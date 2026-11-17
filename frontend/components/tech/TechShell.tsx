import type { ReactNode } from "react";
import { notices, servicePoints } from "@/config/prokom";
import { liveRepairs, repairPath } from "@/lib/tech/naprawy";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { BrandBar } from "./BrandBar";
import { Capsule } from "./Capsule";
import { Footer } from "./Footer";
import { MenuSheet } from "./MenuSheet";
import { MotionRoot } from "./MotionRoot";
import { NoticeBar } from "./NoticeBar";
import { LazySearchDialog } from "./search/LazySearchDialog";
import { SectionRail } from "./SectionRail";
import { ShellProvider } from "./ShellContext";
import { TabBar } from "./TabBar";
import { TrackClicks } from "./TrackClicks";
import { Typeset } from "./Typeset";

/**
 * Public-site shell (SPEC §7, RESPONSYWNOSC): notice, brand bar and capsule on top,
 * side rail ≥ 1424, footer, search window (Ctrl/⌘ K, „/”); on phones and tablet portrait the bottom tab bar and sheets.
 */
export function TechShell({ children }: { children: ReactNode }) {
  const points = visiblePoints();
  // Mega menu „Naprawy”: a fault with its own live page links there, the rest to the form.
  const faultPages = Object.fromEntries(liveRepairs().map((r) => [`${r.device}:${r.usterka}`, repairPath(r.slug)]));
  return (
    <ShellProvider points={points} faultPages={faultPages}>
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
          <LazySearchDialog />
        </div>
        <TrackClicks />
        <MotionRoot />
        <Typeset />
      </div>
    </ShellProvider>
  );
}
