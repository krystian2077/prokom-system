"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { countItems, enquiryPayload, itemKey, itemLabel, removeItem, setQty } from "@/lib/tech/catalog/enquiry";
import { catalog } from "@/lib/tech/catalog";
import { inquiryOutcome, validateInquiry, type InquiryErrors } from "@/lib/tech/inquiry-form";
import { API_V1 } from "@/lib/api";
import { trackEvent } from "@/lib/tech/track-event";
import { servicePoints, type PointKey } from "@/config/prokom";
import { ModelVisual } from "./ModelVisual";
import { useEnquiry } from "./useEnquiry";

const TIMEOUT_MS = 30_000;

/**
 * /zapytanie (runda 18.11 v2 §2): the list (model · colour · storage · quantity), notes, pickup point,
 * name, e-mail (required — KONTRAKT §4), phone (recommended), consent. Sent through the existing
 * contact API: interest „Sprzedaż · N pozycji · punkt: …”, message = readable list + notes.
 * No prices; after sending we answer with price and availability.
 */
export function EnquiryPage() {
  const [list, save, ready] = useEnquiry();
  // Points that take pickups: published only (SPEC §5).
  const points = servicePoints.filter((p) => p.published);
  const [form, setForm] = useState({ firstName: "", phone: "", email: "", notes: "" });
  const [point, setPoint] = useState<PointKey | null>(points[0]?.key ?? null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const n = countItems(list);
  const models = useMemo(() => new Map(catalog.models.map((m) => [m.slug, m])), []);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (status === "sending" || !list.length) return;
    const payload = enquiryPayload(list, form.notes, { firstName: form.firstName, lastName: "", phone: form.phone, email: form.email, point });
    const e = validateInquiry({ firstName: form.firstName, lastName: "", phone: form.phone, email: form.email, topic: payload.interest, point, message: payload.message }, consent);
    setErrors(e);
    setGeneral(null);
    if (Object.keys(e).length) {
      const first = ["firstName", "email", "phone", "consent"].find((k) => k in e);
      if (first) document.getElementById(`enq-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let code: number | "network" | "timeout";
    try {
      const res = await fetch(`${API_V1}/communications/inquiry/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal });
      code = res.status;
    } catch {
      code = ctrl.signal.aborted ? "timeout" : "network";
    } finally {
      window.clearTimeout(timer);
    }
    const out = inquiryOutcome(code);
    if (out.ok) {
      trackEvent("zapytanie_wyslane", { pozycje: n });
      save([]);
      setStatus("sent");
      return;
    }
    setGeneral(out.message);
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div className="t-enq__done" role="status" aria-live="polite">
        <h2 className="t-h3">Zapytanie wysłane</h2>
        <p>Dziękujemy. Odpowiemy na podany adres e-mail z ceną i dostępnością w godzinach pracy salonu.</p>
        {/* TODO(krystian): obietnica czasu odpowiedzi (np. „tego samego dnia”) — decyzja szefa; do tego czasu bez liczby. */}
        <Link href="/sprzedaz" className="t-pbtn t-pbtn--outline t-pbtn--m">
          Wróć do katalogu
        </Link>
      </div>
    );
  }

  return (
    <div className="t-enq">
      <section aria-labelledby="t-enq-list">
        <h2 id="t-enq-list" className="t-h3">
          Twoja lista {ready && n ? `(${n})` : ""}
        </h2>
        {ready && !list.length ? (
          <div className="t-enq__empty">
            <p>Lista jest pusta. Wybierz model w katalogu i kliknij „Dodaj do zapytania”.</p>
            <Link href="/sprzedaz" className="t-pbtn t-pbtn--acc t-pbtn--m">
              Przejdź do katalogu
            </Link>
          </div>
        ) : (
          <ul className="t-enq__items">
            {list.map((i) => {
              const k = itemKey(i);
              const m = models.get(i.slug);
              return (
                <li key={k} className="t-enq__item">
                  {m ? <ModelVisual model={m} color={i.color} decorative /> : <span />}
                  <span>
                    <Link href={`/sprzedaz/${i.brand}/${i.slug}`} className="t-enq__name">
                      {i.name}
                    </Link>
                    <span className="t-enq__variant">{[i.colorName, i.storageLabel].filter(Boolean).join(" · ") || "wersja do ustalenia"}</span>
                    <button type="button" className="t-enq__remove" onClick={() => save(removeItem(list, k))} aria-label={`Usuń: ${itemLabel(i)}`}>
                      Usuń
                    </button>
                  </span>
                  <span className="t-enq__qty" role="group" aria-label={`Ilość: ${itemLabel(i)}`}>
                    <button type="button" onClick={() => save(setQty(list, k, i.qty - 1))} aria-label="Mniej" disabled={i.qty <= 1}>
                      −
                    </button>
                    <output aria-live="polite">{i.qty}</output>
                    <button type="button" onClick={() => save(setQty(list, k, i.qty + 1))} aria-label="Więcej">
                      +
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form className="t-enq__form" onSubmit={onSubmit} noValidate aria-labelledby="t-enq-form">
        <h2 id="t-enq-form" className="t-h3">
          Wyślij zapytanie
        </h2>
        <p className="t-enq__variant">Bez logowania i bez płatności. Odpowiemy z ceną i dostępnością.</p>
        <fieldset className="t-enq__points">
          <legend>Odbiór w salonie</legend>
          {points.map((p) => (
            <button key={p.key} type="button" className="t-cchip t-cchip--soft" aria-pressed={point === p.key} onClick={() => setPoint(p.key)}>
              {p.name}
            </button>
          ))}
        </fieldset>
        <label className="t-enq__field">
          Imię *
          <input id="enq-firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} autoComplete="given-name" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? "enq-firstName-e" : undefined} />
          {errors.firstName ? <span id="enq-firstName-e" className="t-enq__err">{errors.firstName}</span> : null}
        </label>
        <label className="t-enq__field">
          E-mail *
          <input id="enq-email" type="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "enq-email-e" : undefined} />
          {errors.email ? <span id="enq-email-e" className="t-enq__err">{errors.email}</span> : null}
        </label>
        <label className="t-enq__field">
          Telefon (zalecany)
          <input id="enq-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "enq-phone-e" : undefined} />
          {errors.phone ? <span id="enq-phone-e" className="t-enq__err">{errors.phone}</span> : null}
        </label>
        <label className="t-enq__field">
          Uwagi
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Np. potrzebuję faktury na firmę, wolę odbiór w sobotę" />
        </label>
        <label className="t-enq__consent">
          <input id="enq-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "enq-consent-e" : undefined} />
          <span>
            Zgadzam się na kontakt w sprawie zapytania. Szczegóły w{" "}
            <Link href="/polityka-prywatnosci" data-t-inline="">
              polityce prywatności
            </Link>
            .
          </span>
        </label>
        {errors.consent ? <span id="enq-consent-e" className="t-enq__err">{errors.consent}</span> : null}
        {general ? (
          <p className="t-enq__err" role="alert">
            {general}
          </p>
        ) : null}
        <button type="submit" className="t-pbtn t-pbtn--acc" disabled={status === "sending" || !list.length}>
          {status === "sending" ? "Wysyłam…" : `Wyślij zapytanie${n ? ` (${n})` : ""}`}
        </button>
      </form>
    </div>
  );
}
