import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

const rootDir = dirname(fileURLToPath(import.meta.url));

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

export default defineConfig({
  // Custom domain (kidgame.mymallow.cloud) serves from site root.
  base: "/",
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
});
