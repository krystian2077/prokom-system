# Wdrożenie nowego wyglądu PRO-KOM Tech — lista kontrolna

Stan na 16.11.2026, po pełnym audycie (treść, wygląd, działanie, gotowość produkcyjna) i poprawkach
#92–#96. Kolejność z audytu: **29.11 przełączenie 1:1 z `master` na VPS** (stara strona, MIGRACJA §8),
**nowy wygląd (TD6 PR 3 release) najwcześniej tydzień później** (rekomendacja: ndz 6.12, zapas 13.12)
— dwie duże zmiany naraz = przy awarii nie wiadomo, co cofać.

## 1. Kod — zrobione (develop)
- Audyt 16.11: 89 adresów z sitemapy + 404, 390/1440 w obu motywach (472 zrzuty), 192 załadowania
  z konsolą i siecią, 5 zgłoszeń testowych na lokalnym backendzie, axe 40 przebiegów, LCP na telefonie.
- Poprawione: przewijanie w bok na telefonie (#92, #93 + test `bez-poziomego.spec.ts` na całej sitemapie),
  MacBook z logo w hero (#92), kropka w H1 (#93), `sharp` w obrazie (#93), kurier tylko do Rabki (#94),
  HSTS, cache plików, OG na `/`, H1 z serwera na `/zgloszenie` i `/track`, a11y kreatora, favicon,
  Umami/SW/CSP/draft jako build-argi, kontener bez roota, lint i vitest w CI (#95), zepsute kotwice,
  regulamin zgodny z kurierem i diagnozą, soboty tylko w Rabce, blog bez zepsutych zdań i bez kontaktów
  na sztywno, kapsuła 1024–1440, godziny i adres na telefonie, ilustracje `/uslugi`, typografia (myślnik,
  „·”), błąd hydratacji na `/naprawy/naprawa-smartwatcha`, fokus w formularzu, `hammer_glass_interest: null`
  dla laptopa (#96).
- Testy: vitest 442, e2e 848 (836 ✔ przed ostatnimi poprawkami testów; pozostałe — sekcja 4), strefa OK.

## 2. Decyzje Krystiana / szefa (blokują albo zmieniają release)
- [ ] **Backend: `kombu` nieprzypięte** (`backend/requirements.txt`: `celery<5.5`, `redis<5.3`, a świeża
  instalacja bierze kombu 5.7, które wymaga redis-py ≥ 6.1 → Celery nie zleca zadań: brak powiadomień
  o zgłoszeniach, rejestracja konta wisi). Lokalnie potwierdzone. **Przed 29.11 sprawdzić obraz backendu
  na VPS** (`pip show kombu redis` w kontenerze) i dopisać `kombu>=5.4,<5.6` — backend = strefa zakazana,
  potrzebna zgoda i wpis w `WYJATKI.md`.
- [ ] **Blog o sklepie i akcesoriach** (5–7 wpisów: „sklep GSM”, ładowarki GaN, etui, laptopy poleasingowe,
  składanie PC) — CLAUDE.md §5 „bez sklepu” vs SPEC §12.11 (blog zamrożony). Ukryć z 301 na `/hammer-glass`
  lub `/blog`, albo przepisać.
- [ ] **SMS:** „O statusie informujemy też telefonicznie albo SMS-em” (`ProcessSection`, `HomeFaq`) —
  backendowy `send_sms` to atrapa. Czy serwis wysyła SMS-y ręcznie?
- [ ] **Regulamin do prawnika** (gwarancja 3 mies. vs „szczegóły przy odbiorze”, 5 zł/dzień przechowania
  = cena na stronie, karta w obu salonach?, §2 i rękojmia). Poprawki 16.11 usunęły tylko sprzeczności.
- [ ] Zakopane „kilka kroków od Krupówek i Równi Krupowej” — potwierdzić.
- [ ] `/track`: „4 ostatnie cyfry telefonu” nie działają dla starszego zgłoszenia, gdy klient (ten sam
  e-mail) podał później inny telefon (backend nadpisuje `client.phone`) — backlog `WYJATKI.md`.
- [ ] Root layout (`app/layout.tsx`, strefa): tytuł/robots 404 po hydratacji, canonical na `/` dla paneli,
  Google GSI (101 kB) na każdej stronie publicznej — wyjątek w `WYJATKI.md` albo świadomie zostawić.
- [ ] Next 14.2.35: 1 krytyczna + 2 wysokie w `npm audit` (poprawki tylko w Next 15/16). Ryzyko ograniczone
  w #95 (bez `remotePatterns` i rewrite `/api/proxy`); akceptacja albo plan aktualizacji (panele też).
- [ ] `public/images/background-remover.zip` (11 MB) i stare zdjęcia sklepu w `public/images/` — usunąć.
- [ ] Wyjątek `globals.css` (#52), akceptacja wyglądu i release przez szefa (Asana).

## 3. Serwer i usługi (poza kodem, tylko Krystian)
- [ ] **GitHub Variables** (produkcja i staging): `*_NEXT_PUBLIC_API_URL`, `*_NEXT_PUBLIC_SITE_URL`
  (`https://prokomserwis.pl`), `*_NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `*_NEXT_PUBLIC_UMAMI_WEBSITE_ID`,
  `*_NEXT_PUBLIC_UMAMI_SRC`, opcjonalnie `*_NEXT_PUBLIC_CSP_REPORT_URI`, `*_NEXT_PUBLIC_TECH_SW`.
- [ ] **prokom-web `tech.conf`:** `location = /_s/script.js` i `/_s/api/send` (wzór `gaming.conf:53-63`),
  `UMAMI_WEBSITES` z ID strony Tech; decyzja www → 301 na domenę bez www.
- [ ] **VPS `.env.prod`:** `SERWIS_PRINT_HOURS=Pn–Pt 9:00–17:00 · Sob 9:00–14:00`, restart backend/celery.
- [ ] **29.11 (MIGRACJA §8):** kopia Hetznera, TTL DNS, rekord A, cert (domena + www), `deploy.sh prod <sha>`,
  smoke, cron kopii prod, heartbeat Better Stack, okno cofnięcia.
- [ ] GHCR: paczka `prokom-tech-backend` → prywatna. Google OAuth: dozwolone originy po przełączeniu.
- [ ] Polityka prywatności: hosting webh.pl (Polska) po 29.11.

## 4. Release wyglądu (dzień D)
1. Staging z `develop` (obraz ze `NEXT_PUBLIC_TECH_DRAFT=1`): przejść całość na prawdziwym Androidzie
   i iPhonie (instalacja PWA, zgłoszenie testowe, `/track`, ciemny motyw).
2. Testy, które lokalnie zależą od środowiska: `konto.spec` (rejestracja — wymaga działającego Celery,
   patrz kombu), `panele.spec` w worktree bywa niestabilny przez hash kroju — na czystym checkoucie zielony.
3. TD6 PR 3 (`develop` → `master`), squash, CI, `deploy.sh prod <sha>`, smoke: `/`, `/zgloszenie` (wysłać
   zgłoszenie testowe i usunąć w panelu), `/track`, `/panel/login`, `/client/login`, `robots.txt`, `sitemap.xml`.
4. Po wdrożeniu: Search Console (sitemap, 308 `/akcesoria` `/oferta` `/naprawy`, wyniki z elementami
   rozszerzonymi), wizytówki Google obu punktów z tym samym NAP co `config/prokom.ts`, Umami (zdarzenia
   przychodzą, w panelu brak skryptu), prośby o opinie.

## 5. Po starcie (P2 z audytu)
Opisy 28 wpisów bloga > 155 znaków i 7 tytułów > 60; brotli w Nginx; `ploter.mp4` (21,6 MB) do 720p;
CSP z report-only na wymuszaną po zebraniu raportów; optyczna wielkość logo marek (Dell, HP, Apple);
karty marek z logotypem bez nazwy — równa wysokość; `/o-firmie` karty zasad 04/05; puste prawe połowy
hero `/naprawa-kurierem` i `/punkty-serwisowe`; kolor tekstu na czerwonych przyciskach; zamykanie
wyszukiwarki na telefonie („×”); fokus po Esc w wyszukiwarce; wyszukiwarka dopasowuje po prefiksie;
odświeżenie `/zgloszenie` gubi dane (decyzja); imię w `/kontakt` wymagane (backend nie wymaga).
