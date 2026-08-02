import { defineConfig } from "vite";

/**
 * CLI 번들. Vite 로 빌드하는 이유는 심볼 로더가 `import.meta.glob` 로 svg 를
 * 읽기 때문 — 순수 tsc/tsx 로는 실행되지 않는다. SSR 빌드로 뽑으면 glob 이
 * 인라인돼서 Node 에서 그대로 돈다.
 */
export default defineConfig({
  build: {
    ssr: "cli/bin.ts",
    outDir: "dist-cli",
    emptyOutDir: true,
    target: "node18",
    rollupOptions: {
      output: { entryFileNames: "logodown.mjs", banner: "#!/usr/bin/env node" },
      external: ["@resvg/resvg-js", "opentype.js", "fflate"],
    },
  },
});
