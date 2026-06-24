import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { HeroCard } from "@/components/dashboard/hero-card";
import { LastSessionCard } from "@/components/dashboard/last-session-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ScoreJourney } from "@/components/dashboard/score-journey";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { useDashboardData } from "@/lib/dashboard/use-dashboard-data";
import { useReveal } from "@/lib/anim/use-reveal";
import { namePartOfEmail } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardHome,
});

function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const data = useDashboardData();
  const reveal = useReveal<HTMLDivElement>();
  const displayName = user?.full_name ?? (user ? namePartOfEmail(user.email) : "");
  const firstName = displayName.split(" ")[0] ?? displayName;

  if (data.loading) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-soft">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (data.totalSessions === 0) {
    return <EmptyState firstName={firstName} />;
  }

  return (
    <>
      <div ref={reveal} className="flex flex-col gap-8">
        <div data-reveal>
          <HeroCard
            firstName={firstName}
            streakDays={data.streakDays}
            weekDots={data.weekDots}
            weeklyCount={data.weeklyCount}
            weeklyGoal={data.weeklyGoal}
          />
        </div>

        <Section title="Métricas">
          <StatsGrid
            totalSessions={data.totalSessions}
            averageScore={data.averageScore}
            weeklyCount={data.weeklyCount}
            weeklyGoal={data.weeklyGoal}
            practicedSeconds={data.practicedSeconds}
          />
        </Section>

        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-[1.65fr_1fr]">
          <Section title="Progresión">
            <ScoreJourney sessions={data.sessions} />
          </Section>

          <div className="flex flex-col gap-8">
            <Section title="Practicar">
              <QuickActions />
            </Section>
            {data.lastCompleted && (
              <Section title="Última sesión">
                <LastSessionCard session={data.lastCompleted} />
              </Section>
            )}
          </div>
        </div>
      </div>

      <FabNewPractice />
    </>
  );
}

function FabNewPractice() {
  return (
    <Link
      to="/practice/new"
      aria-label="Nueva práctica"
      className="fixed bottom-7 right-7 z-20 inline-flex h-12 items-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-on-lime shadow-[0_0_28px_var(--color-lime-shadow)] transition-colors hover:bg-lime-dim sm:px-6"
    >
      <Plus className="h-4.5 w-4.5" strokeWidth={2.2} />
      <span className="hidden sm:inline">Nueva práctica</span>
    </Link>
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
