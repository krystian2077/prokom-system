import { Suspense } from "react";
import { RepairForm } from "@/components/tech/RepairForm";

/**
 * /zgloszenie — the one repair form (TD3 PR 2, KONTRAKT §1–§2).
 */
// The form renders on the client (search params): the placeholder has the form's height (CLS).
export default function ZgloszeniePage() {
  return (
    <Suspense fallback={<div className="t-ui t-container t-zgl t-zgl-ph" aria-busy="true" />}>
      <RepairForm />
    </Suspense>
  );
}
