import type { CSSProperties } from "react";
import type { ArtKind } from "@/lib/tech/wizard-data";
import ConsoleArt from "./ConsoleArt";
import DataArt from "./DataArt";
import LaptopArt from "./LaptopArt";
import OtherArt from "./OtherArt";
import PcArt from "./PcArt";
import PhoneArt from "./PhoneArt";
import PrinterArt from "./PrinterArt";
import TabletArt from "./TabletArt";
import WatchArt from "./WatchArt";

const ART = { phone: PhoneArt, tablet: TabletArt, watch: WatchArt, laptop: LaptopArt, pc: PcArt, printer: PrinterArt, console: ConsoleArt, data: DataArt, other: OtherArt };
const VIEW: Record<ArtKind, [number, number]> = {
  phone: [480, 540],
  tablet: [440, 600],
  watch: [400, 480],
  laptop: [600, 400],
  pc: [360, 580],
  printer: [600, 380],
  console: [600, 560],
  data: [480, 400],
  other: [480, 400],
};

/**
 * A device illustration cropped to `crop` (viewBox units), for server-rendered places
 * (home "Co naprawiamy"): inline SVG, no client JS, sharp at any density, both themes
 * (materials from `--dv-*`, wrapper class `t-artvars`).
 */
export function StaticArt({ kind, crop, uid, className = "" }: { kind: ArtKind; crop: [number, number, number, number]; uid: string; className?: string }) {
  const A = ART[kind];
  const [vw, vh] = VIEW[kind];
  const [cx, cy, cw, ch] = crop;
  return (
    <span className={`t-artvars t-sart ${className}`} style={{ "--arn": cw / ch } as CSSProperties} aria-hidden="true">
      <span className="t-sart__frame">
        <span className="t-sart__art" style={{ left: `${(-cx / cw) * 100}%`, top: `${(-cy / ch) * 100}%`, width: `${(vw / cw) * 100}%`, height: `${(vh / ch) * 100}%` }}>
          <A uid={uid} />
        </span>
      </span>
    </span>
  );
}
