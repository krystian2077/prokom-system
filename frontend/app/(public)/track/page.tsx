import { Suspense } from "react";
import { TrackPage } from "@/components/tech/TrackPage";

/** /track — repair status (TD3 PR 3, KONTRAKT §3). */
export default function Page() {
  return (
    <Suspense fallback={<div className="t-ui t-container t-trk" style={{ minHeight: "60vh" }} aria-busy="true" />}>
      <TrackPage />
    </Suspense>
  );
}
