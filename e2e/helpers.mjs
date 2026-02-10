import { createServer } from "vite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure tmp directory exists for screenshots on failure
mkdirSync(path.join(__dirname, "tmp"), { recursive: true });
const root = path.resolve(__dirname, "..");

/**
 * Start a Vite dev server for a showcase example.
 *
 * @param {string} showcase - e.g. "showcase8"
 * @param {number} port
 * @returns {Promise<{ server: import('vite').ViteDevServer, url: string }>}
 */
export async function startShowcase(showcase, port) {
  const showcasePath = path.resolve(root, "examples", showcase);

  const server = await createServer({
    root: showcasePath,
    configFile: path.resolve(showcasePath, "vite.config.ts"),
    server: { port, strictPort: true },
    logLevel: "silent",
  });

  await server.listen();
  return { server, url: `http://localhost:${port}` };
}
