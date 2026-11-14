import Link from "next/link";
import type { DeviceCategory } from "@/lib/tech/contract";
import { PREP_GUIDE_HREF, PREP_GUIDE_READY } from "@/lib/tech/nav";
import { prepChecklist } from "@/lib/tech/repair-form";
import { IconCheck } from "./icons";

/**
 * "Zanim przyjdziesz" — the 4 most important preparation steps (SPEC §12.3).
 * Links to the full guide once it exists (TD5).
 */
export function PrepChecklist({ category, title = "Zanim oddasz sprzęt" }: { category: DeviceCategory | null; title?: string }) {
  return (
    <div className="t-prep">
      <span className="t-eyebrow">{title}</span>
      <ul>
        {prepChecklist(category).map((item) => (
          <li key={item}>
            <IconCheck size={15} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {PREP_GUIDE_READY ? (
        <Link href={PREP_GUIDE_HREF} className="t-prep__more">
          Jak przygotować sprzęt do serwisu →
        </Link>
      ) : null}
    </div>
  );
}
