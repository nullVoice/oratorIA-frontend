import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy URL — kept as a redirect so existing bookmarks / dashboard
 * links keep working. The canonical report page is /reports/$reportId.
 */
export const Route = createFileRoute("/_authenticated/sessions/$sessionId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/reports/$reportId",
      params: { reportId: params.sessionId },
    });
  },
});
