import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

interface HeroCardProps {
  firstName: string;
  streakDays: number;
  weekDots: Array<"done" | "today" | "future">;
  weeklyCount: number;
  weeklyGoal: number;
}

export function HeroCard({
  firstName,
  streakDays,
  weekDots,
  weeklyCount,
  weeklyGoal,
}: HeroCardProps) {
  const remainingThisWeek = Math.max(0, weeklyGoal - weeklyCount);
  const subtitle = streakDays > 0
    ? `Llevas ${streakDays} día${streakDays === 1 ? "" : "s"} seguidos practicando.`
    : "Empieza tu próxima sesión cuando quieras.";
  const goalLine = remainingThisWeek > 0
    ? `Te falta${remainingThisWeek === 1 ? "" : "n"} ${remainingThisWeek} sesió${remainingThisWeek === 1 ? "n" : "nes"} para tu meta semanal.`
    : "Ya cumpliste tu meta semanal — sigue así.";

  return (
    <section className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-gray-200 bg-white p-7 xl:grid-cols-[1fr_auto]">
      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#0A0A0A] sm:text-3xl">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-2 max-w-md text-[15px] text-gray-600">
          {subtitle} {goalLine}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            to="/practice"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0A0A0A] px-5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
          >
            Empezar nueva sesión
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <StreakBadge days={streakDays} weekDots={weekDots} />
    </section>
  );
}

function StreakBadge({
  days,
  weekDots,
}: {
  days: number;
  weekDots: Array<"done" | "today" | "future">;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5">
      <span className="text-5xl font-bold leading-none tracking-tight text-[#0A0A0A]">
        {days}
      </span>
      <span className="text-xs text-gray-600">
        {days === 1 ? "día seguido" : "días seguidos"}
      </span>
      <div className="flex gap-1">
        {weekDots.map((s, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-sm",
              s === "done" && "bg-[#C6FF3D]",
              s === "today" && "bg-[#0A0A0A]",
              s === "future" && "bg-gray-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}
