/**
 * useDeepgram — real-time streaming transcription via Deepgram WebSocket.
 *
 * Architecture (webm/opus container streaming — NOT raw PCM):
 *   1. Fetch an ephemeral token from POST /api/v1/practice/deepgram-token
 *      (requires user auth; backend mints the token).
 *   2. Open a WebSocket to wss://api.deepgram.com/v1/listen with the
 *      Deepgram auth trick: first protocol value = "token", second = the key.
 *      We DO NOT declare encoding/sample_rate — Deepgram auto-detects the
 *      webm/opus container we feed it.
 *   3. Run a dedicated MediaRecorder on the shared mic stream and forward each
 *      `ondataavailable` chunk straight to the socket as a binary frame.
 *   4. Accumulate FINAL/UtteranceEnd segments into `transcript` (stable).
 *      Keep the latest interim result in `interim` (may change/vanish).
 *
 * Why MediaRecorder instead of AudioContext + ScriptProcessor:
 *   The previous PCM-capture path created an AudioContext AFTER an `await`
 *   (token fetch), so it was outside the user gesture and the browser's
 *   autoplay policy kept it suspended — it streamed silence and Deepgram
 *   returned empty transcripts. MediaRecorder needs no resume gesture and
 *   delivers real audio immediately. The first webm chunk carries the EBML
 *   header; subsequent chunks are clusters, and Deepgram reconstructs the
 *   continuous stream correctly over one connection.
 *
 * Reconciliation rule (F2-U-05/06):
 *   Filler counts must be computed from `transcript` ONLY (never from `interim`)
 *   so the counter never flickers or decrements. See `countFillersFromTranscript`.
 *
 * Manual QA note:
 *   The live mic→Deepgram path (getUserMedia → WS → real transcription) is
 *   NOT covered by automated tests (requires a real browser + mic + network).
 *   Test it manually: start a practice session, speak, and watch words appear
 *   in <150ms. See the project README for the manual QA checklist.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api/client";
import { detectFillers, type FillerSummary } from "@/lib/practice/fillers";

// ---------------------------------------------------------------------------
// Deepgram WS parameters
// ---------------------------------------------------------------------------

const DG_WS_BASE = "wss://api.deepgram.com/v1/listen";

/**
 * Build the Deepgram WS URL. No `encoding`/`sample_rate`/`channels`: we feed a
 * webm/opus container and let Deepgram auto-detect the codec — declaring a raw
 * PCM layout for opus bytes is what made it return empty transcripts before.
 */
function buildDgUrl(): string {
  const params = new URLSearchParams({
    model: "nova-3",
    language: "es",
    interim_results: "true",
    utterance_end_ms: "1000",
    filler_words: "true",
    smart_format: "true",
  });
  return `${DG_WS_BASE}?${params.toString()}`;
}

/** Chunk cadence — small enough to feel live, large enough to be efficient. */
const TIMESLICE_MS = 250;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UseDeepgramReturn {
  /** Stable, accumulated transcript from FINAL + UtteranceEnd segments only. */
  transcript: string;
  /** Latest interim hypothesis; may change or become empty between utterances. */
  interim: string;
  /** True once the WebSocket has opened and Deepgram is receiving audio. */
  isConnected: boolean;
  /** Any connection/token error. Null when healthy. */
  error: string | null;
  /**
   * Count of prolonged vocal fillers ("eeee", "ehhh") detected from word
   * durations — these never surface as lexical fillers in Spanish.
   */
  prolonged: number;
}

// ---------------------------------------------------------------------------
// Reconciliation helper (F2-U-05/06) — pure, exportable for tests
// ---------------------------------------------------------------------------

/**
 * Compute filler counts from the STABLE transcript only.
 * Never call this on `interim` — interim changes cause counter flicker.
 */
export function countFillersFromTranscript(transcript: string): FillerSummary {
  return detectFillers(transcript);
}

// ---------------------------------------------------------------------------
// Token fetch
// ---------------------------------------------------------------------------

interface TokenPayload {
  token: string;
  expires_in: number;
  /** WS subprotocol: "bearer" for a grant-token JWT, "token" for a raw key. */
  scheme?: string;
}

