import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@ydant/interface": path.resolve(root, "packages/interface/src/index.ts"),
      "@ydant/composer": path.resolve(root, "packages/composer/src/index.ts"),
      "@ydant/renderer": path.resolve(root, "packages/renderer/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: ["@ydant/interface", "@ydant/composer", "@ydant/renderer"],
  },
  server: {
    fs: {
      allow: [root],
    },
  },
});
