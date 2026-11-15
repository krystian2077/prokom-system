import Link from "next/link";
import type { DeviceExtra } from "@/lib/tech/content-types";
import { relatedPosts, blogCategoryHref } from "@/lib/tech/page-links";
import type { VisiblePoint } from "@/lib/tech/points";
import { submitHref, type CategoryCode } from "@/lib/tech/wizard-data";
import { HERO_SCENES } from "@/lib/tech/subhero";
import { IconArrow, IconPath } from "../icons";
import { FaultGlyph, faultFamily } from "./FaultGlyph";
import { SalonCards } from "./SalonCards";
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
  const device = HERO_SCENES[category as keyof typeof HERO_SCENES]?.device ?? "other";
  return (
    <Section id="objawy" rail="Objawy" eyebrow="Po czym poznać usterkę" title={`${short}: objawy najczęstszych usterek`}>
      <ul className="t-symptoms" data-t-stagger="">
        {extra.symptoms.map((s) => (
          <li key={s.t} className="t-card t-symptoms__item">
            <div className="t-symptoms__head">
              <span className="t-symptoms__ico">
                <FaultGlyph family={faultFamily(device, s.fault)} />
              </span>
              <h3 className="t-h3 t-symptoms__t">{s.t}</h3>
            </div>
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

/** How to hand over: each published salon (live status, navigation, parking) + courier, then the device note. */
export function DeviceIntake({ note, points, what = "sprzęt" }: { note: string; points: VisiblePoint[]; what?: string }) {
  return (
    <Section id="jak-oddac" rail="Jak oddać" eyebrow="Przyjęcie i diagnoza" title={`Jak oddać ${what} do serwisu`} lead="Bez umawiania: przyjdź do salonu w godzinach otwarcia albo wyślij sprzęt." alt>
      <SalonCards points={points} trackFrom="urzadzenie" />
      <div className="t-intake__note">
        <span className="t-intake__noteico" aria-hidden="true">
          <IconPath icon="list" size={18} />
        </span>
        <div>
          <b>Co zabrać i jak spakować</b>
          <p>{note}</p>
        </div>
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
