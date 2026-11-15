/**
 * Live opening status in the browser on test days (SPEC §12.1, TD6 QA).
 * hours.test.ts covers the logic; this checks what the page shows with a fake clock.
 * Rabka-Zdrój: Mon–Fri 9–17, Sat 9–14 (config/prokom.ts).
 */
import { expect, test } from "@playwright/test";

const CASES: [string, string, RegExp][] = [
  ["święto 11.11 (środa) w południe", "2026-11-11T12:00:00+01:00", /Zamknięte dziś \([^)]+\) · otwieramy jutro o 9:00/],
  ["sobota po zamknięciu", "2026-11-14T14:30:00+01:00", /Zamknięte · otwieramy w poniedziałek o 9:00/],
  ["sobota 13:40", "2026-11-14T13:40:00+01:00", /Zamykamy za 20 min/],
  ["Wigilia 2026 (czwartek)", "2026-12-24T10:00:00+01:00", /Zamknięte dziś \([^)]+\) · otwieramy w poniedziałek o 9:00/],
  ["dzień roboczy 10:00", "2026-11-16T10:00:00+01:00", /Otwarte do 17:00/],
];

for (const [name, iso, expected] of CASES) {
  test(`status godzin na /punkty-serwisowe: ${name}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(iso));
    await page.goto("/punkty-serwisowe");
    const status = page.locator(".t-status[role=status]").first();
    await expect(status).toHaveText(expected);
  });
}
