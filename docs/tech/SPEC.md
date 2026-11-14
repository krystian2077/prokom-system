# PRO-KOM Tech — specyfikacja przebudowy strony publicznej prokomserwis.pl

Wersja 1.0 · 14.11.2026 · właściciel: Krystian Potaczek
Kolejność ważności dokumentów: `docs/tech/00-INDEKS.md`.

## 1. Cel i zasada nadrzędna
prokomserwis.pl staje się stroną linii **PRO-KOM Tech**: jeden serwis z dwoma punktami (Rabka-Zdrój i Zakopane), wspólne elementy ekosystemu PRO-KOM, mocne SEO lokalne (Rabka, Podhale, Zakopane i okolice), tryb jasny i ciemny, na telefonie jak nowoczesna aplikacja, równie dopracowana na tablecie, laptopie i PC.

**Dostosowujemy frontend do backendu, nigdy odwrotnie.**
- Backend Django (`backend/`) zostaje bez zmian: modele, migracje, API, serializery, zadania Celery, ustawienia aplikacji.
- Panel pracownika (`/panel`), panel administratora (`/admin-panel`) i konto klienta (`/client`) zostają bez zmian, także wizualnie.
- Nowa strona wysyła i czyta dokładnie te pola i wartości, które backend przyjmuje dziś (`KONTRAKT-BACKEND.md`).
- Jeśli coś z wizualizacji nie da się zrobić bez zmiany backendu, **zatrzymaj się i zapytaj**. Nie obchodź tego po cichu i nie zmieniaj backendu „przy okazji”.

## 2. Granice — co wolno zmieniać
**Strefa zakazana** (zmiana = błąd CI `scripts/tech/strefa-zakazana.sh`, wyjątek tylko wpisany w `docs/tech/WYJATKI.md` za zgodą Krystiana):
- `backend/**`
- `frontend/app/panel/**`, `frontend/app/admin-panel/**`, `frontend/app/client/**`
- `frontend/components/panel/**`, `frontend/features/client-*/**`, `frontend/contexts/**`
- `frontend/lib/api.ts`, `frontend/lib/panel-api.ts`, `frontend/lib/auth-storage.ts`, `frontend/lib/theme.ts`, `frontend/hooks/**`, `frontend/store/**`, `frontend/stores/**`, `frontend/types/**` (wolno importować, nie wolno zmieniać)
- `frontend/middleware.ts`, `frontend/tailwind.config.ts` (sekcja `theme`), reguły w `frontend/app/globals.css` używane przez panele

**Strefa przebudowy** (tu powstaje nowa strona):
- `frontend/app/(public)/**`: strony publiczne, `layout.tsx`, nowy `tech.css`
- `frontend/components/tech/**` (nowe), `frontend/lib/tech/**` (nowe), `frontend/config/prokom.ts` (nowe), `frontend/config/media-zrodla.json` (nowe)
- `frontend/public/tech/**` (nowe obrazy), `frontend/app/sitemap.ts`, `frontend/app/robots.ts`
- Pliki wspólne, tylko w opisanym zakresie: `frontend/app/layout.tsx` (metadane domyślne, JSON-LD przenoszone do layoutu publicznego, kroje używane wyłącznie przez stronę publiczną), `frontend/next.config.js` (`redirects`, `images`), `frontend/Dockerfile` i CI (wersja Node)
- Stare pliki strony publicznej (`frontend/sections/**`, `frontend/components/layout/Public*.tsx`, `ConditionalPublicLayout.tsx`, `ScopeBar.tsx`, `LiveBadge.tsx`, `frontend/components/hammer-glass/**`, `frontend/components/blog/**`, `frontend/features/zgloszenie/**`, publiczne bloki w `globals.css`): usuwamy dopiero w TD6, po dowodzie (grep), że nikt ich nie importuje.

**Dlaczego tak ostro:** panele i strona są w jednym projekcie Next.js. Dzielą `globals.css` (4083 linie), Tailwinda, kroje i atrybut motywu `data-theme` z kluczem `prokom-theme`. Jedna „porządkująca” zmiana w globalnych stylach może zepsuć panel, w którym serwis pracuje cały dzień.

