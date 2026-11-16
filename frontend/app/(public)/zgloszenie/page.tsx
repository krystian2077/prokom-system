import { Suspense } from "react";
import { RepairForm } from "@/components/tech/RepairForm";
import { RepairFormHead } from "@/components/tech/PageHeads";

/**
 * /zgloszenie — the one repair form (TD3 PR 2, KONTRAKT §1–§2).
 */
// The form renders on the client (search params). The placeholder has the form's height (CLS)
// and the same header as the form, so the server HTML carries the H1 and the lead (LCP, SEO).
export default function ZgloszeniePage() {
  return (
    <Suspense
      fallback={
        <div className="t-ui t-container t-zgl t-zgl-ph" aria-busy="true">
          <div className="t-zgl__main">
            <RepairFormHead />
          </div>
        </div>
      }
    >
      <RepairForm />
    </Suspense>
  );
}
