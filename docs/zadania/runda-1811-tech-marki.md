# Runda 18.11.2026 (dopisek v2) — PRO-KOM Tech: katalog i salony marek Apple i Samsung z listą zapytania + strony serwisu marek

Przygotowane w czacie projektu 18.11.2026 (21:30), **wersja 2 — zastępuje wersję z 21:20** (dodane: katalog jak na Biznesie, salony marek, lista zapytania, pełny zakres modeli od Krystiana). Sesje **T-R2a → T-R2b → T-R2c**, po T-R1 (`docs/zadania/runda-1811-tech.md`). Plan całej rundy: `prokom-web/docs/zadania/runda-1811.md` (D16).

> **Aktualizacja Krystiana 18.11 (wieczór, w sesji T-R1):** „ZDJĘCIA WEŹ OD PRODUCENTÓW — JEST ZGODA”. Zastępuje zakaz z §0 „Zdjęcia”: zdjęcia produktowe można brać ze stron producentów (apple.com/pl, samsung.com/pl); w danych każde zdjęcie dalej ma pole `source` (skąd, kiedy, „zgoda: Krystian 18.11.2026”).

## 0. Decyzje i fakty
- **Krystian 18.11:** na Tech, tak jak na prokombiznes.pl: **katalog wszystkich urządzeń Apple i Samsung**, które sprzedajemy, z możliwością **dodania do zapytania** (lista zapytania, bez koszyka i bez cen), **salon marki Apple i salon marki Samsung** — premium i „inteligentnie”. Do tego strony **serwisu marki** (`/serwis-apple`, `/serwis-samsung`).
- **Zmienia decyzję z 14.11** („sklep znika ze strony Tech”) — to nie jest sklep: zero cen, zero koszyka i płatności; klient wybiera model, kolor i pamięć, dodaje do listy i wysyła zapytanie, my odpowiadamy ceną i dostępnością (odbiór w salonie Rabka/Zakopane). Wpis w `docs/tech/SPEC.md` (decyzja 18.11) i STAN. Ceny pojawią się najwcześniej z panelem ofert smartfonów (osobny projekt).
- **Zakres modeli (Krystian 18.11) — sesja T-R2a sprawdza aktualność u producenta w dniu sesji** (premiery, wycofania, dokładne nazwy) i zapisuje źródło i datę:
  - **Apple:** iPhone 17, iPhone 18 Pro, iPhone 18 Pro Max (wszystkie kolory; plus pozostałe modele iPhone w aktualnej sprzedaży Apple w Polsce — `TODO(krystian)`: czy pokazujemy też starsze w sprzedaży), **iPad** (wszystkie linie w sprzedaży: iPad, iPad mini, iPad Air, iPad Pro — najnowsze generacje), **MacBook** (Air i Pro, aktualne), **Mac** (iMac, Mac mini, Mac Studio — aktualne w sprzedaży), **Apple Watch** (aktualne serie), **AirPods** (aktualne modele).
  - **Samsung:** **cała seria Galaxy S26**, **seria A od A17: A17, A27, A37, A57** (tylko modele faktycznie wprowadzone w Polsce — weryfikacja), **tablety Galaxy Tab w aktualnej sprzedaży**, **Galaxy Buds** (aktualne), **Galaxy Watch** (aktualne).
  - Każdy model: wszystkie **kolory** i **wersje pamięci** oferowane w Polsce, z nazwami kolorów po polsku tak, jak podaje producent.
