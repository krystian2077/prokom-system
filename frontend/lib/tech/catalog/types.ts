/**
 * Catalogue of Apple and Samsung devices sold by PRO-KOM (runda 18.11 v2, docs/zadania/runda-1811-tech-marki.md).
 * Not a shop: no prices, no cart — the customer picks a model, colour and storage, adds it to the
 * enquiry list and we answer with the price and availability (KONTRAKT §4: contact API).
 *
 * Data lives in content/katalog/*.json (option A of §1: data in the repo, static pages, no backend
 * change). Facts (specs, colours, storage, box contents) come from the manufacturer's Polish site
 * with the URL and date in `sources`; sentences are our own (§0 „Opisy — po swojemu”).
 */

export type Brand = "apple" | "samsung";
/** Kinds shown as catalogue filters: telefon · tablet · laptop · komputer · zegarek · słuchawki. */
export type Kind = "phone" | "tablet" | "laptop" | "desktop" | "watch" | "audio";

export type CatalogColor = {
  /** Stable key used in the URL (?kolor=) and the enquiry list, e.g. "blekit-lodowca". */
  key: string;
  /** Name exactly as the manufacturer's Polish site writes it. */
  name: string;
  /** Swatch colour (our approximation for the UI, not the manufacturer's value). */
  hex: string;
  /** Samsung: „tylko w Oficjalnych Sklepach Samsung” — we may not get it; the page says so. */
  officialStoreOnly?: boolean;
};

export type StorageOption = {
  key: string;
  /** "256 GB", "16 GB RAM · 512 GB SSD", "42 mm · GPS + Cellular". */
  label: string;
  ram?: string | null;
};

export type Spec = { label: string; value: string };
export type CatalogFaq = { q: string; a: string };

/** Where a fact or photo comes from — the manufacturer page and the date it was read. */
export type Source = { url: string; date: string; what: string };

export type CatalogImage = {
  /** Colour key the photo shows. */
  color: string;
  /** Path under public/ (downloaded file) — null until the file is in the repo. */
  src: string | null;
  /** Cut-out product shot (transparent background): shown free-standing with the glow, not as a tile. */
  transparent?: boolean;
  /** Flat background of an opaque photo (#rrggbb) — the tile takes it, so the photo blends in. */
  bg?: string;
  /** Original URL, who and when, and the permission (Krystian 18.11.2026: photos from manufacturers allowed). */
  source: { url: string | null; date: string; consent: string };
};

export type CatalogModel = {
  slug: string;
  brand: Brand;
  kind: Kind;
  /** Family key from families.json (salon departments: „iPhone Pro”, „Galaxy S”…). */
  family: string;
  name: string;
  /** Higher = newer; the catalogue sorts by it („najnowsze”). */
  order: number;
  isNew: boolean;
  colors: CatalogColor[];
  /** Empty for devices without options (e.g. AirPods). */
  storage: StorageOption[];
  /** „W skrócie”: 4 short facts. */
  keyFacts: string[];
  /** 10–14 rows of manufacturer facts (8+ for audio). */
  specs: Spec[];
  inBox: string[];
  /** Three paragraphs, our own words: what it is and for whom → specs in plain words → what PRO-KOM does. */
  description: string[];
  faq: CatalogFaq[];
  /** „Pasuje do”: accessory keys from accessories.json and slugs of other models. */
  compat: string[];
  /** Tags for „Dobierz w 3 pytaniach” (e.g. "size:compact", "camera:pro", "tier:pro"). */
  tags: string[];
  images: CatalogImage[];
  sources: Source[];
  /** Manufacturer page showed „Produkt niedostępny” on the reading date — ask first. */
  availabilityNote?: string | null;
};

export type Family = {
  key: string;
  brand: Brand;
  kind: Kind;
  name: string;
  /** „Dla kogo” — one sentence, our own words. */
  forWho: string;
  order: number;
};

export type Accessory = { key: string; name: string; href: string | null; note: string };

export type QuizOption = { label: string; tags: string[] };
export type QuizQuestion = { q: string; options: QuizOption[] };
/** „Dobierz w 3 pytaniach” for one salon department (brand + kind). */
export type Quiz = { brand: Brand; kind: Kind; title: string; questions: QuizQuestion[] };

export type Catalog = { models: CatalogModel[]; families: Family[]; accessories: Accessory[]; quizzes: Quiz[] };
