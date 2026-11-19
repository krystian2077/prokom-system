import { Suspense } from "react";
import { RepairForm } from "@/components/tech/RepairForm";
import { RepairFormHead } from "@/components/tech/PageHeads";

/**
 * /zgloszenie — the one repair form (TD3 PR 2, KONTRAKT §1–§2).
 */
// The form renders on the client (search params). The header is server HTML outside Suspense, so
// it is not replaced after hydration (stays the LCP element, H1 for SEO); the placeholder has the
// height of the form column (CLS).
export default function ZgloszeniePage() {
  return (
    <div className="t-ui t-container t-zgl">
      <RepairFormHead />
      <Suspense fallback={<div className="t-zgl__main t-zgl-ph" aria-busy="true" />}>
        <RepairForm />
      </Suspense>
    </div>
  );
}
