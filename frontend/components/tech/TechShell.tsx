import type { ReactNode } from "react";
import { notices, servicePoints } from "@/config/prokom";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { BrandBar } from "./BrandBar";
import { Capsule } from "./Capsule";
import { Footer } from "./Footer";
import { MenuSheet } from "./MenuSheet";
import { NoticeBar } from "./NoticeBar";
import { SectionRail } from "./SectionRail";
import { ShellProvider } from "./ShellContext";
import { TabBar } from "./TabBar";
import { TrackClicks } from "./TrackClicks";

/**
 * Public-site shell (SPEC §7, RESPONSYWNOSC): notice, brand bar and capsule on top,
 * side rail ≥ 1400, footer; on phones and tablet portrait the bottom tab bar and sheets.
 */
export function TechShell({ children }: { children: ReactNode }) {
  const points = visiblePoints();
  return (
    <ShellProvider points={points}>
      <div className="t-shell" id="top">
        <a href="#tresc" className="t-skip t-ui">
          Przejdź do treści
        </a>
        <div className="t-header t-ui" data-t-region="header">
          <NoticeBar notices={notices} />
          <BrandBar points={points} />
          <Capsule />
        </div>
        <SectionRail />
        <main id="tresc" className="t-main" tabIndex={-1}>
          {children}
        </main>
        <Footer points={points} publishedCount={publishedPoints(servicePoints).length} />
        <div className="t-ui">
          <TabBar />
          <MenuSheet />
        </div>
        <TrackClicks />
      </div>
    </ShellProvider>
  );
}
