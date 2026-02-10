import { chromium } from "playwright";
import { startShowcase } from "./helpers.mjs";

const PORT = 5189;
let server, browser, page;

try {
  ({ server } = await startShowcase("showcase9", PORT));
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

  console.log("Showcase 9: Admin Dashboard\n");

  // --- Page loads ---
  assert("Title", await page.title(), "Showcase 9 - Admin Dashboard");
  assert("H1", await page.textContent("h1"), "Admin Dashboard Demo");

  // --- Not logged in ---
  const navText = await page.textContent("nav");
  assert("Shows not logged in", navText.includes("Not logged in"), true);

  // --- Guard redirects to login ---
  await page.click("nav >> text=Dashboard");
  await page.waitForTimeout(500);
  assert("Guard redirects to /login", page.url().includes("/login"), true);
  assert("Login page H1", await page.textContent("h1"), "Login");

  // --- Empty username error ---
  await page.click('button:has-text("Login as Admin")');
  await page.waitForTimeout(300);
  assert("Error for empty username", (await page.$('[class*="text-red-500"]')) !== null, true);

  // --- Login as admin ---
  await page.fill('input[type="text"]', "TestAdmin");
  await page.click('button:has-text("Login as Admin")');
  await page.waitForTimeout(500);
  assert("Navigated to /dashboard", page.url().includes("/dashboard"), true);

  // --- Nav shows user ---
  const navAfterLogin = await page.textContent("nav");
  assert("Nav shows username", navAfterLogin.includes("TestAdmin"), true);
  assert("Nav shows role", navAfterLogin.includes("admin"), true);

  // --- Dashboard content (wait for Suspense) ---
  await page.waitForTimeout(2000);
  assert("Dashboard H1", await page.textContent("h1"), "Dashboard");
  assert("6 metric cards", (await page.$$('[class*="rounded-lg"][class*="shadow"]')).length, 6);
  assert("Last updated visible", (await page.$("text=Last updated")) !== null, true);
  assert("Auto-refresh notice", (await page.$("text=auto-refresh")) !== null, true);

  // --- Logout ---
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(500);
  const navAfterLogout = await page.textContent("nav");
  assert("Not logged in after logout", navAfterLogout.includes("Not logged in"), true);

  // --- Login as viewer ---
  await page.click("nav >> text=Dashboard");
  await page.waitForTimeout(500);
  await page.fill('input[type="text"]', "ViewerUser");
  await page.click('button:has-text("Login as Viewer")');
  await page.waitForTimeout(2500);
  assert("Viewer sees dashboard", page.url().includes("/dashboard"), true);
  const navViewer = await page.textContent("nav");
  assert("Nav shows viewer role", navViewer.includes("viewer"), true);

  console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`}`);
  process.exitCode = failed > 0 ? 1 : 0;
} catch (e) {
  console.error(`[ERROR] ${e.message}`);
  if (page) await page.screenshot({ path: new URL("tmp/showcase9-error.png", import.meta.url).pathname });
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
}
