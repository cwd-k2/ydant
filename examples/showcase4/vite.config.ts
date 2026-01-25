import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@ydant/core": path.resolve(root, "packages/core/src/index.ts"),
      "@ydant/dom": path.resolve(root, "packages/dom/src/index.ts"),
      "@ydant/router": path.resolve(root, "packages/router/src/index.ts"),
      "@ydant/context": path.resolve(root, "packages/context/src/index.ts"),
      "@ydant/form": path.resolve(root, "packages/form/src/index.ts"),
      "@ydant/reactive": path.resolve(root, "packages/reactive/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@ydant/core",
      "@ydant/dom",
      "@ydant/router",
      "@ydant/context",
      "@ydant/form",
      "@ydant/reactive",
    ],
  },
  server: {
    fs: {
      allow: [root],
    },
  },
});
