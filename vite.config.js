import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

const rootDir = dirname(fileURLToPath(import.meta.url));
const PAGES_BASE = "/nintendo-kids-game-recommendations/";

function gameHtmlInputs() {
  const dir = resolve(rootDir, "games");
  try {
    return Object.fromEntries(
      readdirSync(dir)
        .filter((f) => f.endsWith(".html"))
        .map((f) => [`games-${f.replace(/\.html$/, "")}`, resolve(dir, f)]),
    );
  } catch {
    return {};
  }
}

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
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        about: resolve(rootDir, "about.html"),
        contact: resolve(rootDir, "contact.html"),
        privacy: resolve(rootDir, "privacy.html"),
        terms: resolve(rootDir, "terms.html"),
        ...gameHtmlInputs(),
      },
    },
  },
}));
