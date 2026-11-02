import { defineConfig } from "vite";

const PAGES_BASE = "/nintendo-kids-game-recommendations/";

export default defineConfig(({ command }) => ({
  // Project Pages need the repo base in production builds.
  // Local `npm run dev` stays at http://127.0.0.1:5173/
  base: command === "build" ? PAGES_BASE : "/",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
}));
