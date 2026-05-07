/**
 * Recorder hook with cumulative re-transcription.
 *
 * MediaRecorder is started with a `timeslice` so chunks land in
 * `chunksRef` every second. Every `transcribeIntervalMs` we build a
 * Blob from all chunks-so-far (which forms a valid container), POST
 * it to /api/v1/practice/transcribe, and replace the local transcript
 * with whatever Whisper returns. That gives the frontend a "live"
 * transcript at the cost of re-sending the cumulative audio.
 *
 * Cost trade-off accepted for the demo: O(n²/2) bytes total per
 * recording. For a 2-minute capture at 8s ticks this is ~1MB.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api/client";

export type RecorderState = "idle" | "starting" | "recording" | "stopping";

export interface UseRecorderOptions {
  /** How often to re-transcribe the cumulative audio. */
  transcribeIntervalMs?: number;
  onTranscriptUpdate?: (transcript: string) => void;
  onError?: (err: Error) => void;
}

export interface UseRecorderReturn {
  state: RecorderState;
  /** Seconds elapsed since recording started. */
  elapsedSeconds: number;
  /** Latest cumulative transcript text from Whisper. */
  transcript: string;
  /** True while a /transcribe call is in flight. */
  isTranscribing: boolean;
  start: () => Promise<void>;
  /** Stop and return the final audio Blob (concatenation of all chunks). */
  stop: () => Promise<Blob>;
  reset: () => void;
}

const TRANSCRIBE_RESPONSE_FIELDS = ["text", "language", "duration_seconds"] as const;

interface TranscribeResponseShape {
  text: string;
  language: string;
  duration_seconds: number;
}

function isTranscribeResponse(value: unknown): value is TranscribeResponseShape {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return TRANSCRIBE_RESPONSE_FIELDS.every((f) => f in v);
}

export function useRecorder(options: UseRecorderOptions = {}): UseRecorderReturn {
  const { transcribeIntervalMs = 8000, onTranscriptUpdate, onError } = options;

  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const transcribeTimerRef = useRef<number | null>(null);
  const transcribeInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cleanupTimers = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (transcribeTimerRef.current !== null) {
      window.clearInterval(transcribeTimerRef.current);
      transcribeTimerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cleanupTimers();
    stopStream();
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    setElapsedSeconds(0);
    setTranscript("");
    setState("idle");
    setIsTranscribing(false);
  }, [cleanupTimers, stopStream]);

  useEffect(() => () => reset(), [reset]);

  const transcribeCumulative = useCallback(async () => {
    if (transcribeInFlightRef.current || chunksRef.current.length === 0) return;
    transcribeInFlightRef.current = true;
    if (mountedRef.current) setIsTranscribing(true);
    try {
      const recorder = recorderRef.current;
      const mime = recorder?.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const form = new FormData();
      form.append("file", blob, `chunk.${mime.includes("ogg") ? "ogg" : "webm"}`);
      const resp = await api.post("api/v1/practice/transcribe", { body: form }).json();
      if (!isTranscribeResponse(resp)) return;
      if (!mountedRef.current) return;
      setTranscript(resp.text);
      onTranscriptUpdate?.(resp.text);
    } catch (err) {
      if (err instanceof Error) onError?.(err);
    } finally {
      transcribeInFlightRef.current = false;
      if (mountedRef.current) setIsTranscribing(false);
    }
  }, [onError, onTranscriptUpdate]);

  const start = useCallback(async () => {
    if (state !== "idle") return;
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      // Emit chunks every 1s so the cumulative blob is up-to-date when we transcribe.
      recorder.start(1000);
      startedAtRef.current = Date.now();
      setState("recording");
      tickRef.current = window.setInterval(() => {
        if (startedAtRef.current === null) return;
        setElapsedSeconds((Date.now() - startedAtRef.current) / 1000);
      }, 200);
      // First transcribe after the interval — gives Whisper enough audio.
      transcribeTimerRef.current = window.setInterval(() => {
        void transcribeCumulative();
      }, transcribeIntervalMs);
    } catch (err) {
      stopStream();
      setState("idle");
      if (err instanceof Error) onError?.(err);
      throw err;
    }
  }, [onError, state, stopStream, transcribeCumulative, transcribeIntervalMs]);

  const stop = useCallback(async () => {
    if (state !== "recording") {
      throw new Error("Recorder is not recording.");
    }
    setState("stopping");
    cleanupTimers();
    const recorder = recorderRef.current;
    if (!recorder) throw new Error("Recorder missing.");

    const blob: Blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        resolve(new Blob(chunksRef.current, { type: mime }));
      };
      recorder.stop();
    });

    stopStream();
    // One last transcription pass for whatever audio was captured after the
    // last interval tick.
    await transcribeCumulative();
    setState("idle");
    return blob;
  }, [cleanupTimers, state, stopStream, transcribeCumulative]);

  return {
    state,
    elapsedSeconds,
    transcript,
    isTranscribing,
    start,
    stop,
    reset,
  };
}
