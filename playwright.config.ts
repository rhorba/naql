import { defineConfig, devices } from "@playwright/test";

// Use PORT env if set, otherwise try 3003 (3000 may be taken in dev)
const PORT = process.env.PORT ?? "3003";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    video: "on",
    screenshot: "on",
    trace: "on",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: "fr-MA",
  },
  outputDir: "docs/e2e-artifacts",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `pnpm --filter web dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 90_000,
    env: { PORT },
  },
});
