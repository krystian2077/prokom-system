import Link from "next/link";
import { telHref } from "@/config/prokom";
import type { TrackResponse } from "@/lib/tech/contract";
import { ACCOUNT_HREF } from "@/lib/tech/nav";
import { detailRows, historyRows, routeHref, stageViews } from "@/lib/tech/track";
import { CATEGORY_ICON } from "@/lib/tech/repair-form";
import { DEVICE_CATEGORIES } from "@/types/repair";
import { DeviceGlyph, IconArrowUpRight, IconCheck, IconClose } from "./icons";

/** Category label from the backend ("Telefon") → icon of the chips. */
function iconFor(label: string) {
  const code = DEVICE_CATEGORIES.find((c) => c.label.toLocaleLowerCase("pl") === label.toLocaleLowerCase("pl"))?.value;
  return (code && CATEGORY_ICON[code]) || "phone";
}

/**
 * Repair status (design #status-naprawy, KONTRAKT §3): 5-stage axis from `stages`,
 * interruption on its stage, details without empty rows, history with backend labels,
 * "Twój serwis" from the API response (not from config), call button.
 */
export function RepairTracker({ data, onRefresh, refreshing = false }: { data: TrackResponse; onRefresh?: () => void; refreshing?: boolean }) {
  const stages = stageViews(data);
  const details = detailRows(data);
  const history = historyRows(data);
  const s = data.service;
  const route = routeHref(s.address);
  const tone = data.is_interrupted ? "is-bad" : data.is_finished ? "is-ok" : "";
  return (
    <article className="t-card t-trk__card" aria-labelledby="t-trk-device" data-status-code={data.status_code}>
      <header className="t-trk__top">
        <div className="t-trk__dev">
          <span className="t-ico t-trk__ico">
            <DeviceGlyph icon={iconFor(data.device.category)} size={28} strokeWidth={1.8} />
          </span>
          <div>
            <span className="t-trk__ref">
              Zgłoszenie <b>{data.repair_number}</b>
            </span>
            <h2 id="t-trk-device">{[data.device.brand, data.device.name].filter(Boolean).join(" ") || data.device.category}</h2>
          </div>
        </div>
        <div className="t-trk__now">
          <span>Aktualny status</span>
          <span className={`t-trk__pill ${tone}`} data-status="">
            {data.status}
          </span>
          {onRefresh ? (
            <button type="button" className="t-linkbtn" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? "Odświeżanie…" : "Odśwież"}
            </button>
          ) : null}
        </div>
      </header>

      <ol className="t-axis" aria-label="Etapy naprawy">
        {stages.map((st, i) => (
          <li key={st.key} className={`t-axis__item is-${st.state}`} aria-current={st.state === "current" || st.state === "interrupted" ? "step" : undefined}>
            <span className="t-axis__bar" aria-hidden="true" />
            <div className="t-axis__row">
              <span className="t-axis__dot" aria-hidden="true">
                {st.state === "done" ? <IconCheck size={15} strokeWidth={3.2} /> : st.state === "interrupted" ? <IconClose size={14} strokeWidth={3.2} /> : i + 1}
              </span>
              <div className="t-axis__txt">
                <b>{st.label}</b>
                {st.meta ? <span>{st.meta}</span> : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="t-trk__grid">
        <section aria-labelledby="t-trk-det">
          <span className="t-eyebrow" id="t-trk-det">
            Szczegóły
          </span>
          <dl className="t-kv">
            {details.map((r) => (
              <div key={r.k}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
        </section>
        {history.length ? (
          <section aria-labelledby="t-trk-hist">
            <span className="t-eyebrow" id="t-trk-hist">
              Historia
            </span>
            <ol className="t-hist">
              {history.map((h, i) => (
                <li key={`${h.code}-${i}`} className={h.current ? "is-current" : ""}>
                  <span className="t-hist__dot" aria-hidden="true" />
                  <div>
                    <b>{h.label}</b>
                    {h.at ? <span>{h.at}</span> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <div className="t-trk__side">
          <section className="t-dark t-trk__service" aria-labelledby="t-trk-srv">
            <span className="t-eyebrow t-eyebrow--dark" id="t-trk-srv">
              Twój serwis
            </span>
            {s.name ? <b className="t-trk__sname">{s.name}</b> : null}
            {s.address || s.hours ? (
              <span className="t-trk__saddr">
                {s.address}
                {s.address && s.hours ? <br /> : null}
                {s.hours}
              </span>
            ) : null}
            {s.phone ? (
              <a href={telHref(s.phone)} className="t-trk__sphone" data-track="telefon_klik" data-track-miejsce="status">
                {s.phone}
              </a>
            ) : null}
            {s.email ? (
              <a href={`mailto:${s.email}`} className="t-trk__smail">
                {s.email}
              </a>
            ) : null}
            {route ? (
              <a href={route} className="t-btn t-btn--sm t-trk__route" target="_blank" rel="noopener noreferrer">
                Wyznacz trasę <IconArrowUpRight />
              </a>
            ) : null}
          </section>
          <div className="t-trk__login">
            <b>Chcesz widzieć wszystkie naprawy?</b>
            <span>W koncie klienta masz historię, wyceny i dokumenty.</span>
            <Link href={ACCOUNT_HREF}>Zaloguj się →</Link>
          </div>
        </div>
      </div>
      {s.phone ? (
        <div className="t-trk__callbar">
          <a href={telHref(s.phone)} className="t-btn t-btn--acc" data-track="telefon_klik" data-track-miejsce="status_pasek">
            Zadzwoń do serwisu
          </a>
        </div>
      ) : null}
    </article>
  );
}