interface DeepgramCredential {
  token: string;
  scheme: string;
}

async function fetchDeepgramToken(): Promise<DeepgramCredential> {
  const payload = await api
    .post("api/v1/practice/deepgram-token")
    .json<TokenPayload>();
  return { token: payload.token, scheme: payload.scheme ?? "token" };
}

// ---------------------------------------------------------------------------
// MediaRecorder mime selection
// ---------------------------------------------------------------------------

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  for (const mime of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(mime)
    ) {
      return mime;
    }
  }
  return "";
}

// ---------------------------------------------------------------------------
// Deepgram message types (minimal surface)
// ---------------------------------------------------------------------------

interface DgWord {
  word: string;
  start: number;
  end: number;
}

interface DgTranscript {
  type: "Results";
  is_final: boolean;
  speech_final: boolean;
  channel: {
    alternatives: Array<{ transcript: string; words?: DgWord[] }>;
  };
}

// ---------------------------------------------------------------------------
// Prolonged vocal filler detection (from word timings)
// ---------------------------------------------------------------------------

/**
 * Deepgram drops the *injected* vocalizations (uh/um) in Spanish, but a
 * drawn-out "eeee"/"aaaa" still gets transcribed — usually collapsed to a
 * single vowel token like "e". We flag a word as a prolonged vocal filler when:
 *   - it's a clearly-repeated vowel/hum ("eee", "aaa", "mmm") — unambiguous, or
 *   - it's a single vowel-ish token ("e", "a", "o", "eh", "mmm") whose duration
 *     is implausibly long for a real word (a preposition "a" lasts ~0.1s; a
 *     held "aaaa" lasts 0.5s+).
 */
const REPEATED_VOWEL = /^(?:e{2,}|a{2,}|o{2,}|u{2,}|m{2,}|h?mm+|e?h{2,})$/;
const SINGLE_VOWELISH = /^(?:e|a|o|u|eh|em|ah|um|hm|mmm?)$/;
const MIN_HOLD_SEC = 0.5;

function countProlongedInWords(words: DgWord[] | undefined): number {
  if (!words || words.length === 0) return 0;
  let n = 0;
  for (const w of words) {
    const token = (w.word ?? "").toLowerCase().replace(/[^a-záéíóúñü]/g, "");
    if (!token) continue;
    const dur = (w.end ?? 0) - (w.start ?? 0);
    if (REPEATED_VOWEL.test(token)) {
      n += 1;
    } else if (SINGLE_VOWELISH.test(token) && dur >= MIN_HOLD_SEC) {
      n += 1;
    }
  }
  return n;
}

interface DgUtteranceEnd {
  type: "UtteranceEnd";
}

interface DgMetadata {
  type: "Metadata";
}

