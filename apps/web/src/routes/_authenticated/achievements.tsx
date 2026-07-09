/**
 * Logros — achievement wall derived from the user's real session history.
 * Unlocked badges are highlighted; locked ones show a progress bar toward
 * their goal so the page motivates instead of gating.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
  Flame,
  Layers,
  Loader2,
  Lock,
  Medal,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useReveal } from "@/lib/anim/use-reveal";
import {
  computeAchievements,
  countUnlocked,
  type Achievement,
  type AchievementIcon,
} from "@/lib/progress/achievements";
import { useDashboardData } from "@/lib/dashboard/use-dashboard-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/achievements")({
  component: AchievementsPage,
});

const ICONS: Record<AchievementIcon, LucideIcon> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  star: Star,
  clock: Clock,
  sparkles: Sparkles,
  medal: Medal,
  zap: Zap,
  trending: TrendingUp,
  layers: Layers,
};

function AchievementsPage() {
  const data = useDashboardData();
  const reveal = useReveal<HTMLDivElement>();

  if (data.loading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-soft">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const achievements = computeAchievements({
    sessions: data.sessions,
    completedSessions: data.completedSessions,
    streakDays: data.streakDays,
    practicedSeconds: data.practicedSeconds,
  });
  const unlocked = countUnlocked(achievements);
  const total = achievements.length;
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return (
    <div ref={reveal} className="flex flex-col gap-8">
      <header data-reveal className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Logros
        </h1>
        <p className="text-sm text-ink-soft">
          Desbloqueaste{" "}
          <span className="font-semibold text-ink">{unlocked}</span> de {total}{" "}
          logros. Seguí practicando para completar el resto.
        </p>
      </header>

      <section
        data-reveal
        className="rounded-2xl bg-surface p-6 sm:flex sm:items-center sm:justify-between sm:p-7"
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-5xl font-bold leading-none tabular-nums text-ink">
            {unlocked}
          </span>
          <span className="text-lg font-medium text-ink-faint">/ {total}</span>
        </div>
        <div className="mt-4 w-full sm:mt-0 sm:max-w-xs">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>Progreso total</span>
            <span className="font-semibold text-ink">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      <section data-reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const Icon = ICONS[a.icon];
  const pct = Math.round(a.progress * 100);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 rounded-2xl border p-5 transition-colors",
        a.unlocked
          ? "border-accent/25 bg-accent/[0.06]"
          : "border-line bg-surface",
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-xl",
            a.unlocked
              ? "bg-accent/15 text-accent"
              : "bg-surface-2 text-ink-faint",
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        </span>
        {a.unlocked ? (
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent ring-1 ring-accent/25">
            Desbloqueado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            <Lock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
            Bloqueado
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          {a.description}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] text-ink-faint">
          <span className="font-medium">{a.hint}</span>
          {!a.unlocked && <span>{pct}%</span>}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700",
              a.unlocked ? "bg-accent" : "bg-ink-faint/40",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
