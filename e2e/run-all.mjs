import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testFiles = readdirSync(__dirname)
  .filter((f) => f.endsWith(".test.mjs"))
  .sort();

console.log(`Running ${testFiles.length} e2e test(s)...\n`);

let passed = 0;
let failedTests = [];

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  console.log(`--- ${file} ---`);
  try {
    execFileSync("node", [filePath], { stdio: "inherit", timeout: 60000 });
    passed++;
  } catch {
    failedTests.push(file);
  }
  console.log();
}

console.log(`\n=== Results: ${passed}/${testFiles.length} passed ===`);
if (failedTests.length > 0) {
  console.log(`Failed: ${failedTests.join(", ")}`);
  process.exitCode = 1;
}
