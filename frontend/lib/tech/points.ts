/**
 * Which service points may render (docs/tech/SPEC.md §5).
 * Production: only `published: true`. Staging with NEXT_PUBLIC_TECH_DRAFT=1: all points,
 * unpublished ones flagged `draft` so the UI draws the "do uzupełnienia" frame.
 */
import { notices as allNotices, servicePoints, type Notice, type ServicePoint } from "@/config/prokom";
import { isActiveToday } from "./hours";

export type VisiblePoint = ServicePoint & { draft: boolean };

export function isDraftMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_TECH_DRAFT === "1";
}

export function visiblePoints(
  draft: boolean = isDraftMode(),
  points: ServicePoint[] = servicePoints,
): VisiblePoint[] {
  return points.filter((p) => p.published || draft).map((p) => ({ ...p, draft: !p.published }));
}

/** Points that go into JSON-LD, sitemap and other machine-readable output: never drafts. */
export function publishedPoints(points: ServicePoint[] = servicePoints): ServicePoint[] {
  return points.filter((p) => p.published);
}

/** The single notice active today (SPEC §12.9), or null. */
export function activeNotice(now: Date, list: Notice[] = allNotices): Notice | null {
  return list.find((n) => isActiveToday(n.from, n.to, now)) ?? null;
}
