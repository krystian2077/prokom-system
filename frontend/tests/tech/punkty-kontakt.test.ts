/** TD4 PR 1: points, contact, about — data helpers, contact form logic, flags. */
import { describe, expect, it } from "vitest";
import { claims, line, servicePoints, type ServicePoint } from "@/config/prokom";
import { DATA_SAFETY_APPROVED, showFlagged } from "@/lib/tech/content-flags";
import { claim } from "@/lib/tech/claims";
import { buildInquiryPayload, type InquiryForm } from "@/lib/tech/contract";
import { inquiryOutcome, validateInquiry } from "@/lib/tech/inquiry-form";
import { hoursLong, hoursRows, inCity, isMainPoint, joinCities, pointAddress, pointPhoneDisplay, saturdayHours } from "@/lib/tech/point-format";
import { faqJsonLd, breadcrumbJsonLd } from "@/lib/tech/seo";
import { visitFaq } from "@/lib/tech/visit-faq";

const rabka = servicePoints.find((p) => p.key === "rabka")!;
const zakopane = servicePoints.find((p) => p.key === "zakopane")!;

describe("point-format", () => {
  it("hours rows and summaries come from prokom.ts", () => {
    expect(hoursRows(rabka)).toEqual([
      { days: "pn–pt", label: "Pon–Pt", value: "9:00–17:00", open: true },
      { days: "sob", label: "Sobota", value: "9:00–14:00", open: true },
      { days: "nd", label: "Niedziela", value: "zamknięte", open: false },
    ]);
    expect(hoursLong(rabka)).toBe("pn–pt 9:00–17:00 · sob 9:00–14:00");
    expect(hoursLong(zakopane)).toBe("pn–pt 10:00–16:30");
    expect(saturdayHours(rabka)).toBe("9:00–14:00");
    expect(saturdayHours(zakopane)).toBeNull();
  });
  it("address, city forms and main point", () => {
    expect(pointAddress(rabka)).toBe(`${rabka.street}, ${rabka.postal} ${rabka.city}`);
    expect(pointAddress({ ...rabka, street: null })).toBe(`${rabka.postal} ${rabka.city}`);
    expect(inCity("Rabka-Zdrój")).toBe("w Rabce-Zdroju");
    expect(inCity("Zakopane")).toBe("w Zakopanem");
    expect(joinCities([rabka])).toBe("Rabka-Zdrój");
    expect(joinCities([rabka, zakopane])).toBe("Rabka-Zdrój i Zakopane");
    expect(isMainPoint(rabka)).toBe(true);
    expect(isMainPoint(zakopane)).toBe(false);
    expect(pointPhoneDisplay(rabka)).toBe(line.phoneDisplay);
    expect(pointPhoneDisplay(zakopane)).not.toMatch(/^\+48/);
  });
});

describe("visit FAQ", () => {
  it("one point: no parking or other-point questions", () => {
    const qs = visitFaq([rabka]).map((f) => f.q);
    expect(qs[0]).toBe("Czy muszę się umawiać?");
    expect(qs.some((q) => /zaparkować|drugim/.test(q))).toBe(false);
  });
  it("two points with parking notes: both questions appear", () => {
    const pts: Pick<ServicePoint, "city" | "parkingNote">[] = [
      { city: "Rabka-Zdrój", parkingNote: "Parking przed budynkiem." },
      { city: "Zakopane", parkingNote: null },
    ];
    const faq = visitFaq(pts);
    expect(faq.map((f) => f.q)).toContain("Gdzie zaparkować w Rabce-Zdroju?");
    expect(faq.map((f) => f.q)).toContain("Czy sprzęt oddany w jednym punkcie odbiorę w drugim?");
    expect(faq.find((f) => f.q.startsWith("Gdzie"))!.a).toBe("Parking przed budynkiem.");
  });
  it("FAQPage and BreadcrumbList JSON-LD", () => {
    const f = faqJsonLd(visitFaq([rabka]));
    expect(f["@type"]).toBe("FAQPage");
    expect(f.mainEntity[0]).toMatchObject({ "@type": "Question", acceptedAnswer: { "@type": "Answer" } });
    const b = breadcrumbJsonLd([{ name: "Start", path: "/" }, { name: "Kontakt", path: "/kontakt" }]);
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(b.itemListElement[1].item).toMatch(/\/kontakt$/);
  });
});

describe("contact form (KONTRAKT §4)", () => {
  const ok: InquiryForm = { firstName: "Anna", lastName: "", phone: "", email: "anna@poczta.pl", topic: "Reklamacja", point: null, message: "Pęknięta szybka" };

  it("e-mail and message required, phone optional but checked", () => {
    expect(validateInquiry(ok, true)).toEqual({});
    const e = validateInquiry({ ...ok, email: "", message: " " }, true);
    expect(Object.keys(e).sort()).toEqual(["email", "message"]);
    expect(validateInquiry({ ...ok, email: "anna@" }, true).email).toBeTruthy();
    expect(validateInquiry({ ...ok, phone: "600 100 200" }, true)).toEqual({});
    expect(validateInquiry({ ...ok, phone: "+48 600 100 200" }, true)).toEqual({});
    expect(validateInquiry({ ...ok, phone: "12345" }, true).phone).toBeTruthy();
    expect(validateInquiry(ok, false).consent).toBeTruthy();
  });

  it("interest = topic + point", () => {
    expect(buildInquiryPayload(ok).interest).toBe("Reklamacja");
    expect(buildInquiryPayload({ ...ok, point: "zakopane" }).interest).toBe("Reklamacja · punkt: Zakopane");
    expect(Object.keys(buildInquiryPayload(ok)).sort()).toEqual(["email", "first_name", "interest", "last_name", "message", "phone"]);
  });

  it("maps responses to own Polish messages with the phone from prokom.ts", () => {
    expect(inquiryOutcome(200)).toEqual({ ok: true });
    for (const s of [400, 429, 500, "network", "timeout"] as const) {
      const out = inquiryOutcome(s);
      expect(out.ok).toBe(false);
      if (!out.ok && s !== 400) expect(out.message).toContain(line.phoneDisplay);
    }
  });
});

describe("unconfirmed numbers on 'O firmie' (SPEC §10)", () => {
  it("about claims still unconfirmed: hidden in production, framed on staging", () => {
    for (const k of ["aboutLines", "ruleParts", "ruleData", "googleProfiles"] as const) {
      expect(claims[k].confirmed).toBe(false);
      expect(claim(k, false)).toBeNull();
    }
    expect(claim("aboutLines", true)).toEqual({ text: "4 + 1", draft: true });
  });
  it("founding year 2004 confirmed on 15.11: shown in production without a frame", () => {
    expect(claim("aboutSince", false)).toEqual({ text: "2004", draft: false });
    expect(claim("sinceYear", false)).toEqual({ text: "2004", draft: false });
  });
  it("flagged content: hidden in production until accepted, draft on staging", () => {
    expect(showFlagged(false, false)).toBe(false);
    expect(showFlagged(false, true)).toBe(true);
    expect(showFlagged(true, false)).toBe(true);
  });
  it("DataSafety accepted on 15.11: shown in production", () => {
    expect(DATA_SAFETY_APPROVED).toBe(true);
    expect(showFlagged(DATA_SAFETY_APPROVED, false)).toBe(true);
  });
});
