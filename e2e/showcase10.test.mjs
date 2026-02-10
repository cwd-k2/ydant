import { chromium } from "playwright";
import { startShowcase } from "./helpers.mjs";

const PORT = 5190;
let server, browser, page;

try {
  ({ server } = await startShowcase("showcase10", PORT));
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

  console.log("Showcase 10: Form Validation\n");

  // --- Page loads ---
  assert("Title", await page.title(), "Showcase 10 - Form Validation");
  assert("H1", await page.textContent("h1"), "User Registration");
  assert("4 input fields", (await page.$$("input")).length, 4);

  const labels = await page.$$eval("label", (els) => els.map((e) => e.textContent.trim()));
  assert("Labels", JSON.stringify(labels), JSON.stringify(["Username", "Email", "Password", "Confirm Password"]));

  // --- Submit empty form ---
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);
  const errors = await page.$$eval('[class*="text-red-500"]', (els) =>
    els.map((e) => e.textContent.trim()).filter((t) => t.length > 0),
  );
  assert("4 errors on empty submit", errors.length, 4);

  // --- Username validation ---
  await page.fill('input[placeholder="Enter username"]', "ab");
  await page.locator('input[placeholder="Enter username"]').blur();
  await page.waitForTimeout(200);
  const shortErr = await page.$$eval('[class*="text-red-500"]', (els) =>
    els.map((e) => e.textContent.trim()).filter((t) => t.includes("3 characters")),
  );
  assert("Username too short error", shortErr.length, 1);

  await page.fill('input[placeholder="Enter username"]', "alice");
  await page.waitForTimeout(200);
  const noUsernameErr = await page.$$eval('[class*="text-red-500"]', (els) =>
    els.map((e) => e.textContent.trim()).filter((t) => t.includes("Username")),
  );
  assert("Username error cleared", noUsernameErr.length, 0);

  // --- Email ---
  await page.fill('input[placeholder="Enter email"]', "bad");
  await page.locator('input[placeholder="Enter email"]').blur();
  await page.waitForTimeout(200);
  const emailErr = await page.$$eval('[class*="text-red-500"]', (els) =>
    els.map((e) => e.textContent.trim()).filter((t) => t.includes("valid email")),
  );
  assert("Invalid email error", emailErr.length, 1);

  await page.fill('input[placeholder="Enter email"]', "alice@example.com");
  await page.waitForTimeout(200);
  const noEmailErr = await page.$$eval('[class*="text-red-500"]', (els) =>
    els.map((e) => e.textContent.trim()).filter((t) => t.includes("email")),
  );
  assert("Email error cleared", noEmailErr.length, 0);

  // --- Password strength ---
  await page.fill('input[placeholder*="password"]:not([placeholder*="Re-enter"])', "short");
  await page.waitForTimeout(200);
  assert("Weak strength bar", (await page.$('[class*="bg-red-400"]')) !== null, true);

  await page.fill('input[placeholder*="password"]:not([placeholder*="Re-enter"])', "MyStr0ng!Pass");
  await page.waitForTimeout(200);
  assert("Strong strength bar", (await page.$('[class*="bg-green-400"]')) !== null, true);

  // --- Confirm password ---
  await page.fill('input[placeholder="Re-enter password"]', "mismatch");
  await page.locator('input[placeholder="Re-enter password"]').blur();
  await page.waitForTimeout(200);
  const mismatchErr = await page.$$eval('[class*="text-red-500"]', (els) =>
    els.map((e) => e.textContent.trim()).filter((t) => t.includes("do not match")),
  );
  assert("Mismatch error", mismatchErr.length, 1);

  await page.fill('input[placeholder="Re-enter password"]', "MyStr0ng!Pass");
  await page.waitForTimeout(200);

  // --- Successful submit ---
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);
  const success = await page.$('[class*="bg-green-50"]');
  assert("Success message shown", success !== null, true);

  if (success) {
    const successText = await success.textContent();
    assert("Success text", successText.trim(), "Registration successful!");
  }

  console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`}`);
  process.exitCode = failed > 0 ? 1 : 0;
} catch (e) {
  console.error(`[ERROR] ${e.message}`);
  if (page) await page.screenshot({ path: new URL("tmp/showcase10-error.png", import.meta.url).pathname });
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
}
