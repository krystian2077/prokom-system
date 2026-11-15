import { Suspense } from "react";
import { TrackPage } from "@/components/tech/TrackPage";

/** /track — repair status (TD3 PR 3, KONTRAKT §3). The page renders on the client (search params);
 * the placeholder has the height of the empty page, so the footer does not jump (CLS). */
export default function Page() {
  return (
    <Suspense fallback={<div className="t-ui t-container t-trk t-trk-ph" aria-busy="true" />}>
      <TrackPage />
    </Suspense>
  );
}