- **Zdjęcia** (stan z 21:30, zmieniony aktualizacją na górze): ~~nie pobieramy z apple.com ani samsung.com~~. Źródła: (1) materiały dystrybutora (ALSEN/AB) — `TODO(krystian)`; (2) własne zdjęcia z salonu; (3) do czasu zdjęć — ilustracje urządzeń w stylu Tech (SVG). Każde zdjęcie w danych ma pole `source` (kto, kiedy, zgoda).
- **Opisy — po swojemu.** Parametry (ekran, procesor, aparat, bateria, pamięć, kolory) to fakty — bierzemy je ze stron producenta z linkiem i datą w `sources`; **zdania piszemy sami** (żadnych akapitów z apple.com/samsung.com, sprawdzane automatycznie: najdłuższy wspólny fragment < 12 słów). Nie kopiujemy też tekstów z prokombiznes.pl (karty Apple dla firm — inny odbiorca).
- **Certyfikaty (sprawdzone 18.11 na plikach od Krystiana):** Samsung SILVER ważny do 31.03.2024, Samsung GOLD do 31.12.2022, Dell ASP do 03.02.2023 — **wygasłe**; Apple — brak. Na stronie **bez „autoryzowany/certyfikowany partner/serwis Apple/Samsung”**, bez odznak.
- **Znak Apple:** bez logo z jabłkiem — nazwa „Apple” tekstem (dziś `components/tech/brand-logos.ts` ma znak — na stronach katalogu, salonu i serwisu napis; pas marek na głównej — `TODO(krystian)`). Logotyp Samsung (napis) — `TODO(krystian)`: zgoda/zasady z materiałów dystrybutora; do tego czasu napis krojem strony.

## 1. Architektura (decyzja do przyjęcia w T-R2b — ADR w `docs/tech/`)
Tech to Next.js 14 + Django (repo `prokom-system`), **bez Payload** — silnika katalogu Biznesu nie da się użyć wprost.

| Opcja | Co | Koszt | Ryzyko |
|---|---|---|---|
| **A (rekomendacja)** | Dane katalogu w repo: `content/katalog/*.json` (modele, warianty, kolory, pamięci, cechy, źródła, zdjęcia) + typy i walidacja Zod w `lib/tech/catalog/`, strony statyczne (SSG) Next, lista zapytania w `localStorage`, wysyłka przez **istniejące** `/kontakt` API (KONTRAKT §4: `interest` + `message`) | najmniejszy, bez zmian backendu i bez nowych usług | edycja = zmiana w repo (Krystian/Claude Code), nie w panelu |
| B | Modele katalogu w Django (admin istnieje) + API do frontu | 2× większy, zmiany backendu i migracje przed 29.11 | strefa zakazana / ryzyko przełączenia 29.11 |
| C | Tech jako tenant prokom-web (Payload) | przebudowa całej strony | nierealne teraz |

**Rekomendacja A:** katalog zmienia się kilka razy w roku (premiery), a strona dzięki SSG jest szybka. Przejście na B możliwe później bez zmiany adresów.

## 2. Strony i adresy
| Adres | Co |
|---|---|
| `/sprzedaz` | Katalog: wszystkie urządzenia Apple i Samsung, filtry (marka, rodzaj: telefon · tablet · laptop · komputer · zegarek · słuchawki), wyszukiwanie, sortowanie (najnowsze), chipy rodzin |
| `/apple` | **Salon Apple** (jak salon 2.0 Biznesu): działy iPhone · iPad · Mac · Apple Watch · AirPods → rodziny/serie z opisem „dla kogo” → modele; porównanie serii; **„Dobierz w 3 pytaniach”** (np. iPhone: rozmiar, aparat, budżet ogólnie „podstawowy / pro” bez cen) |
| `/samsung` | **Salon Samsung**: Galaxy S · Galaxy A · Galaxy Tab · Galaxy Watch · Galaxy Buds — jak wyżej |
| `/sprzedaz/[marka]/[model]` | **Karta modelu** (np. `/sprzedaz/apple/iphone-18-pro`): galeria (zdjęcie/ilustracja **zmienia się z kolorem**), wybór **koloru** (próbki) i **pamięci** — „konfigurator” bez cen jak na Biznesie, „W skrócie” (4 cechy), parametry (10–14, z tabelą źródeł), „Co w pudełku” (od producenta), „Pasuje do” (etui, szkło Hammer Glass → `/hammer-glass`, ładowarka, AirPods/Buds), „Serwis tego modelu” → `/serwis-apple` / `/serwis-samsung`, FAQ (≥ 3), przyklejony przycisk **„Dodaj do zapytania”** (z wybranym kolorem i pamięcią) |
| `/zapytanie` | **Lista zapytania**: pozycje (model · kolor · pamięć · ilość), uwagi, punkt odbioru (Rabka / Zakopane), imię, e-mail (wymagany — kontrakt), telefon (zalecany), zgoda; wysyłka → API kontaktu: `interest` = `Sprzedaż · N pozycji · punkt: Rabka-Zdrój`, `message` = czytelna lista pozycji + uwagi. Sukces z numerem/komunikatem z API i „co dalej” (odpowiemy z ceną i dostępnością w godzinach pracy — **obietnica czasu `TODO` szef**, bez niej bez liczby godzin) |
| `/serwis-apple`, `/serwis-samsung` | Strony serwisu marki (§4) |

