import Link from "next/link";
import type { RepairPageData } from "@/config/naprawy";
import { liveRepairs, repairPath, repairsForDevice } from "@/lib/tech/naprawy";
import type { CategoryCode } from "@/lib/tech/wizard-data";
import { IconArrow } from "../icons";

/**
 * Links to repair pages (SPEC §12.4): only `published && verified` pages, so the block
 * renders nothing until the service confirms the list (TD5b PR 2).
 */
export function RepairLinks({ device, title = "Konkretne naprawy", className }: { device?: CategoryCode; title?: string; className?: string }) {
  const list: RepairPageData[] = device ? repairsForDevice(device) : liveRepairs();
  if (!list.length) return null;
  return (
    <nav className={`t-section t-section--tight t-repairlinks${className ? ` ${className}` : ""}`} aria-label={title} data-rail={title} id="konkretne-naprawy">
      <div className="t-container">
        <h2 className="t-h2 t-h2--sm">{title}</h2>
        <ul className="t-dev-more__list">
          {list.map((r) => (
            <li key={r.slug}>
              <Link href={repairPath(r.slug)} className="t-chiplink">
                {r.h1}
                <IconArrow size={14} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
