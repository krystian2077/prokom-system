import Image from "next/image";
import { partners, type ServicePoint } from "@/config/prokom";
import { showsAlsenBadge } from "@/lib/tech/partners";

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

// TODO(krystian): treść o partnerstwie do akceptacji (bez liczb sieci, dopóki ich nie potwierdzimy).
const LEAD = "PRO-KOM jest autoryzowanym partnerem sieci ALSEN.";

/** Home page, „Dlaczego PRO-KOM Tech”: a wide card under the reasons. */
export function AlsenCard() {
  return (
    <div className="t-card t-alsen" data-alsen="">
      <AlsenLogo height={40} className="t-alsen__logo" />
      <div className="t-alsen__text">
        <span className="t-h3 t-alsen__t">Autoryzowany partner ALSEN</span>
        <span className="t-alsen__s">{LEAD}</span>
      </div>
      <AlsenLink className="t-alsen__link">alsen.pl ↗</AlsenLink>
    </div>
  );
}

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
