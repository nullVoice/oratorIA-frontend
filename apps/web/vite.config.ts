import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// The Nitro plugin is REQUIRED for production hosting: it auto-detects the
// platform (Vercel sets VERCEL=1 → emits `.vercel/output`). Without it, the
// build falls back to a plain node-server (dist/server) that Vercel can't
// serve → 404 on every route.
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact(),
  ],
  server: {
    port: 3001,
    // Windows file-watching with tool-based writes (editors/agents) frequently
    // misses chokidar fs events, so Vite keeps serving a stale module. Polling
    // guarantees every change is picked up. ~300ms feels instant in dev.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
