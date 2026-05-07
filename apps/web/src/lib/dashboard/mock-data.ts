/**
 * Hard-coded data for the dashboard placeholder.
 *
 * Each block points at the epic that will replace it with real data.
 * The shapes here intentionally match the eventual API responses so
 * components don't need to change once the wiring lands.
 */
import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
  Clock,
  MessageSquare,
  Target,
  Trophy,
} from "lucide-react";

// TODO(épica-7): GET /api/v1/progress
export const stats = {
  globalScore: 78,
  globalScoreDelta: 5,
  weeklySessions: { done: 4, goal: 5 },
  practicedTimeMinutes: 154, // 2h 34m
  nextAchievement: "Maratón",
  nextAchievementCopy: "1 sesión más para desbloquear",
};

// TODO(épica-7): streak from progress aggregates
export const streak = {
  days: 5,
  // 7 dots for the week. last index is "today", earlier "done", future "".
  weekDots: ["done", "done", "done", "done", "today", "future", "future"] as const,
};

// TODO(épica-4 / 5): GET /api/v1/sessions ordered desc
export const lastSession = {
  id: "demo-14",
  title: "Pitch para inversionistas serie A",
  daysAgo: 2,
  durationMinutes: 12,
  sessionNumber: 14,
  fillerWords: 3,
  wpm: 142,
  clarity: 8.6,
  score: 78,
};

// TODO(épica-4): /reports/{id}/recommended-focus
export const recommendation = {
  title: "Pausas estratégicas en cierres",
  body:
    "Tu velocidad de habla aumenta 18% en los últimos 30 segundos. Sesión enfocada de 5 min para trabajar el ritmo del cierre.",
};

// TODO(épica-7): time-series of weekly scores
export const progressSeries = {
  points: [
    { x: 0, y: 90 },
    { x: 60, y: 82 },
    { x: 120, y: 72 },
    { x: 180, y: 76 },
    { x: 240, y: 60 },
    { x: 300, y: 54 },
    { x: 360, y: 48 },
    { x: 420, y: 40 },
    { x: 480, y: 42 },
    { x: 540, y: 32 },
    { x: 600, y: 28 },
  ],
  highlightedIndices: [1, 3, 5, 7, 9],
  weekLabels: ["S 1", "S 2", "S 3", "S 4"],
  currentScore: 78,
  improvement: 12,
  bestCategory: "Estructura",
};

// TODO(épica-7): /api/v1/routes (no existe aún, se crea en una épica futura)
export interface ActiveRoute {
  id: string;
  name: string;
  level: number;
  totalLevels: number;
  done: number;
  total: number;
  variant: "lime" | "dark";
}

export const activeRoutes: ActiveRoute[] = [
  {
    id: "pauses",
    name: "Pausas intencionales",
    level: 3,
    totalLevels: 5,
    done: 4,
    total: 7,
    variant: "lime",
  },
  {
    id: "storytelling",
    name: "Storytelling persuasivo",
    level: 2,
    totalLevels: 5,
    done: 2,
    total: 6,
    variant: "dark",
  },
];

// TODO(épica-7): conteos reales en sidebar
export interface SidebarLink {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export const navMainPlaceholders: SidebarLink[] = [
  { id: "new-session", label: "Nueva sesión", icon: MessageSquare, badge: "+" },
  { id: "progress", label: "Mi progreso", icon: Target },
  { id: "history", label: "Histórico", icon: Clock, badge: "14" },
  { id: "achievements", label: "Logros", icon: Trophy, badge: "3" },
];

export const navAccountPlaceholders: SidebarLink[] = [
  { id: "settings", label: "Configuración", icon: CheckSquare },
];
