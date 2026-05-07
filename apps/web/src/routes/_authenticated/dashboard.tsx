import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { HeroCard } from "@/components/dashboard/hero-card";
import { LastSessionCard } from "@/components/dashboard/last-session-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { useDashboardData } from "@/lib/dashboard/use-dashboard-data";
import { namePartOfEmail } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardHome,
});

function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const data = useDashboardData();
  const displayName = user?.full_name ?? (user ? namePartOfEmail(user.email) : "");
  const firstName = displayName.split(" ")[0] ?? displayName;

  if (data.loading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (data.totalSessions === 0) {
    return <EmptyState firstName={firstName} />;
  }

  return (
    <div className="flex flex-col gap-7">
      <HeroCard
        firstName={firstName}
        streakDays={data.streakDays}
        weekDots={data.weekDots}
        weeklyCount={data.weeklyCount}
        weeklyGoal={data.weeklyGoal}
      />

      <Section title="Tus métricas">
        <StatsGrid
          totalSessions={data.totalSessions}
          averageScore={data.averageScore}
          weeklyCount={data.weeklyCount}
          weeklyGoal={data.weeklyGoal}
          practicedSeconds={data.practicedSeconds}
        />
      </Section>

      <Section title="Acciones rápidas">
        <QuickActions />
      </Section>

      {data.lastCompleted && (
        <Section title="Tu última sesión">
          <LastSessionCard session={data.lastCompleted} />
        </Section>
      )}
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
    <section>
      <h2 className="mb-4 text-base font-semibold text-[#0A0A0A]">{title}</h2>
      {children}
    </section>
  );
}
