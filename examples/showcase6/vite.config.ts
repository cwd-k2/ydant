import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@ydant/core": path.resolve(root, "packages/core/src/index.ts"),
      "@ydant/dom": path.resolve(root, "packages/dom/src/index.ts"),
      "@ydant/async": path.resolve(root, "packages/async/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: ["@ydant/core", "@ydant/dom", "@ydant/async"],
  },
  server: {
    fs: {
      allow: [root],
    },
  },
});
