import { Mic, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState =
  | "idle"
  | "starting"
  | "recording"
  | "stopping"
  | "stopped";

export interface UseAudioRecorderOptions {
  onError?: (err: Error) => void;
}

export interface UseAudioRecorderReturn {
  state: RecorderState;
  isRecording: boolean;
  /** Seconds elapsed since recording started. */
  duration: number;
  /** Final audio blob; populated after stop() resolves. */
  audioBlob: Blob | null;
  /** Live MediaStream while recording (for waveform visualizers). */
  stream: MediaStream | null;
  /** Mime type the recorder produced (use for upload Content-Type). */
  mimeType: string;
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  reset: () => void;
}

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function pickMimeType(): string {
  for (const t of PREFERRED_MIME_TYPES) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "";
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {},
): UseAudioRecorderReturn {
  const { onError } = options;

  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mimeType, setMimeType] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stopStream = useCallback((s: MediaStream | null) => {
    s?.getTracks().forEach((t) => t.stop());
  }, []);

  const stopTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopTick();
    stopStream(stream);
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    setDuration(0);
    setAudioBlob(null);
    setStream(null);
    setMimeType("");
    setState("idle");
  }, [stopStream, stopTick, stream]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      stopTick();
      // capture latest stream from ref to avoid stale closure
      stopStream(recorderRef.current?.stream ?? null);
    },
    [stopStream, stopTick],
  );

  const start = useCallback(async () => {
    if (state !== "idle" && state !== "stopped") return;
    setState("starting");
    setAudioBlob(null);
    setDuration(0);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mt = pickMimeType();
      const recorder = new MediaRecorder(
        newStream,
        mt ? { mimeType: mt } : undefined,
      );

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000);

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();

      if (mountedRef.current) {
        setStream(newStream);
        setMimeType(recorder.mimeType || mt || "audio/webm");
        setState("recording");
      }

      tickRef.current = window.setInterval(() => {
        if (startedAtRef.current === null) return;
        const secs = (Date.now() - startedAtRef.current) / 1000;
        if (mountedRef.current) setDuration(secs);
      }, 200);
    } catch (err) {
      if (mountedRef.current) setState("idle");
      const error = err instanceof Error ? err : new Error("Recorder error");
      onError?.(error);
      throw error;
    }
  }, [onError, state]);

  const stop = useCallback(async (): Promise<Blob> => {
    if (state !== "recording") {
      throw new Error("Recorder is not recording.");
    }
    setState("stopping");
    stopTick();

    const recorder = recorderRef.current;
    if (!recorder) throw new Error("Recorder missing.");

    const blob: Blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const mt = recorder.mimeType || mimeType || "audio/webm";
        resolve(new Blob(chunksRef.current, { type: mt }));
      };
      recorder.stop();
    });

    stopStream(recorder.stream);
    if (mountedRef.current) {
      setStream(null);
      setAudioBlob(blob);
      setState("stopped");
    }
    return blob;
  }, [mimeType, state, stopStream, stopTick]);

  return {
    state,
    isRecording: state === "recording",
    duration,
    audioBlob,
    stream,
    mimeType,
    start,
    stop,
    reset,
  };
}

// ============================== UI =============================

interface RecorderProps {
  state: RecorderState;
  duration: number;
  onStart: () => void | Promise<void>;
  onStop: () => void | Promise<void>;
  disabled?: boolean;
}

export function Recorder({
  state,
  duration,
  onStart,
  onStop,
  disabled,
}: RecorderProps) {
  const recording = state === "recording";
  const starting = state === "starting";
  const stopping = state === "stopping";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={recording ? onStop : onStart}
        disabled={disabled || starting || stopping}
        aria-label={recording ? "Detener grabación" : "Empezar grabación"}
        className={`grid h-20 w-20 place-items-center rounded-full text-white shadow-md transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${
          recording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-[#0A0A0A] hover:bg-gray-800"
        }`}
      >
        {recording ? (
          <Square className="h-8 w-8" fill="currentColor" />
        ) : (
          <Mic className="h-8 w-8" strokeWidth={1.8} />
        )}
      </button>
      <span className="font-mono text-sm text-gray-700 tabular-nums">
        {formatDuration(duration)}
      </span>
      {starting && (
        <span className="text-xs text-gray-500">Solicitando micrófono…</span>
      )}
      {stopping && (
        <span className="text-xs text-gray-500">Finalizando…</span>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
