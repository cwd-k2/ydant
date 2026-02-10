import { chromium } from "playwright";
import { startShowcase } from "./helpers.mjs";

const PORT = 5188;
let server, browser, page;

try {
  ({ server } = await startShowcase("showcase8", PORT));
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle", timeout: 15000 });

  let failed = 0;

  function assert(label, actual, expected) {
    if (actual === expected) {
      console.log(`  [PASS] ${label}`);
    } else {
      console.log(`  [FAIL] ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      failed++;
    }
  }

  console.log("Showcase 8: Notification Feed\n");

  // --- Page loads ---
  assert("Title", await page.title(), "Showcase 8 - Notification Feed");
  assert("H1", await page.textContent("h1"), "Notification Feed");

  // --- Add notifications ---
  await page.click('button:has-text("Info")');
  await page.waitForTimeout(400);
  assert("1 notification after adding info", (await page.$$('[class*="border-l-4"]')).length, 1);

  await page.click('button:has-text("Warning")');
  await page.click('button:has-text("Error")');
  await page.waitForTimeout(400);
  assert("3 notifications total", (await page.$$('[class*="border-l-4"]')).length, 3);

  // --- Count ---
  const countText = await page.textContent('span:has-text("notifications")');
  assert("Count shows 3", countText.trim(), "3 notifications");

  // --- Filter ---
  await page.click('button.rounded-full:has-text("Info")');
  await page.waitForTimeout(400);
  assert("Info filter shows 1", (await page.$$('[class*="border-l-4"]')).length, 1);

  await page.click('button.rounded-full:has-text("All")');
  await page.waitForTimeout(400);
  assert("All filter shows 3", (await page.$$('[class*="border-l-4"]')).length, 3);

  // --- Delete ---
  await page.click('[class*="border-l-4"] button');
  await page.waitForTimeout(400);
  assert("2 after delete", (await page.$$('[class*="border-l-4"]')).length, 2);

  // --- Clear all ---
  await page.click('button:has-text("Clear All")');
  await page.waitForTimeout(400);
  assert("0 after clear", (await page.$$('[class*="border-l-4"]')).length, 0);

  console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`}`);
  process.exitCode = failed > 0 ? 1 : 0;
} catch (e) {
  console.error(`[ERROR] ${e.message}`);
  if (page) await page.screenshot({ path: new URL("tmp/showcase8-error.png", import.meta.url).pathname });
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
}
