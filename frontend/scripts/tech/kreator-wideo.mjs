/**
 * Wizard video for review (feat/tech-kreator-wizual): camera move + three effects + device
 * cross-fade, desktop 1440 in both themes and the phone flow at 390.
 * Usage: node scripts/tech/kreator-wideo.mjs <baseURL> <outDir>
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const [base = "http://localhost:3021", out = "../tmp/kw/wideo"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

async function desktop(theme) {
  const size = { width: 1440, height: 900 };
  const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: out, size }, locale: "pl-PL" });
  await ctx.addInitScript((t) => localStorage.setItem("pk-theme", t), theme);
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const wiz = page.locator("#kreator");
  await wiz.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1800); // spots pulse once
  const pick = async (device, fault, wait = 3600) => {
    if (device) {
      await wiz.locator(`.t-wiz__devices [data-value="${device}"]`).click();
      await page.waitForTimeout(900);
    }
    await wiz.getByRole("radio", { name: fault, exact: true }).click();
    await page.mouse.move(2, 2);
    await page.waitForTimeout(wait);
  };
  await pick("telefon", "Pęknięty ekran");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1000);
  await wiz.getByRole("radio", { name: "Bateria", exact: true }).hover();
  await page.waitForTimeout(1600);
  await pick("laptop", "Matryca");
  await pick(null, "Przegrzewa się");
  await pick("drukarka", "Zacina papier");
  await pick("konsola", "Dryf w padzie");
  await pick("smartwatch", "Pęknięte szkło");
  const v = page.video();
  await ctx.close();
  fs.renameSync(await v.path(), path.join(out, `kreator-1440-${theme}.webm`));
}

async function phone() {
  const size = { width: 390, height: 844 };
  const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: out, size }, hasTouch: true, isMobile: true, locale: "pl-PL" });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.locator("#kreator").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(800);
  const flow = page.getByTestId("wizard-flow");
  for (const [device, fault] of [
    ["telefon", "Pęknięty ekran"],
    ["laptop", "Klawiatura"],
    ["drukarka", "Zacina papier"],
    ["konsola", "Dryf w padzie"],
    ["smartwatch", "Pęknięte szkło"],
  ]) {
    await page.locator(`#kreator .t-wiz__devices [data-value="${device}"]`).click();
    await page.waitForTimeout(1200);
    await flow.getByRole("radio", { name: fault, exact: true }).click();
    await flow.locator(".t-scene").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(3000);
    // first Esc leaves the camera zoom, the second closes the full-screen flow
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }
  const v = page.video();
  await ctx.close();
  fs.renameSync(await v.path(), path.join(out, "kreator-390-light.webm"));
}

const only = process.env.ONLY;
if (!only || only === "desktop") {
  await desktop("light");
  await desktop("dark");
}
if (!only || only === "phone") await phone();
await browser.close();
console.log("nagrania →", out);
