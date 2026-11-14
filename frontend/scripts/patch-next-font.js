/**
 * Build-time workaround for next/font/google in Next 14.2.x (runs as `prebuild`).
 *
 * Google Fonts serves some families (here: Unbounded) from extensionless URLs
 * like `https://fonts.gstatic.com/l/font?kit=...`. Next derives the file
 * extension with `/\.(woff|woff2|eot|ttf|otf)$/.exec(url)[1]`, which is null for
 * such URLs, so `next build` crashes with "Cannot read properties of null (reading '1')".
 * The files are WOFF2 (we request them with a Chrome user agent), so we fall
 * back to "woff2" when the URL has no extension.
 *
 * Idempotent. Fails loudly if the code it patches changes (e.g. after a Next
 * upgrade) so the workaround is reviewed instead of silently skipped.
 * Remove once Next handles extensionless Google Fonts URLs.
 */
const fs = require("fs");
const path = require("path");

const loaderPath = path.join(
  path.dirname(require.resolve("next/package.json")),
  "dist/compiled/@next/font/dist/google/loader.js"
);

const ORIGINAL = "const ext = /\\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1];";
const PATCHED =
  "const ext = (/\\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl) || [null, 'woff2'])[1]; /* prokom: patch-next-font */";

const source = fs.readFileSync(loaderPath, "utf8");

if (source.includes(PATCHED)) {
  console.log("patch-next-font: already applied");
} else if (source.includes(ORIGINAL)) {
  fs.writeFileSync(loaderPath, source.replace(ORIGINAL, PATCHED));
  console.log("patch-next-font: applied");
} else {
  console.error(`patch-next-font: expected code not found in ${loaderPath}. Review the workaround after the Next upgrade.`);
  process.exit(1);
}
