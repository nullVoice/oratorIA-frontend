/**
 * Achievements engine — derives unlocked/locked badges from the user's real
 * session history. Pure and side-effect free so both the Logros page and the
 * sidebar badge can compute the same result from the shared `useDashboardData`
 * query (no extra fetch).
 *
 * Every achievement exposes a `progress` (0..1) so locked badges still show
 * how close the user is, turning the page into a motivator rather than a wall.
 */
import type { SessionSummary } from "@/lib/api/sessions";

export type AchievementIcon =
  | "trophy"
  | "flame"
  | "target"
  | "star"
  | "clock"
  | "sparkles"
  | "medal"
  | "zap"
  | "trending"
  | "layers";

/** Per-achievement accent color, so the wall reads as alive, not monochrome. */
export type AchievementColor =
  | "lime"
  | "emerald"
  | "teal"
  | "sky"
  | "violet"
  | "fuchsia"
  | "rose"
  | "orange"
  | "amber"
  | "yellow";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  color: AchievementColor;
  /** 0..1 completion toward the goal. */
  progress: number;
  unlocked: boolean;
  current: number;
  goal: number;
  /** Short human-readable current/goal, e.g. "3 / 5 sesiones". */
  hint: string;
}

export interface AchievementInput {
  sessions: SessionSummary[];
  completedSessions: SessionSummary[];
  streakDays: number;
  practicedSeconds: number;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

interface Def {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  color: AchievementColor;
  goal: number;
  current: number;
  unit: string;
}

export function computeAchievements(input: AchievementInput): Achievement[] {
  const { sessions, completedSessions, streakDays, practicedSeconds } = input;

  const completedCount = completedSessions.length;
  const scores = completedSessions
    .map((s) => s.score)
    .filter((v): v is number => v !== null);
  const bestScore = scores.length ? Math.max(...scores) : 0;

  // Improvement = last completed score - first completed score (chronological).
  const chrono = completedSessions
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
      : 0;

  const usedLive = sessions.some((s) => s.type === "live");
  const usedAsync = sessions.some((s) => s.type === "async");
  const versatility = (usedLive ? 1 : 0) + (usedAsync ? 1 : 0);

  const practicedMinutes = Math.floor(practicedSeconds / 60);

  const defs: Def[] = [
    {
      id: "first-session",
      title: "Primer paso",
      description: "Completá tu primera sesión de práctica.",
      icon: "star",
      color: "amber",
      goal: 1,
      current: completedCount,
      unit: "sesión",
    },
    {
      id: "consistency-5",
      title: "En marcha",
      description: "Completá 5 sesiones y agarrá ritmo.",
      icon: "target",
      color: "emerald",
      goal: 5,
      current: completedCount,
      unit: "sesiones",
    },
    {
      id: "marathon-15",
      title: "Orador incansable",
      description: "Completá 15 sesiones de práctica.",
      icon: "medal",
      color: "sky",
      goal: 15,
      current: completedCount,
      unit: "sesiones",
    },
    {
      id: "streak-3",
      title: "En racha",
      description: "Practicá 3 días seguidos.",
      icon: "flame",
      color: "orange",
      goal: 3,
      current: streakDays,
      unit: "días",
    },
    {
      id: "streak-7",
      title: "Semana perfecta",
      description: "Mantené una racha de 7 días.",
      icon: "zap",
      color: "yellow",
      goal: 7,
      current: streakDays,
      unit: "días",
    },
    {
      id: "score-80",
      title: "Buen orador",
      description: "Alcanzá un score de 80 en una sesión.",
      icon: "trophy",
      color: "violet",
      goal: 80,
      current: bestScore,
      unit: "pts",
    },
    {
      id: "score-90",
      title: "Maestría",
      description: "Alcanzá un score de 90 en una sesión.",
      icon: "sparkles",
      color: "fuchsia",
      goal: 90,
      current: bestScore,
      unit: "pts",
    },
    {
      id: "improvement-10",
      title: "Mejora sostenida",
      description: "Subí 10 puntos entre tu primera y tu última sesión.",
      icon: "trending",
      color: "teal",
      goal: 10,
      current: Math.max(0, improvement),
      unit: "pts",
    },
    {
      id: "time-60",
      title: "Tiempo al aire",
      description: "Acumulá 60 minutos frente al micrófono.",
      icon: "clock",
      color: "rose",
      goal: 60,
      current: practicedMinutes,
      unit: "min",
    },
    {
      id: "versatile",
      title: "Versátil",
      description: "Probá los dos modos: en vivo y análisis de video.",
      icon: "layers",
      color: "lime",
      goal: 2,
      current: versatility,
      unit: "modos",
    },
  ];

  return defs.map((d) => {
    const progress = d.goal > 0 ? clamp01(d.current / d.goal) : 0;
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      icon: d.icon,
      color: d.color,
      progress,
      unlocked: d.current >= d.goal,
      current: d.current,
      goal: d.goal,
      hint: `${Math.min(d.current, d.goal)} / ${d.goal} ${d.unit}`,
    } satisfies Achievement;
  });
}

export function countUnlocked(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).length;
}
