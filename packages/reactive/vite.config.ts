import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.build.json",
      copyDtsFiles: true,
      beforeWriteFile: (filePath, content) => {
        if (filePath.endsWith("index.d.ts")) {
          return { content: `/// <reference path="./global.d.ts" />\n${content}` };
        }
      },
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "YdantReactive",
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
