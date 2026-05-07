import { Clock, Gauge, MessageSquare } from "lucide-react";

import { formatTime, paceLabel } from "@/lib/practice/fillers";
import { cn } from "@/lib/utils";

interface LiveMetricsProps {
  elapsedSeconds: number;
  fillerTotal: number;
  wpm: number;
}

export function LiveMetrics({ elapsedSeconds, fillerTotal, wpm }: LiveMetricsProps) {
  const pace = paceLabel(wpm);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Metric
        label="Duración"
        value={formatTime(elapsedSeconds)}
        icon={<Clock className="h-4 w-4" strokeWidth={1.8} />}
        accent="lime"
      />
      <Metric
        label="Muletillas"
        value={fillerTotal.toString()}
        icon={<MessageSquare className="h-4 w-4" strokeWidth={1.8} />}
        accent={fillerTotal === 0 ? "lime" : fillerTotal > 5 ? "danger" : "warn"}
      />
      <Metric
        label="Palabras/min"
        value={wpm > 0 ? Math.round(wpm).toString() : "—"}
        sub={wpm > 0 ? pace.label : "Aún no detectado"}
        icon={<Gauge className="h-4 w-4" strokeWidth={1.8} />}
        accent={pace.tone === "ok" ? "lime" : pace.tone === "fast" ? "danger" : "warn"}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: "lime" | "warn" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4.5 transition-colors",
        accent === "lime" && "border-gray-200",
        accent === "warn" && "border-amber-200 bg-amber-50/30",
        accent === "danger" && "border-red-200 bg-red-50/30",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-lg",
            accent === "lime" && "bg-[#F7FFE0] text-[#0A0A0A]",
            accent === "warn" && "bg-amber-100 text-amber-700",
            accent === "danger" && "bg-red-100 text-red-700",
          )}
        >
          {icon}
        </span>
      </div>
      <div className="text-3xl font-extrabold leading-none tracking-tight text-[#0A0A0A]">
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