## 3. Architektura frontu publicznego
- **Izolacja stylów:** cały nowy wygląd siedzi w `frontend/app/(public)/tech.css`, importowanym tylko w `app/(public)/layout.tsx`. Każda reguła jest pod korzeniem `.tech` (wrapper w layoucie publicznym). Zero nowych reguł globalnych dla `html`, `body` i `*` poza `.tech`. Klasy komponentów mają prefiks `t-` (np. `.t-hero`, `.t-capsule`), żeby nie zderzyły się z klasami paneli.
- **Tailwind:** w nowym kodzie nie używamy. Wygląd przenosimy 1:1 z CSS prototypu (`docs/design/tech/prototyp`). Preflight Tailwinda działa globalnie już dziś i to akceptujemy.
- **Kroje:** Archivo (oś `wdth`, nagłówki: stretch 108%, waga 800) i Manrope (tekst) przez `next/font/google`, podpięte zmiennymi tylko w layoucie publicznym. W root layoucie zostają DM Sans i Unbounded (używają ich panele). Syne i Plus Jakarta Sans usuwamy w TD6, po sprawdzeniu, że nikt ich nie używa (dziś Syne tylko na starej stronie, Jakarta nigdzie).
- **Motyw:** panele używają `data-theme` + `localStorage['prokom-theme']` (`lib/theme.ts`, konteksty paneli). Strona publiczna dostaje **osobny** mechanizm: atrybut `data-tech-theme="light|dark"` na `<html>`, klucz `localStorage['pk-theme']` (wspólny dla stron linii PRO-KOM) i domyślnie motyw systemu. Skrypt ustawiający atrybut jest pierwszym elementem layoutu publicznego (inline, przed treścią), więc nie ma mignięcia. Przełącznik: Jasny / Ciemny / Auto (arkusz Menu na telefonie, przycisk w kapsule). Strona publiczna nigdy nie zapisuje `prokom-theme`.
- **Dane:** jedno źródło `frontend/config/prokom.ts` (§5). Telefon, e-mail, adres i godziny jako literały w komponentach są zakazane (test `tests/tech/literaly.test.ts`).
- **API:** wywołania tylko przez istniejące `frontend/lib/api.ts` (`api.post`, `API_V1`) albo `fetch(\`${API_V1}/…\`)` jak dziś. Nowe typy żądań i odpowiedzi trzymamy w `frontend/lib/tech/contract.ts`, 1:1 z `KONTRAKT-BACKEND.md`.
- **Renderowanie:** strony treściowe jako Server Components (SEO, szybkość). Klient (`"use client"`) tylko tam, gdzie jest interakcja: kreator, formularze, status, przełączniki, arkusze. Ruch tylko `transform` i `opacity`, wyłączany przy `prefers-reduced-motion`. `framer-motion` nie wchodzi do nowego kodu strony (zostaje dla paneli).
- **Obrazy:** `next/image`, AVIF/WebP, wymiary zawsze podane, `priority` tylko dla obrazu LCP w hero.

## 4. Tokeny Tech
Z prototypu (`.wrap` / `.wrap.dk`), przeniesione na `.tech` i `.tech[data-tech-theme="dark"]` (atrybut z `<html>`, selektor `html[data-tech-theme="dark"] .tech`).

| Token | Jasny | Ciemny |
|---|---|---|
| `--bg` | #F4F5F1 | #120D0C |
| `--bg2` | #ECEEE8 | #1B1413 |
| `--card` | #FFFFFF | #241B1A |
| `--bd` / `--bd2` | #E3E6DF / #CFD3CA | #3A2E2C / #54433F |
| `--ink` / `--ink2` | #121613 / #4F5650 | #F6F1F0 / #BDB1AE |
| `--acc` (przyciski) | #C4362B | #E2483A |
| `--onacc` (tekst na akcencie) | #FFFFFF | #1A0806 |
| `--acct` (tekst w akcencie) | #B3301F | #F29185 |
| `--soft` / `--softbd` | #FBE9E6 / #F1C9C3 | rgba(226,72,58,.16) / rgba(226,72,58,.45) |
| `--okbg` / `--ok` | #EAF5E6 / #2E7A1E | rgba(123,211,106,.14) / #8FDB80 |
| `--capbg` / `--capbd` | rgba(255,255,255,.8) / rgba(18,22,19,.09) | rgba(36,27,26,.8) / rgba(255,255,255,.1) |
| `--logo-acc` | #D13A2E | #E2483A |

