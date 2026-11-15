import Image from "next/image";
import Link from "next/link";
import type { PointKey } from "@/config/prokom";
import { claim } from "@/lib/tech/claims";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { PHONE_BRANDS, PHONE_REPAIRS, phoneSteps } from "@/lib/tech/phone-repairs";
import { PageIconSvg } from "./page-icons";
import { BrandLogo } from "./BrandLogo";
import { cardBrandLogos, logoSpellsName } from "./brand-logos";
import { Timeline } from "./content/Blocks";

const submitHref = (usterka: string, punkt?: PointKey) => {
  const q = new URLSearchParams({ category: "phone", usterka });
  if (punkt) q.set("punkt", punkt);
  return `${SUBMIT_HREF}?${q.toString()}`;
};

/** "Co naprawiamy w telefonach" — repairs table (cards on phones), design #serwis-telefonow-zakopane. */
export function PhoneRepairsSection({ punkt }: { punkt?: PointKey }) {
  return (
    <section className="t-section t-section--alt" id="naprawy" data-rail="Co naprawiamy">
      <div className="t-container t-phrep">
        <div className="t-phrep__intro">
          <span className="t-eyebrow">Naprawy telefonów</span>
          <h2 className="t-h2">Co naprawiamy w telefonach</h2>
          <p className="t-lead">Ceny zależą od modelu i części, dlatego podajemy je po diagnozie. Zanim zaczniemy, znasz kwotę.</p>
          <div className="t-phrep__img" aria-hidden="true">
            <span className="t-phrep__glow" />
            <Image src="/tech/urzadzenia/iphone.webp" alt="" width={433} height={577} unoptimized />
          </div>
        </div>
        <div className="t-phrep__table">
          <div className="t-phrep__head" aria-hidden="true">
            <span />
            <span>Naprawa</span>
            <span>Czas</span>
            <span />
          </div>
          <ul>
            {PHONE_REPAIRS.map((r) => {
              const time = typeof r.time === "string" ? { text: r.time, draft: false } : claim(r.time.claim) ?? { text: r.time.fallback, draft: false };
              return (
                <li key={r.t} className="t-phrep__row">
                  <span className="t-phrep__ico">
                    <PageIconSvg icon={r.icon} />
                  </span>
                  <span className="t-phrep__txt">
                    <h3>{r.t}</h3>
                    <span>{r.s}</span>
                  </span>
                  <span className={`t-phrep__time${time.draft ? " t-draft" : ""}`}>
                    <span className="t-visually-hidden">Czas: </span>
                    {time.text}
                  </span>
                  <Link href={submitHref(r.usterka, punkt)} className="t-pbtn t-pbtn--outline t-pbtn--m" aria-label={`Zgłoś: ${r.t}`}>
                    Zgłoś
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** "Jakie telefony naprawiamy" — brand cards. */
export function PhoneBrandsSection({ title }: { title: string }) {
  const logos = cardBrandLogos(PHONE_BRANDS.map((b) => b.n));
  return (
    <section className="t-section" id="marki" data-rail="Marki">
      <div className="t-container">
        <div className="t-sechead">
          <div>
            <span className="t-eyebrow">Marki</span>
            <h2 className="t-h2">{title}</h2>
          </div>
          <p className="t-lead">Nie widzisz swojej marki? Zadzwoń. Sprawdzimy dostępność części do Twojego modelu.</p>
        </div>
        <ul className="t-phbrands t-snap" tabIndex={0} aria-label="Marki telefonów, które naprawiamy">
          {PHONE_BRANDS.map((b, i) => (
            <li key={b.n} className="t-phbrand">
              {logos ? (
                <span className="t-kinds__logo">
                  <BrandLogo brand={logos[i]} hidden />
                </span>
              ) : null}
              <h3 className={logos && logoSpellsName(logos[i], b.n) ? "t-visually-hidden" : undefined}>{b.n}</h3>
              <p>{b.s}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** "Cztery kroki do sprawnego telefonu" on a dark band. */
export function PhoneStepsSection({ eyebrow, cityName, timeline = false }: { eyebrow: string; cityName: string | null; timeline?: boolean }) {
  const sameDay = claim("sameDayDiagnosis");
  const steps = phoneSteps(cityName, sameDay?.text ?? null);
  if (timeline) {
    // /serwis-telefonow: same drawn timeline as the other repair pages (content unchanged)
    return (
      <section className="t-section t-dsteps" id="jak-to-dziala" data-rail="Jak to działa">
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className="t-eyebrow t-eyebrow--stage">{eyebrow}</span>
              <h2 className="t-h2">Cztery kroki do sprawnego telefonu</h2>
            </div>
          </div>
          <Timeline steps={steps.map((st, i) => ({ t: st.t, s: st.s, lead: i === 0, draft: i === 1 && !!sameDay?.draft }))} tone="stage" horizontal />
        </div>
      </section>
    );
  }
  return (
    <section className="t-steps-dark" id="jak-to-dziala" data-rail="Jak to działa">
      <div className="t-container">
        <span className="t-eyebrow t-eyebrow--stage">{eyebrow}</span>
        <h2 className="t-h2">Cztery kroki do sprawnego telefonu</h2>
        <ol className="t-steps-dark__list">
          {steps.map((s, i) => (
            <li key={s.t} className={i === 1 && sameDay?.draft ? "t-draft" : undefined}>
              <span className={i === 0 ? "is-first" : undefined}>{i + 1}</span>
              <h3>{s.t}</h3>
              <p>{s.s}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
