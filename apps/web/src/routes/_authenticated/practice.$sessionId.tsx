import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout para /practice/$sessionId/*. La página de grabación simple vive en
 * practice.$sessionId.index.tsx; la modalidad avatar vive en
 * practice.$sessionId.avatar.tsx. Este layout sólo monta <Outlet />.
 */
export const Route = createFileRoute("/_authenticated/practice/$sessionId")({
  component: () => <Outlet />,
});
