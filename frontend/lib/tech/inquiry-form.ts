/**
 * Contact form logic (KONTRAKT §4): front-side validation and response → message mapping.
 * The backend requires only `email` and `message` and validates no formats, so the
 * front checks e-mail and (optional) phone. Payload building lives in contract.ts.
 */
import { line } from "@/config/prokom";
import { isValidPolishPhone, type InquiryForm } from "./contract";

export type InquiryField = "firstName" | "phone" | "email" | "message" | "consent";
export type InquiryErrors = Partial<Record<InquiryField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const INQUIRY_MESSAGE_MAX = 3000;

export const INQUIRY_MSG = {
  firstName: "Podaj imię, żebyśmy wiedzieli, jak się zwracać.",
  email: "Podaj adres e-mail — na niego odpowiemy.",
  emailFormat: "Podaj poprawny adres e-mail.",
  phone: "Podaj numer telefonu: 9 cyfr, np. 600 100 200 (albo zostaw puste).",
  message: "Napisz, w czym możemy pomóc.",
  messageLong: `Wiadomość może mieć najwyżej ${INQUIRY_MESSAGE_MAX} znaków.`,
  consent: "Zaznacz zgodę, żebyśmy mogli odpowiedzieć.",
} as const;

export function validateInquiry(f: InquiryForm, consent: boolean): InquiryErrors {
  const e: InquiryErrors = {};
  if (!f.firstName.trim()) e.firstName = INQUIRY_MSG.firstName;
  const email = f.email.trim();
  if (!email) e.email = INQUIRY_MSG.email;
  else if (!EMAIL_RE.test(email)) e.email = INQUIRY_MSG.emailFormat;
  if (f.phone.trim() && !isValidPolishPhone(f.phone)) e.phone = INQUIRY_MSG.phone;
  const msg = f.message.trim();
  if (!msg) e.message = INQUIRY_MSG.message;
  else if (msg.length > INQUIRY_MESSAGE_MAX) e.message = INQUIRY_MSG.messageLong;
  if (!consent) e.consent = INQUIRY_MSG.consent;
  return e;
}

export const INQUIRY_FIELD_ORDER: InquiryField[] = ["firstName", "phone", "email", "message", "consent"];

export type InquiryOutcome = { ok: true } | { ok: false; message: string };

/**
 * Maps the backend answer to what the visitor sees. Backend texts have no Polish letters
 * ("Wiadomosc zostala wyslana."), so we show our own (KONTRAKT §4).
 */
export function inquiryOutcome(status: number | "network" | "timeout"): InquiryOutcome {
  if (status === 200 || status === 201) return { ok: true };
  if (status === 400) return { ok: false, message: "Uzupełnij adres e-mail i treść wiadomości, a potem wyślij jeszcze raz." };
  if (status === 429) return { ok: false, message: `Zbyt wiele wiadomości z tego urządzenia. Zadzwoń: ${line.phoneDisplay}.` };
  if (status === "timeout")
    return { ok: false, message: `Nie mamy potwierdzenia wysłania. Nie wysyłaj ponownie — zadzwoń: ${line.phoneDisplay}.` };
  return { ok: false, message: `Nie udało się wysłać. Zadzwoń: ${line.phoneDisplay}.` };
}
