import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ tsconfigPath: "./tsconfig.build.json" })],
  build: {
    outDir: "dist",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "YdantRouter",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["@ydant/core"],
      output: {
        globals: {
          "@ydant/core": "YdantCore",
        },
      },
    },
  },
});
