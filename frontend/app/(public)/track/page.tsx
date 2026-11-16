import { Suspense } from "react";
import { TrackHead } from "@/components/tech/PageHeads";
import { TrackPage } from "@/components/tech/TrackPage";

/** /track — repair status (TD3 PR 3, KONTRAKT §3). The page renders on the client (search params);
 * the placeholder has the height of the empty page, so the footer does not jump (CLS), and the same
 * header as the page, so the server HTML carries the H1 (LCP, SEO). */
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="t-ui t-container t-trk t-trk-ph" aria-busy="true">
          <div className="t-trk__head">
            <TrackHead />
          </div>
        </div>
      }
    >
      <TrackPage />
    </Suspense>
  );
}
