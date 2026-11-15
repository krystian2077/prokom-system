"use client";

import { useRef, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import type { FieldErrors, FormField } from "@/lib/tech/contract";
import { IconCheck } from "../icons";
import { usePill } from "../usePill";

/** Small building blocks of the repair form (styles: tech-form.css). */

export const fieldId = (f: FormField) => `zgl-${f}`;

export const aria = (field: FormField, errors: FieldErrors) =>
  errors[field]?.length ? { "aria-invalid": true as const, "aria-describedby": `${fieldId(field)}-err` } : {};

/** Error under a field: slides in (tech-form.css), announced once. */
export function FieldError({ field, errors }: { field: FormField; errors: FieldErrors }) {
  const msgs = errors[field];
  if (!msgs?.length) return null;
  return (
    <span className="t-field__error" id={`${fieldId(field)}-err`} role="alert" key={msgs.join(" ")}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7.5v5.5M12 16.5h.01" />
      </svg>
      {msgs.join(" ")}
    </span>
  );
}

/** Arrow keys inside a radiogroup move focus and select (WAI-ARIA radio pattern). */
export function radioKeys(e: KeyboardEvent<HTMLElement>) {
  const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
  if (!step) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'));
  const i = items.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const next = items[(i + step + items.length) % items.length];
  next.focus();
  next.click();
}

export function Choice({ on, onClick, children, className = "" }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`t-choice${on ? " is-on" : ""} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

/** Segmented switch with a sliding pill (PREMIUM §1 "zakładki z pigułką"). */
export function Segmented<T extends string>({
  labelId,
  options,
  value,
  onChange,
  invalid,
}: {
  labelId: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  invalid?: Record<string, unknown>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  usePill(ref, '[aria-checked="true"]', [value, options.length]);
  return (
    <div
      ref={ref}
      className="t-seg"
      role="radiogroup"
      aria-labelledby={labelId}
      data-empty={value === null || !options.some((o) => o.value === value) ? "" : undefined}
      style={{ ["--seg-n" as string]: options.length }}
      onKeyDown={radioKeys}
      {...invalid}
    >
      <span className="t-seg__pill" aria-hidden="true" />
      {options.map((o) => (
        <Choice key={o.value} on={value === o.value} onClick={() => onChange(o.value)} className="t-seg__opt">
          {o.label}
        </Choice>
      ))}
    </div>
  );
}

type TextFieldProps = {
  field: FormField;
  label: ReactNode;
  value: string;
  onValue: (v: string) => void;
  onBlurField?: (f: FormField) => void;
  errors: FieldErrors;
  valid?: boolean;
  /** Under the input (outside <label>, so the input keeps its accessible name): the helper link. */
  aside?: ReactNode;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange" | "onBlur" | "className">;

/** Text input with a label, focus ring with glow, live ✓ and the error sliding in. */
export function TextField({ field, label, value, onValue, onBlurField, errors, valid, aside, className = "", type = "text", ...rest }: TextFieldProps) {
  const id = fieldId(field);
  return (
    <div className={`t-field${aside ? " t-field--help" : ""}${valid ? " is-valid" : ""} ${className}`}>
      <label className="t-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="t-input">
        <input id={id} type={type} value={value} onChange={(e) => onValue(e.target.value)} onBlur={() => onBlurField?.(field)} {...aria(field, errors)} {...rest} />
        <span className="t-input__ok" aria-hidden="true">
          <IconCheck size={14} strokeWidth={3} />
        </span>
      </div>
      <FieldError field={field} errors={errors} />
      {aside ? <div className="t-field__after">{aside}</div> : null}
    </div>
  );
}

export const DotsIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M5 12h.01M12 12h.01M19 12h.01" />
  </svg>
);
