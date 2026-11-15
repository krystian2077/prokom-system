/** TP PR 3: wizard scene and effects (docs/tech/PREMIUM.md §4). */
import { expect, test, type Page } from "@playwright/test";

const camScale = (page: Page) =>
  page.locator("#kreator .t-scene__cam").evaluate((el) => {
    const m = getComputedStyle(el).transform;
    return m === "none" ? 1 : Number(m.match(/matrix\(([^,]+)/)?.[1] ?? 1);
  });

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("device → fault → camera moves and the effect plays → Esc returns to the whole device", async ({ page }) => {
    await page.goto("/");
    const wiz = page.locator("#kreator");
    await wiz.scrollIntoViewIfNeeded();
    await wiz.getByRole("radio", { name: "Laptop" }).click();
    await expect(wiz.locator(".t-scene")).toHaveAttribute("data-device", "laptop");
    await wiz.getByRole("radio", { name: "Klawiatura" }).click();
    await expect(wiz.locator(".t-scene")).toHaveClass(/is-zoom/);
    await expect(wiz.locator(".t-scene")).toHaveAttribute("data-effect", "E12");
    await expect(wiz.getByTestId("scene-effect").locator("svg.t-fx--e12")).toBeVisible();
    await expect(wiz.locator(".t-scene__label")).toHaveText("Klawiatura");
    await expect(wiz.getByTestId("scene-card")).toContainText("klawisze");
    await expect.poll(() => camScale(page)).toBeGreaterThan(1.1);
    // the other spots dim
    await expect(wiz.locator(".t-scene__spot:not(.is-on)").first()).toHaveCSS("opacity", "0.32");
    await page.keyboard.press("Escape");
    await expect(wiz.locator(".t-scene")).not.toHaveClass(/is-zoom/);
    await expect.poll(() => camScale(page)).toBeLessThan(1.01);
    // fault stays selected
    await expect(wiz.getByRole("radio", { name: "Klawiatura" })).toHaveAttribute("aria-checked", "true");
  });

  test("'Pokaż całe urządzenie' resets the camera; whole-device faults never zoom", async ({ page }) => {
    await page.goto("/");
    const wiz = page.locator("#kreator");
    await wiz.locator(".t-scene__spot[aria-label='Aparat']").click();
    await expect(wiz.locator(".t-scene")).toHaveClass(/is-zoom/);
    await wiz.getByTestId("scene-whole").click();
    await expect(wiz.locator(".t-scene")).not.toHaveClass(/is-zoom/);
    await wiz.getByRole("radio", { name: "Po zalaniu" }).click();
    await expect(wiz.locator(".t-scene")).toHaveAttribute("data-effect", "E7");
    await expect(wiz.locator(".t-scene")).not.toHaveClass(/is-zoom/);
    await expect(wiz.locator(".t-scene__label")).toHaveCount(0);
  });

  test("hovering a fault previews its effect; hovering a spot highlights the chip", async ({ page }) => {
    await page.goto("/");
    const wiz = page.locator("#kreator");
    await wiz.getByRole("radio", { name: "Bateria" }).hover();
    await expect(wiz.locator(".t-scene")).toHaveAttribute("data-effect", "E2");
    await expect(wiz.getByTestId("scene-effect")).toHaveClass(/is-preview/);
    await wiz.locator(".t-scene__spot[aria-label='Aparat']").hover();
    await expect(wiz.getByRole("radio", { name: "Aparat" })).toHaveClass(/is-hot/);
    await expect(wiz.locator(".t-scene")).toHaveAttribute("data-effect", "E4");
  });

  test("label never covers its region", async ({ page }) => {
    await page.goto("/");
    const wiz = page.locator("#kreator");
    for (const [device, faults] of [
      ["Telefon", ["Pęknięty ekran", "Bateria", "Aparat", "Nie ładuje"]],
      ["Drukarka", ["Zacina papier", "Skaner", "Tusz i głowica"]],
      ["Konsola", ["Dryf w padzie", "Nie czyta płyt"]],
    ] as const) {
      await wiz.getByRole("radio", { name: device }).click();
      for (const f of faults) {
        await wiz.getByRole("radio", { name: f }).click();
        await page.waitForTimeout(650);
        const overlap = await page.evaluate(() => {
          const a = document.querySelector("#kreator .t-scene__label")!.getBoundingClientRect();
          const b = document.querySelector("#kreator [data-testid=scene-effect]")!.getBoundingClientRect();
          const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          return (w * h) / (a.width * a.height);
        });
        expect(overlap, `${device} · ${f}`).toBeLessThan(0.05);
      }
    }
  });

  test("keyboard: radiogroups move with arrows, Enter on a spot picks it", async ({ page }) => {
    await page.goto("/");
    const wiz = page.locator("#kreator");
    await wiz.getByRole("radio", { name: "Telefon" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(wiz.getByRole("radio", { name: "Tablet" })).toBeFocused();
    await expect(wiz.getByRole("radio", { name: "Tablet" })).toHaveAttribute("aria-checked", "true");
    await expect(wiz.locator(".t-scene")).toHaveAttribute("data-device", "tablet");
    await wiz.getByRole("radio", { name: "Pęknięty ekran" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(wiz.getByRole("radio", { name: "Bateria" })).toHaveAttribute("aria-checked", "true");
    await page.waitForTimeout(600); // camera settles on "Bateria"
    await wiz.locator(".t-scene__spot[aria-label='Aparat']").focus();
    await page.keyboard.press("Enter");
    await expect(wiz.getByRole("radio", { name: "Aparat" })).toHaveAttribute("aria-checked", "true");
    await expect(wiz.locator("[aria-live=polite]").filter({ hasText: "Aparat." })).toHaveCount(1);
  });

  test("every device renders its scene and every fault an effect", async ({ page }) => {
    await page.goto("/");
    const wiz = page.locator("#kreator");
    const devices = await wiz.locator(".t-chp--dev").allTextContents();
    expect(devices).toHaveLength(9);
    for (const name of devices) {
      await wiz.getByRole("radio", { name: name.trim() }).click();
      const faults = await wiz.locator(".t-chp--fault").allTextContents();
      for (const f of faults) {
        await wiz.getByRole("radio", { name: f.trim(), exact: true }).click();
        await expect(wiz.getByTestId("scene-effect").locator(":scope > .t-fx"), `${name} · ${f}`).toHaveCount(1);
      }
    }
  });

  test("reduced motion → poster: no running animations in the scene", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const wiz = page.locator("#kreator");
    await wiz.getByRole("radio", { name: "Pęknięty ekran" }).click();
    await expect(wiz.locator(".t-scene")).toHaveClass(/is-poster/);
    await page.waitForTimeout(400);
    const running = await page.evaluate(
      () =>
        document
          .querySelector("#kreator .t-scene")!
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === "running" && "animationName" in a && /^t-(fx|scene|label|spot)/.test(String((a as CSSAnimation).animationName))).length,
    );
    expect(running).toBe(0);
  });
});

test.describe("phone 390", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("full-screen flow: scene with the label card under the photo, swipe changes the device", async ({ page }) => {
    await page.goto("/");
    await page.locator("#kreator").getByRole("radio", { name: "Telefon" }).click();
    const flow = page.getByTestId("wizard-flow");
    await expect(flow.locator(".t-scene--phone")).toBeVisible();
    await expect(flow.getByTestId("scene-card")).toContainText("Pęknięty ekran");
    const card = (await flow.getByTestId("scene-card").boundingBox())!;
    const frame = (await flow.locator(".t-scene__frame").boundingBox())!;
    expect(card.y).toBeGreaterThanOrEqual(frame.y + frame.height - 1);
    // swipe left → next device
    const box = (await flow.locator(".t-wizflow__scene").boundingBox())!;
    await page.mouse.move(box.x + box.width - 30, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 30, box.y + 90, { steps: 6 });
    await page.mouse.up();
    await expect(flow.locator(".t-scene")).toHaveAttribute("data-device", "tablet");
    // spots are 44 px targets (after the entrance scale settles)
    await page.waitForTimeout(700);
    const spot = (await flow.locator(".t-scene__spot").first().boundingBox())!;
    expect(Math.round(spot.width)).toBeGreaterThanOrEqual(44);
  });
});