Stałe: scena hero i ciemne bloki `#171110` / `#1A1312` z poświatą `rgba(226,72,58,.3)`, stopka `#1A1312`, CTA kapsuły gradient `#CF4034 → #B02C22`, czerwień znaku Tech `#D13A2E` (księga znaku). Kontrast tekstu ≥ 4,5:1 w obu motywach (axe w TD6).

## 5. Dane — `frontend/config/prokom.ts`
Kształt jak `CompanyData` + `shared` w spec. elementów wspólnych prokom-web (jeśli `docs/wspolne/` jest w repo, przyjmij tamten kształt; jeśli nie, użyj tego):
```ts
export const company = { name: 'PRO-KOM Tadeusz Wójciak', nip: '7352511447', since: 2004, hq: { street: 'ul. Orkana 16B', postal: '34-700', city: 'Rabka-Zdrój' } };
export const line = { key: 'tech', name: 'PRO-KOM Tech', domain: 'prokomserwis.pl', phone: '+48 883 200 151', phoneDisplay: '883 200 151', email: 'sklep@pro-kom.eu' /* → kontakt@prokomserwis.pl po potwierdzeniu MX (MIGRACJA-VPS §3) */ };
export type ServicePoint = { key: 'rabka' | 'zakopane'; name: string; street: string | null; postal: string; city: string; geo: { lat: number; lng: number } | null; hours: { days: string; open: string | null; close: string | null }[]; phone: string | null; mapsUrl: string | null; parkingNote: string | null; published: boolean };
export const servicePoints: ServicePoint[] = [
  { key: 'rabka', name: 'Rabka-Zdrój', street: 'ul. Orkana 16B', postal: '34-700', city: 'Rabka-Zdrój', geo: { lat: 49.6130, lng: 19.9629 }, hours: [{ days: 'pn–pt', open: '09:00', close: '17:00' }, { days: 'sob', open: '09:00', close: '14:00' }, { days: 'nd', open: null, close: null }], phone: null /* = line.phone */, mapsUrl: null, parkingNote: null, published: true },
  { key: 'zakopane', name: 'Zakopane', street: null, postal: '34-500', city: 'Zakopane', geo: null, hours: [], phone: null, mapsUrl: null, parkingNote: null, published: false },
];
export const lines = [ /* PRO-KOM, Biznes, Instalacje, Software, Tech (bieżąca), Gaming — nazwy, domeny, kolory kresek z wzorca (stopka, pasek marki) */ ];
```
- Godziny „otwarte do …” liczone na żywo w strefie `Europe/Warsaw` (komponent `OpeningStatus`). Bez godzin punkt nie pokazuje statusu.
- **Punkt z `published: false` nie renderuje się nigdzie** na produkcji: karta, mapa, wybór w kreatorze i formularzu, JSON-LD, strona lokalna. Na stagingu, przy `NEXT_PUBLIC_TECH_DRAFT=1`, pokazuje się z ramką „do uzupełnienia” jak w prototypie. Test sprawdza oba warianty.
- Treść pokazuje, że punkty są dwa, dopiero gdy Zakopane ma `published: true`. Do tego czasu strona mówi o Rabce, a Zakopane pojawia się wyłącznie na stagingu. To blokada produkcji pełnej wersji (§10).

