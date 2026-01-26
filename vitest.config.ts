import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["packages/**/src/**/*.test.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov", "html"],
      include: ["packages/**/src/**/*.ts"],
      exclude: ["packages/**/src/**/*.test.ts", "packages/**/src/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@ydant/core": path.resolve(__dirname, "packages/core/src"),
      "@ydant/reactive": path.resolve(__dirname, "packages/reactive/src"),
      "@ydant/dom": path.resolve(__dirname, "packages/dom/src"),
      "@ydant/context": path.resolve(__dirname, "packages/context/src"),
      "@ydant/router": path.resolve(__dirname, "packages/router/src"),
      "@ydant/async": path.resolve(__dirname, "packages/async/src"),
      "@ydant/transition": path.resolve(__dirname, "packages/transition/src"),
    },
  },
});
