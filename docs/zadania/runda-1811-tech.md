# Runda 18.11.2026 — PRO-KOM Tech (prokomserwis.pl): przyklejona kapsuła, telefony punktów, motyw, pasek linii, ALSEN

Przygotowane w czacie projektu „PRO-KOM Cyfryzacja” 18.11.2026 (wieczór). Plan całej rundy (wszystkie linie): `prokom-web/docs/zadania/runda-1811.md`. Wspólny kontrakt motywu, paska linii i szyny: `docs/tech/MOTYW-PASEK-LINII.md` (kopia z prokom-web — przy różnicy wygrywa prokom-web).

**Zamrożenie:** do przełączenia produkcji 29.11 nic z `develop` nie idzie do `master` (STAN). Ta sesja pracuje na `develop` przez PR-y; wydanie po 29.11 i akceptacji szefa.

## 1. Zakres (decyzje szefa 18.11 + Krystian)

### 1.1. Kapsuła przyklejona przy przewijaniu (D13) — błąd

- **Diagnoza (czat, odczyt kodu 18.11):** `.t-capwrap` ma `position: sticky; top: 0` (`app/(public)/tech-nav.css`, ≥ 1024 px), ale siedzi **w środku `.t-header`** (`components/tech/TechShell.tsx`: `NoticeBar` + `BrandBar` + `Capsule`), a `.t-header` ma `position: relative` i wysokość równą swojej treści (`app/(public)/tech.css`). Element sticky „przykleja się” tylko w obrębie rodzica, więc gdy `.t-header` wyjeżdża z ekranu, kapsuła wyjeżdża razem z nim. Na innych liniach kapsuła jest przyklejona względem całej strony.
- **Naprawa (do wyboru w sesji, rekomendacja pierwsza):** (a) `.t-header` staje się sticky z `top: calc(-1 * (wysokość paska powiadomień + paska linii))` — pasek linii i powiadomienie przewijają się w górę, kapsuła zostaje (bez zmiany DOM); (b) `Capsule` wyjęta z `.t-header` jako bezpośrednie dziecko `.t-shell` przed `<main>`. Wysokości paska linii i powiadomienia — z tokenów/zmiennych CSS (powiadomienie bywa puste).
- Zachowanie jak w prokom-web: przyklejona, zwęża się po przewinięciu (`is-compact` już jest), chowa przy przewijaniu w dół i wraca przy przewijaniu w górę (`is-hidden` już jest — sprawdzić, że działa po zmianie), mega menu i ciemna warstwa pod nim bez zmian. `scroll-margin-top` kotwic dopasować.
- Test e2e: przewinięcie 1500 px na `/` 1440 px → kapsuła w widoku (`boundingBox().y` ≤ 16), po przewinięciu w dół chowa się, w górę wraca; to samo na podstronie.

### 1.2. Telefony i e-maile punktów (D5)

Zadanie szefa (Asana 18.11): „powinny być osobne na punkty, a ten duży nazwać ogólnym… Po naciśnięciu Rabki czy Zakopanego powinien wyświetlać się tylko kontakt do Rabki i tylko do Zakopanego, a nie do obydwu lokalizacji, bo do obydwu jest już po naciśnięciu Kontakt”. Także: „brak e-maili do punktu Zakopanego i Rabki, jest tylko ogólny”.

- `config/prokom.ts`: punkt Rabka dostaje **własny numer `+48 18 541 20 55`** (ten sam, który pro-kom.eu pokazuje jako „serwis PRO-KOM Tech Rabka” — `TODO(krystian)`: potwierdzenie szefa), Zakopane zostaje `+48 18 541 20 15`. `ServicePoint` dostaje pole `email: string | null` (null = brak, nie e-mail linii): `rabka@prokomserwis.pl`, `zakopane@prokomserwis.pl` — **`TODO(krystian)`**: decyzja szefa, alias do `kontakt@` czy osobna skrzynka (do tego czasu `null` i pokazujemy `kontakt@` jako „E-mail ogólny”). Skrzynki/aliasy zakłada Krystian w DirectAdmin SH 1 **przed** pokazaniem adresu na stronie.
- `line.phone` (883 200 151) = **numer ogólny** z etykietą **„Infolinia”** (`TODO(krystian)`: nazwa od szefa — stała `GENERAL_PHONE_LABEL` w jednym miejscu).
- **Reguła wyświetlania:**
  - Miejsce dotyczące jednego punktu (strona lokalna `/serwis-telefonow-rabka-zdroj` i `-zakopane`, karta punktu, mega menu „Punkty serwisowe” — pozycja punktu, kreator „Gdzie oddać” po wyborze punktu, pasek punktów w hero po wyborze) → **tylko telefon i e-mail tego punktu**. Dziś `LocalServicePage` (ok. wiersz 76) pokazuje `line.phone` — zmienić na `pointPhone(p)`; `pointPhone` przestaje mieć zastępstwo „null = line.phone” tam, gdzie punkt ma swój numer.
  - Miejsca ogólne (pasek linii „Serwis: …”, stopka, CTA, FAQ, menu telefonu) → **Infolinia 883 200 151** z etykietą.
  - `/kontakt` i `/punkty-serwisowe` → oba punkty, każdy ze swoim telefonem i e-mailem, plus Infolinia jako „ogólny”.
