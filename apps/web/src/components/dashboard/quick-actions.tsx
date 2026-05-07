import { Link } from "@tanstack/react-router";
import { Mic, Upload } from "lucide-react";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
      <ActionCard
        meta="Recomendado · 10 min"
        title="Sesión en tiempo real"
        description="Practica con el agente IA. Feedback contextual mientras hablas."
        icon={<Mic className="h-5 w-5" strokeWidth={1.8} />}
        ctaLabel="Empezar →"
        href="/practice"
        primary
      />
      <ActionCard
        meta="Asíncrono · análisis detallado"
        title="Subir video"
        description="Análisis de tu presentación grabada. Recibe reporte completo en minutos."
        icon={<Upload className="h-5 w-5" strokeWidth={1.8} />}
        ctaLabel="Subir archivo"
        disabled
      />
    </div>
  );
}

interface ActionCardProps {
  meta: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaLabel: string;
  href?: string;
  primary?: boolean;
  disabled?: boolean;
}

function ActionCard({
  meta,
  title,
  description,
  icon,
  ctaLabel,
  href,
  primary = false,
  disabled = false,
}: ActionCardProps) {
  if (primary) {
    const cta = (
      <button
        type="button"
        disabled={disabled}
        className="inline-flex h-9 items-center rounded-lg bg-[#C6FF3D] px-3.5 text-xs font-bold text-[#0A0A0A] transition-colors hover:bg-[#D4FF7A] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {ctaLabel}
      </button>
    );
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-6 text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-10px_rgba(10,10,10,0.4)]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#C6FF3D] text-[#0A0A0A]">
          {icon}
        </span>
        <div className="flex-1">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#C6FF3D]">
            {meta}
          </p>
          <h3 className="mb-1 text-base font-bold tracking-tight">{title}</h3>
          <p className="mb-3.5 text-[13px] text-gray-300">{description}</p>
          {href && !disabled ? <Link to={href}>{cta}</Link> : cta}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F7FFE0] text-[#0A0A0A]">
        {icon}
      </span>
      <div className="flex-1">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500">
          {meta}
        </p>
        <h3 className="mb-1 text-base font-bold tracking-tight text-[#0A0A0A]">{title}</h3>
        <p className="mb-3.5 text-[13px] text-gray-600">{description}</p>
        <button
          type="button"
          disabled={disabled}
          title={disabled ? "Próximamente" : undefined}
          className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-bold text-[#0A0A0A] transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