## 6. Mapa stron i adresów
| Adres | Teraz | Po przebudowie | Sesja |
|---|---|---|---|
| `/` | główna | główna wg wzorca (`#glowna`) | TD2 |
| `/zgloszenie` | formularz (2 implementacje) | **jeden** formularz wg wzorca i kontraktu | TD3 |
| `/track` | status | status wg wzorca (`#status-naprawy`) | TD3 |
| `/claim-repair` | przypisanie naprawy do konta | nowa skórka, logika bez zmian | TD3 |
| `/punkty-serwisowe` | — (nowy) | wzorzec `#punkty-serwisowe` | TD4 |
| `/kontakt` | linki mailto | wzorzec `#kontakt`, formularz → `communications/inquiry` | TD4 |
| `/o-firmie` | — (nowy) | wzorzec `#o-firmie` | TD4 |
| `/serwis-telefonow` | 301 → `/uslugi` (next.config) | **prawdziwa strona** (usuń przekierowanie) | TD4 |
| `/serwis-telefonow-zakopane`, `/serwis-telefonow-rabka-zdroj` | — | szablon strony lokalnej wg `#serwis-telefonow-zakopane` | TD4 |
| `/obslugiwane-miejscowosci` | lista | nowa skórka, dwie grupy (bliżej Rabki / bliżej Zakopanego) | TD4 |
| `/uslugi` | lista usług | „Naprawy”: hub wszystkich urządzeń (etykieta w menu „Naprawy”) | TD5 |
| `/serwis-laptopow`, `-tabletow`, `-komputerow`, `-drukarek`, `-konsol`, `-smartwatchy`, `/odzyskiwanie-danych` | proste strony | szablon strony urządzenia (hero, naprawy, marki, proces, FAQ, CTA) | TD5 |
| `/hammer-glass` | strona | wzorzec `#hammer-glass` | TD5 |
| `/faq`, `/blog`, `/blog/[slug]` | są | nowa skórka, **treści bloga bez zmian** (`lib/blog-posts.ts`, 50 wpisów) | TD5 |
| `/polityka-prywatnosci`, `/regulamin` | są | nowa skórka + aktualizacja hostingu (webh.pl, Polska) po migracji | TD5 |
| `/akcesoria` | sklep | **usunięte** → 301 na `/hammer-glass` (najbliższa treść: folie i szkła) | TD4 |
| `/oferta` | sprzedaż sprzętu | **usunięte** → 301 na `/` | TD4 |
| 404 | domyślna | własna strona 404 w skórce | TD5 |

Menu (kapsuła): **Naprawy ▾ · Punkty serwisowe ▾ · Hammer Glass · Blog · O firmie · Kontakt**, po prawej Konto, motyw, „Zgłoś naprawę”. Bez „Sklep”. „Konto” prowadzi do `/client/login` (panel klienta bez zmian).
Pasek marki: linie PRO-KOM (Tech pogrubiony), status godzin, „Sprawdź status naprawy” → `/track`, „Serwis: 883 200 151”.
Stopka: kolumny Naprawy / Hammer Glass / Informacje (O firmie, Kontakt, Blog, Obsługiwane miejscowości, Status naprawy, Konto klienta) + Punkty serwisowe z mapami, pas linii PRO-KOM (Gaming jako kafelek-odnośnik), pasek prawny.

## 7. Komponenty (nazwy wiążące, katalog `frontend/components/tech/`)
- Powłoka: `TechShell`, `BrandBar`, `Capsule` (+ mega menu Naprawy i Punkty), `SectionRail` (≥ 1400 px), `TabBar` i `MenuSheet` (telefon), `Footer`, `LinesBand`, `LegalBar`, `Logo` (SVG znaku PRO-KOM TECH; do czasu oficjalnego pliku rysunek z prototypu), `ThemeToggle`, `OpeningStatus`.
- Wspólne bloki: `PointCard`, `PodhaleMap` (mapa schematyczna z prototypu, SVG), `OsmMap` (mapa adresu: statyczny SVG albo kafel OSM, bez ramki Google), `Faq`, `CtaBand`, `Steps`, `RepairTracker` (5 etapów), `DeviceGrid`, `BrandMarquee`.
- Kreator: `RepairWizard` z `wizard-data.ts` (urządzenia, usterki per urządzenie, punkty na zdjęciach, sposoby dostarczenia: Rabka-Zdrój, Zakopane (tylko gdy `published`), kurier). Wynik to przejście do `/zgloszenie` z parametrami (KONTRAKT §1.4).
- Formularze: `RepairForm` (5 kroków), `InquiryForm`, `TrackForm`. Wspólnie: walidacja, zgoda, ekran sukcesu, obsługa błędów API.

