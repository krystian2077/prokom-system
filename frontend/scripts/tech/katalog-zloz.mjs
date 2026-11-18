/**
 * Builds content/katalog/{apple,samsung}.json (runda 18.11 v2, T-R2a) from:
 *   - manufacturer facts collected by hand/agents: tmp/r1/specs-*.json (specs, colours, storage, box, image URLs, sources),
 *   - our own copy: tmp/r1/copy-*.json (description, FAQ, quiz tags),
 *   - the editorial table below (family, order, „Nowość”, „Pasuje do”).
 * With --download it fetches one photo per colour from the manufacturer (Krystian 18.11.2026: photos
 * from manufacturers allowed), converts it to WebP 720 px and stores it in public/tech/katalog/<slug>/.
 *
 *   node scripts/tech/katalog-zloz.mjs <dir-with-tmp-files> [--download]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
const DOWNLOAD = process.argv.includes("--download");
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "../..");
const OUT = path.join(ROOT, "content/katalog");
const PUB = path.join(ROOT, "public/tech/katalog");
const TODAY = "2026-11-18";
const CONSENT = "Krystian 18.11.2026: zdjęcia od producentów — zgoda";

/** slug → [family, order, isNew, compat] */
const EDIT = {
  "iphone-18-pro": ["iphone-pro", 1000, true, ["hammer-glass", "etui", "ladowarka", "airpods-pro-3", "apple-watch-series-12"]],
  "iphone-18-pro-max": ["iphone-pro", 999, true, ["hammer-glass", "etui", "ladowarka", "airpods-pro-3", "apple-watch-series-12"]],
  "iphone-duo": ["iphone-duo", 998, true, ["hammer-glass", "etui", "ladowarka", "airpods-pro-3"]],
  "iphone-air": ["iphone-air", 960, false, ["hammer-glass", "etui", "ladowarka", "airpods-5"]],
  "iphone-17": ["iphone", 950, false, ["hammer-glass", "etui", "ladowarka", "airpods-5"]],
  "iphone-17e": ["iphone", 940, false, ["hammer-glass", "etui", "ladowarka", "airpods-5"]],
  "iphone-16": ["iphone", 900, false, ["hammer-glass", "etui", "ladowarka", "airpods-5"]],
  "ipad-pro-13-m5": ["ipad-pro", 891, false, ["hammer-glass", "etui", "ladowarka"]],
  "ipad-pro-11-m5": ["ipad-pro", 890, false, ["hammer-glass", "etui", "ladowarka"]],
  "ipad-air-13-m4": ["ipad-air", 881, false, ["hammer-glass", "etui", "ladowarka"]],
  "ipad-air-11-m4": ["ipad-air", 880, false, ["hammer-glass", "etui", "ladowarka"]],
  "ipad-mini-a20-pro": ["ipad", 872, true, ["hammer-glass", "etui", "ladowarka"]],
  "ipad-11-a16": ["ipad", 870, false, ["hammer-glass", "etui", "ladowarka"]],
  "macbook-pro-proled-xdr": ["macbook-pro", 862, true, ["etui"]],
  "macbook-pro-14": ["macbook-pro", 861, true, ["etui"]],
  "macbook-pro-16": ["macbook-pro", 860, false, ["etui"]],
  "macbook-air-15": ["macbook-air", 851, false, ["etui"]],
  "macbook-air-13": ["macbook-air", 850, false, ["etui"]],
  "macbook-neo-13": ["macbook-neo", 855, true, ["etui"]],
  "imac-24": ["mac", 832, true, []],
  "mac-studio": ["mac", 831, true, []],
  "mac-mini": ["mac", 830, true, []],
  "apple-watch-series-12": ["apple-watch", 822, true, ["hammer-glass", "iphone-18-pro"]],
  "apple-watch-ultra-4": ["apple-watch", 821, true, ["hammer-glass", "iphone-18-pro"]],
  "apple-watch-se-3": ["apple-watch", 810, false, ["hammer-glass", "iphone-17"]],
  "airpods-pro-3": ["airpods", 803, false, ["iphone-18-pro"]],
  "airpods-5-wireless": ["airpods", 802, true, ["iphone-17"]],
  "airpods-5": ["airpods", 801, true, ["iphone-17"]],
  "airpods-max-2": ["airpods", 800, false, ["iphone-18-pro", "macbook-pro-14"]],
  "galaxy-s26-ultra": ["galaxy-s", 1000, true, ["hammer-glass", "etui", "ladowarka", "galaxy-buds4-pro", "galaxy-watch9"]],
  "galaxy-s26-plus": ["galaxy-s", 999, true, ["hammer-glass", "etui", "ladowarka", "galaxy-buds4-pro", "galaxy-watch9"]],
  "galaxy-s26": ["galaxy-s", 998, true, ["hammer-glass", "etui", "ladowarka", "galaxy-buds4", "galaxy-watch9"]],
  "galaxy-s26-fe": ["galaxy-s", 970, false, ["hammer-glass", "etui", "ladowarka", "galaxy-buds4"]],
  "galaxy-z-fold8-ultra": ["galaxy-z", 996, true, ["etui", "ladowarka", "galaxy-buds4-pro"]],
  "galaxy-z-fold8": ["galaxy-z", 995, true, ["etui", "ladowarka", "galaxy-buds4-pro"]],
  "galaxy-z-flip8": ["galaxy-z", 994, true, ["etui", "ladowarka", "galaxy-buds4"]],
  "galaxy-a57-5g": ["galaxy-a", 940, false, ["hammer-glass", "etui", "ladowarka", "galaxy-buds4"]],
  "galaxy-a37-5g": ["galaxy-a", 930, false, ["hammer-glass", "etui", "ladowarka", "galaxy-buds4"]],
  "galaxy-a27-5g": ["galaxy-a", 920, false, ["hammer-glass", "etui", "ladowarka"]],
  "galaxy-a17": ["galaxy-a", 910, false, ["hammer-glass", "etui", "ladowarka"]],
  "galaxy-tab-s12-ultra": ["galaxy-tab", 890, true, ["hammer-glass", "etui", "ladowarka"]],
  "galaxy-tab-s12-plus": ["galaxy-tab", 889, true, ["hammer-glass", "etui", "ladowarka"]],
  "galaxy-watch9": ["galaxy-watch", 830, true, ["hammer-glass", "galaxy-s26"]],
  "galaxy-watch-ultra2": ["galaxy-watch", 829, true, ["hammer-glass", "galaxy-s26-ultra"]],
  "galaxy-watch8-classic": ["galaxy-watch", 820, false, ["hammer-glass", "galaxy-s26"]],
  "galaxy-watch8": ["galaxy-watch", 819, false, ["hammer-glass", "galaxy-s26"]],
  "galaxy-buds4-pro": ["galaxy-buds", 810, true, ["galaxy-s26-ultra"]],
  "galaxy-buds4": ["galaxy-buds", 809, true, ["galaxy-s26"]],
};

