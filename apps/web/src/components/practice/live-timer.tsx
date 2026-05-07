import { formatTime } from "@/lib/practice/fillers";

interface LiveTimerProps {
  elapsedSeconds: number;
  /** Optional target in seconds, e.g. 600 for a 10-min target. Drives the bar. */
  targetSeconds?: number;
}

export function LiveTimer({ elapsedSeconds, targetSeconds }: LiveTimerProps) {
  const pct = targetSeconds
    ? Math.min(100, (elapsedSeconds / targetSeconds) * 100)
    : 0;
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
      <span className="relative grid h-2.5 w-2.5 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="h-2 w-2 rounded-full bg-red-500" />
      </span>
      <span className="font-mono text-sm font-semibold text-[#0A0A0A]">
        {formatTime(elapsedSeconds)}
      </span>
      {targetSeconds && (
        <>
          <span className="font-mono text-xs text-gray-400">
            / {formatTime(targetSeconds)}
          </span>
          <span className="h-1 w-16 overflow-hidden rounded-full bg-gray-200">
            <span
              className="block h-full bg-[#C6FF3D]"
              style={{ width: `${pct}%` }}
            />
          </span>
        </>
      )}
    </div>
  );
}
