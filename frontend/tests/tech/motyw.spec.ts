/**
 * Runda 18.11 §1.3 (D7–D10, MOTYW-PASEK-LINII §1–§3, §6): the labelled theme button, Auto at night,
 * the choice carried to the other PRO-KOM lines, the theme entry in the side rail.
 */
import { expect, test } from "@playwright/test";
import { NIGHT_WARSAW, NOON_WARSAW, pinDaylight } from "./zegar";

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the button says what happens: „Ciemny motyw” → dark page, „Jasny motyw”, saved, announced", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await pinDaylight(page);
    await page.goto("/");
    const html = page.locator("html");
    const btn = page.locator(".t-capsule [data-tech-theme-toggle]");
    await expect(html).toHaveAttribute("data-tech-theme", "light");
    await expect(btn).toHaveAccessibleName("Ciemny motyw");
    await expect(btn).not.toHaveAttribute("aria-pressed", /.*/);
    const width = (await btn.boundingBox())!.width;
    await btn.click();
    await expect(html).toHaveAttribute("data-tech-theme", "dark");
    await expect(btn).toHaveAccessibleName("Jasny motyw");
    expect(await page.evaluate(() => localStorage.getItem("pk-theme"))).toBe("dark");
    await expect(page.locator(".t-capsule__theme [aria-live]")).toHaveText("Włączono ciemny motyw.");
    // fixed width: the capsule does not jump
    expect(Math.abs((await btn.boundingBox())!.width - width)).toBeLessThan(1);
  });

  test("Auto with no saved choice: 22:00 in Warsaw → dark, 12:00 → light (light system)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await pinDaylight(page, NIGHT_WARSAW);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme-choice", "auto");

    const day = await page.context().newPage();
    await day.emulateMedia({ colorScheme: "light" });
    await pinDaylight(day, NOON_WARSAW);
    await day.goto("/");
    await expect(day.locator("html")).toHaveAttribute("data-tech-theme", "light");
  });

  test("a saved choice wins over the night", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await pinDaylight(page, NIGHT_WARSAW);
    await page.addInitScript(() => localStorage.setItem("pk-theme", "light"));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "light");
  });

  test("?motyw=ciemny from another line: dark before paint, saved, gone from the address after hydration", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await pinDaylight(page);
    await page.goto("/kontakt?motyw=ciemny#formularz");
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
    await expect(page).toHaveURL(/\/kontakt#formularz$/);
    expect(await page.evaluate(() => localStorage.getItem("pk-theme"))).toBe("dark");
    // the App Router took the clean address (a client-side navigation still works)
    await page.locator(".t-capsule").getByRole("link", { name: "O firmie" }).click();
    await expect(page).toHaveURL(/\/o-firmie$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/kontakt#formularz$/);
  });

  test("a link to another PRO-KOM line carries the choice only for the click", async ({ page }) => {
    await pinDaylight(page);
    await page.addInitScript(() => localStorage.setItem("pk-theme", "dark"));
    let requested = "";
    await page.route("https://prokomsoftware.pl/**", (route) => {
      requested = route.request().url();
      return route.fulfill({ status: 200, contentType: "text/html", body: "<title>Software</title>" });
    });
    await page.goto("/");
    const link = page.locator(".t-brandbar").getByRole("link", { name: "Software" });
    await expect(link).toHaveAttribute("href", "https://prokomsoftware.pl");
    await link.click();
    await expect.poll(() => requested).toContain("motyw=ciemny");
    await page.goBack();
    // in the HTML (and for a copied link) the address stays clean
    await expect(page.locator(".t-brandbar").getByRole("link", { name: "Software" })).toHaveAttribute("href", "https://prokomsoftware.pl");
  });

  test("reduced motion: the switch is instant, no circle", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await pinDaylight(page);
    await page.goto("/");
    await page.locator(".t-capsule [data-tech-theme-toggle]").click();
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
    expect(await page.evaluate(() => document.documentElement.classList.contains("t-vt-theme"))).toBe(false);
  });

  for (const path of ["/", "/punkty-serwisowe"]) {
    test(`side rail on ${path}: theme entry above „Do góry” with Jasny · Ciemny · Auto`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await pinDaylight(page);
      await page.goto(path);
      const rail = page.locator(".t-rail");
      const entry = rail.locator("[data-tech-theme-rail]");
      await expect(entry).toBeVisible();
      // order: theme entry, then „Do góry”
      const order = await rail.locator("[data-tech-theme-rail], .t-rail__up").evaluateAll((els) => els.map((e) => (e.matches("[data-tech-theme-rail]") ? "theme" : "up")));
      expect(order).toEqual(["theme", "up"]);
      await entry.hover({ position: { x: 22, y: 18 } }); // the folded rail shows only the icon column
      const seg = rail.getByRole("radiogroup", { name: "Motyw strony" });
      await expect(seg).toBeVisible();
      await seg.getByRole("radio", { name: "Ciemny" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
      await expect(seg.getByRole("radio", { name: "Ciemny" })).toHaveAttribute("aria-checked", "true");
      await seg.getByRole("radio", { name: "Auto" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "light"); // noon, light system
      expect(await page.evaluate(() => localStorage.getItem("pk-theme"))).toBeNull();
    });
  }
});

/** Everything stays inside the capsule (18.11: „Zgłoś naprawę” stuck out at 1440 next to the labelled button). */
for (const width of [1024, 1100, 1200, 1280, 1320, 1360, 1440, 1600, 1920]) {
  test(`capsule ${width}: actions stay inside, no Blog in the main menu`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await pinDaylight(page);
    await page.goto("/");
    const cap = (await page.locator(".t-capsule").boundingBox())!;
    for (const sel of [".t-capsule .t-cta", ".t-capsule [data-tech-theme-toggle]", ".t-capsule__logo", ".t-capsule__nav"]) {
      const b = (await page.locator(sel).first().boundingBox())!;
      expect(b.x, `${sel} @${width}`).toBeGreaterThanOrEqual(cap.x);
      expect(b.x + b.width, `${sel} @${width}`).toBeLessThanOrEqual(cap.x + cap.width + 0.5);
    }
    await expect(page.locator(".t-capsule").getByRole("link", { name: "Blog" })).toHaveCount(0);
  });
}

test.describe("1280: short label", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test("„Ciemny” on screen, „Ciemny motyw” as the name", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await pinDaylight(page);
    await page.goto("/");
    const btn = page.locator(".t-capsule [data-tech-theme-toggle]");
    await expect(btn).toHaveAccessibleName("Ciemny motyw");
    // „ motyw” is clipped to 1 px (still read out)
    const rest = (await btn.locator(".t-themebtn__label--to-dark .t-themebtn__rest").boundingBox())!;
    expect(rest.width).toBeLessThanOrEqual(1);
  });
});

test.describe("phone 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("menu sheet: „Motyw strony” with the Auto note", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    await page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Motyw strony")).toBeVisible();
    await expect(dialog.getByText("Auto: w nocy ciemny, w dzień jak ustawienia telefonu.")).toBeVisible();
  });
});
