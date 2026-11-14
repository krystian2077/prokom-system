import { Suspense } from "react";
import { RepairForm } from "@/components/tech/RepairForm";

/**
 * /zgloszenie — the one repair form (TD3 PR 2, KONTRAKT §1–§2).
 * The previous implementation is kept unused in features/zgloszenie/LegacyZgloszeniePage.tsx
 * until TD6 removes it.
 */
export default function ZgloszeniePage() {
  return (
    <Suspense fallback={<div className="t-ui t-container t-zgl" style={{ minHeight: "80vh" }} aria-busy="true" />}>
      <RepairForm />
    </Suspense>
  );
}
