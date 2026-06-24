import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { AuroraBackground } from "@/components/reports/aurora-background";
import {
  InsightCarousel,
  type InsightSlide,
} from "@/components/reports/insight-carousel";
import {
  ImprovementCard,
  priorityOrder,
  type Improvement,
} from "@/components/reports/improvements-list";
import { ScoreRing } from "@/components/reports/score-ring";
import {
  StrengthCard,
  type Strength,
} from "@/components/reports/strengths-list";
import { WpmGauge } from "@/components/reports/wpm-gauge";
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
      <div className="grid place-items-center py-24 text-sm text-ink-soft">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-ink-soft">No encontramos este reporte.</p>
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:border-line-strong"
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
        <p className="text-sm text-ink-soft">
          Esta sesión todavía no tiene reporte (estado: {session.status}).
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:border-line-strong"
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

  const wpm = num(paraverbal.words_per_minute);
  const fillers = num(paraverbal.filler_words_count);
  const pauseRatio = num(paraverbal.pause_ratio);
  const tone = num(paraverbal.tone_variance);

  // One unified deck for the carousel: strengths first, then improvements
  // sorted by priority. Each item is a single card shown one at a time.
  const sortedImprovements = [...improvements].sort(
    (a, b) => priorityOrder(a.priority) - priorityOrder(b.priority),
  );
  const slides: InsightSlide[] = [
    ...strengths.map((s, idx) => ({
      key: `s-${idx}`,
      kind: "strength" as const,
      node: <StrengthCard s={s} index={idx} />,
    })),
    ...sortedImprovements.map((m, idx) => ({
      key: `m-${idx}`,
      kind: "improvement" as const,
      node: <ImprovementCard m={m} index={idx} />,
    })),
  ];

  const formattedDate = new Date(session.created_at).toLocaleString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative isolate -mx-5 -mt-8 overflow-hidden px-5 pb-16 pt-8 sm:-mx-7 sm:px-7 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12 2xl:-mx-16 2xl:px-16">
      <AuroraBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col 2xl:max-w-[88rem]">
        {/* ── Back link ── */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Dashboard
          </button>
        </div>

        {/* ── Hero ── */}
        <header className="border-b border-line pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Reporte · {formattedDate}
          </p>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
            {/* Left col: score ring */}
            <div className="flex w-[220px] shrink-0 justify-center">
              <ScoreRing score={r.score} />
            </div>

            {/* Center col: verdict + summary + stat cards */}
            <div className="flex min-w-0 flex-col gap-4">
              <h1 className="font-display text-2xl font-bold text-ink">
                {scoreVerdict(r.score)}
              </h1>
              <p className="max-w-prose text-[14px] leading-relaxed text-ink-soft">
                {r.summary}
              </p>

              {/* Compact stat cards: fillers, pause, tone */}
              <div className="mt-2 grid grid-cols-3 gap-3">
                <StatCard
                  label="Muletillas"
                  value={fillers !== null ? String(Math.round(fillers)) : "—"}
                  status={fillersStatus(fillers)}
                />
                <StatCard
                  label="Pausas"
                  value={
                    pauseRatio !== null
                      ? `${Math.round(pauseRatio * 100)}%`
                      : "—"
                  }
                  status={pauseStatus(pauseRatio)}
                />
                <StatCard
                  label="Modulación"
                  value={tone !== null ? toneLabel(tone) : "—"}
                  status={toneStatus(tone)}
                />
              </div>
            </div>

            {/* Right col: WPM gauge */}
            <div className="w-[260px] shrink-0">
              <WpmGauge wpm={wpm} />
            </div>
          </div>
        </header>

        {/* ── Body: analysis carousel (one card at a time, never crowded) ── */}
        {slides.length > 0 && (
          <div className="mt-10">
            <SectionHeading>
              Análisis · deslizá para ver cada punto
            </SectionHeading>
            <InsightCarousel slides={slides} />
          </div>
        )}

        {/* ── Next steps (compact, full-width row) ── */}
        {nextSteps.length > 0 && (
          <div className="mt-12">
            <SectionHeading>Próximos pasos</SectionHeading>
            <ol className="grid gap-3 sm:grid-cols-3">
              {nextSteps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-line bg-surface/70 px-4 py-3.5"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime text-[11px] font-bold text-on-lime">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[13px] leading-relaxed text-ink-soft">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── Footer actions ── */}
        <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-5 text-sm font-semibold text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/practice/new" })}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-lime px-5 text-sm font-bold text-on-lime transition-colors hover:bg-lime-dim"
          >
            Nueva práctica
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
      {children}
    </h2>
  );
}

// ── Compact stat card ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  status: Status;
}

function StatCard({ label, value, status }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
        {label}
      </p>
      <p className="font-display mt-1.5 text-[32px] font-extrabold leading-none tabular-nums text-ink">
        {value}
      </p>
      {/* range bar: lime when the metric sits in the healthy zone */}
      <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${status.good ? "bg-lime" : "bg-ink-faint/50"}`}
          style={{ width: status.good ? "100%" : "42%" }}
        />
      </div>
      <p
        className={`font-mono mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
          status.good ? "text-accent" : "text-ink-soft"
        }`}
      >
        {status.word}
      </p>
    </div>
  );
}

// ── Status helpers ───────────────────────────────────────────────────────────

interface Status {
  word: string;
  good: boolean;
}

function fillersStatus(n: number | null): Status {
  if (n === null) return { word: "—", good: false };
  if (n === 0) return { word: "Excelente", good: true };
  if (n <= 3) return { word: "Bajo", good: true };
  if (n <= 8) return { word: "Moderado", good: false };
  return { word: "Alto", good: false };
}

function pauseStatus(ratio: number | null): Status {
  if (ratio === null) return { word: "—", good: false };
  if (ratio < 0.05) return { word: "Escasas", good: false };
  if (ratio <= 0.2) return { word: "Óptimas", good: true };
  return { word: "Frecuentes", good: false };
}

function toneStatus(variance: number | null): Status {
  if (variance === null) return { word: "—", good: false };
  if (variance < 200) return { word: "Plana", good: false };
  if (variance < 800) return { word: "Equilibrada", good: true };
  return { word: "Expresiva", good: true };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreVerdict(score: number): string {
  if (score >= 85) return "Excelente presentación";
  if (score >= 70) return "Buena presentación";
  if (score >= 50) return "Presentación en desarrollo";
  return "Mucho margen de mejora";
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

// ── Shape normalization (legacy + new) ───────────────────────────────────────

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
