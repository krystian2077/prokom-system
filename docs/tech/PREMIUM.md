# PREMIUM — jakość premium strony publicznej PRO-KOM Tech (sesja TP)

> **Uwaga:** oryginalny `docs/tech/PREMIUM.md` nie istniał w repo (szukano w całym `D:\PRO-KOM`). Ten dokument powstał w sesji TP (15.11.2026) **z treści zadania Krystiana** i zapisuje decyzje, które z niej wynikają. **Wymaga akceptacji Krystiana** — razem z wyglądem w PR-ach TP 1–4 (bez akceptacji nic z TP nie jest scalane).
> Liczb biznesowych tu nie ma. Teksty „co to zwykle znaczy” (§5) są do akceptacji — bez cen i obietnic czasu.

Kolejność ważności bez zmian (`00-INDEKS.md`): KONTRAKT > SPEC > RESPONSYWNOSC > wzorzec. PREMIUM dotyczy tylko wyglądu i ruchu strony publicznej; panele i backend nietknięte.

## 0. Zasady
- **Bez bibliotek animacji** (bez framer-motion, GSAP — framer-motion jest w `package.json` dla starych stron/paneli, nowy kod go nie importuje). Ruch = CSS + Web Animations API + `lib/tech/motion.ts`.
- **Izolacja:** style w `app/(public)/tech*.css` (`tech.css` + warstwy TP: `tech-theme.css`, `tech-motion.css`, `tech-nav.css`, `tech-wizard.css`), każdy selektor pod `.tech`; test `tests/tech/fundament.test.ts` sprawdza wszystkie pliki `tech*.css`. Warstwy TP są osobnymi plikami także po to, żeby nie kolidować z równoległymi sesjami w `tech.css`.
- **Ruch nie może ukrywać treści bez JS:** ukrywanie przed „reveal” działa tylko pod `.tech.t-motion` (klasę daje JS).
- **Reduced motion = stan końcowy** (plakat), bez pętli. Flaga `data-tech-reduced` na `<html>` wymusza to samo (do `/lab` i testów).
- **LCP nie czeka na animację:** h1 i zdjęcia w hero nigdy nie startują z `opacity: 0`.
- Pętle maks. **3 cykle**, pauza poza ekranem (`onVisible`) i przy ukrytej karcie.

## 1. Tokeny ruchu (`tech-motion.css`, lustrzane w `lib/tech/motion.ts`)
| Token | Wartość | Do czego |
|---|---|---|
| `--m-micro` | 120 ms | wciśnięcie przycisku, kolor przy hover |
| `--m-small` | 200 ms | chipsy, przełączniki, crossfade zastępczy |
| `--m-panel` | 320 ms | mega menu, arkusz, FAQ, pigułka |
| `--m-scene` | 520 ms | „kamera” kreatora, przejście motywu, rysowanie ✓ |
| `--m-reveal` | 700 ms | wejście sekcji przy przewijaniu |
| `--m-ease-out` | `cubic-bezier(.2,.7,.2,1)` | domyślna (jak `--t-ease` z TD1) |
| `--m-ease-in-out` | `cubic-bezier(.65,0,.35,1)` | koło motywu, przejazdy |
| `--m-ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | wyrastanie mega menu, aktywny punkt, pigułka |
| `--m-ease-emph` | `cubic-bezier(.16,1,.3,1)` | wejścia, FAQ |
| `--m-stagger` | 40 ms, maks. 8 elementów | listy, mega menu, arkusz |

Wzorce: `[data-t-reveal]` (+ `data-t-stagger` na rodzicu), wciśnięcie `scale(.97)`, karta z dwuwarstwowym cieniem, FAQ przez `grid-template-rows` (natywny `<details>` bez JS), zakładki z pigułką (`usePill` + `.t-pilltabs__pill`), oś statusu rysowana (pasek `scaleX`, ✓ przez `stroke-dashoffset`), marquee z pauzą (hover, fokus, poza ekranem), szkielety z połyskiem, View Transitions między stronami (postępowe ulepszenie, tylko trasy publiczne).

## 2. Motywy
**Ciemny — drabina powierzchni** (`tech-theme.css`):
| Poziom | Token | Kolor |
|---|---|---|
| 0 tło | `--bg` | `#0e0a09` |
| 1 pas sekcji | `--bg2` | `#15100f` |
| 2 karta | `--card` | `#1c1615` |
| 3 wyniesione (mega menu, pigułki) | `--raised` | `#241c1b` |
| 4 szkło (kapsuła, TabBar, arkusz) | `--overlay` | `rgba(34,26,25,.72)` + blur 18 px; bez `backdrop-filter` → `--overlay-solid #221a19` |

