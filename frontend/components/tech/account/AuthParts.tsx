"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { IconArrow, IconCheck } from "../icons";
import { GoogleMark, IconAlert, IconEye, IconEyeOff } from "./account-icons";

/** Error (role=alert) or confirmation (role=status) under a form. Text comes as is from the API. */
export function AuthAlert({ tone = "error", children }: { tone?: "error" | "ok"; children: ReactNode }) {
  const ok = tone === "ok";
  return (
    <div className={`t-ck-alert${ok ? " t-ck-alert--ok" : ""}`} role={ok ? "status" : "alert"} aria-live="polite">
      <span className="t-ck-alert__ico" aria-hidden="true">
        {ok ? <IconCheck size={16} strokeWidth={2.6} /> : <IconAlert size={17} />}
      </span>
      <span>{children}</span>
    </div>
  );
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  id: string;
  label: ReactNode;
  type?: "text" | "email" | "tel";
  hint?: ReactNode;
  /** Extra content on the label row, e.g. "Nie pamiętasz hasła?" */
  aside?: ReactNode;
};

/** Labelled text input in the Tech style. */
export function AuthField({ id, label, type = "text", hint, aside, ...input }: FieldProps) {
  return (
    <div className="t-ck-field">
      <div className="t-ck-field__row">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      <input id={id} type={type} {...input} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint ? (
        <span className="t-ck-field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/** Password input with a show/hide toggle (purely visual — the value is untouched). */
export function PasswordField({ id, label, hint, aside, ...input }: Omit<FieldProps, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <div className="t-ck-field">
      <div className="t-ck-field__row">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      <div className="t-ck-field__pw">
        <input id={id} type={shown ? "text" : "password"} {...input} aria-describedby={hint ? `${id}-hint` : undefined} />
        <button
          type="button"
          className="t-ck-field__eye"
          aria-label={shown ? "Ukryj hasło" : "Pokaż hasło"}
          aria-pressed={shown}
          aria-controls={id}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? <IconEyeOff size={19} /> : <IconEye size={19} />}
        </button>
      </div>
      {hint ? (
        <span className="t-ck-field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/** Primary submit button with the arrow from the public site. */
export function SubmitButton({ busy, busyLabel, children, type = "submit", onClick, disabled }: {
  busy: boolean;
  busyLabel: string;
  children: ReactNode;
  type?: "submit" | "button";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type={type} className="t-pbtn t-pbtn--acc t-ck-submit" disabled={busy || disabled} aria-busy={busy || undefined} onClick={onClick}>
      {busy ? (
        <>
          <span className="t-ck-spin" aria-hidden="true" />
          {busyLabel}
        </>
      ) : (
        <>
          {children}
          <IconArrow size={16} className="t-ck-submit__arrow" />
        </>
      )}
    </button>
  );
}

export function OrDivider({ children = "albo" }: { children?: ReactNode }) {
  return (
    <div className="t-ck-or" role="separator">
      <span>{children}</span>
    </div>
  );
}

export function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="t-pbtn t-pbtn--outline t-ck-google" onClick={onClick} disabled={disabled}>
      <GoogleMark size={19} />
      Kontynuuj z Google
    </button>
  );
}
