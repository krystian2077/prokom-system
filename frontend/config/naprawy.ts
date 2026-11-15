/**
 * Repair pages /naprawy/[slug] (docs/tech/SPEC.md §12.4).
 *
 * A page is built and listed (sitemap, links) only when `published && verified`.
 * On staging (NEXT_PUBLIC_TECH_DRAFT=1) unpublished pages render in a draft frame.
 *
 * Status 15.11.2026: the service has NOT confirmed the list yet (docs/STAN.md) — entries
 * below are the SPEC §12.4 candidates with titles only. No content, no times, no warranty:
 * TODO(krystian): pick up to 12 with the service, then TD5b PR 2 (content/tech-naprawy)
 * writes ≥ 400 words per page; flip `verified` only after your acceptance.
 */
import type { CategoryCode } from "@/lib/tech/wizard-data";

export type RepairFaq = { q: string; a: string };

export type RepairPageData = {
  slug: string;
  /** SEO title before " | PRO-KOM Tech" — city part is added from published points. */
  title: string;
  h1: string;
  /** Backend category (KONTRAKT §1.1). */
  device: CategoryCode;
  /** Fault text from wizard-data for the device (prefills /zgloszenie). */
  usterka: string;
  /** 120–155 chars, without the city part. */
  description: string;
  intro: string[];
  objawy: string[];
  przebieg: string[];
  /** Confirmed by the service, or null (section hidden). */
  czas: string | null;
  gwarancja: string | null;
  /** Repair done on site in the point (Rabka) — null = unknown, sentence hidden. */
  naMiejscu: boolean | null;
  faq: RepairFaq[];
  powiazane: string[];
  published: boolean;
  verified: boolean;
};

/** No content yet: everything empty, unpublished, unverified. */
function draft(base: Pick<RepairPageData, "slug" | "title" | "h1" | "device" | "usterka" | "powiazane">): RepairPageData {
  return { ...base, description: "", intro: [], objawy: [], przebieg: [], czas: null, gwarancja: null, naMiejscu: null, faq: [], published: false, verified: false };
}

export const repairPages: RepairPageData[] = [
  draft({ slug: "wymiana-ekranu-iphone", title: "Wymiana ekranu iPhone", h1: "Wymiana ekranu iPhone", device: "phone", usterka: "Pęknięty ekran", powiazane: ["wymiana-tylnej-szybki-iphone", "wymiana-baterii-w-telefonie"] }),
  draft({ slug: "wymiana-ekranu-samsung", title: "Wymiana ekranu Samsung", h1: "Wymiana ekranu Samsung", device: "phone", usterka: "Pęknięty ekran", powiazane: ["wymiana-baterii-w-telefonie", "naprawa-gniazda-ladowania"] }),
  draft({ slug: "wymiana-baterii-w-telefonie", title: "Wymiana baterii w telefonie", h1: "Wymiana baterii w telefonie", device: "phone", usterka: "Bateria", powiazane: ["naprawa-gniazda-ladowania", "wymiana-ekranu-iphone"] }),
  draft({ slug: "naprawa-gniazda-ladowania", title: "Naprawa gniazda ładowania telefonu", h1: "Naprawa gniazda ładowania", device: "phone", usterka: "Nie ładuje", powiazane: ["wymiana-baterii-w-telefonie", "telefon-po-zalaniu"] }),
  draft({ slug: "telefon-po-zalaniu", title: "Telefon po zalaniu — co robić", h1: "Telefon po zalaniu", device: "phone", usterka: "Po zalaniu", powiazane: ["naprawa-gniazda-ladowania", "wymiana-baterii-w-telefonie"] }),
  draft({ slug: "wymiana-tylnej-szybki-iphone", title: "Wymiana tylnej szybki iPhone", h1: "Wymiana tylnej szybki iPhone", device: "phone", usterka: "Przyciski i obudowa", powiazane: ["wymiana-ekranu-iphone"] }),
  draft({ slug: "laptop-sie-przegrzewa", title: "Laptop się przegrzewa — czyszczenie i pasta", h1: "Laptop się przegrzewa", device: "laptop", usterka: "Przegrzewa się", powiazane: ["laptop-sie-nie-wlacza", "wymiana-dysku-na-ssd"] }),
  draft({ slug: "wymiana-matrycy-w-laptopie", title: "Wymiana matrycy w laptopie", h1: "Wymiana matrycy w laptopie", device: "laptop", usterka: "Matryca", powiazane: ["wymiana-klawiatury-w-laptopie"] }),
  draft({ slug: "wymiana-klawiatury-w-laptopie", title: "Wymiana klawiatury w laptopie", h1: "Wymiana klawiatury w laptopie", device: "laptop", usterka: "Klawiatura", powiazane: ["wymiana-matrycy-w-laptopie"] }),
  draft({ slug: "laptop-sie-nie-wlacza", title: "Laptop się nie włącza — diagnoza i naprawa", h1: "Laptop się nie włącza", device: "laptop", usterka: "Nie włącza się", powiazane: ["laptop-sie-przegrzewa"] }),
  draft({ slug: "wymiana-dysku-na-ssd", title: "Wymiana dysku na SSD — przyspieszenie komputera", h1: "Wymiana dysku na SSD", device: "laptop", usterka: "Działa wolno", powiazane: ["laptop-sie-przegrzewa"] }),
  draft({ slug: "czyszczenie-konsoli-ps5-ps4", title: "Czyszczenie konsoli PS5 i PS4", h1: "Czyszczenie konsoli PS5 i PS4", device: "console", usterka: "Głośna, przegrzewa się", powiazane: [] }),
];
