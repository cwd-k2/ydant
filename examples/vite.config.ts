import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "..");

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      "@ydant/core": path.resolve(root, "packages/core/src/index.ts"),
      "@ydant/base": path.resolve(root, "packages/base/src/index.ts"),
      "@ydant/reactive": path.resolve(root, "packages/reactive/src/index.ts"),
      "@ydant/context": path.resolve(root, "packages/context/src/index.ts"),
      "@ydant/router": path.resolve(root, "packages/router/src/index.ts"),
      "@ydant/async": path.resolve(root, "packages/async/src/index.ts"),
      "@ydant/transition": path.resolve(root, "packages/transition/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@ydant/core",
      "@ydant/base",
      "@ydant/reactive",
      "@ydant/context",
      "@ydant/router",
      "@ydant/async",
      "@ydant/transition",
    ],
  },
  server: {
    fs: {
      allow: [root],
    },
  },
});