- Włoskowe krawędzie `--hair` `rgba(255,255,255,.07)` + górne światło `inset 0 1px 0 --hair-top`.
- Krawędź gradientowa kart wyróżnionych (`.t-edge`, kreator, karta kontaktu w FAQ): `--edge`.
- Ziarno: jeden plik `public/tech/grain.svg` (feTurbulence), stałe, krycie 4,5% tylko w ciemnym.
- Tekst: `--ink #f6f1f0`, `--ink2 #c2b6b3`, `--ink3 #a39592`. Kontrast (sprawdzony skryptem): `--ink3` na `--raised` 5,78:1, `--ink2` na `--raised` 8,46:1, `--acct` na `--card` 7,8:1 — wszystkie ≥ 4,5:1.
- Mapy i ilustracje: ciemne warianty na drabinie (`t-map`, scena kreatora), autofill i pola formularzy w motywie, `::selection`, `scrollbar-color`, `color-scheme` (także na `<html>`, zdejmowane po wyjściu ze strony publicznej).

**Jasny:** cienie dwuwarstwowe `--sh-1/2/3` (kontaktowy + rozproszony), `--ink3 #5f665f` (4,72:1 na `--bg`).

**Przełączanie:** View Transition — koło z miejsca przełącznika (`switchTechTheme`, reguły `::view-transition` wstrzykiwane na czas przełączenia, bo nie da się ich zawęzić do `.tech`), bez wsparcia → crossfade 200 ms, klasa `.t-theme-switching` wycisza przejścia komponentów, `<meta name="theme-color">` jasny `#f4f5f1` / ciemny `#0e0a09`.

## 3. Nawigacja (PR 2)
- **Kapsuła ≥ 1024:** przyklejona; po przewinięciu > 24 px zwęża się przez `transform` (bez zmiany układu), pigułka pod aktywną pozycją.
- **Mega menu „Naprawy” i „Punkty serwisowe”:** intencja hover 80 ms, zamknięcie 250 ms, bezpieczny trójkąt (kursor w trójkącie od punktu wyjścia do krawędzi panelu nie zmienia panelu), wyrastanie z kapsuły (`scale` od góry, `--m-ease-spring`), stagger 40 ms, przełączanie paneli bez zamykania (jeden kontener, zmiana treści i wysokości), przyciemnione i rozmyte tło pod spodem.
  - Naprawy: urządzenia z 3 najczęstszymi usterkami (z `wizard-data.ts`), karta „Zgłoś naprawę online”.
  - Punkty: tylko `published` (Zakopane do czasu publikacji nie), `OpeningStatus`, Nawiguj, Zadzwoń, mini mapa.
  - Klawiatura: Enter/Spacja/↓ otwiera i przenosi fokus do panelu, ←/→ między pozycjami menu (otwarte menu przechodzi na sąsiada), ↑/↓ w panelu, Tab wychodzi naturalnie, Esc zamyka i wraca fokusem do przycisku. Bez JS: przyciski są linkami do `/uslugi` i `/punkty-serwisowe` (`<noscript>` nie potrzebny).
- **Telefon / tablet pionowo:** TabBar ze szkłem i pigułką, wyniesiony „Zgłoś”; arkusz Menu z efektem karty iOS (treść strony pomniejszona do 0,94 i zaokrąglona), przeciąganie w dół (zamyka > 110 px albo szybki ruch), stagger pozycji, segmentowany przełącznik motywu z pigułką, focus trap, blokada przewijania bez skoku (kompensacja paska przewijania).

## 4. Kreator „Co się zepsuło?” (PR 3) — rodziny efektów E1–E17
Efekt = komponent SVG w układzie % kadru, przycięty maską regionu, z wejściem, pętlą (maks. 3 cykle) i stanem „plakat” (statyczna klatka: reduced motion, `/lab`, poza ekranem). Kolory z tokenów (jasny/ciemny). Ładowane leniwie per rodzina (`next/dynamic`).

