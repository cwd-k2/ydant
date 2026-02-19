import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@ydant/core": path.resolve(root, "packages/core/src/index.ts"),
      "@ydant/base": path.resolve(root, "packages/base/src/index.ts"),
      "@ydant/canvas": path.resolve(root, "packages/canvas/src/index.ts"),
      "@ydant/reactive": path.resolve(root, "packages/reactive/src/index.ts"),
      "@ydant/devtools": path.resolve(root, "packages/devtools/src/index.ts"),
      "@ydant/ssr": path.resolve(root, "packages/ssr/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@ydant/core",
      "@ydant/base",
      "@ydant/canvas",
      "@ydant/reactive",
      "@ydant/devtools",
      "@ydant/ssr",
    ],
  },
  server: {
    fs: {
      allow: [root],
    },
  },
});
