import Link from "next/link";
import { APPLE_PROGRAM_NOTE, applePrograms, certificates } from "@/lib/tech/certificates";
import { IconArrow } from "../icons";
import { CertGallery } from "./CertGallery";

/**
 * „Programy i certyfikaty” on /o-firmie (boss consent 23.11): the current Apple programmes (iLeader, AB)
 * first, then manufacturer partner statuses and trainings, each with its years.
 */
export function CertificatesSection() {
  return (
    <section className="t-section t-section--tight" id="certyfikaty" data-rail="Certyfikaty" aria-labelledby="t-certs-h">
      <div className="t-container">
        <div className="t-certsec">
          <div className="t-certsec__head">
            <span className="t-eyebrow">Programy i certyfikaty</span>
            <h2 id="t-certs-h" className="t-h2">
              Partnerzy producentów
            </h2>
            <p className="t-lead">Dziś działamy w programie Apple iLeader. Niżej statusy partnerskie i szkolenia producentów, które zdobyliśmy przez lata — z datami z dokumentów.</p>
          </div>
          <div className="t-certapple" data-t-reveal="">
            <span className="t-certapple__chip">Aktualnie</span>
            <span className="t-certapple__brand">Apple · program iLeader (AB)</span>
            <ul className="t-certapple__list">
              {applePrograms.map((p) => (
                <li key={p.key}>
                  <b>{p.title}</b>
                  <span>{p.lead}</span>
                </li>
              ))}
            </ul>
            <p className="t-certapple__note">{APPLE_PROGRAM_NOTE}</p>
            <Link href="/apple#dla-firm" className="t-certapple__link">
              Apple dla firm i instytucji
              <IconArrow size={16} strokeWidth={2.6} />
            </Link>
          </div>
          <CertGallery items={certificates} />
        </div>
      </div>
    </section>
  );
}
