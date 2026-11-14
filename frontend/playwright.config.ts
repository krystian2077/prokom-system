import { defineConfig, devices } from "@playwright/test";

/**
 * PRO-KOM Tech e2e (docs/tech/SPEC.md §11, RESPONSYWNOSC.md §6).
 * Runs against a production build on port 3003 (`npm run build` first).
 * Set TECH_BASE_URL to test another origin (e.g. a running dev server).
 */
const baseURL = process.env.TECH_BASE_URL || "http://localhost:3003";

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
        command: "npx next start -p 3003",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
