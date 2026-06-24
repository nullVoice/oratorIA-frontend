/**
 * Pulls the current user's sessions and derives the metrics the
 * dashboard cards consume. Uses TanStack Query so the list stays
 * cached across navigations (dashboard ↔ report ↔ back).
 */
import { useQuery } from "@tanstack/react-query";

import { fetchSessions, type SessionSummary } from "@/lib/api/sessions";
import { buildMockSessions } from "@/lib/dashboard/mock-sessions";

export interface DashboardData {
  loading: boolean;
  sessions: SessionSummary[];
  totalSessions: number;
  completedSessions: SessionSummary[];
  averageScore: number | null;
  weeklyCount: number;
  weeklyGoal: number;
  practicedSeconds: number;
  streakDays: number;
  weekDots: Array<"done" | "today" | "future">;
  lastCompleted: SessionSummary | null;
}

const WEEKLY_GOAL = 5;

function startOfWeekUTC(d = new Date()): number {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day);
  return x.getTime();
}

function startOfTodayUTC(): number {
  const x = new Date();
  x.setUTCHours(0, 0, 0, 0);
  return x.getTime();
}

function computeStreak(sessions: SessionSummary[]): number {
  const days = new Set<number>();
  for (const s of sessions) {
    const d = new Date(s.created_at);
    d.setUTCHours(0, 0, 0, 0);
    days.add(d.getTime());
  }
  let streak = 0;
  let cursor = startOfTodayUTC();
  while (days.has(cursor)) {
    streak++;
    cursor -= 24 * 60 * 60 * 1000;
  }
  return streak;
}

function buildWeekDots(streakDays: number): Array<"done" | "today" | "future"> {
  const todayIdx = (new Date().getUTCDay() + 6) % 7;
  const done = Math.max(0, Math.min(todayIdx, streakDays - 1));
  const dots: Array<"done" | "today" | "future"> = [];
  for (let i = 0; i < 7; i++) {
    if (i < todayIdx - done) dots.push("future");
    else if (i < todayIdx) dots.push("done");
    else if (i === todayIdx) dots.push("today");
    else dots.push("future");
  }
  return dots;
}

export function useDashboardData(): DashboardData {
  const query = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetchSessions({ page_size: 100 }),
    staleTime: 30_000,
  });

  // Demo fallback: when the account has no real sessions yet, surface a
  // mocked dataset so the dashboard showcases the product instead of an
  // empty state. Real sessions always take precedence.
  const fetched = query.data ?? [];
  const sessions =
    !query.isLoading && fetched.length === 0 ? buildMockSessions() : fetched;
  const completed = sessions.filter(
    (s) => s.status === "completed" && s.score !== null,
  );

  const averageScore = completed.length
    ? Math.round(
        completed.reduce((acc, s) => acc + (s.score ?? 0), 0) / completed.length,
      )
    : null;

  const weekStart = startOfWeekUTC();
  const weeklyCount = sessions.filter((s) => {
    const ts = new Date(s.created_at).getTime();
    return ts >= weekStart;
  }).length;

  const practicedSeconds = sessions.reduce(
    (acc, s) => acc + (s.duration_seconds ?? 0),
    0,
  );

  const streakDays = computeStreak(sessions);
  const weekDots = buildWeekDots(streakDays);

  const lastCompleted = completed[0] ?? null;

  return {
    loading: query.isLoading,
    sessions,
    totalSessions: sessions.length,
    completedSessions: completed,
    averageScore,
    weeklyCount,
    weeklyGoal: WEEKLY_GOAL,
    practicedSeconds,
    streakDays,
    weekDots,
    lastCompleted,
  };
}
