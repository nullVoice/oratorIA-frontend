import { Calendar, Clock, Target, Trophy, type LucideIcon } from "lucide-react";

import { stats } from "@/lib/dashboard/mock-data";

export function StatsGrid() {
  const hours = Math.floor(stats.practicedTimeMinutes / 60);
  const minutes = stats.practicedTimeMinutes % 60;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Score global"
        icon={Target}
        value={
          <>
            {stats.globalScore}
            <span className="ml-1 text-[13px] font-semibold text-gray-500">/100</span>
          </>
        }
        meta={
          <>
            <span className="font-bold text-emerald-500">↑ +{stats.globalScoreDelta}</span> vs mes pasado
          </>
        }
      />

      <StatCard
        label="Sesiones esta semana"
        icon={Calendar}
        value={
          <>
            {stats.weeklySessions.done}
            <span className="ml-1 text-[13px] font-semibold text-gray-500">
              / {stats.weeklySessions.goal}
            </span>
          </>
        }
        meta={<MetaProgress percent={(stats.weeklySessions.done / stats.weeklySessions.goal) * 100} />}
      />

      <StatCard
        label="Tiempo practicado"
        icon={Clock}
        value={
          <>
            {hours}
            <span className="text-[13px] font-semibold text-gray-500">h</span> {minutes}
            <span className="text-[13px] font-semibold text-gray-500">min</span>
          </>
        }
        meta="Total acumulado"
      />

      <StatCard
        label="Próximo logro"
        icon={Trophy}
        value={<span className="text-lg leading-tight">{stats.nextAchievement}</span>}
        meta={stats.nextAchievementCopy}
      />
    </div>
  );
}

function StatCard({
  label,
  icon: Icon,
  value,
  meta,
}: {
  label: string;
  icon: LucideIcon;
  value: React.ReactNode;
  meta: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F7FFE0] text-[#0A0A0A]">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
      </div>
      <div className="flex items-baseline gap-1 text-3xl font-bold leading-none tracking-tight text-[#0A0A0A]">
        {value}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500">{meta}</div>
    </div>
  );
}

function MetaProgress({ percent }: { percent: number }) {
  return (
    <div className="flex-1 overflow-hidden rounded-sm bg-gray-100">
      <div
        className="h-1 bg-[#C6FF3D]"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
