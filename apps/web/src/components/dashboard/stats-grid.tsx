import { Calendar, Clock, Target, TrendingUp, type LucideIcon } from "lucide-react";

interface StatsGridProps {
  totalSessions: number;
  averageScore: number | null;
  weeklyCount: number;
  weeklyGoal: number;
  practicedSeconds: number;
}

export function StatsGrid({
  totalSessions,
  averageScore,
  weeklyCount,
  weeklyGoal,
  practicedSeconds,
}: StatsGridProps) {
  const hours = Math.floor(practicedSeconds / 3600);
  const minutes = Math.round((practicedSeconds % 3600) / 60);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Score promedio"
        icon={Target}
        value={
          averageScore === null ? (
            "—"
          ) : (
            <>
              {averageScore}
              <span className="ml-1 text-[13px] font-medium text-gray-500">/100</span>
            </>
          )
        }
        meta={averageScore === null ? "Aún sin sesiones completadas" : "Promedio de tus reportes"}
      />

      <StatCard
        label="Sesiones esta semana"
        icon={Calendar}
        value={
          <>
            {weeklyCount}
            <span className="ml-1 text-[13px] font-medium text-gray-500">/ {weeklyGoal}</span>
          </>
        }
        meta={
          <MetaProgress
            percent={weeklyGoal > 0 ? (weeklyCount / weeklyGoal) * 100 : 0}
          />
        }
      />

      <StatCard
        label="Tiempo practicado"
        icon={Clock}
        value={
          hours > 0 ? (
            <>
              {hours}
              <span className="text-[13px] font-medium text-gray-500">h</span> {minutes}
              <span className="text-[13px] font-medium text-gray-500">min</span>
            </>
          ) : minutes > 0 ? (
            <>
              {minutes}
              <span className="text-[13px] font-medium text-gray-500">min</span>
            </>
          ) : (
            "—"
          )
        }
        meta="Total acumulado"
      />

      <StatCard
        label="Total de sesiones"
        icon={TrendingUp}
        value={totalSessions.toString()}
        meta={totalSessions === 0 ? "Empieza tu primera sesión" : "Incluye estados intermedios"}
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
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gray-100 text-[#0A0A0A]">
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
