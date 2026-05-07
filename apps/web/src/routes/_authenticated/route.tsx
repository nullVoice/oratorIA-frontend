/**
 * Pathless layout route for the authenticated zone.
 *
 * - `beforeLoad` redirects to `/login` if no token is in the auth store
 *   yet (synchronous check — we don't fetch /users/me here, the
 *   sub-routes do that after the layout mounts).
 * - The component renders the dashboard chrome (sidebar + topbar)
 *   around `<Outlet />` so every child route inherits it.
 */
import { Outlet, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    const { token } = useAuthStore.getState();
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  // After a hard reload the token survives in localStorage but `user`
  // is null — repopulate from the server before painting protected UI.
  useEffect(() => {
    if (token && !user) {
      fetchMe().catch(() => {
        router.navigate({ to: "/login" });
      });
    }
  }, [token, user, fetchMe, router]);

  if (!user) {
    return (
      <div className="grid h-svh place-items-center text-sm text-gray-500">
        Cargando…
      </div>
    );
  }

  return (
    <div className="grid min-h-svh grid-cols-[240px_1fr] bg-gray-50">
      <Sidebar user={user} />
      <div className="flex min-h-svh flex-col overflow-hidden">
        <Topbar user={user} />
        <div className="overflow-y-auto px-8 pb-14 pt-7">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
