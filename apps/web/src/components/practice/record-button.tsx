import { Loader2, Mic, Square } from "lucide-react";

import type { RecorderState } from "@/lib/practice/use-recorder";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  state: RecorderState;
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({ state, onStart, onStop }: RecordButtonProps) {
  const recording = state === "recording";
  const busy = state === "starting" || state === "stopping";

  return (
    <button
      type="button"
      onClick={recording ? onStop : onStart}
      disabled={busy}
      aria-label={recording ? "Detener grabación" : "Empezar grabación"}
      className={cn(
        "group relative grid h-32 w-32 place-items-center rounded-full transition-all",
        "shadow-[0_8px_32px_-8px_rgba(198,255,61,0.6)] disabled:cursor-not-allowed disabled:opacity-70",
        recording
          ? "bg-[#0A0A0A] text-[#C6FF3D] hover:scale-105"
          : "bg-[#C6FF3D] text-[#0A0A0A] hover:scale-105 hover:bg-[#D4FF7A]",
      )}
    >
      {recording && (
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#C6FF3D] opacity-30" />
      )}
      {busy ? (
        <Loader2 className="h-12 w-12 animate-spin" strokeWidth={2} />
      ) : recording ? (
        <Square className="h-10 w-10" strokeWidth={2.5} fill="currentColor" />
      ) : (
        <Mic className="h-12 w-12" strokeWidth={2.5} />
      )}
    </button>
  );
}