- JSON-LD: `LocalBusiness`/`department` per punkt z `telephone` punktu.
- Testy: `points.test.ts` (numer/e-mail punktu, brak zastępstwa), `tresc.spec`/`punkty-kontakt.spec` (strona Rabki nie zawiera numeru Zakopanego i odwrotnie).

### 1.3. Motyw: przycisk z napisem, koło, Auto w nocy, wybór między liniami, szyna (D7–D10)

Wg `docs/tech/MOTYW-PASEK-LINII.md` §1–§3, §6. W Tech:

- `components/tech/ThemeToggle.tsx` → przycisk z napisem „Ciemny motyw” / „Jasny motyw” (obie etykiety w HTML, wybór przez CSS z `data-tech-theme`), stała szerokość, skrót „Ciemny”/„Jasny” w 1024–1359 px, bez `aria-pressed`, komunikat `aria-live`. `ThemeSegmented` w arkuszu menu zostaje (podpis „Motyw strony” + opis Auto).
- Koło (`switchTechTheme`) — czas 600 ms i ruch ikony/napisu wg §1.5 kontraktu.
- `lib/tech/theme.ts` → reguła Auto §2.1 (bez wyboru: system ciemny → ciemny; **noc w Rabce → ciemny**; inaczej jasny), tablica 24 wartości wschodu/zachodu — **ta sama co w prokom-web** (`src/lib/shared/daylight.generated.ts` — skopiować plik wynikowy i test zgodności; źródło prawdy w prokom-web), ponowne sprawdzenie przy `visibilitychange`.
- Odbiór `?motyw=jasny|ciemny|auto` w `themeScript` + czyszczenie adresu po hydratacji (natywne `history.replaceState`, Next 14.2 — sprawdzić w dokumentacji zainstalowanej wersji, czy App Router synchronizuje natywne History API; jeśli nie — `router.replace` z `scroll: false` tylko gdy parametr był w adresie).
- Wysyłanie wyboru: globalny nasłuch kliknięć w `TechShell` dla linków do naszych domen (`config/prokom.ts` → `lines[].domain` + `www.`), parametr tylko na czas kliknięcia.
- `components/tech/SectionRail.tsx`: pozycja motywu nad „Do góry” (zwinięta: ikona; rozwinięta: napis + Jasny · Ciemny · Auto). Szyna jest w `TechShell` = na każdej publicznej stronie — sprawdzić.
- Klucz `pk-theme` bez zmian (wspólny z prokom-web).

### 1.4. Pasek linii premium (D11)

`components/tech/BrandBar.tsx` + `tech-nav.css` wg §4 kontraktu: pigułka za kursorem i fokusem, żywa kreska (11 → 18 px z poświatą), bieżąca linia (Tech) z pigułką w kolorze linii, dymek z `lines[].description` po 350 ms (bez dotyku), wejście raz na sesję, wysokość bez zmian, kontrast AA w obu motywach. Prawa część (status, „Sprawdź status naprawy”, telefon) — telefon z etykietą „Infolinia” (§1.2).

### 1.5. ALSEN — autoryzowany partner (D4)

PRO-KOM jest **autoryzowanym partnerem ALSEN** (zgoda na logo — Krystian 18.11). Na Tech ładnie i widocznie:

