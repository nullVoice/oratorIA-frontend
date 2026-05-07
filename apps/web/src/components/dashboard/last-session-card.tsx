import { Check, Clock, MessageSquare } from "lucide-react";

import { lastSession } from "@/lib/dashboard/mock-data";

export function LastSessionCard() {
  return (
    <div className="grid grid-cols-1 items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 sm:grid-cols-[80px_1fr_auto_auto]">
      <Thumbnail />

      <div>
        <h4 className="text-base font-bold tracking-tight text-[#0A0A0A]">
          {lastSession.title}
        </h4>
        <p className="mt-1 text-xs text-gray-500">
          Hace {lastSession.daysAgo} días · {lastSession.durationMinutes} minutos · Sesión #{lastSession.sessionNumber}
        </p>
        <div className="mt-2 flex flex-wrap gap-3.5 text-xs text-gray-700">
          <Mini icon={<MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />}>
            <strong className="font-semibold text-[#0A0A0A]">{lastSession.fillerWords}</strong> muletillas
          </Mini>
          <Mini icon={<Clock className="h-3.5 w-3.5" strokeWidth={1.8} />}>
            <strong className="font-semibold text-[#0A0A0A]">{lastSession.wpm}</strong> wpm
          </Mini>
          <Mini icon={<Check className="h-3.5 w-3.5" strokeWidth={2} />}>
            Claridad <strong className="font-semibold text-[#0A0A0A]">{lastSession.clarity}</strong>
          </Mini>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center self-stretch border-x border-gray-200 px-4">
        <span className="text-3xl font-extrabold leading-none tracking-tight text-[#0A0A0A]">
          {lastSession.score}
        </span>
        <span className="mt-1 text-xs text-gray-500">Score</span>
      </div>

      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0A0A0A] px-4 text-[13px] font-bold text-white transition-colors hover:bg-gray-800"
      >
        Ver reporte
      </button>
    </div>
  );
}

function Thumbnail() {
  return (
    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gray-50">
      <div className="flex items-end gap-[3px]">
        {[14, 24, 32, 22, 16].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-sm bg-[#0A0A0A]"
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
    <span className="flex items-center gap-1">
      <span className="text-gray-400">{icon}</span>
      {children}
    </span>
  );
}