type DgMessage = DgTranscript | DgUtteranceEnd | DgMetadata | { type: string };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDeepgram(
  stream: MediaStream | null,
  options: { paused?: boolean } = {},
): UseDeepgramReturn {
  const paused = options.paused ?? false;
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prolonged, setProlonged] = useState(0);
  const prolongedRef = useRef(0);

  // Stable refs so the cleanup closure captures the latest values.
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  // Independent (cloned) mic stream for Deepgram — see connect().
  const dgStreamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  // Accumulates FINAL segments; avoids stale closure over `transcript` state.
  const stableRef = useRef("");
  // Echo hard-gate state — read inside the recorder/onopen closures.
  const pausedRef = useRef(paused);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Echo hard-gate: while `paused` (e.g. the avatar is speaking), silence the
  // cloned mic track so the avatar's own voice is never transcribed as the
  // user's speech. The recorder keeps running — a disabled track still emits
  // valid opus DTX frames — so Deepgram's webm stream stays intact across the
  // gap (dropping chunks instead would corrupt the container).
  useEffect(() => {
    pausedRef.current = paused;
    dgStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !paused));
  }, [paused]);

  const cleanup = useCallback(() => {
    // Stop the recorder feeding the socket.
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;

    // Stop the cloned mic track so the device is released.
    dgStreamRef.current?.getTracks().forEach((t) => t.stop());
    dgStreamRef.current = null;

    // Tell Deepgram we're done, then close gracefully.
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "CloseStream" }));
      } catch {
        /* ignore */
      }
    }
    if (ws && ws.readyState < WebSocket.CLOSING) {
      ws.close(1000, "session ended");
    }
    wsRef.current = null;

    if (mountedRef.current) {
      setIsConnected(false);
      setInterim("");
    }
  }, []);

  useEffect(() => {
    if (!stream) {
      cleanup();
      return;
    }

    let cancelled = false;
    stableRef.current = "";
    prolongedRef.current = 0;
    if (mountedRef.current) {
      setTranscript("");
      setInterim("");
      setError(null);
      setProlonged(0);
    }

    async function connect() {
      let credential: DeepgramCredential;
      try {
        credential = await fetchDeepgramToken();
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch Deepgram token",
          );
        }
        return;
      }

      if (cancelled || !stream) return;

      // Open WS with auth via subprotocol trick. The scheme ("bearer" for a
      // grant-token JWT, "token" for a raw API key) is dictated by the backend.
      const ws = new WebSocket(buildDgUrl(), [
        credential.scheme,
        credential.token,
      ]);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current || cancelled || !stream) {
          ws.close();
          return;
        }
        setIsConnected(true);

        // Forward webm/opus chunks straight to the socket — no PCM, no
        // AudioContext, no resume gesture required.
        try {
          // Two MediaRecorders pulling from the SAME audio track is unreliable:
          // the second one (this hook's) receives silence — opus emits ~86-byte
          // DTX frames. Clone the track so Deepgram gets an INDEPENDENT copy of
          // the mic source while useRecorder keeps the original for the blob.
          const srcTrack = stream.getAudioTracks()[0];
          const dgStream = srcTrack
            ? new MediaStream([srcTrack.clone()])
            : stream;
          dgStreamRef.current = dgStream;
          // Apply the current gate state to the freshly-cloned track so a
          // mid-connection "avatar speaking" window is honoured immediately.
          dgStream
            .getAudioTracks()
            .forEach((t) => (t.enabled = !pausedRef.current));

          const mime = pickMimeType();
          const recorder = new MediaRecorder(
            dgStream,
            mime ? { mimeType: mime } : undefined,
          );
          recorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(e.data);
            }
          };

          recorder.start(TIMESLICE_MS);
        } catch (recErr) {
          if (mountedRef.current) {
            setError(
              recErr instanceof Error ? recErr.message : "Audio capture failed",
            );
          }
        }
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        if (!mountedRef.current) return;
        let msg: DgMessage;
        try {
          msg = JSON.parse(event.data) as DgMessage;
        } catch {
          return;
        }

        if (msg.type === "Results") {
          const r = msg as DgTranscript;
          const text = r.channel.alternatives[0]?.transcript ?? "";

          if (r.is_final || r.speech_final) {
            if (text.trim()) {
              const separator = stableRef.current ? " " : "";
              stableRef.current = stableRef.current + separator + text.trim();
              setTranscript(stableRef.current);
            }
            // Prolonged vocal fillers come from final-segment word durations.
            const found = countProlongedInWords(
              r.channel.alternatives[0]?.words,
            );
            if (found > 0) {
              prolongedRef.current += found;
              setProlonged(prolongedRef.current);
            }
            setInterim("");
          } else {
            setInterim(text);
          }
          return;
        }

        if (msg.type === "UtteranceEnd") {
          // Deepgram fires UtteranceEnd after silence; the preceding
          // is_final:true result already stabilised the text, so we just
          // clear any residual interim.
          setInterim("");
        }
      };

      ws.onerror = () => {
        if (mountedRef.current) {
          setError("Deepgram WebSocket error");
          setIsConnected(false);
        }
      };

      ws.onclose = (event: CloseEvent) => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        setInterim("");
        if (!cancelled && event.code !== 1000 && event.code !== 1001) {
          setError(`Deepgram connection closed (${event.code})`);
        }
      };
    }

    void connect();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [stream, cleanup]);

  return { transcript, interim, isConnected, error, prolonged };
}
