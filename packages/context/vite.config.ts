import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.build.json",
      afterBuild: () => {
        // Copy global.d.ts to dist
        const globalSrc = path.resolve(__dirname, "src/global.d.ts");
        const globalDest = path.resolve(__dirname, "dist/global.d.ts");
        fs.copyFileSync(globalSrc, globalDest);
        // Add reference to index.d.ts
        const indexPath = path.resolve(__dirname, "dist/index.d.ts");
        const content = fs.readFileSync(indexPath, "utf8");
        fs.writeFileSync(indexPath, `/// <reference path="./global.d.ts" />\n${content}`);
      },
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "YdantContext",
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
