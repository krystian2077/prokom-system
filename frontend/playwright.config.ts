import { defineConfig, devices } from "@playwright/test";

/**
 * PRO-KOM Tech e2e (docs/tech/SPEC.md §11, RESPONSYWNOSC.md §6).
 * Starts `next start` from THIS checkout (`npm run build` first) on TECH_PORT
 * (default 3002 — any free port in 3000–3004, which CORS in local.py allows; 3003 is the usual dev server).
 * It never reuses a server already listening there: an old build on the port would
 * make the panel comparison meaningless. Set TECH_BASE_URL to test a running origin.
 */
const port = Number(process.env.TECH_PORT || 3002);
const baseURL = process.env.TECH_BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/tech",
  testMatch: /.*\.spec\.ts$/,
  snapshotPathTemplate: "{testDir}/__zrzuty__/{testFileName}/{arg}{-platform}{ext}",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled", caret: "hide" },
  },
  use: {
    baseURL,
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.TECH_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
