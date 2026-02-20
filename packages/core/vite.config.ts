import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.build.json",
      copyDtsFiles: true,
      beforeWriteFile: (filePath, content) => {
        if (filePath.endsWith("index.d.ts") || filePath.endsWith("internals.d.ts")) {
          return { content: `/// <reference path="./global.d.ts" />\n${content}` };
        }
      },
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: {
        index: path.resolve(__dirname, "src/index.ts"),
        internals: path.resolve(__dirname, "src/internals.ts"),
      },
      fileName: (format, name) => (format === "es" ? `${name}.es.js` : `${name}.cjs`),
      formats: ["es", "cjs"],
    },
  },
});
