import { Check, Clock, MessageSquare } from "lucide-react";

import { lastSession } from "@/lib/dashboard/mock-data";

export function LastSessionCard() {
  return (
    <div className="grid grid-cols-1 items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5.5 transition-colors hover:border-gray-300 hover:shadow-sm sm:grid-cols-[80px_1fr_auto_auto]">
      <Thumbnail />

      <div>
        <h4 className="mb-1 text-base font-bold tracking-tight text-[#0A0A0A]">
          {lastSession.title}
        </h4>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>Hace {lastSession.daysAgo} días</span>
          <span className="text-gray-300">·</span>
          <span>{lastSession.durationMinutes} minutos</span>
          <span className="text-gray-300">·</span>
          <span>Sesión #{lastSession.sessionNumber}</span>
        </div>
        <div className="flex flex-wrap gap-3.5 text-xs">
          <Mini icon={<MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />}>
            Muletillas: <strong className="text-[#0A0A0A]">{lastSession.fillerWords}</strong>
          </Mini>
          <Mini icon={<Clock className="h-3.5 w-3.5" strokeWidth={1.8} />}>
            WPM: <strong className="text-[#0A0A0A]">{lastSession.wpm}</strong>
          </Mini>
          <Mini icon={<Check className="h-3.5 w-3.5" strokeWidth={2} />}>
            Claridad: <strong className="text-[#0A0A0A]">{lastSession.clarity}</strong>
          </Mini>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center self-stretch border-x border-gray-200 px-3">
        <span className="text-[32px] font-extrabold leading-none tracking-tight text-[#0A0A0A]">
          {lastSession.score}
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500">
          Score · /100
        </span>
      </div>

      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0A0A0A] px-4 text-[13px] font-bold text-white transition-colors hover:bg-gray-800"
      >
        Ver reporte completo
      </button>
    </div>
  );
}

function Thumbnail() {
  return (
    <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(198,255,61,0.25),transparent_70%)]" />
      <div className="relative flex items-end gap-[3px]">
        {[14, 24, 32, 22, 16].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-sm bg-[#C6FF3D]"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function Mini({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1 font-semibold text-gray-700">
      {icon}
      {children}
    </span>
  );
}
