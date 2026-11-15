import Link from "next/link";
import type { RepairPageData } from "@/config/naprawy";
import { liveRepairs, repairPath, repairsForDevice } from "@/lib/tech/naprawy";
import type { CategoryCode } from "@/lib/tech/wizard-data";
import { HERO_SCENES } from "@/lib/tech/subhero";
import { FaultGlyph, faultFamily } from "../content/FaultGlyph";
import { IconArrow } from "../icons";

/**
 * Links to repair pages (SPEC §12.4): only `published && verified` pages, so the block
 * renders nothing until the service confirms the list (TD5b PR 2).
 */
export function RepairLinks({ device, title = "Konkretne naprawy", className }: { device?: CategoryCode; title?: string; className?: string }) {
  const list: RepairPageData[] = device ? repairsForDevice(device) : liveRepairs();
  if (!list.length) return null;
  return (
    <nav className={`t-section t-section--tight t-repairlinks${className ? ` ${className}` : ""}`} aria-label={title} data-rail="Konkretne naprawy" id="konkretne-naprawy">
      <div className="t-container">
        <h2 className="t-h2 t-h2--sm">{title}</h2>
        <ul className="t-replinks" data-t-stagger="">
          {list.map((r) => {
            const scene = r.device === "other" ? null : HERO_SCENES[r.device as keyof typeof HERO_SCENES];
            return (
              <li key={r.slug}>
                <Link href={repairPath(r.slug)} className="t-card t-replink">
                  <span className="t-symptoms__ico" aria-hidden="true">
                    <FaultGlyph family={scene ? faultFamily(scene.device, r.usterka) : "E14"} />
                  </span>
                  <b>{r.h1}</b>
                  <IconArrow size={16} strokeWidth={2.6} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
