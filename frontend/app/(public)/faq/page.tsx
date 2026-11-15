import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { courierPageHref } from "@/lib/tech/courier";
import { PREP_GUIDE_HREF, PREP_GUIDE_READY, SUBMIT_HREF, TRACK_HREF } from "@/lib/tech/nav";
import { inCity, joinCities } from "@/lib/tech/point-format";
import { publishedPoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb, type FaqItem } from "@/lib/tech/seo";

const published = publishedPoints(servicePoints);
const where = published.map((p) => inCity(p.city)).join(" i ");

export const metadata = pageMetadata({
  title: "FAQ — najczęstsze pytania o serwis",
  description: `Odpowiedzi na pytania o serwis PRO-KOM Tech (${joinCities(published)}): wycena, gwarancja, status naprawy, wysyłka kurierem i folie Hammer Glass.`,
  path: "/faq",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "FAQ", path: "/faq" },
];

type Group = { id: string; title: string; items: FaqItem[]; links?: { href: string; label: string }[] };

// TODO(krystian): answers to accept (TD5 PR 2). Old FAQ promised free diagnosis, parcel
// lockers and a shop — removed (SPEC §8, §10).
function groups(): Group[] {
  const courier = courierPageHref();
  return [
    {
      id: "naprawa",
      title: "Naprawa",
      items: [
        { q: "Jakie urządzenia naprawiacie?", a: "Telefony, tablety, smartwatche, laptopy, komputery stacjonarne, drukarki i konsole do gier. Odzyskujemy też dane z dysków, pendrive’ów, kart pamięci i telefonów." },
        { q: "Czy muszę się umawiać?", a: `Nie. Możesz przyjść z urządzeniem w godzinach otwarcia ${published.length > 1 ? "punktów" : "punktu"} ${where}. Zgłoszenie online przyspiesza przyjęcie.` },
        { q: "Ile trwa naprawa?", a: "Zależy od usterki i dostępności części. Po diagnozie podajemy, ile potrwa naprawa w Twoim przypadku." },
        {
          q: "Jak przygotować sprzęt do serwisu?",
          a: "Zrób kopię zapasową danych, przygotuj kod odblokowania, zdejmij etui i wyjmij kartę SIM oraz kartę pamięci. Do laptopa dołącz ładowarkę.",
        },
      ],
      links: PREP_GUIDE_READY ? [{ href: PREP_GUIDE_HREF, label: "Jak przygotować sprzęt do serwisu" }] : undefined,
    },
    {
      id: "wycena",
      title: "Wycena i gwarancja",
      items: [
        { q: "Czy dostanę wycenę przed naprawą?", a: "Zawsze. Po diagnozie przekazujemy wycenę — naprawiamy dopiero po Twojej zgodzie." },
        { q: "Co, jeśli wycena mi nie odpowiada?", a: "Możesz zrezygnować z naprawy i odebrać sprzęt." },
        { q: "Czy dajecie gwarancję?", a: "Tak, na wykonaną usługę i na wymienione części. Szczegóły dostajesz przy odbiorze sprzętu." },
        { q: "Jakich części używacie?", a: "Rodzaj części zależy od modelu i dostępności. Przed naprawą mówimy, jaką część proponujemy." },
      ],
    },
    {
      id: "status",
      title: "Zgłoszenie i status",
      items: [
        { q: "Jak zgłosić naprawę online?", a: "Wypełnij formularz zgłoszenia: urządzenie, opis usterki, dane kontaktowe i sposób dostarczenia. Dostaniesz e-mail z numerem zgłoszenia." },
        { q: "Jak sprawdzę status naprawy?", a: "Na stronie statusu naprawy, po numerze zgłoszenia i 4 ostatnich cyfrach telefonu podanego w zgłoszeniu." },
        { q: "Czy muszę mieć konto?", a: "Nie. Konto klienta przydaje się, jeśli chcesz mieć wszystkie zgłoszenia w jednym miejscu." },
      ],
      links: [
        { href: SUBMIT_HREF, label: "Zgłoś naprawę" },
        { href: TRACK_HREF, label: "Sprawdź status naprawy" },
      ],
    },
    {
      id: "kurier",
      title: "Wysyłka kurierem",
      items: [
        { q: "Czy mogę wysłać sprzęt kurierem?", a: "Tak, na adres jednego z naszych salonów. Najlepiej najpierw zgłoś naprawę online (wybierz „Kurier”), napisz albo zadzwoń, a numer zgłoszenia włóż do paczki." },
        { q: "Czy mogę wysłać sprzęt przez paczkomat?", a: "Nie, nie obsługujemy paczkomatów. Nadaj paczkę kurierem pod adres salonu." },
      ],
      links: courier ? [{ href: courier, label: "Naprawa wysyłkowa — jak to działa" }] : undefined,
    },
    {
      id: "hammer-glass",
      title: "Hammer Glass",
      items: [
        { q: "Co to jest Hammer Glass?", a: "Folia ochronna wycinana na ploterze pod konkretny model telefonu, tabletu albo smartwatcha. Wycinamy ją i zakładamy na miejscu." },
        { q: "Czy mogę założyć folię przy odbiorze naprawy?", a: "Tak. W zgłoszeniu zaznacz, że chcesz folię, a założymy ją przy odbiorze." },
      ],
      links: [{ href: "/hammer-glass", label: "Hammer Glass — folie na wymiar" }],
    },
  ];
}

export default function FaqPage() {
  const all = groups();
  return (
    <div className="t-ui t-page t-faqpage">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(all.flatMap((g) => g.items))} />

      <section className="t-section--hero" id="faq" data-rail="FAQ">
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={CRUMBS} separator="/" />
            <h1 className="t-bhero__h1">
              Najczęstsze pytania <span>o serwis PRO-KOM Tech</span>
            </h1>
            <p className="t-bhero__lead">
              Nie ma tu Twojego pytania? Zadzwoń:{" "}
              <a href={telHref(line.phone)} data-track="telefon_klik" data-track-miejsce="faq" className="t-bhero__tel" data-t-inline="">
                {line.phoneDisplay}
              </a>
            </p>
            <nav aria-label="Tematy" className="t-faqnav">
              {all.map((g) => (
                <a key={g.id} href={`#${g.id}`}>
                  {g.title}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {all.map((g, i) => (
        <section key={g.id} className={`t-section t-section--tight${i % 2 ? " t-section--alt" : ""}`} id={g.id} data-rail={g.title}>
          <div className="t-container t-faqsplit">
            <div className="t-faqsplit__head">
              <span className="t-eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="t-h2 t-h2--sm">{g.title}</h2>
              {g.links ? (
                <ul className="t-faqpage__links">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="t-lnk t-lnk--sm">
                        {l.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Faq items={g.items} openFirst={i === 0} />
          </div>
        </section>
      ))}

      <CtaBand eyebrow="Następny krok" title="Masz zepsuty sprzęt? Zgłoś naprawę online albo zadzwoń." primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }} secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "faq_cta" }} />
    </div>
  );
}
