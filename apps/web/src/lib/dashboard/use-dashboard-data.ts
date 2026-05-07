/**
 * Pulls the current user's sessions and derives the metrics the
 * dashboard cards consume. Replaces the previous mock-data snapshot.
 */
import { useEffect, useState } from "react";

import { fetchSessions, type SessionSummary } from "@/lib/api/sessions";

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
  // Treat Monday as the start of the week. JS getUTCDay -> Sun=0..Sat=6.
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
  // Walk the unique session dates backwards from today, counting consecutive
  // days that had at least one session.
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
  // Show today as the (Mon-indexed) current day; everything before today
  // up to the streak length renders as `done`, today is `today`, after
  // is `future`. Caps at 7 dots.
  const todayIdx = (new Date().getUTCDay() + 6) % 7; // 0..6, Mon=0
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
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSessions();
        if (!cancelled) setSessions(data);
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completed = sessions.filter((s) => s.status === "completed" && s.score !== null);

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
    loading,
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
