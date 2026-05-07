import { ArrowRight } from "lucide-react";

import { streak } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function HeroCard({ firstName }: { firstName: string }) {
  return (
    <section className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-gray-200 bg-white p-7 xl:grid-cols-[1fr_auto]">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#0A0A0A] sm:text-3xl">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-2 max-w-md text-[15px] text-gray-600">
          Llevas {streak.days} días seguidos practicando. Estás a una sesión de tu meta semanal.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0A0A0A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-gray-800"
          >
            Empezar nueva sesión
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-lg border border-gray-200 bg-white px-5 text-[13px] font-bold text-[#0A0A0A] transition-colors hover:border-gray-300"
          >
            Ver mi plan
          </button>
        </div>
      </div>

      <StreakBadge />
    </section>
  );
}

function StreakBadge() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5">
      <span className="text-5xl font-extrabold leading-none tracking-tight text-[#0A0A0A]">
        {streak.days}
      </span>
      <span className="text-xs text-gray-600">días seguidos</span>
      <div className="flex gap-1">
        {streak.weekDots.map((s, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-sm",
              s === "done" && "bg-[#C6FF3D]",
              s === "today" && "bg-[#0A0A0A]",
              s === "future" && "bg-gray-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}