- **Nawigacja:** nowa pozycja kapsuły **„Sprzedaż” ▾** (mega menu: kolumna Apple — iPhone, iPad, Mac, Watch, AirPods, „Salon Apple →”; kolumna Samsung — Galaxy S, A, Tab, Watch, Buds, „Salon Samsung →”; kafel „Twoje zapytanie (N)”) między „Naprawy” a „Punkty serwisowe”. W kapsule ikona **„Zapytanie” z licznikiem** (jak Biznes). Telefon: TabBar bez zmian (5 zakładek), „Sprzedaż” i „Zapytanie” w arkuszu Menu + przyklejony przycisk na karcie modelu; licznik zapytania na ikonie Menu. Szukajka Ctrl/⌘K: modele, rodziny, salony.
- **Mega menu „Naprawy”** dostaje rząd „Marki: Apple · Samsung” (→ strony serwisu).
- **SEO:** tytuły np. „iPhone 18 Pro — kolory i pamięć | Sprzedaż PRO-KOM Tech Rabka-Zdrój, Zakopane” (≤ 60 znaków — skrócić), opisy ≤ 155 znaków, JSON-LD `Product` **bez `offers`** + `BreadcrumbList`, salony `CollectionPage`/`ItemList`, sitemap. Karty wariantów kolorów = jedna strona modelu (bez osobnych adresów na kolor → bez duplikatów), kolor w `?kolor=` z `canonical` bez parametru.

