import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Deploy target (Vercel/Nitro `.vercel/output`) is auto-detected from the
// VERCEL env at build time — no explicit preset needed.
export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
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
