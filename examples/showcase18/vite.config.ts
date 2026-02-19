import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@ydant/core": path.resolve(root, "packages/core/src/index.ts"),
      "@ydant/base": path.resolve(root, "packages/base/src/index.ts"),
      "@ydant/reactive": path.resolve(root, "packages/reactive/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: ["@ydant/core", "@ydant/base", "@ydant/reactive"],
  },
  server: {
    fs: {
      allow: [root],
    },
  },
});