- Strona główna: sekcja „Dlaczego PRO-KOM Tech” — karta „Autoryzowany partner ALSEN” (logo, 1–2 zdania: punkt partnerski sieci ALSEN w Rabce-Zdroju — `TODO(krystian)`: potwierdzić adres punktu; link do `https://www.alsen.pl/` w nowej karcie, `rel="noopener"`).
- `/o-firmie`: krótki blok o partnerstwie (bez liczb, których nie potwierdzimy w dniu publikacji — liczba sklepów sieci `TODO(krystian)`).
- Karta punktu Rabka (`PointCard`, `/punkty-serwisowe`, strona lokalna Rabki): plakietka „Punkt partnerski ALSEN”, jeśli adres potwierdzony.
- Stopka: logo ALSEN w rzędzie partnerów/autoryzacji (jeśli rząd istnieje; jeśli nie — mały rząd „Partnerzy” nad paskiem prawnym).
- Logo: plik od Krystiana `prokom-web/seed/partnerzy/alsen.png` (przycięty PNG) → `public/tech/partnerzy/alsen.png` (WebP + PNG), docelowo SVG od ALSEN. Zdjęcie wnętrza z szyldem ALSEN (`public/images/2023-02-08.webp`) **można** teraz użyć w bloku o partnerstwie, jeśli to zdjęcie z naszego salonu (`TODO(krystian)`).
- **Bez** sklepu kopiującego ceny/stany ALSEN.

### 1.6. Poza zakresem

Nazwa linii „Tech” vs domena (osobna decyzja szefa — zostaje „Tech”), backend, panele, zgłoszenia, `globals.css` (strefa zakazana — jeśli zmiana tego wymaga, wpis w `WYJATKI.md` i pytanie do Krystiana).

## 2. PR-y (piętrowo od `develop`)

1. `fix/tech-kapsula-przyklejona` (§1.1)
2. `feat/tech-punkty-kontakt` (§1.2)
3. `feat/tech-motyw-wspolny` (§1.3)
4. `feat/tech-pasek-linii-premium` (§1.4)
5. `feat/tech-alsen` (§1.5)

## 3. Prompt dla Claude Code (folder `D:\PRO-KOM\repos\prokom-system`)

```
Sesja T-R1 — runda 18.11, PRO-KOM Tech.
Najpierw: git status i git fetch; w docs/ są nowe, nieśledzone pliki z czatu (docs/zadania/runda-1811-tech.md, docs/tech/MOTYW-PASEK-LINII.md) i logo frontend/public/tech/partnerzy/alsen.png — zacommituj je jako pierwszy commit gałęzi docs/runda-1811 i otwórz z nich mały PR do develop (same dokumenty).
Przeczytaj: docs/STAN.md, docs/zadania/runda-1811-tech.md (całość), docs/tech/MOTYW-PASEK-LINII.md, docs/tech/SPEC.md, docs/tech/PREMIUM.md, docs/tech/WYJATKI.md.
Zrób pięć PR-ów piętrowo od develop wg §2. Zamrożenie do 29.11: nic do master.
§1.1: zacznij od testu e2e, który dziś nie przechodzi (kapsuła poza widokiem po przewinięciu), potem naprawa (wariant a z §1.1, chyba że w trakcie znajdziesz powód na b — powiedz).
§1.2: numery i e-maile tylko z config/prokom.ts; strona punktu pokazuje wyłącznie kontakt tego punktu; etykieta „Infolinia” jako jedna stała z TODO(krystian).
§1.3: tablicę wschodu/zachodu skopiuj z prokom-web (src/lib/shared/daylight.generated.ts po scaleniu WSP-M; jeśli jeszcze nie ma — wygeneruj tą samą funkcją NOAA i zostaw TODO do podmiany). Przed użyciem history.replaceState sprawdź w node_modules/next/dist/docs/ (Next 14.2), jak App Router traktuje natywne History API.
Testy: vitest + e2e (wspomniane w pliku), axe, 360 px bez przewijania w bok, oba motywy. Zrzuty przed/po w opisach PR.
Pytaj tylko o decyzje, których plik nie rozstrzyga.
```

## 4. Do decyzji (Krystian / szef)

1. Nazwa numeru ogólnego („Infolinia”?). 2. Numer punktu Rabka 18 541 20 55. 3. E-maile punktów: aliasy czy skrzynka Zakopanego. 4. Adres punktu ALSEN = salon Orkana 16B? 5. Zdjęcie wnętrza z szyldem ALSEN — nasze?
