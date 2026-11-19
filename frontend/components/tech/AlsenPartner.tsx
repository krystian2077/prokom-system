import Image from "next/image";
import { partners, type ServicePoint } from "@/config/prokom";
import { alsenPoint, showsAlsenBadge } from "@/lib/tech/partners";

const alsen = partners.alsen;

/** The ALSEN logo (red plate, white letters — readable on both themes without a backing). */
export function AlsenLogo({ height = 32, className }: { height?: number; className?: string }) {
  const width = Math.round((alsen.logo.width / alsen.logo.height) * height);
  return <Image src={alsen.logo.src} alt="ALSEN" width={width} height={height} className={className} />;
}

/** Link out to alsen.pl: new tab, `noopener` (runda 18.11 §1.5). */
function AlsenLink({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <a href={alsen.url} target="_blank" rel="noopener" className={className}>
      {children}
      <span className="t-visually-hidden"> (otwiera się w nowej karcie)</span>
    </a>
  );
}

// No network figures (alsen.pl gives contradictory ones). Ordering scope and partner point: Krystian 19.11.2026.
const partnerPoint = alsenPoint();
const LEAD = `PRO-KOM jest autoryzowanym partnerem ALSEN — sieci sprzedaży komputerów i elektroniki: laptopy, komputery, podzespoły, urządzenia peryferyjne, smartfony, RTV i AGD. Przez nas zamówisz wszystko, co jest na alsen.pl, i odbierzesz to w punkcie partnerskim: ${partnerPoint.street}, ${partnerPoint.city}.`;

/** „O firmie”: a short block about the partnership. */
export function AlsenBlock() {
  return (
    <section className="t-section t-section--tight" id="partner" data-rail="Partner ALSEN" aria-labelledby="t-alsen-h">
      <div className="t-container">
        <div className="t-card t-alsen t-alsen--block" data-alsen="">
          <AlsenLogo height={48} className="t-alsen__logo" />
          <div className="t-alsen__text">
            <span className="t-eyb">Partnerzy</span>
            <h2 id="t-alsen-h" className="t-h2 t-h2--sm">
              Autoryzowany partner ALSEN
            </h2>
            <p className="t-alsen__s">{LEAD}</p>
          </div>
          <AlsenLink className="t-pbtn t-pbtn--outline t-pbtn--m t-alsen__btn">Strona ALSEN ↗</AlsenLink>
        </div>
      </div>
    </section>
  );
}

/** Footer row „Partnerzy” above the legal bar. */
export function FooterPartners() {
  return (
    <div className="t-footer__partners">
      <span className="t-footer__h">Partnerzy</span>
      <AlsenLink className="t-footer__partner">
        <AlsenLogo height={26} />
        <span className="t-footer__partner-t">Autoryzowany partner ALSEN</span>
      </AlsenLink>
    </div>
  );
}

/** Point card badge „Punkt partnerski ALSEN”. */
export function AlsenBadge({ point }: { point: Pick<ServicePoint, "key"> }) {
  if (!showsAlsenBadge(point.key)) return null;
  return <span className="t-alsen-badge">Punkt partnerski ALSEN</span>;
}
