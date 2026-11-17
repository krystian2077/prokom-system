/**
 * Direction A of feat/tech-kreator-wow, kept ONLY for the /lab comparison: the prototype
 * photos (phone, laptop) with their old scenes. The wizard itself uses direction B
 * (vector illustrations, wizard-data.ts).
 */
import { LAPTOP_FAULTS, MOBILE, buildScenes as build, type Px4, type WizardDevice, deviceById } from "./wizard-data";

const PHONE_CROP: Px4 = [24, 50, 392, 486];
const LAPTOP_CROP: Px4 = [23, 86, 601, 407];
const PHONE_SCREEN: Px4 = [191, 59, 216, 468];
const LAPTOP_LID: [number, number][] = [[140, 88], [506, 116], [513, 132], [402, 476], [388, 488], [32, 402], [25, 386]];
const LAPTOP_BASE: [number, number][] = [[436, 352], [612, 381], [621, 393], [404, 489], [396, 470]];

const phone = build(PHONE_CROP, MOBILE, {
  "Pęknięty ekran": { e: "E1", r: PHONE_SCREEN, s: [318, 232], radius: 12 },
  Bateria: { e: "E2", r: [36, 226, 150, 300], s: [104, 392], radius: 10 },
  "Nie ładuje": { e: "E3", r: [244, 486, 110, 50], s: [299, 527] },
  Aparat: { e: "E4", v: "lens", r: [38, 56, 124, 132], s: [99, 121], radius: 26 },
  "Głośnik lub mikrofon": { e: "E5", r: [244, 52, 110, 46], s: [299, 61] },
  "Przyciski i obudowa": { e: "E6", r: [396, 176, 26, 96], s: [413, 222], radius: 30 },
  "Po zalaniu": { e: "E7", r: [28, 52, 390, 484], radius: 9 },
  "Nie włącza się": { e: "E8", r: PHONE_SCREEN, radius: 12 },
});
const laptop = build(LAPTOP_CROP, LAPTOP_FAULTS, {
  Matryca: { e: "E9", r: [25, 88, 490, 400], s: [300, 250], clip: LAPTOP_LID },
  Klawiatura: { e: "E12", r: [408, 392, 112, 52], s: [498, 413], radius: 10 },
  Bateria: { e: "E2", r: [396, 352, 225, 137], clip: LAPTOP_BASE },
  "Nie ładuje": { e: "E3", r: [398, 448, 100, 40], s: [426, 468] },
  "Przegrzewa się": { e: "E10", r: [30, 330, 372, 160], s: [210, 432], clip: [[44, 330], [400, 330], [402, 476], [388, 488], [32, 402], [25, 386]] },
  "Działa wolno": { e: "E11", r: [25, 88, 490, 400], clip: LAPTOP_LID },
  "Po zalaniu": { e: "E7", r: [396, 352, 225, 137], clip: LAPTOP_BASE },
  "Nie włącza się": { e: "E8", v: "body", r: [25, 88, 490, 400], clip: LAPTOP_LID },
});

export const directionA: WizardDevice[] = [
  { ...deviceById("telefon"), photo: { src: "/tech/urzadzenia/kreator-iphone.webp", width: 433, height: 577, crop: PHONE_CROP, spots: phone.spots }, scenes: phone.scenes },
  { ...deviceById("laptop"), photo: { src: "/tech/urzadzenia/laptop-bez-logo.webp", width: 640, height: 640, crop: LAPTOP_CROP, spots: laptop.spots }, scenes: laptop.scenes },
];