## 8. Treść i zasady treści (obowiązują w każdej sesji)
- Bez WhatsAppa, bez zdjęć ludzi, bez cen (do decyzji szefa), **bez paczkomatu** (serwis nie nadaje i nie odbiera, decyzja 14.11), **bez sklepu**.
- Nazwa linii: „PRO-KOM Tech”. Słowo „serwis” zostaje w H1, tytułach i adresach (SEO).
- Obietnice tylko istniejące: wycena przed naprawą, możliwość rezygnacji, gwarancja na usługę i części, status online, wymiana wyświetlacza „często ok. 1 h”. Liczby z prototypu z §10 tylko po potwierdzeniu.
- Teksty z prototypu przenosimy dosłownie. Zmiana tekstu = najpierw zmiana we wzorcu (czat), potem kod.

## 9. SEO
- Tytuł strony głównej: „Serwis telefonów i komputerów — Rabka-Zdrój i Zakopane | PRO-KOM Tech” (do czasu publikacji Zakopanego: „… — Rabka-Zdrój | PRO-KOM Tech”). Szablon pozostałych: „%s | PRO-KOM Tech”. Każda strona: unikalny tytuł 30–60 znaków, opis 120–155, jeden H1, kanoniczny adres, Open Graph.
- JSON-LD z danych: `Organization` (PRO-KOM) + osobny `LocalBusiness` (`ElectronicsRepair` albo `LocalBusiness` z `@type` sprawdzonym w walidatorze schema.org) dla każdego **opublikowanego** punktu; `Service` na stronach napraw; `FAQPage`; `BreadcrumbList`. JSON-LD przenosimy z root layoutu do layoutu publicznego, bo panele go nie potrzebują.
- `sitemap.ts` z danych (bez usuniętych `/akcesoria` i `/oferta`, z nowymi stronami, bez stron z `published: false`), `robots.ts` bez zmian zasad dla `/panel`, `/admin-panel`, `/client`.
- Strony lokalne: unikalna treść (dojazd, parking, bliższy punkt, pytania z miejscowości). Bez tego strona się nie publikuje (ryzyko „doorway pages”). Start: Rabka-Zdrój i Zakopane, kolejne miejscowości partiami po starcie.
- Wydajność: Lighthouse telefon ≥ 90, LCP < 2,5 s, CLS < 0,1. `public/` ma dziś 105 MB, w tym dwa pliki mp4 z filmem plotera: film ładujemy po kliknięciu (poster), w paczce budowy zostaje jeden plik.

## 10. Otwarte (blokują produkcję, nie budowę)
- **[SZEF]** Zakopane: adres, godziny, telefon, czy jest ploter Hammer Glass, czy można oddać w jednym punkcie i odebrać w drugim. Bez tego produkcja idzie tylko z Rabką (Zakopane `published: false`).
- **[SZEF]** liczby i obietnice: „często ok. 1 h”, „2004”, ocena i liczba opinii Google (albo ukryć kartę).
- **[SZEF/Krystian]** prawa do zdjęć urządzeń i kadrów plotera, źródła w `media-zrodla.json`.
- **[Krystian]** oficjalny SVG znaku PRO-KOM TECH (dziś rysunek zastępczy), DNS/MX dla `kontakt@prokomserwis.pl`.
- **[prawnik]** polityka prywatności po zmianie hostingu.

## 11. Definition of Done każdej sesji z UI
1. Wygląd zgodny ze wzorcem (`porownaj.mjs` 1440 w obu motywach + zasady `RESPONSYWNOSC.md` na wszystkich szerokościach testowych).
2. `scripts/tech/strefa-zakazana.sh` zielony: zero zmian w strefie zakazanej.
3. `tests/tech/panele.spec.ts` zielony: ekrany logowania panelu, panelu admina i konta klienta wyglądają jak w zrzutach bazowych z TD1, a motyw panelu nie zmienia się po zmianie motywu strony.
4. `npm run build` bez błędów i ostrzeżeń typów, lint, testy jednostkowe i e2e z sesji.
5. Testy treści: brak WhatsApp/wa.me, brak „paczkomat”, brak literałów kontaktowych poza `prokom.ts`, brak zaślepek `[…]` na buildzie produkcyjnym.
6. Zrzuty przed/po w opisie PR (1440, 1024, 768, 390, 360, jasny i ciemny).
7. `docs/STAN.md` zaktualizowany (`/koniec-sesji`).
