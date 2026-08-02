import { defineConfig } from "vite";

/** `npm run bbox` 전용 — CLI 와 같은 이유로 Vite SSR 빌드가 필요하다(import.meta.glob). */
export default defineConfig({
  build: {
    ssr: "scripts/gen-symbol-bbox.ts",
    outDir: "dist-bbox",
    emptyOutDir: true,
    target: "node18",
    rollupOptions: {
      output: { entryFileNames: "gen-symbol-bbox.mjs" },
      external: ["@resvg/resvg-js", "opentype.js", "fflate"],
    },
  },
});
