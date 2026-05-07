import { Lightbulb } from "lucide-react";

import { recommendation } from "@/lib/dashboard/mock-data";

export function RecommendationBanner() {
  return (
    <div className="relative grid grid-cols-1 items-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] p-6 text-white sm:grid-cols-[auto_1fr_auto]">
      <div className="absolute -right-15 -top-15 h-50 w-50 bg-[radial-gradient(circle,rgba(198,255,61,0.2),transparent_70%)]" />

      <span className="relative grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-[#C6FF3D] text-[#0A0A0A]">
        <Lightbulb className="h-5 w-5" strokeWidth={2} />
      </span>

      <div className="relative">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#C6FF3D]">
          Foco recomendado para hoy
        </p>
        <h3 className="mb-1 text-base font-bold">{recommendation.title}</h3>
        <p className="max-w-md text-[13px] leading-relaxed text-gray-400">
          {recommendation.body}
        </p>
      </div>

      <button
        type="button"
        className="relative inline-flex h-11 shrink-0 items-center rounded-lg bg-[#C6FF3D] px-5 text-[13px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#D4FF7A]"
      >
        Configurar sesión →
      </button>
    </div>
  );
}
