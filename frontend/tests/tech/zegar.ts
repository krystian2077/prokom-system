import type { Page } from "@playwright/test";

/**
 * Runda 18.11 §1.3: with no saved choice the theme follows Auto — dark at night in Rabka-Zdrój.
 * Tests that expect "light system → light page" pin the clock to a weekday noon (Warsaw), so they
 * pass at any hour. Call before page.goto (the head script reads the clock before the first paint).
 */
export const NOON_WARSAW = new Date("2026-11-18T11:00:00Z"); // Wed 12:00 CET
export const NIGHT_WARSAW = new Date("2026-11-18T21:00:00Z"); // Wed 22:00 CET

export async function pinDaylight(page: Page, at: Date = NOON_WARSAW): Promise<void> {
  await page.clock.setFixedTime(at);
}
