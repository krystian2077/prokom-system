import Link from "next/link";
import { claim } from "@/lib/tech/claims";
import type { DeviceExtra } from "@/lib/tech/content-types";
import { courierPageHref, courierPaysText } from "@/lib/tech/courier";
import { POINTS_HREF } from "@/lib/tech/nav";
import { relatedPosts, blogCategoryHref } from "@/lib/tech/page-links";
import type { VisiblePoint } from "@/lib/tech/points";
import { submitHref, type CategoryCode } from "@/lib/tech/wizard-data";
import { IconArrow, IconPath, IconPin } from "../icons";
import { OpeningStatus } from "../OpeningStatus";
import { Section } from "./Blocks";

/**
 * Content sections of device pages (2026-11): intro, symptoms, how to hand over (both salons + courier), warranty, Hammer Glass, blog posts.
 * Used by DevicePage and /serwis-telefonow. Server Components.
 */

type Base = { extra: DeviceExtra; name: string; short: string };

export function DeviceIntro({ paragraphs, title }: { paragraphs: string[]; title: string }) {
  return (
    <section className="t-section t-section--tight t-dintro" id="o-serwisie" data-rail="O serwisie">
      <div className="t-container t-dintro__in">
        <div className="t-cb-head t-dintro__head">
          <span className="t-eyebrow">Co warto wiedzieć</span>
          <h2 className="t-h2 t-h2--sm">{title}</h2>
        </div>
        <div className="t-dintro__txt">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DeviceSymptoms({ extra, short, category }: Base & { category: CategoryCode }) {
  return (
    <Section id="objawy" rail="Objawy" eyebrow="Po czym poznać usterkę" title={`${short}: objawy najczęstszych usterek`}>
      <ul className="t-symptoms">
        {extra.symptoms.map((s) => (
          <li key={s.t} className="t-card t-symptoms__item">
            <h3 className="t-h3 t-symptoms__t">{s.t}</h3>
            <ul className="t-symptoms__signs">
              {s.signs.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className="t-symptoms__meaning">{s.meaning}</p>
            {s.fault ? (
              <Link href={submitHref(category, s.fault)} className="t-lnk t-lnk--sm t-symptoms__go" aria-label={`Zgłoś naprawę: ${s.t}`}>
                Zgłoś tę usterkę <IconArrow size={14} />
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** How to hand over: each published salon (live status) + courier, then the device note. */
export function DeviceIntake({ note, points, what = "sprzęt" }: { note: string; points: VisiblePoint[]; what?: string }) {
  const courier = courierPageHref();
  const pays = courierPaysText();
  const where = claim("courierWholeCountry");
  return (
    <Section id="jak-oddac" rail="Jak oddać" eyebrow="Przyjęcie i diagnoza" title={`Jak oddać ${what} do serwisu`} alt>
      <ul className="t-intake">
        {points.map((p) => (
          <li key={p.key} className={`t-card t-intake__item${p.draft ? " t-draft" : ""}`}>
            <span className="t-ico t-ico--sm" aria-hidden="true">
              <IconPin size={19} />
            </span>
            <h3 className="t-h3 t-intake__t">Salon {p.city}</h3>
            <p>
              {p.street}. Przyjdź bez umawiania w godzinach otwarcia — <OpeningStatus points={[p]} className="t-intake__status" skeletonCh={14} />.
            </p>
            <Link href={`${POINTS_HREF}#${p.key}`} className="t-lnk t-lnk--sm">
              Dojazd, godziny i parking <IconArrow size={14} />
            </Link>
          </li>
        ))}
        {courier ? (
          <li className="t-card t-intake__item">
            <span className="t-ico t-ico--sm" aria-hidden="true">
              <IconPath icon="truck" size={19} />
            </span>
            <h3 className="t-h3 t-intake__t">Kurierem{where ? ` ${where.text}` : ""}</h3>
            <p>{pays ?? "Wyślij sprzęt do serwisu kurierem."} Płacisz przelewem po diagnozie i akceptacji wyceny.</p>
            <Link href={courier} className="t-lnk t-lnk--sm">
              Jak wysłać sprzęt <IconArrow size={14} />
            </Link>
          </li>
        ) : null}
      </ul>
      <div className="t-intake__note">
        <b>Co zabrać i jak spakować</b>
        <p>{note}</p>
      </div>
    </Section>
  );
}

export function DeviceWarranty({ text }: { text: string }) {
  return (
    <section className="t-section t-section--tight" id="gwarancja" data-rail="Gwarancja">
      <div className="t-container">
        <div className="t-warranty">
          <span className="t-ico" aria-hidden="true">
            <IconPath icon="shield" size={24} />
          </span>
          <div>
            <span className="t-eyebrow">Gwarancja</span>
            <h2 className="t-h2 t-h2--sm">Gwarancja na usługę i wymienione części</h2>
            <p className="t-lead">{text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HammerTeaser({ what }: { what: string }) {
  return (
    <section className="t-section t-section--tight" id="hammer-glass" data-rail="Hammer Glass">
      <div className="t-container">
        <Link href="/hammer-glass" className="t-hgteaser">
          <span className="t-hgteaser__txt">
            <span className="t-eyebrow t-eyebrow--stage">Hammer Glass</span>
            <b>Folia ochronna wycięta na wymiar {what}</b>
            <span>Ploter w obu salonach dopasowuje folię do Twojego modelu na miejscu, także po naprawie.</span>
          </span>
          <span className="t-hgteaser__go">
            Zobacz folie <IconArrow size={16} strokeWidth={2.6} />
          </span>
        </Link>
      </div>
    </section>
  );
}

/** Blog posts of the device's category (links only, content unchanged). */
export function DevicePosts({ category, keywords, title }: { category: CategoryCode; keywords: string; title: string }) {
  const posts = relatedPosts(category, keywords, 3);
  if (!posts.length) return null;
  return (
    <nav className="t-section t-section--tight t-dposts" aria-label={title} id="poradniki" data-rail="Poradniki">
      <div className="t-container">
        <div className="t-sechead">
          <div>
            <span className="t-eyebrow">Blog</span>
            <h2 className="t-h2 t-h2--sm">{title}</h2>
          </div>
          <Link href={blogCategoryHref(category)} className="t-lnk">
            Wszystkie poradniki <IconArrow size={14} />
          </Link>
        </div>
        <ul className="t-cb-links t-dposts__list">
          {posts.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="t-card t-cb-link">
                <span>
                  <b>{p.title}</b>
                </span>
                <IconArrow size={16} strokeWidth={2.6} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
