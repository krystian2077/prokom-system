import { techLlmsTxt } from "@/lib/tech/llms";

// Built from config/prokom.ts only, so it is rendered once at build time.
export const dynamic = "force-static";

export function GET() {
  return new Response(techLlmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
