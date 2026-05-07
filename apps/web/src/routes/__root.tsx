import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Toaster } from "@/components/ui/sonner";

import Header from "../components/header";
import appCss from "../index.css?url";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "My App",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Routes that bring their own chrome — login/register show their
  // marketing layout, /dashboard (and future authenticated routes)
  // render their sidebar+topbar. Everywhere else gets the legacy
  // global Header.
  const ownsChrome =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className={ownsChrome ? "h-svh" : "grid h-svh grid-rows-[auto_1fr]"}>
          {!ownsChrome && <Header />}
          <Outlet />
        </div>
        <Toaster richColors />

        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
