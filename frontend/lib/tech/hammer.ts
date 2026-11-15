/**
 * Hammer Glass data (design T.HammerGlass, docs/tech/SPEC.md §6). Film names and features
 * come verbatim from the prototype; numbers (models, precision, minutes) go through
 * `claim()` because they are unconfirmed (SPEC §10).
 */
export type FilmLayer = "clear" | "matte" | "uv" | "priv";
export type Film = { n: string; tier: string; d: string; tags: string[]; layer: FilmLayer; fin: string; star?: boolean };

export const FILMS: Film[] = [
  { n: "Active Shield", tier: "Entry", d: "Przezroczysta folia na co dzień.", tags: ["0,18 mm", "samoregeneracja"], layer: "clear", fin: "przezroczyste" },
  { n: "Active Shield Matte", tier: "Entry", d: "Matowa wersja Active Shield.", tags: ["0,15 mm", "samoregeneracja"], layer: "matte", fin: "matowe" },
  { n: "Cristal Shield", tier: "Medium", d: "Przezroczysta, cienka, nie zmienia obrazu.", tags: ["0,15 mm", "przezroczysta"], layer: "clear", fin: "przezroczyste" },
  { n: "Matte Finish", tier: "Medium", d: "Powłoka antyrefleksyjna. Mniej odbić w słońcu.", tags: ["0,16 mm", "antyrefleksyjna"], layer: "matte", fin: "matowe" },
  { n: "Cristal UV Shield", tier: "Medium", d: "Przezroczysta folia z ochroną UV.", tags: ["ochrona UV"], layer: "uv", fin: "przezroczyste" },
  { n: "Prime Protector Clear", tier: "Premium", d: "Najwyższa linia. Powłoka antymikrobowa.", tags: ["antymikrobowa", "samoregeneracja"], layer: "clear", fin: "przezroczyste", star: true },
  { n: "Private View", tier: "Special", d: "Filtr prywatności. Z boku ekran jest ciemny.", tags: ["prywatność"], layer: "priv", fin: "filtr prywatności" },
  { n: "Tablet Armour", tier: "Special", d: "Folia w formacie na tablety.", tags: ["tablet"], layer: "clear", fin: "przezroczyste" },
  { n: "Watch Armour", tier: "Special", d: "Folia na smartwatche, wodoodporna.", tags: ["smartwatch", "wodoodporna"], layer: "clear", fin: "przezroczyste" },
];

const LAYERS: Record<FilmLayer, string> = {
  clear: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.34) 44%, rgba(255,255,255,0) 58%)",
  matte: "rgba(214,208,204,0.3)",
  uv: "linear-gradient(115deg, rgba(150,112,238,0.28) 0%, rgba(255,255,255,0.3) 46%, rgba(150,112,238,0.2) 100%)",
  priv: "linear-gradient(90deg, rgba(8,6,5,0.94) 0%, rgba(8,6,5,0.2) 34%, rgba(8,6,5,0) 50%, rgba(8,6,5,0.2) 66%, rgba(8,6,5,0.94) 100%)",
};

export function filmLayer(layer: FilmLayer): string {
  return LAYERS[layer];
}

/** One video file in the build (SPEC §9); loaded only after a click, poster first. */
export const PLOTER_VIDEO = { src: "/tech/hammer/ploter.mp4", poster: "/tech/hammer/hg-ploter.webp", width: 1671, height: 922 };
