import { notFound } from "next/navigation";

/**
 * Unknown public URLs → app/(public)/not-found.tsx in the Tech skin (SPEC §6).
 * Next renders a route group's not-found only for notFound() calls inside the group,
 * so unmatched URLs are routed here first. Real routes always win over this catch-all.
 */
export default function UnknownPage() {
  notFound();
}
