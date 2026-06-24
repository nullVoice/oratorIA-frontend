/**
 * Pathless layout route for the authenticated zone.
 *
 * - `beforeLoad` redirects to `/login` if no token is in the auth store
 *   yet (synchronous check — we don't fetch /users/me here, the
 *   sub-routes do that after the layout mounts).
 * - The component renders the dashboard chrome (sidebar + topbar)
 *   around `<Outlet />` so every child route inherits it.
 */
import {
  Outlet,
  createFileRoute,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    // The auth token lives only in localStorage, which is unreadable during
    // SSR — so on the server `token` is always null. Guarding the redirect to
    // the client prevents a hard load / refresh / direct URL from always
    // bouncing to /login despite a valid session. The component below covers
    // the client-hydration case (redirects if there's genuinely no token).
    if (typeof document === "undefined") return;
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
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);

  // After a hard reload the token survives in localStorage but `user`
  // is null — repopulate from the server before painting protected UI.
  // If there is genuinely no token (logged out, or SSR-skipped guard above),
  // redirect to /login on the client.
  useEffect(() => {
    if (!token) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) {
      fetchMe().catch(() => {
        router.navigate({ to: "/login" });
      });
    }
  }, [token, user, fetchMe, router]);

  if (!user) {
    return (
      <div className="grid h-svh place-items-center bg-stage text-sm text-ink-soft">
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex h-svh overflow-hidden bg-stage">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-lime"
      >
        Saltar al contenido
      </a>

      <Sidebar user={user} />

      <div
        className="flex h-svh min-w-0 flex-1 flex-col"
        {...(mobileNavOpen ? { inert: "" } : {})}
      >
        <Topbar user={user} />
        <main
          id="main-content"
          className="w-full flex-1 overflow-y-auto px-5 pb-16 pt-8 sm:px-7 lg:px-8 xl:px-12 2xl:px-16"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
