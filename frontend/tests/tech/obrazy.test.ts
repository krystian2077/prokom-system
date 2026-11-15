/**
 * Every static file the public site points at exists in public/ (TD6: og-prokom.jpg and
 * logo.png were missing → 404 for the share image and the schema.org logo).
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const FRONTEND = path.resolve(__dirname, "../..");
const SCAN = ["app/(public)", "app/layout.tsx", "components/tech", "lib/tech", "config"];

function walk(rel: string): string[] {
  const abs = path.join(FRONTEND, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [rel];
  return fs.readdirSync(abs).flatMap((n) => walk(`${rel}/${n}`));
}

describe("pliki statyczne strony publicznej", () => {
  const files = SCAN.flatMap(walk).filter((f) => /\.(tsx?|json)$/.test(f) && !/\.test\.ts$/.test(f));
  const refs = new Map<string, string>();
  for (const f of files) {
    const src = fs.readFileSync(path.join(FRONTEND, f), "utf8");
    for (const m of Array.from(src.matchAll(/["'`(](?:\$\{SITE_URL\})?(\/(?:images|tech)\/[\w./-]+\.(?:jpe?g|png|webp|svg|mp4|ico))/g))) {
      refs.set(m[1], f);
    }
  }

  it("finds the share image and the logo", () => {
    expect(refs.has("/images/og-prokom.jpg")).toBe(true);
    expect(refs.has("/images/logo.png")).toBe(true);
  });

  it("every referenced file exists", () => {
    const missing = Array.from(refs).filter(([p]) => !fs.existsSync(path.join(FRONTEND, "public", p))).map(([p, f]) => `${p} (${f})`);
    expect(missing).toEqual([]);
  });
});
