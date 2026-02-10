import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@ydant/core": path.resolve(root, "packages/core/src/index.ts"),
      "@ydant/base": path.resolve(root, "packages/base/src/index.ts"),
      "@ydant/router": path.resolve(root, "packages/router/src/index.ts"),
      "@ydant/async": path.resolve(root, "packages/async/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: ["@ydant/core", "@ydant/base", "@ydant/router", "@ydant/async"],
  },
  server: {
    fs: {
      allow: [root],
    },
  },
});