| Rodzina | Nazwa | Co widać |
|---|---|---|
| E1 | Pęknięcie | rysujące się pęknięcia od punktu uderzenia, odblask na odłamkach |
| E2 | Bateria | wskaźnik baterii spada do czerwieni, kontur puchnie |
| E3 | Ładowanie | wtyk i błyskawica, która gaśnie (prąd nie dochodzi) |
| E4 | Optyka | obiektyw/skaner: rozmycie, ostrość „pływa” albo pasek światła się zacina |
| E5 | Dźwięk | fale dźwięku, które się rwą, przekreślony głośnik |
| E6 | Przyciski i obudowa | wciśnięcie bez reakcji, rysa na krawędzi |
| E7 | Zalanie | krople spływają, poziom cieczy rośnie, zmętnienie |
| E8 | Zasilanie | ekran gaśnie, symbol zasilania mruga i nie startuje |
| E9 | Obraz | migotanie, kolorowe pasy, komunikat „brak sygnału” |
| E10 | Temperatura | fale ciepła, czerwona poświata, wirujący wentylator |
| E11 | Wydajność | wskaźnik/pasek postępu, który stoi |
| E12 | Klawiatura | klawisze wciskają się nierówno, jeden nie wraca |
| E13 | Dane | dysk/płyta/pliki: płyta się kręci i staje, pliki odpływają, odzysk |
| E14 | System i błędy | okno błędu, „robaki”, znak zapytania (Inny problem) |
| E15 | Druk i papier | kartka się gniecie (zacięcie), pasy, pusta kartka, krople tuszu |
| E16 | Łączność i porty | łuki Wi-Fi gasną, port USB/jack iskrzy |
| E17 | Sterowanie | gałka pada dryfuje sama, punkt celownika ucieka |

### Tabela urządzenie × usterka → efekt
„Punkt” = usterka miejscowa z punktem na zdjęciu (spot) i przejazdem kamery; „cały” = efekt na całe urządzenie / cały ekran, bez punktu (wybór z listy). Współrzędne i regiony w `frontend/lib/tech/wizard-data.ts` (`scenes`).

| Urządzenie | Usterka | Efekt | Zakres | Region |
|---|---|---|---|---|
| Telefon | Pęknięty ekran | E1 | punkt | ekran |
| Telefon | Bateria | E2 | punkt | tył, środek |
| Telefon | Nie ładuje | E3 | punkt | złącze na dole |
| Telefon | Aparat | E4 | punkt | wyspa aparatów |
| Telefon | Głośnik lub mikrofon | E5 | punkt | głośnik rozmów |
| Telefon | Przyciski i obudowa | E6 | punkt | bok, przyciski |
| Telefon | Po zalaniu | E7 | cały | całe urządzenie |
| Telefon | Nie włącza się | E8 | cały | ekran |
| Tablet | Pęknięty ekran | E1 | punkt | ekran |
| Tablet | Bateria | E2 | punkt | tył |
| Tablet | Nie ładuje | E3 | punkt | złącze na dole |
| Tablet | Aparat | E4 | punkt | aparat |
| Tablet | Głośnik lub mikrofon | E5 | punkt | górna krawędź, głośnik |
| Tablet | Przyciski i obudowa | E6 | punkt | górna krawędź, przycisk |
| Tablet | Po zalaniu | E7 | cały | całe urządzenie |
| Tablet | Nie włącza się | E8 | cały | ekran |
| Smartwatch | Pęknięte szkło | E1 | punkt | tarcza |
| Smartwatch | Bateria | E2 | cały | koperta |
| Smartwatch | Nie ładuje | E3 | punkt | spód koperty (ładowarka) |
| Smartwatch | Przyciski i obudowa | E6 | punkt | koronka |
| Smartwatch | Po zalaniu | E7 | cały | całe urządzenie |
| Smartwatch | Nie włącza się | E8 | cały | tarcza |
| Laptop | Matryca | E9 | punkt | pokrywa/matryca |
| Laptop | Klawiatura | E12 | punkt | klawiatura |
| Laptop | Bateria | E2 | cały | podstawa |
| Laptop | Nie ładuje | E3 | punkt | porty z boku |
| Laptop | Przegrzewa się | E10 | punkt | dół pokrywy, wylot |
| Laptop | Działa wolno | E11 | cały | całe urządzenie |
| Laptop | Po zalaniu | E7 | cały | podstawa z klawiaturą |
| Laptop | Nie włącza się | E8 | cały | pokrywa |
| Komputer | Nie włącza się | E8 | punkt | przycisk zasilania |
| Komputer | Działa wolno | E11 | cały | obudowa |
| Komputer | Głośno pracuje, grzeje się | E10 | punkt | kratka wentylacyjna |
| Komputer | System i wirusy | E14 | cały | obudowa |
| Komputer | Dysk i dane | E13 | punkt | zatoka napędu |
| Komputer | Brak obrazu | E9 | cały | obudowa (dymek „brak sygnału”) |
| Komputer | Porty USB i audio | E16 | punkt | panel portów |
| Komputer | Rozbudowa | E11 | cały | obudowa (wskaźnik rośnie) |
| Drukarka | Nie drukuje | E15 | cały | wylot papieru (pusta kartka) |
| Drukarka | Paski na wydruku | E15 | cały | wylot papieru (pasy) |
| Drukarka | Zacina papier | E15 | punkt | wylot papieru (zgnieciona kartka) |
| Drukarka | Tusz i głowica | E15 | punkt | zbiorniki tuszu |
| Drukarka | Skaner | E4 | punkt | pokrywa skanera (pasek światła) |
| Drukarka | Brak Wi-Fi | E16 | cały | górna część |
| Drukarka | Błąd na panelu | E14 | punkt | panel sterowania |
| Drukarka | Nie włącza się | E8 | cały | całe urządzenie |
| Konsola | Brak obrazu (HDMI) | E9 | cały | konsola (dymek „brak sygnału”) |
| Konsola | Nie czyta płyt | E13 | punkt | napęd (płyta) |
| Konsola | Głośna, przegrzewa się | E10 | punkt | dół obudowy |
| Konsola | Nie włącza się | E8 | cały | konsola |
| Konsola | Dryf w padzie | E17 | punkt | lewa gałka pada |
| Konsola | Pad nie ładuje | E3 | punkt | złącze pada |
| Konsola | Błąd systemu | E14 | cały | konsola |
| Konsola | Po zalaniu | E7 | cały | pad |
| Odzysk danych | Z telefonu | E13 | punkt | ikona telefonu |
| Odzysk danych | Z dysku HDD lub SSD | E13 | punkt | ikona dysku |
| Odzysk danych | Z pendrive’a lub karty | E13 | punkt | ikona pendrive’a i karty |
| Odzysk danych | Usunięte pliki | E13 | punkt | folder (pliki odpływają) |
| Odzysk danych | Sprzęt po zalaniu | E7 | cały | cała kompozycja |
| Odzysk danych | Sprzęt nie włącza się | E8 | cały | cała kompozycja |
| Inne | Nie włącza się | E8 | punkt | przycisk zasilania |
| Inne | Nie ładuje | E3 | punkt | wtyczka |
| Inne | Brak obrazu | E9 | punkt | ekran |
| Inne | Brak dźwięku | E5 | punkt | głośnik |
| Inne | Po zalaniu | E7 | cały | cała kompozycja |
| Inne | Inny problem | E14 | cały | cała kompozycja (znak zapytania) |

