/**
 * Enquiry list („lista zapytania”, runda 18.11 v2 §2 /zapytanie): model · colour · storage · quantity,
 * kept in localStorage, sent through the EXISTING contact API (KONTRAKT §4) — interest + message, no
 * backend change. No prices anywhere: we answer with price and availability.
 */
import type { PointKey } from "@/config/prokom";
import { buildInquiryPayload, type InquiryPayload } from "../contract";
import { INQUIRY_MESSAGE_MAX } from "../inquiry-form";
import type { CatalogModel } from "./types";

export const ENQUIRY_KEY = "pk-tech-zapytanie";
export const ENQUIRY_EVENT = "pk-tech-zapytanie";
export const QTY_MAX = 10;
export const ITEMS_MAX = 20;

export type EnquiryItem = { brand: string; slug: string; name: string; color: string | null; colorName: string | null; storage: string | null; storageLabel: string | null; qty: number };

/** Same model in the same colour and storage = one line (its quantity grows). */
export function itemKey(i: Pick<EnquiryItem, "slug" | "color" | "storage">): string {
  return `${i.slug}|${i.color ?? ""}|${i.storage ?? ""}`;
}

export function makeItem(m: CatalogModel, color: string | null, storage: string | null, qty = 1): EnquiryItem {
  const c = m.colors.find((x) => x.key === color) ?? null;
  const s = m.storage.find((x) => x.key === storage) ?? null;
  return { brand: m.brand, slug: m.slug, name: m.name, color: c?.key ?? null, colorName: c?.name ?? null, storage: s?.key ?? null, storageLabel: s?.label ?? null, qty: clampQty(qty) };
}

export function clampQty(n: number): number {
  return Math.max(1, Math.min(QTY_MAX, Math.round(Number.isFinite(n) ? n : 1)));
}

export function addItem(list: EnquiryItem[], item: EnquiryItem): EnquiryItem[] {
  const k = itemKey(item);
  const found = list.find((i) => itemKey(i) === k);
  if (found) return list.map((i) => (itemKey(i) === k ? { ...i, qty: clampQty(i.qty + item.qty) } : i));
  return [...list, item].slice(-ITEMS_MAX);
}

export function removeItem(list: EnquiryItem[], key: string): EnquiryItem[] {
  return list.filter((i) => itemKey(i) !== key);
}

export function setQty(list: EnquiryItem[], key: string, qty: number): EnquiryItem[] {
  return list.map((i) => (itemKey(i) === key ? { ...i, qty: clampQty(qty) } : i));
}

export function countItems(list: EnquiryItem[]): number {
  return list.reduce((n, i) => n + i.qty, 0);
}

/** "iPhone 18 Pro · Błękit lodowca · 256 GB" */
export function itemLabel(i: EnquiryItem): string {
  return [i.name, i.colorName, i.storageLabel].filter(Boolean).join(" · ");
}

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}

/** interest = "Sprzedaż · 3 pozycje" (+ " · punkt: Rabka-Zdrój" added by buildInquiryPayload). */
export function enquiryTopic(list: EnquiryItem[]): string {
  const n = countItems(list);
  return `Sprzedaż · ${n} ${plural(n, "pozycja", "pozycje", "pozycji")}`;
}

/** Readable list for the e-mail the service gets, with notes; trimmed to the contact API limit. */
export function enquiryMessage(list: EnquiryItem[], notes: string): string {
  const lines = list.map((i, n) => `${n + 1}. ${itemLabel(i)} — ${i.qty} szt.`);
  const parts = ["Zapytanie o cenę i dostępność:", ...lines];
  if (notes.trim()) parts.push("", `Uwagi: ${notes.trim()}`);
  const msg = parts.join("\n");
  return msg.length > INQUIRY_MESSAGE_MAX ? `${msg.slice(0, INQUIRY_MESSAGE_MAX - 1)}…` : msg;
}

export type EnquiryContact = { firstName: string; lastName: string; phone: string; email: string; point: PointKey | null };

export function enquiryPayload(list: EnquiryItem[], notes: string, c: EnquiryContact): InquiryPayload {
  return buildInquiryPayload({ ...c, topic: enquiryTopic(list), message: enquiryMessage(list, notes) });
}

/* ---------- storage (browser) ---------- */

function isItem(x: unknown): x is EnquiryItem {
  const i = x as EnquiryItem;
  return !!i && typeof i.slug === "string" && typeof i.name === "string" && typeof i.qty === "number";
}

export function readEnquiry(): EnquiryItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(ENQUIRY_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(isItem).map((i) => ({ ...i, qty: clampQty(i.qty) })).slice(-ITEMS_MAX) : [];
  } catch {
    return [];
  }
}

export function writeEnquiry(list: EnquiryItem[]): void {
  try {
    if (list.length) localStorage.setItem(ENQUIRY_KEY, JSON.stringify(list));
    else localStorage.removeItem(ENQUIRY_KEY);
  } catch {
    // private mode: the list lasts until the page closes
  }
  try {
    window.dispatchEvent(new CustomEvent(ENQUIRY_EVENT, { detail: list }));
  } catch {
    /* no window */
  }
}
