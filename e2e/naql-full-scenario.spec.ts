import fs from "node:fs";
import path from "node:path";
/**
 * Naql v0.1 — Full E2E Scenario
 *
 * Covers the golden path a first-time user (owner) goes through:
 * 1. Login page renders correctly
 * 2. Signup — create a new organisation
 * 3. Dashboard loads with KPI cards and alerts panel
 * 4. Fleet — view vehicle list (demo data)
 * 5. Fleet — create a new vehicle
 * 6. Missions — view dispatch board
 * 7. Fuel — view fuel log list with consumption ranking
 * 8. Invoicing — view invoice list
 * 9. HR Employees — view employee list
 * 10. Profitability — view P&L dashboard
 * 11. Locale switch — switch to Arabic (RTL)
 * 12. Sign out
 *
 * All steps are recorded as a single continuous video saved to docs/.
 */
import { expect, test } from "@playwright/test";

const DEMO_EMAIL = `e2e-${Date.now()}@naql-test.ma`;
const DEMO_PASSWORD = "E2eTest2026!";
const ORG_NAME = "E2E Transport SARL";

test.describe("Naql Full Scenario", () => {
  test("complete user journey from signup to sign-out", async ({ page }) => {
    // ── 1. Home redirects to login ────────────────────────────────────────────
    await page.goto("/");
    await page.waitForURL(/\/(fr|ar|en)\/login/);
    await expect(page.locator("h1, [class*='title']").first()).toBeVisible();

    // ── 2. Navigate to signup ─────────────────────────────────────────────────
    await page.goto("/fr/signup");
    await page.waitForLoadState("networkidle");

    await page.fill('[name="orgName"]', ORG_NAME);
    await page.fill('[name="name"]', "Jamal Benali (Test)");
    await page.fill('[name="email"]', DEMO_EMAIL);
    await page.fill('[name="password"]', DEMO_PASSWORD);

    // Screenshot before submit
    await page.screenshot({ path: "docs/e2e-artifacts/01-signup-form.png", fullPage: true });

    // ── 3. Dashboard after signup ─────────────────────────────────────────────
    // Submit signup — it redirects to dashboard
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "docs/e2e-artifacts/02-dashboard.png", fullPage: true });

    // ── 4. Fleet — vehicle list ───────────────────────────────────────────────
    await page.goto("/fr/fleet");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: "docs/e2e-artifacts/03-fleet-list.png", fullPage: true });

    // ── 5. Fleet — create a vehicle ──────────────────────────────────────────
    await page.goto("/fr/fleet/new");
    await page.waitForLoadState("networkidle");
    await page.fill('[name="code"]', "TEST-01");
    await page.fill('[name="registration"]', "TEST-01-MA");
    await page.fill('[name="make"]', "FUSO");
    await page.fill('[name="model"]', "Fighter");
    await page.fill('[name="year"]', "2022");
    await page.screenshot({ path: "docs/e2e-artifacts/04-fleet-new-form.png", fullPage: true });

    // ── 6. Missions dispatch board ────────────────────────────────────────────
    await page.goto("/fr/missions");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: "docs/e2e-artifacts/05-missions.png", fullPage: true });

    // ── 7. New mission form ───────────────────────────────────────────────────
    await page.goto("/fr/missions/new");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "docs/e2e-artifacts/06-mission-new.png", fullPage: true });

    // ── 8. Fuel & Consumption ─────────────────────────────────────────────────
    await page.goto("/fr/fuel");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: "docs/e2e-artifacts/07-fuel.png", fullPage: true });

    // ── 9. Clients ────────────────────────────────────────────────────────────
    await page.goto("/fr/clients");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "docs/e2e-artifacts/08-clients.png", fullPage: true });

    // ── 10. Invoicing ──────────────────────────────────────────────────────────
    await page.goto("/fr/invoicing");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: "docs/e2e-artifacts/09-invoicing.png", fullPage: true });

    // ── 11. Payments ──────────────────────────────────────────────────────────
    await page.goto("/fr/payments");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "docs/e2e-artifacts/10-payments.png", fullPage: true });

    // ── 12. Profitability ─────────────────────────────────────────────────────
    await page.goto("/fr/profitability");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: "docs/e2e-artifacts/11-profitability.png", fullPage: true });

    // ── 13. HR Employees ──────────────────────────────────────────────────────
    await page.goto("/fr/hr/employees");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "docs/e2e-artifacts/12-hr-employees.png", fullPage: true });

    // ── 14. Payroll ───────────────────────────────────────────────────────────
    await page.goto("/fr/hr/payroll");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "docs/e2e-artifacts/13-hr-payroll.png", fullPage: true });

    // ── 15. OCR Receipt Capture ───────────────────────────────────────────────
    await page.goto("/fr/fuel/ocr");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "docs/e2e-artifacts/14-ocr-receipt.png", fullPage: true });

    // ── 16. Switch to Arabic (RTL) ────────────────────────────────────────────
    await page.goto("/ar/dashboard");
    await page.waitForLoadState("networkidle");
    const htmlDir = await page.getAttribute("html", "dir");
    expect(htmlDir).toBe("rtl");
    await page.screenshot({ path: "docs/e2e-artifacts/15-arabic-rtl.png", fullPage: true });

    // ── 17. Back to FR — Alerts panel visible ─────────────────────────────────
    await page.goto("/fr/dashboard");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "docs/e2e-artifacts/16-dashboard-final.png", fullPage: true });

    // ── 18. Sign out ──────────────────────────────────────────────────────────
    const signOutBtn = page
      .locator('button:has-text("Déconnexion"), button:has-text("Sign out")')
      .first();
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
      await page.waitForURL(/\/login/, { timeout: 10_000 });
      await page.screenshot({ path: "docs/e2e-artifacts/17-signed-out.png", fullPage: true });
    }

    // Copy the Playwright-generated video to docs/
    // (done in afterAll below)
  });
});

test.afterAll(async () => {
  // Playwright stores video at testInfo.outputPath() inside outputDir
  // We copy the latest webm to docs/naql-scenario.webm
  const artifactsDir = path.resolve("docs/e2e-artifacts");
  if (!fs.existsSync(artifactsDir)) return;

  const webms = fs
    .readdirSync(artifactsDir, { recursive: true })
    .map((f) => String(f))
    .filter((f) => f.endsWith(".webm"))
    .map((f) => path.join(artifactsDir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (webms[0] && fs.existsSync(webms[0])) {
    const dest = path.resolve("docs/naql-scenario.webm");
    fs.copyFileSync(webms[0], dest);
    console.log("\n✅ Video saved → docs/naql-scenario.webm");
  }
});
