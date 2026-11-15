import { webManifest } from "@/lib/tech/pwa";

// A route handler instead of app/manifest.ts: Next would add <link rel="manifest"> to every
// page, panels included. Here only the public layout links it (SPEC §12.2).
export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(webManifest()), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
