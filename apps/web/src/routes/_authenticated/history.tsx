/**
 * Histórico — the full session log. Reuses the shared sessions query and lets
 * the user filter by modality / status client-side. Each row links to its
 * report (same target as the dashboard's session list).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { SessionTimeline } from "@/components/dashboard/session-timeline";
import { useReveal } from "@/lib/anim/use-reveal";
import { useDashboardData } from "@/lib/dashboard/use-dashboard-data";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/lib/api/sessions";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

type Filter = "all" | "live" | "async" | "completed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "live", label: "En vivo" },
  { id: "async", label: "Análisis" },
  { id: "completed", label: "Completadas" },
];

function matches(s: SessionSummary, filter: Filter): boolean {
  switch (filter) {
    case "live":
      return s.type === "live";
    case "async":
      return s.type === "async";
    case "completed":
      return s.status === "completed";
    default:
      return true;
  }
}

function HistoryPage() {
  const data = useDashboardData();
  const reveal = useReveal<HTMLDivElement>();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(
    () =>
      data.sessions
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [data.sessions],
  );

  const filtered = useMemo(
    () => sorted.filter((s) => matches(s, filter)),
    [sorted, filter],
  );

  const bestScore =
    data.completedSessions.length > 0
      ? Math.max(...data.completedSessions.map((s) => s.score ?? 0))
      : null;

  if (data.loading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-soft">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div ref={reveal} className="flex flex-col gap-8">
      <header data-reveal className="flex flex-col gap-1.5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-accent">
          Tu progresión
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
          Histórico
        </h1>
        <p className="text-sm text-ink-soft">
          {data.totalSessions}{" "}
          {data.totalSessions === 1
            ? "sesión registrada"
            : "sesiones registradas"}
          .
        </p>
      </header>

      <div data-reveal>
        <StatsBanner
          total={data.totalSessions}
          average={data.averageScore}
          best={bestScore}
          practicedSeconds={data.practicedSeconds}
        />
      </div>

      <div
        data-reveal
        role="tablist"
        aria-label="Filtrar sesiones"
        className="-mb-px flex flex-wrap gap-6 border-b border-line"
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = sorted.filter((s) => matches(s, f.id)).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 border-b-2 pb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none",
                active
                  ? "border-lime text-ink"
                  : "border-transparent text-ink-faint hover:text-ink",
              )}
            >
              {f.label}
              <sup className="text-[9px] font-semibold tabular-nums text-ink-faint">
                {count}
              </sup>
            </button>
          );
        })}
      </div>

      <section data-reveal>
        {filtered.length === 0 ? (
          <EmptyHistory />
        ) : (
          <SessionTimeline sessions={filtered} />
        )}
      </section>
    </div>
  );
}

function formatPracticed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min`;
  return "—";
}

function StatsBanner({
  total,
  average,
  best,
  practicedSeconds,
}: {
  total: number;
  average: number | null;
  best: number | null;
  practicedSeconds: number;
}) {
  // One dominant metric (score promedio) + a mono ledger — a hierarchy, not
  // four equal tiles.
  const ledger: { label: string; value: string }[] = [
    { label: "Sesiones", value: String(total) },
    { label: "Mejor score", value: best === null ? "—" : String(best) },
    { label: "Tiempo total", value: formatPracticed(practicedSeconds) },
  ];
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-line lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col justify-center bg-surface px-6 py-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
          Score promedio
        </p>
        <p className="font-display mt-2 flex items-baseline text-6xl font-bold tabular-nums text-ink">
          {average ?? "—"}
          <span className="ml-1.5 text-2xl font-semibold text-ink-faint">
            /100
          </span>
        </p>
      </div>
      <div className="grid grid-rows-3 divide-y divide-line bg-surface">
        {ledger.map((it) => (
          <div
            key={it.label}
            className="flex items-baseline justify-between px-6 py-3"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              {it.label}
            </span>
            <span className="font-display text-lg font-bold tabular-nums text-ink">
              {it.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface px-6 py-14 text-center">
      <p className="text-sm text-ink-soft">
        No hay sesiones con este filtro todavía.
      </p>
      <Link
        to="/practice/new"
        className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-on-lime transition-colors hover:bg-lime-dim"
      >
        <Plus className="h-4 w-4" strokeWidth={2.2} />
        Nueva práctica
      </Link>
    </div>
  );
}
