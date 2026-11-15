"use client";

import ConsoleArt from "../wizard/art/ConsoleArt";
import DataArt from "../wizard/art/DataArt";
import LaptopArt from "../wizard/art/LaptopArt";
import OtherArt from "../wizard/art/OtherArt";
import PcArt from "../wizard/art/PcArt";
import PhoneArt from "../wizard/art/PhoneArt";
import PrinterArt from "../wizard/art/PrinterArt";
import TabletArt from "../wizard/art/TabletArt";
import WatchArt from "../wizard/art/WatchArt";

/** Temporary: raw device illustrations for review. */
export function LabArtPreview() {
  return (
    <div className="t-artvars" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }} data-testid="art-preview">
      {[PhoneArt, TabletArt, WatchArt, LaptopArt, PcArt, PrinterArt, ConsoleArt, DataArt, OtherArt].map((A, i) => (
        <div key={i} style={{ width: 300, height: 300, padding: 16, borderRadius: 20, background: "var(--bg2)", display: "grid", placeItems: "center", boxSizing: "border-box" }}>
          <div style={{ width: "100%", height: "100%" }}>
            <A uid={`p${i}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
