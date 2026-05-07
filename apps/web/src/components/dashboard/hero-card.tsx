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
    <section
      className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[20px] border border-[#D4FF7A] p-8 xl:grid-cols-[1fr_auto]"
      style={{
        background:
          "radial-gradient(circle at 100% 0%, rgba(198,255,61,0.55), transparent 50%), radial-gradient(circle at 0% 100%, rgba(198,255,61,0.25), transparent 50%), linear-gradient(135deg, #fff, #F7FFE0)",
      }}
    >
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-700">
          {greeting()}
        </p>
        <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tight text-[#0A0A0A]">
          ¡{firstName}, llevas {streak.days} días seguidos! 👋
        </h1>
        <p className="mb-6 max-w-md text-[15px] text-gray-700">
          Estás a 1 sesión de tu meta semanal. Tu siguiente foco recomendado:
          pausas estratégicas en cierres.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0A0A0A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-gray-800"
          >
            Empezar nueva sesión
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-lg bg-[#0A0A0A]/[0.06] px-5 text-[13px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A]/10"
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
    <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-[#0A0A0A]/15 bg-[#0A0A0A]/[0.04] px-7 py-5 backdrop-blur">
      <span className="text-6xl font-extrabold leading-none tracking-[-0.04em] text-[#0A0A0A]">
        {streak.days}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-700">
        Días de racha
      </span>
      <div className="flex gap-1">
        {streak.weekDots.map((s, i) => (
          <span
            key={i}
            className={cn(
              "h-3.5 w-3.5 rounded",
              s === "done" && "bg-[#C6FF3D] shadow-[0_0_0_2px_rgba(198,255,61,0.3)]",
              s === "today" && "bg-[#0A0A0A]",
              s === "future" && "bg-gray-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}
