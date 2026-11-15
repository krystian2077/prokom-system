import { describe, expect, it } from "vitest";
import { NBSP, WJ, polishText } from "./typo";

describe("polishText (Polish typesetting, przegląd wizualny)", () => {
  it("binds one-letter words to the next word", () => {
    expect(polishText("Folia wycięta pod Twój model. W około 5 minut.")).toBe(`Folia wycięta pod Twój model. W${NBSP}około 5 minut.`);
    expect(polishText("w domu i w firmie")).toBe(`w${NBSP}domu i${NBSP}w${NBSP}firmie`);
    expect(polishText("Rabka-Zdrój i Zakopane")).toBe(`Rabka-Zdrój i${NBSP}Zakopane`);
  });
  it("leaves longer words and the text itself alone", () => {
    const s = "Najpierw diagnoza i wycena.";
    expect(polishText(s).replace(/\u00a0/g, " ")).toBe(s);
    expect(polishText("Ola ma kota")).toBe("Ola ma kota");
  });
  it("keeps hyphenated names on one line only where asked (headings)", () => {
    expect(polishText("Rabka-Zdrój")).toBe("Rabka-Zdrój");
    expect(polishText("Rabka-Zdrój, PRO-KOM, USB-C", true)).toBe(`Rabka-${WJ}Zdrój, PRO-${WJ}KOM, USB-${WJ}C`);
    expect(polishText("9:00 - 17:00", true)).toBe("9:00 - 17:00");
  });
  it("keeps street abbreviations and house numbers with the street", () => {
    expect(polishText("ul. Jana Długa 8, 34-000 Miasto")).toBe(`ul.${NBSP}Jana Długa${NBSP}8, 34-000 Miasto`);
    expect(polishText("Punkt: Nowa-Wieś, ul. Polna 16B")).toBe(`Punkt: Nowa-Wieś, ul.${NBSP}Polna${NBSP}16B`);
    expect(polishText("około 5 minut")).toBe("około 5 minut");
  });
  it("is idempotent", () => {
    const once = polishText("Serwis w Rabce-Zdroju i w Zakopanem", true);
    expect(polishText(once, true)).toBe(once);
  });
});
