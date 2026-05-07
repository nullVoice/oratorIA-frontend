import { createFileRoute } from "@tanstack/react-router";

import { HeroCard } from "@/components/dashboard/hero-card";
import { LastSessionCard } from "@/components/dashboard/last-session-card";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecommendationBanner } from "@/components/dashboard/recommendation-banner";
import { RoutesGrid } from "@/components/dashboard/routes-grid";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { namePartOfEmail } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardHome,
});

function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.full_name ?? (user ? namePartOfEmail(user.email) : "");
  const firstName = displayName.split(" ")[0] ?? displayName;

  return (
    <div className="flex flex-col gap-7">
      <HeroCard firstName={firstName} />

      <Section title="Tus métricas rápidas" link="Ver progreso completo →">
        <StatsGrid />
      </Section>

      <Section title="Acciones rápidas">
        <QuickActions />
      </Section>

      <Section title="Tu última sesión" link="Ver histórico →">
        <LastSessionCard />
      </Section>

      <RecommendationBanner />

      <Section title="Tu progreso · últimas 4 semanas" link="Ver detalle →">
        <ProgressChart />
      </Section>

      <Section title="Tus rutas activas" link="Ver todas →">
        <RoutesGrid />
      </Section>
    </div>
  );
}

function Section({
  title,
  link,
  children,
}: {
  title: string;
  link?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-tight text-[#0A0A0A]">{title}</h2>
        {link && (
          <button type="button" className="text-xs font-semibold text-gray-500 transition-colors hover:text-[#0A0A0A]">
            {link}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
