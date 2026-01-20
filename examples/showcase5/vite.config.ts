import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@ydant/core": path.resolve(root, "packages/core/src/index.ts"),
      "@ydant/dom": path.resolve(root, "packages/dom/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: ["@ydant/core", "@ydant/dom"],
  },
  server: {
    fs: {
      allow: [root],
    },
  },
});
