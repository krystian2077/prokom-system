"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { company, type PointKey } from "@/config/prokom";
import { API_V1 } from "@/lib/api";
import { buildInquiryPayload, INQUIRY_TOPICS, type InquiryForm as FormState } from "@/lib/tech/contract";
import { INQUIRY_FIELD_ORDER, INQUIRY_MESSAGE_MAX, inquiryOutcome, validateInquiry, type InquiryErrors, type InquiryField } from "@/lib/tech/inquiry-form";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { trackEvent } from "@/lib/tech/track-event";

type PointOption = { key: PointKey; name: string; draft: boolean };
const TIMEOUT_MS = 30_000;

const empty = (): FormState => ({ firstName: "", lastName: "", phone: "", email: "", topic: INQUIRY_TOPICS[0], point: null, message: "" });

/**
 * Contact form (KONTRAKT §4, design #kontakt): topic and point → `interest`,
 * e-mail and message required, phone recommended. POST /communications/inquiry/.
 * Live validation: a field is checked when the visitor leaves it, then on every change;
 * a filled, valid field gets a check. The request shape is untouched (contract.ts).
 */
export function InquiryForm({ points }: { points: PointOption[] }) {
  const [f, setF] = useState<FormState>(empty);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [general, setGeneral] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<InquiryField, boolean>>>({});
  const formRef = useRef<HTMLFormElement>(null);

  /** Re-checks one field against the next state (only once it was left, or after a submit). */
  const check = (k: InquiryField, next: FormState, nextConsent = consent) => {
    setErrors((e) => ({ ...e, [k]: validateInquiry(next, nextConsent)[k] }));
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    const next = { ...f, [k]: v };
    setF(next);
    if ((k as string) in errors || touched[k as InquiryField]) check(k as InquiryField, next);
  };

  const leave = (k: InquiryField) => {
    if (k === "consent") return; // the consent box is checked on submit, not when tabbing past it
    setTouched((t) => ({ ...t, [k]: true }));
    check(k, f);
  };

  const focusFirst = (e: InquiryErrors) => {
    const first = INQUIRY_FIELD_ORDER.find((k) => e[k]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (status === "sending") return;
    const e = validateInquiry(f, consent);
    setErrors(e);
    setTouched({ firstName: true, phone: true, email: true, message: true, consent: true });
    setGeneral(null);
    if (Object.keys(e).length) {
      focusFirst(e);
      return;
    }
    setStatus("sending");
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let code: number | "network" | "timeout";
    try {
      const res = await fetch(`${API_V1}/communications/inquiry/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildInquiryPayload(f)),
        signal: ctrl.signal,
      });
      code = res.status;
    } catch {
      code = ctrl.signal.aborted ? "timeout" : "network";
    } finally {
      window.clearTimeout(timer);
    }
    const out = inquiryOutcome(code);
    if (out.ok) {
      trackEvent("kontakt_wyslany", { temat: f.topic });
      setStatus("sent");
      return;
    }
    setGeneral(out.message);
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div className="t-inq__done" role="status" aria-live="polite">
        <span className="t-inq__done-ico" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <path d="M20 6 9 17l-5-5" pathLength={1} />
          </svg>
        </span>
        <h3>Wiadomość wysłana</h3>
        <p>Dziękujemy. Odpowiemy w godzinach pracy punktów — na e-mail {f.email.trim()}{f.phone.trim() ? " albo telefonicznie" : ""}.</p>
        <div className="t-btnrow">
          <button
            type="button"
            className="t-pbtn t-pbtn--outline"
            onClick={() => {
              setF(empty());
              setConsent(false);
              setErrors({});
              setTouched({});
              setStatus("idle");
            }}
          >
            Napisz kolejną wiadomość
          </button>
          <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--acc">
            Zgłoś naprawę
          </Link>
        </div>
      </div>
    );
  }

  const err = (k: InquiryField) =>
    errors[k] ? (
      <span className="t-fld__err" id={`inq-${k}-err`}>
        {errors[k]}
      </span>
    ) : null;
  const aria = (k: InquiryField) => ({
    onBlur: () => leave(k),
    ...(errors[k] ? { "aria-invalid": true, "aria-describedby": `inq-${k}-err` } : {}),
  });
  /** Field state class: error, or a check once a touched field holds a valid value. */
  const st = (k: InquiryField, value: string) =>
    errors[k] ? " is-error" : touched[k] && value.trim() ? " is-valid" : "";

  return (
    <form ref={formRef} className="t-inq" onSubmit={onSubmit} noValidate aria-label="Formularz kontaktowy">
      <fieldset className="t-inq__group">
        <legend>Temat</legend>
        <div className="t-topics">
          {INQUIRY_TOPICS.map((t) => (
            <button key={t} type="button" className={`t-topic${f.topic === t ? " is-on" : ""}`} aria-pressed={f.topic === t} onClick={() => set("topic", t)}>
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      {points.length > 1 ? (
        <fieldset className="t-inq__group">
          <legend>Punkt</legend>
          <div className="t-topics">
            {points.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`t-topic${f.point === p.key ? " is-on" : ""}${p.draft ? " t-draft" : ""}`}
                aria-pressed={f.point === p.key}
                onClick={() => set("point", p.key)}
              >
                {p.name}
              </button>
            ))}
            <button type="button" className={`t-topic${f.point === null ? " is-on" : ""}`} aria-pressed={f.point === null} onClick={() => set("point", null)}>
              Obojętnie
            </button>
          </div>
        </fieldset>
      ) : null}
      <div className="t-inq__grid">
        <label className={`t-fld${st("firstName", f.firstName)}`}>
          <span>Imię *</span>
          <input name="firstName" type="text" autoComplete="given-name" placeholder="np. Anna" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} {...aria("firstName")} />
          {err("firstName")}
        </label>
        <label className="t-fld">
          <span>Nazwisko</span>
          <input name="lastName" type="text" autoComplete="family-name" placeholder="np. Nowak" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </label>
        <label className={`t-fld${st("phone", f.phone)}`}>
          <span>
            Telefon <em>— żebyśmy mogli oddzwonić</em>
          </span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="np. 600 100 200" value={f.phone} onChange={(e) => set("phone", e.target.value)} {...aria("phone")} />
          {err("phone")}
        </label>
        <label className={`t-fld${st("email", f.email)}`}>
          <span>E-mail *</span>
          <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="np. anna@poczta.pl" value={f.email} onChange={(e) => set("email", e.target.value)} {...aria("email")} />
          {err("email")}
        </label>
      </div>
      <label className={`t-fld t-fld--msg${st("message", f.message)}`}>
        <span>Wiadomość *</span>
        <textarea name="message" rows={4} placeholder="Model urządzenia i co się dzieje, np. iPhone 13, pęknięta szybka" value={f.message} onChange={(e) => set("message", e.target.value)} {...aria("message")} />
        <span className={`t-inq__count${f.message.trim().length > INQUIRY_MESSAGE_MAX ? " is-over" : ""}`} aria-hidden="true">
          {f.message.trim().length} / {INQUIRY_MESSAGE_MAX}
        </span>
        {err("message")}
      </label>
      <label className="t-inq__consent">
        <input name="consent" type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); check("consent", f, e.target.checked); }} {...aria("consent")} />
        <span>
          Zgadzam się na przetwarzanie danych przez {company.name} w celu odpowiedzi na zapytanie. Szczegóły w{" "}
          <Link href="/polityka-prywatnosci" data-t-inline="">polityce prywatności</Link>.
        </span>
      </label>
      {err("consent")}
      {general ? (
        <p className="t-inq__general" role="alert">
          {general}
        </p>
      ) : null}
      <div className="t-inq__submit">
        <button type="submit" className={`t-pbtn t-pbtn--acc t-inq__send${status === "sending" ? " is-sending" : ""}`} disabled={status === "sending"} aria-busy={status === "sending"}>
          {status === "sending" ? <span className="t-inq__spin" aria-hidden="true" /> : null}
          {status === "sending" ? "Wysyłanie…" : "Wyślij wiadomość"}
        </button>
        <span>Odpowiadamy w godzinach pracy serwisu</span>
      </div>
    </form>
  );
}
