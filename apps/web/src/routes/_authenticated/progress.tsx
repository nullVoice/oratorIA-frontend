/**
 * Mi progreso — the user's improvement story: headline metrics, the score
 * journey chart and a breakdown by session type and weekly goal. All derived
 * from the shared sessions query (with the same demo fallback as the
 * dashboard, so a fresh account still sees a meaningful view).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Mic, TrendingUp, Trophy, Video } from "lucide-react";

import { ScoreJourney } from "@/components/dashboard/score-journey";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { useReveal } from "@/lib/anim/use-reveal";
import { useDashboardData } from "@/lib/dashboard/use-dashboard-data";
import type { SessionSummary } from "@/lib/api/sessions";

export const Route = createFileRoute("/_authenticated/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const data = useDashboardData();
  const reveal = useReveal<HTMLDivElement>();

  if (data.loading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-soft">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const scores = data.completedSessions
    .map((s) => s.score)
    .filter((v): v is number => v !== null);
  const bestScore = scores.length ? Math.max(...scores) : null;

  const chrono = data.completedSessions
    .filter((s) => s.score !== null)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  const improvement =
    chrono.length >= 2
      ? (chrono[chrono.length - 1].score as number) -
        (chrono[0].score as number)
      : null;

  const live = data.sessions.filter((s) => s.type === "live");
  const asyncS = data.sessions.filter((s) => s.type === "async");

  return (
    <div ref={reveal} className="flex flex-col gap-8">
      <header data-reveal className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Mi progreso
        </h1>
        <p className="text-sm text-ink-soft">
          Tu evolución a lo largo de {data.completedSessions.length}{" "}
          {data.completedSessions.length === 1 ? "sesión" : "sesiones"}{" "}
          evaluadas.
        </p>
      </header>

      <section data-reveal>
        <StatsGrid
          totalSessions={data.totalSessions}
          averageScore={data.averageScore}
          weeklyCount={data.weeklyCount}
          weeklyGoal={data.weeklyGoal}
          practicedSeconds={data.practicedSeconds}
        />
      </section>

      <div className="grid gap-x-6 gap-y-8 lg:grid-cols-[1.65fr_1fr]">
        <Section title="Progresión">
          <ScoreJourney sessions={data.sessions} />
        </Section>

        <div className="flex flex-col gap-8">
          <Section title="Resumen">
            <div className="flex flex-col gap-3 rounded-2xl bg-surface p-6">
              <SummaryRow
                icon={
                  <Trophy className="h-4 w-4 text-accent" strokeWidth={2} />
                }
                label="Mejor score"
                value={bestScore === null ? "—" : `${bestScore} / 100`}
              />
              <SummaryRow
                icon={
                  <TrendingUp className="h-4 w-4 text-accent" strokeWidth={2} />
                }
                label="Mejora total"
                value={
                  improvement === null
                    ? "—"
                    : `${improvement >= 0 ? "+" : ""}${improvement} pts`
                }
              />
              <SummaryRow
                icon={<Mic className="h-4 w-4 text-accent" strokeWidth={2} />}
                label="Racha actual"
                value={`${data.streakDays} ${
                  data.streakDays === 1 ? "día" : "días"
                }`}
              />
            </div>
          </Section>

          <Section title="Por modalidad">
            <div className="grid grid-cols-2 gap-3">
              <TypeCard
                icon={<Mic className="h-5 w-5" strokeWidth={1.8} />}
                label="En vivo"
                sessions={live}
              />
              <TypeCard
                icon={<Video className="h-5 w-5" strokeWidth={1.8} />}
                label="Análisis"
                sessions={asyncS}
              />
            </div>
          </Section>
        </div>
      </div>

      <section data-reveal>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
        >
          Ver historial completo →
        </Link>
      </section>
    </div>
  );
}

function TypeCard({
  icon,
  label,
  sessions,
}: {
  icon: React.ReactNode;
  label: string;
  sessions: SessionSummary[];
}) {
  const scored = sessions
    .map((s) => s.score)
    .filter((v): v is number => v !== null);
  const avg = scored.length
    ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
    : null;

  return (
    <div className="rounded-2xl bg-surface p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-accent">
        {icon}
      </span>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      <p className="font-display mt-1 text-3xl font-bold tabular-nums text-ink">
        {sessions.length}
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        {avg === null ? "Sin score" : `Promedio ${avg}`}
      </p>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2.5 text-sm text-ink-soft">
        {icon}
        {label}
      </span>
      <span className="font-display text-lg font-semibold tabular-nums text-ink">
        {value}
      </span>
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
    <section data-reveal>
      <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}