/** Colour names that the manufacturer pages do not give (AirPods): the product is white. */
const DEFAULT_COLORS = { audio: [{ name: "Biały", hex: "#f2f2f0" }] };

const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL[c])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null);

async function downloadPhoto(url, slug, colorKey) {
  const dir = path.join(PUB, slug);
  const file = path.join(dir, `${colorKey}.webp`);
  const rel = `/tech/katalog/${slug}/${colorKey}.webp`;
  if (fs.existsSync(file)) return rel;
  await new Promise((r) => setTimeout(r, 1200)); // polite: one request at a time
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (catalogue build)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(dir, { recursive: true });
  await sharp(buf).trim().resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90 }).toFile(file);
  return rel;
}

/** Better product shots chosen later (e.g. iphone-photos.json): { slug: { "Kolor": { url, transparent } } }. */
const OVERRIDES = Object.assign({}, ...["iphone-photos.json"].map((f) => readJson(path.join(SRC, f)) ?? {}));

async function build(brand, specFiles, copyFiles) {
  const specs = specFiles.flatMap((f) => readJson(path.join(SRC, f)) ?? []);
  for (const s of specs) {
    const o = OVERRIDES[s.slug];
    if (!o) continue;
    for (const [colorName, v] of Object.entries(o)) {
      if (!v?.url) continue;
      const key = slugify(colorName);
      s.images = [...(s.images ?? []).filter((i) => !(i.color && slugify(i.color) === key)), { color: colorName, url: v.url, transparent: !!v.transparent }];
      const file = path.join(PUB, s.slug, `${key}.webp`);
      // replace the earlier download once (marker file keeps it from re-downloading on every run)
      const marker = path.join(SRC, ".overrides", `${s.slug}--${key}`);
      if (DOWNLOAD && fs.existsSync(file) && !fs.existsSync(marker)) fs.unlinkSync(file);
      if (DOWNLOAD) {
        fs.mkdirSync(path.dirname(marker), { recursive: true });
        fs.writeFileSync(marker, v.url);
      }
    }
  }
  const copy = Object.assign({}, ...copyFiles.map((f) => readJson(path.join(SRC, f)) ?? {}));
  const out = [];
  const report = [];
  for (const s of specs) {
    const ed = EDIT[s.slug];
    if (!ed) {
      report.push(`pominięto (brak w tabeli redakcyjnej): ${s.slug}`);
      continue;
    }
    const c = copy[s.slug];
    if (!c) report.push(`brak tekstów: ${s.slug}`);
    const [family, order, isNew, compat] = ed;
    const rawColors = s.colors?.length ? s.colors : DEFAULT_COLORS[s.kind] ?? [];
    const colors = rawColors.map((x) => ({ key: slugify(x.name), name: x.name, hex: /^#[0-9a-f]{6}$/i.test(x.hex ?? "") ? x.hex.toLowerCase() : "#888888", ...(x.officialStoreOnly ? { officialStoreOnly: true } : {}) }));
    const storage = (s.storage ?? []).map((x) => ({ key: slugify(x.label), label: x.label, ...(x.ram ? { ram: x.ram } : {}) }));
    const images = [];
    for (const col of colors) {
      const img = (s.images ?? []).find((i) => i.color && slugify(i.color) === col.key) ?? ((s.images ?? []).length && colors.length === 1 ? s.images[0] : null);
      if (!img?.url) continue;
      let src = null;
      if (DOWNLOAD) {
        try {
          src = await downloadPhoto(img.url, s.slug, col.key);
        } catch (e) {
          report.push(`zdjęcie nie pobrane ${s.slug}/${col.key}: ${e.message}`);
        }
      } else if (fs.existsSync(path.join(PUB, s.slug, `${col.key}.webp`))) src = `/tech/katalog/${s.slug}/${col.key}.webp`;
      images.push({ color: col.key, src, ...(img.transparent ? { transparent: true } : {}), source: { url: img.url, date: TODAY, consent: CONSENT } });
    }
    const specsRows = (s.specs ?? []).filter((r) => r.value).slice(0, 14);
    out.push({
      slug: s.slug,
      brand,
      kind: s.kind,
      family,
      name: s.name,
      order,
      isNew,
      colors,
      storage,
      keyFacts: (s.keyFacts ?? []).slice(0, 4),
      specs: specsRows,
      inBox: s.inBox ?? [],
      description: c?.description ?? [],
      faq: c?.faq ?? [],
      compat,
      tags: c?.tags ?? [],
      images,
      sources: (s.sources ?? []).map((x) => ({ url: x.url, date: x.date ?? TODAY, what: x.what ?? "dane producenta" })),
      ...(s.availabilityNote ? { availabilityNote: s.availabilityNote } : {}),
    });
  }
  out.sort((a, b) => b.order - a.order);
  fs.writeFileSync(path.join(OUT, `${brand}.json`), `${JSON.stringify(out, null, 2)}\n`);
  return report;
}

const r1 = await build("apple", ["specs-apple-mobile.json", "specs-apple-other.json"], ["copy-apple-mobile.json", "copy-apple-other.json"]);
const r2 = await build("samsung", ["specs-samsung.json"], ["copy-samsung.json"]);
for (const line of [...r1, ...r2]) console.log(line);
console.log("ok");