## 3. Wygląd „premium” i „inteligentnie”
- Styl wg `docs/tech/PREMIUM.md` + `MOTYW-PASEK-LINII.md`: ciemna drabina powierzchni, sceny produktowe jak hero Tech (#89), światło w kolorze Tech, karty modeli z przechyłem przy kursorze (bez reduced-motion), View Transitions katalog → karta (obraz modelu przelatuje), zmiana koloru wariantu = płynna zmiana obrazu i poświaty w kolorze wariantu.
- „Inteligentnie”: (1) **dobór w 3 pytaniach** w salonach (wynik = 1–3 modele z uzasadnieniem, „Dodaj do zapytania”); (2) **porównanie** do 3 modeli (tabela parametrów, różnice podświetlone, bez cen); (3) **„Pasuje do”** liczone z danych (zgodność etui/szkła z modelem z pola `compat`); (4) **ostatnio oglądane** (lokalnie, bez śledzenia); (5) **„Zapytaj o całość”** — z karty zestawu np. iPhone + AirPods + szkło jednym kliknięciem do listy.
- Telefon jak aplikacja: karuzele, chipy filtrów w arkuszu od dołu, galeria przesuwana palcem, przyklejony pasek „Dodaj do zapytania” z wybranym wariantem.
- Zero nowych bibliotek bez uzasadnienia, Lighthouse telefon katalogu i karty — bez spadku względem `/serwis-telefonow`, 360 px bez przewijania w bok, axe 0, oba motywy.

## 4. Strony serwisu marki (`/serwis-apple`, `/serwis-samsung`)
H1 (szkic): „Serwis iPhone, iPad i MacBook — Rabka-Zdrój i Zakopane”, „Serwis Samsung Galaxy — Rabka-Zdrój i Zakopane”. Sekcje: hero (ilustracja bez logo Apple, „Zgłoś naprawę” → `/zgloszenie?category=…&marka=…`, telefon punktu wg T-R1 §1.2, punkty ze statusem), **„Wybierz model”** (z danych katalogu `content/katalog` + starsze modele do serwisu z listy `TODO(krystian)`) → zgłoszenie z modelem, **„Najczęstsze naprawy”** (karty z `config/naprawy.ts` — linki tylko `published && verified`), „Części i gwarancja” (polityka części `TODO(krystian)`, bezpłatna diagnoza i wycena — obietnica z 16.11), „Jak oddać sprzęt” (Rabka, Zakopane, kurier tylko do Rabki — #94), FAQ marki (5–8, unikalne), JSON-LD `Service` + `FAQPage` + `BreadcrumbList`, link do salonu marki. Bez stron miasto × marka (doorway — `lib/tech/local-pages.ts`).

## 5. Sesje i PR-y (piętrowo od `develop`, zamrożenie do 29.11 — nic do `master`)
- **T-R2a — dane (bez UI):** `content/katalog/` — modele z §0 (weryfikacja aktualności, nazwy, kolory po polsku, pamięci, 10–14 parametrów, „co w pudełku”, `sources` z datą), opisy po swojemu (3 akapity: co to i dla kogo → parametry prostym językiem → **co robi PRO-KOM**: przeniesienie danych, szkło, konfiguracja — tylko to, co Krystian potwierdzi), FAQ ≥ 3, `compat`, rodziny/serie salonów z „dla kogo”, pytania doboru; ilustracje SVG sylwetek z kolorami wariantów; pola zdjęć z `source`. Walidacja Zod + test (każdy model ma kolory, pamięci, ≥ 10 parametrów, źródło z datą, bez słowa „autoryzowany”, bez cen, wspólny fragment z tekstem producenta < 12 słów — porównanie z zapisanym fragmentem źródła w `tmp/`). PR `feat/tech-katalog-dane`. **Pobieranie stron producentów i dystrybutora — tylko po zgodzie Krystiana w tej sesji**, spokojnie (≥ 2 s), tylko fakty.
- **T-R2b — katalog, salony, lista zapytania:** ADR (opcja A), `/sprzedaz`, `/apple`, `/samsung`, `/sprzedaz/[marka]/[model]`, `/zapytanie`, nawigacja „Sprzedaż” + licznik, szukajka, porównanie, dobór, JSON-LD, sitemap, View Transitions. PR-y `feat/tech-katalog-strony` → `feat/tech-salony-marek` → `feat/tech-lista-zapytania`.
- **T-R2c — serwis marek i porządki:** `/serwis-apple`, `/serwis-samsung`, rząd marek w mega menu „Naprawy”, napis zamiast znaku Apple, decyzja 18.11 w SPEC, STAN. PR-y `feat/tech-serwis-marek` → `fix/tech-znak-apple`.

## 6. Prompty dla Claude Code (folder `prokom-system`)
### T-R2a
```
Sesja T-R2a — runda 18.11: dane katalogu Apple i Samsung dla PRO-KOM Tech (bez UI).
Najpierw: git status, git fetch. Jeśli docs/zadania/runda-1811-tech-marki.md jest nieśledzony — zacommituj go pierwszym commitem gałęzi feat/tech-katalog-dane.
Przeczytaj: docs/zadania/runda-1811-tech-marki.md (całość, wersja 2), docs/tech/SPEC.md, docs/tech/KONTRAKT-BACKEND.md §4, config/naprawy.ts, lib/tech/devices.ts, docs/STAN.md.
Zakres modeli z §0 — najpierw zrób listę modeli do sprawdzenia i zapytaj mnie o zgodę na pobieranie stron producentów (apple.com/pl, samsung.com/pl) tylko po fakty (nazwy, kolory, pamięci, parametry, co w pudełku) — z przerwą ≥ 2 s.
Wynik wg §5 T-R2a: content/katalog/*.json + lib/tech/catalog/ (typy, Zod, testy), ilustracje SVG sylwetek w kolorach wariantów, pola zdjęć z source. Opisy po swojemu, bez „autoryzowany”, bez cen, bez obietnic spoza SPEC (TODO(krystian)). Modele, których nie da się potwierdzić u producenta w Polsce — w raporcie, nie w danych.
Jeden PR feat/tech-katalog-dane do develop. Na końcu lista decyzji dla mnie (§0, §4, zdjęcia).
```
### T-R2b
```
Sesja T-R2b — runda 18.11: katalog, salony Apple i Samsung, lista zapytania na PRO-KOM Tech.
Przeczytaj: docs/zadania/runda-1811-tech-marki.md (§1–§3, §5 T-R2b), docs/tech/PREMIUM.md, docs/tech/MOTYW-PASEK-LINII.md, docs/tech/KONTRAKT-BACKEND.md §4, lib/tech/catalog/ i content/katalog/ (z T-R2a), components/tech/Capsule.tsx, MenuSheet.tsx, search/, InquiryForm.tsx, lib/tech/requests.ts.
Najpierw ADR w docs/tech/ (opcja A z §1) — status „przyjęta”, jeśli nie mam uwag w tej sesji.
Trzy PR-y piętrowo od develop: feat/tech-katalog-strony → feat/tech-salony-marek → feat/tech-lista-zapytania, wg §2–§3. Lista zapytania wysyła przez istniejące API kontaktu (interest + message) — bez zmian backendu; e-mail wymagany (kontrakt).
Zero cen, bez koszyka, bez logo z jabłkiem, bez „autoryzowany”. Premium wg PREMIUM.md; telefon jak aplikacja. Zamrożenie do 29.11 — nic do master.
Testy: vitest (lista zapytania: dodaj/usuń/ilość/wariant, budowa message, brak cen w HTML), e2e (katalog → filtr → karta → kolor/pamięć → do zapytania → wysyłka na fixture API; salony; porównanie; dobór; 360 px; oba motywy; axe), Lighthouse telefon vs /serwis-telefonow. Zrzuty 1440/390 jasny/ciemny w opisach PR. Pytaj tylko o decyzje, których plik nie rozstrzyga.
```
### T-R2c
```
Sesja T-R2c — runda 18.11: strony serwisu Apple i Samsung + porządki znaku Apple na PRO-KOM Tech.
Przeczytaj: docs/zadania/runda-1811-tech-marki.md (§0, §4, §5 T-R2c), docs/tech/SPEC.md, config/naprawy.ts, lib/tech/local-pages.ts, components/tech/brand-logos.ts, content/katalog/.
Dwa PR-y piętrowo od develop: feat/tech-serwis-marek → fix/tech-znak-apple. Modele do „Wybierz model” z katalogu + starsze z listy TODO(krystian); naprawy tylko published && verified jako linki; bez stron miasto × marka.
Wpisz decyzję 18.11 (sprzedaż jako katalog z listą zapytania, bez cen i koszyka) w docs/tech/SPEC.md i STAN. Testy jak w T-R2b dla nowych stron. Zamrożenie do 29.11. Zdjęcia od producentów — jest zgoda Krystiana (18.11).
```

## 7. Do decyzji (Krystian / szef)
1. **Zdjęcia:** ~~dostęp do materiałów AB/ALSEN albo sesja zdjęciowa~~ — Krystian 18.11: zdjęcia od producentów, jest zgoda. Zostaje: zapisać źródło każdego zdjęcia.
2. Czy pokazujemy starsze modele w sprzedaży (np. iPhone 16, Galaxy S25), czy tylko z listy §0.
3. Co robi PRO-KOM przy zakupie: przeniesienie danych, szkło Hammer Glass, konfiguracja, odkup starego telefonu — które tak (do opisów).
4. Obietnica czasu odpowiedzi na zapytanie o cenę (np. „w godzinach pracy tego samego dnia”) — bez niej bez liczby.
5. Faktura VAT na firmę — tak (do FAQ)? Raty — nie (jak na pozostałych liniach), chyba że szef zdecyduje inaczej.
6. Lista napraw Apple/Samsung, które robimy (MacBook, składane Galaxy Z, Apple Watch?) i polityka części.
7. Pas marek na głównej Tech: znak Apple zostaje czy napis; logotyp Samsung — zasady.