Smartwatch: zdjęcia z prawem do użycia nie ma → ilustracja SVG w stylu sceny (`components/tech/wizard/art/WatchArt.tsx`). Odzysk danych i Inne: kompozycje ikon w stylu sceny (`DataArt`, `OtherArt`).

### Scena
- Gradient i cień kontaktowy; punkty 44 px celu (widoczne 30 px), bez pierścieni-duchów: jeden puls po kolei przy pierwszym wejściu sceny w widok.
- Aktywny punkt sprężysty z rysowanym ✓; etykieta po zewnętrznej stronie regionu z linią łączącą (nad albo pod regionem, nigdy na nim); telefon: karta etykiety pod zdjęciem.
- Przejazd „kamery” do `focus` (`scale(1.12)`, `transform-origin` w punkcie), pozostałe punkty przygaszone; „Pokaż całe urządzenie” i Esc wracają.
- Lista ↔ zdjęcie dwukierunkowo (hover na chipsie podświetla punkt i pokazuje podgląd efektu), zmiana urządzenia z crossfade i pigułką, podsumowanie z „wskakującymi” wartościami.
- Telefon i tablet: pełny ekran, chipsy, karta etykiety, przeciągnięcie w bok zmienia urządzenie, przyklejone „Dalej”. Dostępność: `radiogroup` (urządzenia, usterki), `aria-live` z opisem usterki, punkty jako przyciski.
- Wydajność: JS kreatora ≤ 45 kB gz (efekty osobno, leniwie), preload zdjęcia przy hover chipsa urządzenia, brak zadań > 50 ms przy CPU 4× (`scripts/tech/wydajnosc.mjs --wizard`).

## 5. Teksty „co to zwykle znaczy” — do akceptacji
Pełna lista w `frontend/lib/tech/wizard-data.ts` (`FAULT_MEANING`) i w opisie PR 3. Zasady: jedno zdanie, prostym językiem, bez cen, bez czasu naprawy, bez obietnic („naprawimy na pewno”), zawsze kończy się tym, że diagnoza i wycena są przed naprawą tylko wtedy, gdy to naturalne.

## 6. `/lab` (PR 4)
`/lab`, `/lab/kreator` (siatka wszystkich par jako plakaty + „odtwórz”, przełącznik motywu i szerokości), `/lab/menu`, `/lab/ruch` — tylko przy `NEXT_PUBLIC_TECH_DRAFT=1`; `noindex`, poza sitemap, na produkcji 404 (test). Zrzuty: `node scripts/tech/zrzuty.mjs --lab`; nagrania: `node scripts/tech/nagrania.mjs` → `tmp/nagrania/*.webm`.
