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

> **Uwaga z T0 (14.11.2026, `MAPA-PLIKOW.md`) — lista wyżej jest za szeroka:**
> - `ScopeBar.tsx` i `LiveBadge.tsx` **należą do panelu** (`app/panel/dashboard/page.tsx:16,736`) — **nie usuwamy**.
> - `PublicNavbar.tsx` i `PublicFooter.tsx` renderuje konto klienta (`app/client/ClientGate.tsx:9-10,87-89`, strefa zakazana). Na stronie publicznej je zastępujemy, ale pliki zostają (zamrożone), chyba że Krystian zatwierdzi wyjątek w `WYJATKI.md`. TODO(krystian): decyzja przed TD6.
> - `/zgloszenie` ma dziś jedną działającą implementację (`app/(public)/zgloszenie/page.tsx`); `features/zgloszenie/SubmissionForm.tsx` nie jest nigdzie importowany.

**Dlaczego tak ostro:** panele i strona są w jednym projekcie Next.js. Dzielą `globals.css` (4083 linie), Tailwinda, kroje i atrybut motywu `data-theme` z kluczem `prokom-theme`. Jedna „porządkująca” zmiana w globalnych stylach może zepsuć panel, w którym serwis pracuje cały dzień.

## 3. Architektura frontu publicznego
- **Izolacja stylów:** cały nowy wygląd siedzi w `frontend/app/(public)/tech.css`, importowanym tylko w `app/(public)/layout.tsx`. Każda reguła jest pod korzeniem `.tech` (wrapper w layoucie publicznym). Zero nowych reguł globalnych dla `html`, `body` i `*` poza `.tech`. Klasy komponentów mają prefiks `t-` (np. `.t-hero`, `.t-capsule`), żeby nie zderzyły się z klasami paneli.
- **Tailwind:** w nowym kodzie nie używamy. Wygląd przenosimy 1:1 z CSS prototypu (`docs/design/tech/prototyp`). Preflight Tailwinda działa globalnie już dziś i to akceptujemy.
- **Kroje:** Archivo (oś `wdth`, nagłówki: stretch 108%, waga 800) i Manrope (tekst) przez `next/font/google`, podpięte zmiennymi tylko w layoucie publicznym. W root layoucie zostają DM Sans i Unbounded (używają ich panele). Syne i Plus Jakarta Sans usuwamy w TD6, po sprawdzeniu, że nikt ich nie używa (dziś Syne tylko na starej stronie, Jakarta nigdzie). *Uwaga z T0: „nigdzie” dotyczy zmiennej `--font-jakarta` z root layoutu; 5 stron `app/client/*` ładuje Jakartę i Unbounded własnym `next/font` — te zostają. Unbounded psuł `next build` (Google podaje go bez rozszerzenia pliku); obejście `frontend/scripts/patch-next-font.js` (prebuild) — sprawdzić po każdej zmianie wersji Nexta.*
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
  { key: 'zakopane', name: 'Zakopane', street: 'ul. Stanisława Staszica 8', postal: '34-500', city: 'Zakopane', geo: { lat: 49.2990, lng: 19.9489 } /* PRZYBLIŻONE (centrum Zakopanego) — TODO(krystian): pinezka sklepu przed publikacją */, hours: [{ days: 'pn–pt', open: '10:00', close: '16:30' }, { days: 'sob', open: null, close: null }, { days: 'nd', open: null, close: null }], phone: '+48 18 541 20 15', mapsUrl: null, parkingNote: null, published: false },
];
export const lines = [ /* PRO-KOM, Biznes, Instalacje, Software, Tech (bieżąca), Gaming — nazwy, domeny, kolory kresek z wzorca (stopka, pasek marki) */ ];
```
- Godziny „otwarte do …” liczone na żywo w strefie `Europe/Warsaw` (komponent `OpeningStatus`). Bez godzin punkt nie pokazuje statusu. Szczegóły statusu dla każdego punktu: §12.1.
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
| `/faq`, `/blog`, `/blog/[slug]` | są | nowa skórka, **treści bloga bez zmian** (`lib/blog-posts.ts`, 50 wpisów + 1 zdublowany slug do usunięcia, §12.11) | TD5 |
| `/blog/kategoria/[slug]` | — (filtr w przeglądarce) | 4 strony kategorii z własnym wstępem (§12.11) | TD5 |
| `/naprawa-kurierem` | — (nowy) | naprawa wysyłkowa: jak wysłać, kto płaci, jak wraca (§12.10) | TD5 |
| `/polityka-prywatnosci`, `/regulamin` | są | nowa skórka + aktualizacja hostingu (webh.pl, Polska) po migracji | TD5 |
| `/akcesoria` | sklep | **usunięte** → 301 na `/hammer-glass` (najbliższa treść: folie i szkła) | TD4 |
| `/oferta` | sprzedaż sprzętu | **usunięte** → 301 na `/` | TD4 |
| 404 | domyślna | własna strona 404 w skórce | TD5 |
| `/jak-przygotowac-sprzet` | — (nowy) | poradnik przed oddaniem sprzętu (§12.3) | TD5 |
| `/naprawy/[slug]` | — (nowe) | strony konkretnych napraw, start: do 12 (§12.4) | TD5b |

Menu (kapsuła): **Naprawy ▾ · Punkty serwisowe ▾ · Hammer Glass · Blog · O firmie · Kontakt**, po prawej Konto, motyw, „Zgłoś naprawę”. Bez „Sklep”. „Konto” prowadzi do `/client/login` (panel klienta bez zmian).
Pasek marki: linie PRO-KOM (Tech pogrubiony), status godzin, „Sprawdź status naprawy” → `/track`, „Serwis: 883 200 151”.
Stopka: kolumny Naprawy / Hammer Glass / Informacje (O firmie, Kontakt, Blog, Obsługiwane miejscowości, Status naprawy, Konto klienta) + Punkty serwisowe z mapami, pas linii PRO-KOM (Gaming jako kafelek-odnośnik), pasek prawny.

## 7. Komponenty (nazwy wiążące, katalog `frontend/components/tech/`)
- Powłoka: `TechShell`, `BrandBar`, `Capsule` (+ mega menu Naprawy i Punkty), `SectionRail` (≥ 1400 px), `TabBar` i `MenuSheet` (telefon), `Footer`, `LinesBand`, `LegalBar`, `Logo` (SVG znaku PRO-KOM TECH; do czasu oficjalnego pliku rysunek z prototypu), `ThemeToggle`, `OpeningStatus`.
- Wspólne bloki: `PointCard`, `PodhaleMap` (mapa schematyczna z prototypu, SVG), `OsmMap` (mapa adresu: statyczny SVG albo kafel OSM, bez ramki Google), `Faq`, `CtaBand`, `Steps`, `RepairTracker` (5 etapów), `DeviceGrid`, `BrandMarquee`.
- Kreator: `RepairWizard` z `wizard-data.ts` (urządzenia, usterki per urządzenie, punkty na zdjęciach, sposoby dostarczenia: Rabka-Zdrój, Zakopane (tylko gdy `published`), kurier). Wynik to przejście do `/zgloszenie` z parametrami (KONTRAKT §1.4).
- Formularze: `RepairForm` (5 kroków), `InquiryForm`, `TrackForm`. Wspólnie: walidacja, zgoda, ekran sukcesu, obsługa błędów API.
- Dodatki (§12): `NoticeBar` (komunikat z `prokom.ts`), `MyRepairs` (zapamiętane naprawy), `SuccessCard` (QR, udostępnij, zapisz), `NavigateButtons` (Mapy Google / Apple / Waze), `DataSafety` (sekcja zaufania), `PrepChecklist` (lista „przygotuj sprzęt”, także skrót w formularzu i na ekranie sukcesu), `RepairPage` (szablon strony naprawy), `InstallHint` (dyskretna podpowiedź „Dodaj do ekranu głównego” w arkuszu Menu, bez wyskakujących okien).

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
- **[SZEF]** Zakopane: ~~adres~~ (✔ 14.11: salon i serwis, ul. Stanisława Staszica 8, 34-500 Zakopane), godziny, ~~telefon~~ (✔ 14.11: 18 541 20 15), ~~godziny~~ (✔ pn–pt 10:00–16:30, sob–nd zamknięte), ~~ploter Hammer Glass~~ (✔ jest), ~~oddanie w jednym punkcie i odbiór w drugim~~ (✔ można — KONTRAKT §2), **współrzędne: dziś przybliżone (centrum miasta) — dokładna pinezka przed publikacją**. Bez tego produkcja idzie tylko z Rabką (Zakopane `published: false`).
- **[SZEF]** liczby i obietnice: „często ok. 1 h”, „2004”, ocena i liczba opinii Google (albo ukryć kartę).
- **[SZEF/Krystian]** prawa do zdjęć urządzeń i kadrów plotera, źródła w `media-zrodla.json`.
- **[Krystian]** oficjalny SVG znaku PRO-KOM TECH (dziś rysunek zastępczy), DNS/MX dla `kontakt@prokomserwis.pl`.
- **[prawnik]** polityka prywatności po zmianie hostingu.
- **[Krystian + serwis]** lista do 12 najczęstszych napraw na strony `/naprawy/…` (§12.4) i dla każdej: realny czas, czy na miejscu w Rabce, gwarancja. Strona bez potwierdzonych danych się nie publikuje.
- **[Krystian]** identyfikator strony Tech w Umami (wpis w `UMAMI_WEBSITES` w `.env.prod`, wzór prokom-web) i dopisek o statystykach w polityce prywatności (§12.5).
- **[SZEF/serwis]** treść sekcji „Twoje dane są bezpieczne” zgodna z tym, jak serwis naprawdę postępuje z danymi (§12.9).
- **[SZEF]** naprawa wysyłkowa (§12.10) — 5 odpowiedzi: (1) czy promujemy ją na stronie, (2) czy nadal: wysyłka do serwisu na koszt klienta, odesłanie po naprawie na koszt serwisu (tak mówi dziś mail z systemu), (3) jak klient płaci za naprawę przy wysyłce (przelew przed odesłaniem / pobranie / inaczej), (4) co, gdy klient zrezygnuje po wycenie — kto płaci za odesłanie, (5) czy cała Polska, czy tylko okolica. Bez odpowiedzi strona `published: false`.
- **[Krystian]** akceptacja wstępów kategorii bloga (§12.11) i przypisania wpisów.
- **[SZEF]** dni zamknięcia poza świętami ustawowymi (np. inwentaryzacja, urlop) — wpisywane w `closures` w `prokom.ts` (§12.1).

## 11. Definition of Done każdej sesji z UI
1. Wygląd zgodny ze wzorcem (`porownaj.mjs` 1440 w obu motywach + zasady `RESPONSYWNOSC.md` na wszystkich szerokościach testowych).
2. `scripts/tech/strefa-zakazana.sh` zielony: zero zmian w strefie zakazanej.
3. `tests/tech/panele.spec.ts` zielony: ekrany logowania panelu, panelu admina i konta klienta wyglądają jak w zrzutach bazowych z TD1, a motyw panelu nie zmienia się po zmianie motywu strony.
4. `npm run build` bez błędów i ostrzeżeń typów, lint, testy jednostkowe i e2e z sesji.
5. Testy treści: brak WhatsApp/wa.me, brak „paczkomat” (wyjątek: zdanie „nie obsługujemy paczkomatów” na `/naprawa-kurierem` i w FAQ), brak literałów kontaktowych poza `prokom.ts`, brak zaślepek `[…]` na buildzie produkcyjnym.
6. Zrzuty przed/po w opisie PR (1440, 1024, 768, 390, 360, jasny i ciemny).
7. `docs/STAN.md` zaktualizowany (`/koniec-sesji`).

## 12. Dodatki (decyzja Krystiana 14.11.2026)

### 12.1 „Otwarte teraz” przy każdym punkcie (TD1 logika, TD1/TD4 widok)
- Logika w `lib/tech/hours.ts`, czysta funkcja `getOpeningStatus(point, now)` z testami, strefa `Europe/Warsaw` (także zmiana czasu w marcu i październiku).
- Komunikaty (dosłownie): „Otwarte do 17:00” · „Zamykamy za 25 min” (ostatnie 30 min) · „Otwieramy dziś o 9:00” · „Zamknięte · otwieramy jutro o 9:00” · „Zamknięte · otwieramy w poniedziałek o 9:00”. Zielona kropka tylko przy „Otwarte”.
- Święta ustawowe liczone w kodzie (stałe + Wielkanoc, Boże Ciało; od 2025 także Wigilia 24.12) i dodatkowe dni zamknięcia z `prokom.ts` → `closures: { date: 'YYYY-MM-DD'; note: string }[]` (np. inwentaryzacja). W taki dzień: „Zamknięte dziś (święto) · otwieramy …”.
- Gdzie: pasek marki (punkt najbliższy otwarcia albo oba skrótem), `PointCard`, strony lokalne, ekran sukcesu zgłoszenia przy wybranym punkcie, arkusz Menu na telefonie.
- Renderowanie: status liczony po stronie klienta po hydratacji (bez zgadywania na serwerze), wcześniej szkielet o stałej szerokości (CLS = 0). Odświeżenie co minutę, gdy karta jest widoczna.
- `openingHoursSpecification` w JSON-LD z tych samych danych (bez dni wyjątkowych).

### 12.2 Strona jako aplikacja (PWA) (TD5 PR 3)
- `app/(public)/manifest.ts` → `/manifest.webmanifest`: nazwa „PRO-KOM Tech”, krótka „PRO-KOM Tech”, `start_url: '/?src=pwa'`, `scope: '/'`, `display: 'standalone'`, kolory z tokenów (tło `--bg`, `theme_color` jasny/ciemny przez `<meta name="theme-color" media=…>`), ikony 192/512, wersja `maskable`, skróty: „Zgłoś naprawę” → `/zgloszenie`, „Status naprawy” → `/track`, „Punkty” → `/punkty-serwisowe`.
- iOS: `apple-touch-icon` 180, `apple-mobile-web-app-capable`, styl paska stanu, `viewport-fit=cover` i bezpieczne marginesy (`env(safe-area-inset-*)`) dla TabBar.
- Manifest i meta podpinane **tylko w layoucie publicznym** — panele bez zmian.
- Service worker `public/sw.js` minimalny i bezpieczny: obsługuje wyłącznie stronę offline (`/offline` w skórce: „Brak połączenia”, telefon serwisu, godziny z ostatniego wczytania). **Nie keszuje** HTML, `/api/**`, `/panel/**`, `/admin-panel/**`, `/client/**`, `/_next/data/**` ani niczego z ciasteczkami. Rejestrowany tylko na stronach publicznych, po `load`. Wersjonowany, z procedurą wyrejestrowania opisaną w `WDROZENIE.md`.
- `InstallHint` w arkuszu Menu: na Androidzie przycisk przez `beforeinstallprompt`, na iOS instrukcja „Udostępnij → Do ekranu początkowego”; ukryty, gdy strona działa jako zainstalowana. Żadnych wyskakujących banerów.
- Ikony z oficjalnego znaku PRO-KOM TECH (do tego czasu z rysunku z prototypu, wymiana jednym plikiem).
- Analityka (jeśli wejdzie): `src=pwa` pozwala policzyć wejścia z ikony.

### 12.3 „Jak przygotować sprzęt do serwisu” (TD5 PR 3)
- Strona `/jak-przygotowac-sprzet` z zakładkami: Telefon / Tablet, Laptop / Komputer, Konsola, Smartwatch. Kroki z krótkim „dlaczego”:
  kopia zapasowa (iCloud/Google/komputer) · kod odblokowania albo wzór (podajesz przy przyjęciu, albo naprawa bez testu po naprawie) · wyłączenie „Znajdź mój iPhone” / ochrony przed kradzieżą — tylko gdy serwis poprosi, z informacją, że bez tego niektóre naprawy są niemożliwe · konto Google na Androidzie (FRP) — znać login i hasło · wyjęcie karty SIM i karty pamięci · zdjęcie etui i szkła (szkło Hammer Glass założymy nowe) · ładowarka do laptopa · opis usterki i kiedy występuje · dowód zakupu przy gwarancji.
- Teksty zgodne z zasadami §8 (bez cen, bez obietnic czasu). Każdy krok sprawdzany z serwisem przed publikacją.
- Wykorzystanie: link w kroku 5 formularza i na ekranie sukcesu (skrót 4 najważniejszych punktów jako `PrepChecklist`), na `/track` przy statusie „Przyjęte”, w FAQ i w stopce (Informacje). Opcja „Wydrukuj” (styl druku).
- SEO: tytuł „Jak przygotować telefon lub laptop do serwisu | PRO-KOM Tech”, JSON-LD `Article` + `BreadcrumbList` (bez `HowTo` — Google nie pokazuje już tych wyników).

### 12.4 Strony konkretnych napraw `/naprawy/[slug]` (TD5b)
- Dane w `frontend/config/naprawy.ts`: `slug, title, h1, device (kategoria z KONTRAKT §1.1), usterka (kod z wizard-data), intro, objawy[], przebieg[], czas (tekst potwierdzony przez serwis albo null), gwarancja (tekst albo null), naMiejscu (boolean|null), faq[], powiazane[], published, verified`. Strona publikuje się tylko przy `published && verified` (na stagingu z ramką przy `NEXT_PUBLIC_TECH_DRAFT=1`).
- **Jedna strona na naprawę, nie na miasto.** Oba punkty w jednym bloku („Gdzie oddać”: karty z `OpeningStatus`). Żadnych wariantów „… Rabka” i „… Zakopane” tej samej naprawy (ryzyko doorway pages). Miasto w tytule tylko w formie „Rabka-Zdrój i Zakopane” (albo samo Rabka-Zdrój do publikacji Zakopanego).
- Szablon `RepairPage`: hero (H1, 2–3 zdania, „Zgłoś tę naprawę” → `/zgloszenie?category=…&usterka=…`), objawy, jak przebiega naprawa (kroki), ile trwa (tylko potwierdzone), gwarancja, „Zanim przyjdziesz” (`PrepChecklist` dla urządzenia), Hammer Glass przy ekranach telefonów, FAQ (3–5 unikalnych pytań), powiązane naprawy, CTA. Bez cen.
- Treść: minimum ok. 400 słów własnego tekstu na stronę, każda inna (test: wspólny tekst między stronami < 30% poza blokami szablonu). Lepiej 6 dobrych niż 12 słabych.
- Kandydaci (wybiera Krystian z serwisem, start do 12): wymiana ekranu iPhone · wymiana ekranu Samsung · wymiana baterii w telefonie · naprawa gniazda ładowania · telefon po zalaniu · wymiana tylnej szybki iPhone · laptop się przegrzewa (czyszczenie i pasta) · wymiana matrycy w laptopie · wymiana klawiatury w laptopie · laptop się nie włącza · wymiana dysku na SSD / przyspieszenie komputera · czyszczenie konsoli PS5/PS4.
- Linkowanie: hub `/uslugi` i strony urządzeń (TD5) linkują do napraw swojego urządzenia; kreator po wyborze usterki pokazuje „Dowiedz się więcej” (jeśli strona istnieje); blog — linki z pasujących wpisów (bez zmiany treści wpisów, tylko blok „Powiązana naprawa” w szablonie wpisu po tagu/kategorii).
- SEO: tytuł np. „Wymiana ekranu iPhone — Rabka-Zdrój i Zakopane | PRO-KOM Tech”, opis 120–155, JSON-LD `Service` (provider = punkty opublikowane, `areaServed` z listy miejscowości) + `FAQPage` + `BreadcrumbList`, sitemap tylko opublikowane.

### 12.5 Pomiar (Umami, wspólny dla linii PRO-KOM) (TD1 skrypt, zdarzenia w sesjach TD2–TD5, kontrola w TD6)
- Ta sama instancja Umami co strony z prokom-web (bez ciasteczek, bez zapisu na urządzeniu, dane na serwerze PRO-KOM → bez banera zgód). Skrypt tylko w layoucie publicznym, tylko gdy ustawione `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (produkcja), ładowany `defer`, ścieżka przez Nginx jak w prokom-web (`/_s/script.js`). Panele bez skryptu (test).
- Zdarzenia (nazwy wiążące): `telefon_klik` (miejsce), `zgloszenie_start` (źródło: kreator / przycisk / strona naprawy), `zgloszenie_krok` (nr), `zgloszenie_wyslane` (kategoria, dostawa, punkt), `zgloszenie_blad` (typ: walidacja / 429 / sieć / 5xx — **bez danych osobowych**), `kontakt_wyslany` (temat), `status_sprawdzony` (wynik: znaleziono / nie), `nawigacja_klik` (punkt, aplikacja), `kreator_usterka` (urządzenie, usterka), `pwa_start`, `poradnik_otwarty`.
- `zgloszenie_blad` jest też alarmem: jeśli w Umami pojawia się wiele błędów 5xx, coś jest nie tak z backendem — sprawdzić w pierwszym tygodniu codziennie.
- *Uwaga (KONTRAKT §1.3): przy awarii Redisa backend nie zwraca 5xx, tylko nie odpowiada — front kończy żądanie po timeoucie. Zgłaszamy to jako `zgloszenie_blad` z typem `timeout` (dopisany do listy typów), żeby alarm złapał też ten przypadek.*
- Raport dla szefa raz w miesiącu (lista w STAN): wejścia, zgłoszenia ze strony, telefony z telefonu, najczęstsze usterki z kreatora, punkt (Rabka/Zakopane), źródła wejść.

### 12.6 „Moje naprawy” w przeglądarce (TD3 PR 3)
- Po sprawdzeniu statusu albo wysłaniu zgłoszenia pole „Zapamiętaj na tym urządzeniu” (domyślnie **wyłączone**, bo telefon może być wspólny). Zapis w `localStorage['pk-tech-naprawy']`: numer, 4 cyfry telefonu, nazwa urządzenia, data, ostatni status. Maks. 5 pozycji, automatyczne usunięcie 90 dni po statusie „Wydane”.
- Na `/track` i w arkuszu Menu: „Twoje naprawy” — karta z ostatnim znanym statusem i przyciskiem „Odśwież” (zapytanie do API dopiero po kliknięciu albo przy wejściu na `/track`, nie w tle). Przycisk „Usuń z tego urządzenia” przy każdej i „Usuń wszystkie”.
- Odczyt i zapis w `try/catch` (tryb prywatny), brak danych = brak sekcji. Nic nie trafia do backendu ani do Umami.
- *Uwaga (zgodność z backendem, 14.11.2026): backend nie ma statusu „Wydane”. Koniec naprawy to `is_finished = true` w odpowiedzi `/track` (statusy `picked_up`, `delivered`, `shipped`; etykiety „Odebrane”, „Wysłane”) — od tego liczymy 90 dni. Sprawy przerwane (`is_interrupted`) liczymy tak samo.*

### 12.7 Ekran po wysłaniu zgłoszenia (TD3 PR 2)
- `SuccessCard`: numer (kopiuj), kod QR generowany w przeglądarce (biblioteka bez zależności sieciowych, np. `qrcode`) z adresem `https://prokomserwis.pl/track?ref=<numer>` — **bez cyfr telefonu w adresie**; „Udostępnij” (Web Share API, gdy brak — kopiuj link), „Zapisz jako obraz” (PNG karty: logo, numer, QR, punkt i jego godziny). Wybrany punkt z `OpeningStatus` i `NavigateButtons`. `PrepChecklist` (§12.3) i 3 kroki „co dalej”.
- *Uwaga (KONTRAKT §1.2): numer ma ukośniki (`PROKOM/RMA/4/2026`), więc w adresie QR i linku „Udostępnij” musi być `encodeURIComponent(numer)`.*

### 12.8 „Nawiguj do punktu” (TD4 PR 1)
- `NavigateButtons` przy każdym opublikowanym punkcie z adresem (karta, strona punktów, strony lokalne, ekran sukcesu): Mapy Google (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`), Mapy Apple (`https://maps.apple.com/?daddr=lat,lng`), Waze (`https://waze.com/ul?ll=lat,lng&navigate=yes`). Na telefonie jeden przycisk „Nawiguj” z arkuszem wyboru, na komputerze link do Map Google. Obok `parkingNote` z `prokom.ts` (pokazywane tylko, gdy wypełnione).

### 12.9 Komunikat i sekcja zaufania (TD1 komunikat, TD2/TD4 sekcja)
- `prokom.ts` → `notices: { id; text; href?; from: 'YYYY-MM-DD'; to: 'YYYY-MM-DD'; points?: ('rabka'|'zakopane')[] }[]`. `NoticeBar` nad kapsułą pokazuje komunikat aktywny dziś (Europe/Warsaw), z zamknięciem zapamiętanym per `id` (localStorage). Bez aktywnego komunikatu — nic (zero miejsca). Maks. jeden naraz. Zmiana = commit w `prokom.ts` i deploy (bez CMS).
- `DataSafety`: krótka sekcja „Twoje dane są bezpieczne” (na głównej przy procesie, na `/jak-przygotowac-sprzet`, na stronach napraw telefonów): co serwis robi przy naprawie (np. dostęp tylko do testu po naprawie), czego nie robi, kopia zapasowa po stronie klienta, możliwość oddania bez kodu z ograniczonym testem. **Treść tylko po potwierdzeniu przez serwis/szefa** (§10); do tego czasu sekcja ukryta flagą.

### 12.10 Naprawa wysyłkowa `/naprawa-kurierem` (TD5 PR 3)
**Co dziś robi system (sprawdzone w kodzie 14.11, bez zmian backendu):**
- Formularz przyjmuje `delivery_method` i `return_method` = `courier`; przy kurierze adres klienta (ulica i miasto) jest wymagany — to adres zwrotny.
- Mail potwierdzający zgłoszenie (`communications/services/send.py`) przy kurierze podaje adres serwisu do nadania (z `SERWIS_PRINT_*`, domyślnie ul. Orkana 16B, 34-700 Rabka-Zdrój), prosi o staranne zapakowanie i mówi: **wysyłkę do serwisu opłaca klient, odesłanie po naprawie jest po stronie serwisu**, numer listu przewozowego można dodać w koncie klienta.
- Konto klienta ma pole na numer przesyłki i przewoźnika (InPost-kurier, DPD, DHL, GLS, FedEx, UPS). Numeru przesyłki zwrotnej klient dziś online nie widzi (WYJATKI).
- Paczkomaty: nie odbieramy i nie nadajemy (decyzja 14.11) — strona mówi to wprost.

**Dane strony z jednego miejsca** — `prokom.ts`:
```ts
export const courierService = {
  published: false,                 // true dopiero po odpowiedziach szefa (§10)
  address: 'rabka',                 // punkt, na który się wysyła (tylko opublikowany)
  inboundPaidBy: 'client' as const, // z maila systemu — do potwierdzenia
  returnPaidBy: 'service' as 'service' | 'client' | null,
  returnIfDeclined: null as null | 'service' | 'client', // rezygnacja po wycenie
  payment: null as null | string[], // np. ['przelew przed odesłaniem'] — po decyzji szefa
  area: null as null | 'polska' | 'okolica',
};
```
Komponenty czytają te pola; pole `null` = zdanie się nie pojawia (strona nie zgaduje). Ten sam tekst „kto płaci” w krótkiej wersji widać w kroku 2 formularza po wybraniu „Kurier” i w kreatorze.

**Treść strony (kolejność sekcji):**
1. Hero: H1 „Naprawa wysyłkowa — wyślij sprzęt kurierem”, 2 zdania (dla kogo: daleko od Rabki i Zakopanego, nie masz czasu przyjechać), przyciski „Zgłoś naprawę kurierem” → `/zgloszenie?dostawa=kurier` i „Jak spakować”.
2. „Jak to działa” — 6 kroków (`Steps`): zgłoś online i wybierz „Kurier” → dostajesz e-mail z numerem zgłoszenia i adresem → zapakuj i **włóż do paczki kartkę z numerem zgłoszenia i telefonem** → nadaj dowolnym kurierem pod adres serwisu (nie do paczkomatu), numer przesyłki możesz dodać w koncie klienta → diagnoza i wycena, naprawa dopiero po Twojej zgodzie → odsyłamy na adres ze zgłoszenia (+ sposób płatności z `payment`, jeśli ustalony).
3. „Kto płaci za przesyłki” — tabela z `courierService` (do serwisu / z powrotem / przy rezygnacji po wycenie). Pola `null` → wiersz ukryty, a przy braku wszystkich — sekcja ukryta.
4. „Jak spakować” — lista z ikonami: telefon/tablet w pudełku lub sztywnym kartonie, owinięty folią bąbelkową, bez luzu (potrząśnij — nic nie może się przesuwać); laptop: zamknięty, w kartonie min. ok. 5 cm wypełnienia z każdej strony, nie w samej kopercie/torbie; ładowarka tylko, gdy usterka dotyczy ładowania; bez etui, karty SIM i karty pamięci; kartka z numerem zgłoszenia w środku; przy droższym sprzęcie warto zadeklarować wartość przesyłki u przewoźnika.
5. „Czego nie wysyłać” — urządzenie ze spuchniętą lub uszkodzoną baterią (przewoźnicy zwykle nie przyjmują uszkodzonych baterii litowych — zadzwoń, doradzimy), sprzęt po świeżym zalaniu bez wcześniejszego kontaktu (liczy się czas — lepiej zadzwonić), akcesoria niezwiązane z usterką.
6. „Przygotuj sprzęt” — `PrepChecklist` (§12.3) + `DataSafety` (§12.9, gdy zatwierdzona).
7. „Gdzie wysłać” — adres punktu z `courierService.address` i `prokom.ts` (godziny odbioru paczek = godziny punktu), bez paczkomatu.
8. FAQ (4–6): Czy mogę wysłać przez paczkomat? (nie) · Ile trwa naprawa wysyłkowa? (bez obietnic czasu: zależy od naprawy + dni przesyłki) · Co, jeśli nie zgodzę się na wycenę? (z `returnIfDeclined`) · Czy sprzęt jest ubezpieczony w drodze? (ubezpieczenie zależy od przewoźnika i zadeklarowanej wartości — bez obietnic serwisu) · Jak sprawdzę status? (`/track` z numerem i 4 cyframi telefonu) · Czy muszę mieć konto? (nie; konto pozwala dodać numer przesyłki).
9. CTA.

**SEO:** tytuł „Naprawa wysyłkowa telefonów i laptopów — serwis kurierem | PRO-KOM Tech” (≤ 60 znaków po skróceniu w teście), opis 120–155, JSON-LD `Service` (`serviceType` „Naprawa wysyłkowa elektroniki”, `areaServed` = Polska tylko przy `area: 'polska'`) + `FAQPage` + `BreadcrumbList`. W sitemap tylko przy `published`.
**Linkowanie:** hub `/uslugi` (kafel „Nie możesz przyjechać? Wyślij kurierem”), krok 2 formularza i kreatora (przy opcji „Kurier” link „Jak to działa?” otwierany w arkuszu, bez wychodzenia z formularza), strony urządzeń (blok przed CTA), FAQ ogólne, stopka (Informacje), `/obslugiwane-miejscowosci` (dopisek „Dalej? Naprawa wysyłkowa”).
**Pomiar:** `kurier_strona` (wejście), `zgloszenie_start` ze źródłem `kurier`.

### 12.11 Blog: kategorie i porządek (TD5 PR 2)
**Stan (sprawdzony 14.11):** `lib/blog-posts.ts` ma 51 obiektów, ale slug `na-co-uwazac-przy-zakupie-sprzetu-poleasingowego` jest dwa razy (kategoria Poleasing, linie ok. 1717 i 3039) → 50 wpisów. Kategorie w danych (9): Naprawa telefonów 9, Akcesoria GSM 5, Sklep GSM 4, Laptopy 6, Komputery 5, Gaming 4, Drukarki 8, Poleasing 3(+1 dubel), Sprzęt biznesowy 4. Filtr kategorii działa tylko w przeglądarce (bez adresów), więc żadne stare adresy kategorii nie istnieją — nie potrzeba 301. 17 wpisów ma `relatedServiceHref` na usuwane `/akcesoria` (7) i `/oferta` (10). W treściach brak cen, WhatsAppa i paczkomatu. Słowo „sklep” w treściach dotyczy sklepów stacjonarnych PRO-KOM — zostaje.

*Uwaga (przeliczone w kodzie 14.11.2026, Node): w `BLOG_POSTS` jest **49 obiektów = 48 unikalnych wpisów** (nie 51/50). Liczby kategorii wyżej są dokładne (suma 49 z dublem). Dubel linkuje do `/oferta`, więc unikalnych wpisów z linkiem do usuwanych stron jest **16** (`/akcesoria` 7, `/oferta` 9). Po mapowaniu: telefony 16, laptopy i komputery 15, porady zakupowe 9, drukarki 8 — próg „≥ 6 na kategorię” spełniony. W §6 „50 wpisów” czytaj jako 48.*

**Zasady:** treści wpisów (tytuł, opis, treść, FAQ, daty) **bez zmian**. Zmiany tylko w danych porządkowych: usunięcie drugiego obiektu zdublowanego wpisu (pierwszy zostaje, adres się nie zmienia) i nowa warstwa `frontend/lib/tech/blog-taxonomy.ts` — bez edycji pól w `blog-posts.ts`.

**4 kategorie publiczne** (adres `/blog/kategoria/<slug>`):
| slug | Nazwa | Wpisy (mapowanie) |
|---|---|---|
| `telefony` | Telefony i tablety | Naprawa telefonów, Akcesoria GSM + `oryginalne-czesci-samsung-czy-zamienniki`, `jak-rozpoznac-oryginalne-czesci-w-serwisie-gsm` |
| `laptopy-i-komputery` | Laptopy i komputery | Laptopy, Komputery, Gaming |
| `drukarki` | Drukarki | Drukarki |
| `porady-zakupowe` | Porady zakupowe | Poleasing, Sprzęt biznesowy, pozostałe ze „Sklep GSM” (`gdzie-kupic-akcesoria-gsm-rabka-zdroj`, `dlaczego-warto-kupowac-akcesoria-gsm-w-sprawdzonym-sklepie`) |
`blog-taxonomy.ts`: mapa stara kategoria → nowa, nadpisania per slug, a dla każdej nowej kategorii: nazwa, wstęp, powiązane strony (urządzenia, naprawy z §12.4, `/naprawa-kurierem`), domyślny link „Powiązana usługa”. Test: każdy wpis należy do dokładnie jednej kategorii, żadna kategoria nie ma mniej niż 6 wpisów, brak zdublowanych slugów w `BLOG_POSTS`.

**Linki usług we wpisach:** `relatedServiceHref` = `/akcesoria` albo `/oferta` → zastępowany w czasie renderowania domyślnym linkiem kategorii (telefony → `/serwis-telefonow`, laptopy i komputery → `/serwis-laptopow` lub `/serwis-komputerow` wg starej kategorii, porady zakupowe → `/uslugi`; Hammer Glass/akcesoria telefonu → `/hammer-glass`). Pozostałe linki bez zmian. Dodatkowo blok „Powiązana naprawa” (strona z §12.4, gdy opublikowana i pasuje tag lub kategoria).

**Strona kategorii:** okruszki, H1 = nazwa, wstęp (poniżej — do akceptacji Krystiana), wyróżniony wpis (`featured` albo najnowszy), lista wpisów (karty jak na `/blog`, najnowsze pierwsze, bez stronicowania przy < 24 wpisach), boks „Masz taki problem? Zgłoś naprawę” z linkami do napraw i stron urządzeń kategorii, CTA. Tytuł „<Nazwa> — porady serwisu | PRO-KOM Tech”, opis 120–155, kanoniczny, JSON-LD `CollectionPage` + `ItemList` + `BreadcrumbList`, w sitemap.
**`/blog`:** pasek kategorii jako linki (adresy, nie filtr JS), wyszukiwarka po tytule i tagach zostaje (w przeglądarce). Tagi nie dostają własnych stron (za mało treści).
**Wpis:** okruszki Blog → Kategoria → wpis, kategoria jako link, `BlogPosting` z `articleSection` = nowa kategoria (bez zmiany `datePublished`/`dateModified`), powiązane wpisy wg `relatedSlugs`, a gdy puste — z tej samej nowej kategorii.

**Wstępy kategorii (projekt do akceptacji):**
- *Telefony i tablety:* „Pęknięty ekran, słaba bateria, telefon, który nie chce się ładować albo przeszedł zalanie — tu zebraliśmy porady z codziennej pracy naszego serwisu w Rabce-Zdroju. Piszemy, co możesz sprawdzić sam, kiedy naprawa ma sens i jak chronić telefon, żeby rzadziej trafiał do serwisu. Jeśli problem nie znika, zgłoś naprawę online — wycenę dostaniesz przed rozpoczęciem pracy.”
- *Laptopy i komputery:* „Laptop się przegrzewa, komputer zwalnia albo sam się restartuje? W tej części bloga wyjaśniamy najczęstsze usterki laptopów i komputerów stacjonarnych, podpowiadamy, kiedy opłaca się modernizacja, a kiedy naprawa, i jak przygotować sprzęt do pracy lub grania. Poradniki piszemy na podstawie napraw, które robimy na co dzień.”
- *Drukarki:* „Drukarka nie drukuje, brudzi kartki albo zgubiła Wi-Fi — zanim zadzwonisz do serwisu, sprawdź nasze poradniki. Opisujemy najczęstsze usterki drukarek atramentowych i laserowych, proste rozwiązania do zrobienia samemu i to, jak dbać o drukarkę, żeby rzadziej się psuła.”
- *Porady zakupowe:* „Nowy czy poleasingowy laptop? Jaki komputer do firmy albo pracy zdalnej? Na co uważać przy zakupie akcesoriów do telefonu? Zebraliśmy porady, które dajemy klientom w naszych sklepach w Rabce-Zdroju i Zakopanem — bez reklam konkretnych ofert i bez cen.”
(Wstęp Zakopanego w tekście tylko, gdy punkt `published`; do tego czasu „w Rabce-Zdroju”.)

**Pomiar:** `blog_kategoria` (slug), `blog_powiazana_naprawa_klik`.
