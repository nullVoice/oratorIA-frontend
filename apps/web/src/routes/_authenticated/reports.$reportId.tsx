import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import {
  ImprovementsList,
  type Improvement,
} from "@/components/reports/improvements-list";
import { ScoreCard } from "@/components/reports/score-card";
import {
  StrengthsList,
  type Strength,
} from "@/components/reports/strengths-list";
import { fetchSessionDetail } from "@/lib/api/sessions";

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
  component: ReportRoute,
});

function ReportRoute() {
  // NOTE: The :reportId URL param actually carries the session id —
  // reports are 1:1 with sessions and there is no public GET /reports/:id
  // endpoint, so we fetch via GET /sessions/:id.
  const { reportId } = Route.useParams();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["session-report", reportId],
    queryFn: () => fetchSessionDetail(reportId),
  });

  if (query.isLoading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-gray-600">No encontramos este reporte.</p>
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </button>
      </div>
    );
  }

  const session = query.data;
  if (!session.report) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-gray-600">
          Esta sesión todavía no tiene reporte (estado: {session.status}).
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </button>
      </div>
    );
  }

  const r = session.report;
  const strengths = r.strengths.map(normalizeStrength);
  const improvements = r.improvements.map(normalizeImprovement);
  const paraverbal = r.paraverbal_metrics as Record<string, unknown>;
  const nextSteps = r.next_steps ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-7 pb-10">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            aria-label="Volver"
            className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
              Tu reporte
            </h1>
            <p className="mt-0.5 text-sm text-gray-600">
              {new Date(session.created_at).toLocaleString("es", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-gray-200 bg-white p-6 md:grid-cols-[auto_1fr]">
        <ScoreCard score={r.score} size="lg" />
        <div>
          <h2 className="text-base font-bold tracking-tight text-[#0A0A0A]">
            Resumen
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-700">
            {r.summary}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="Fortalezas">
          <StrengthsList items={strengths} />
        </Section>
        <Section title="Áreas de mejora">
          <ImprovementsList items={improvements} />
        </Section>
      </section>

      <Section title="Métricas paraverbales">
        <ParaverbalGrid metrics={paraverbal} />
      </Section>

      {nextSteps.length > 0 && (
        <Section title="Próximos pasos">
          <ol className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5">
            {nextSteps.map((step, i) => (
              <li
                key={i}
                className="flex gap-3 text-[14px] leading-relaxed text-gray-700"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#C6FF3D] text-xs font-bold text-[#0A0A0A]">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-[#0A0A0A] hover:border-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/practice/new" })}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#C6FF3D] px-5 text-sm font-bold text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#D4FF7A]"
        >
          Nueva práctica
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-[#0A0A0A]">{title}</h2>
      {children}
    </section>
  );
}

interface ParaverbalGridProps {
  metrics: Record<string, unknown>;
}

function ParaverbalGrid({ metrics }: ParaverbalGridProps) {
  const wpm = num(metrics.words_per_minute);
  const fillers = num(metrics.filler_words_count);
  const pauseRatio = num(metrics.pause_ratio);
  const tone = num(metrics.tone_variance);

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-4">
      <MetricCard
        label="Palabras / min"
        value={wpm !== null ? wpm.toFixed(0) : "—"}
        hint={wpmHint(wpm)}
      />
      <MetricCard
        label="Muletillas"
        value={fillers !== null ? String(fillers) : "—"}
        hint={fillersHint(fillers)}
      />
      <MetricCard
        label="Pausas"
        value={pauseRatio !== null ? `${Math.round(pauseRatio * 100)}%` : "—"}
        hint="Tiempo en silencio"
      />
      <MetricCard
        label="Modulación"
        value={tone !== null ? toneLabel(tone) : "—"}
        hint="Variación tonal"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-[#0A0A0A] tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-gray-500">{hint}</div>
    </div>
  );
}

function wpmHint(wpm: number | null): string {
  if (wpm === null) return "—";
  if (wpm < 90) return "Lento";
  if (wpm < 130) return "Moderado";
  if (wpm < 170) return "Ágil";
  return "Muy rápido";
}

function fillersHint(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "Excelente";
  if (n <= 3) return "Bajo";
  if (n <= 8) return "Moderado";
  return "Alto";
}

function toneLabel(variance: number): string {
  if (variance < 200) return "Plana";
  if (variance < 800) return "Equilibrada";
  return "Expresiva";
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// ============== Shape normalization (legacy + new) ==============

function normalizeStrength(raw: Record<string, unknown>): Strength {
  return {
    title: str(raw.title) ?? "—",
    description: str(raw.description) ?? str(raw.text) ?? undefined,
    dimension: str(raw.dimension) ?? undefined,
    evidence: str(raw.evidence) ?? undefined,
    impact: str(raw.impact) ?? undefined,
  };
}

function normalizeImprovement(raw: Record<string, unknown>): Improvement {
  return {
    title: str(raw.title) ?? "—",
    description: str(raw.description) ?? str(raw.text) ?? undefined,
    dimension: str(raw.dimension) ?? undefined,
    evidence: str(raw.evidence) ?? undefined,
    suggestion: str(raw.suggestion) ?? undefined,
    priority: str(raw.priority) ?? undefined,
  };
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.length > 0) return v;
  return null;
}
