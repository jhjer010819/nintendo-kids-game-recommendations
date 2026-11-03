import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFileSync, readdirSync, writeFileSync } from "node:fs";

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

/** Ensure GitHub Pages serves index at `/` and soft-falls back unknown paths. */
function pagesRootFallback() {
  return {
    name: "pages-root-fallback",
    closeBundle() {
      const dist = resolve(rootDir, "dist");
      copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
      writeFileSync(resolve(dist, ".nojekyll"), "");
    },
  };
}

export default defineConfig({
  // Custom domain (kidgame.mymallow.cloud) serves from site root.
  base: "/",
  plugins: [pagesRootFallback()],
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
