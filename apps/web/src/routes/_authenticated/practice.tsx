import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";

/**
 * Layout para todas las rutas /practice/*. Antes este archivo contenía el
 * flujo legacy completo (basado en /api/v1/practice/finalize). En épica 5
 * se migró a /practice/new + /practice/$sessionId, y este wrapper queda
 * para:
 *   - redirigir /practice (sin sufijo) a /practice/new
 *   - exponer un <Outlet /> para que las rutas hijas se rendericen
 */
export const Route = createFileRoute("/_authenticated/practice")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/practice" || location.pathname === "/practice/") {
      throw redirect({ to: "/practice/new" });
    }
  },
  component: PracticeLayout,
});

function PracticeLayout() {
  return <Outlet />;
}
