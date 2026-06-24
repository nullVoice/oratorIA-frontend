import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";

import Header from "../components/header";
import appCss from "../index.css?url";

export interface RouterAppContext {
  queryClient: QueryClient;
}

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
        title: "OratorIA — tu coach de oratoria con IA",
      },
      {
        name: "description",
        content:
          "OratorIA: practicá tus presentaciones con una audiencia digital y recibí feedback inmediato.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/OratorIA-favicon-32.png" },
      { rel: "apple-touch-icon", href: "/OratorIA-app-icon-1024.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&family=JetBrains+Mono:wght@400;500;600&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap",
      },
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
    pathname.startsWith("/dashboard/") ||
    pathname === "/practice" ||
    pathname.startsWith("/practice/") ||
    pathname.startsWith("/reports/") ||
    pathname.startsWith("/sessions/");

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* No-flash theme: apply stored/default theme before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('oratoria-theme')||'dark';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
        <HeadContent />
      </head>
      <body>
        <div
          className={ownsChrome ? "h-svh" : "grid h-svh grid-rows-[auto_1fr]"}
        >
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
