# PRO-KOM Tech — plan sesji Claude Code z promptami (14.11.2026)

Duże sesje, każda kończy się kilkoma PR-ami piętrowymi do `develop` (preferencja Krystiana). Czas w wieczorach pracy z Claude Code (szacunek, bez bufora).
Dokumenty: `docs/tech/00-INDEKS.md`. Zasady: `CLAUDE.md`. Stan: `docs/STAN.md`.

## 1. Kolejność i zależności
| # | Sesja | PR-y | Zależy od | Wieczory |
|---|---|---|---|---|
| 1 | **T0** — start, porządki, rozpoznanie, inwentaryzacja | 2 | — | 0,75 |
| 2 | **TM** — migracja 1:1 na VPS (staging → niedziela) | 1 + 1 w prokom-web | T0, Gaming stabilny | 2 + okno |
| 3 | **TD1** — fundament i powłoka | 2 | TM | 2,75 |
| 4 | **TD2** — strona główna + kreator | 2 | TD1 | 3 |
| 5 | **TD3** — kontrakt, zgłoszenie, status | 3 | TD1 | 3 |
| 6 | **TD4** — punkty, kontakt, o firmie, strony lokalne, SEO, 301 | 2 | TD1 (TD3 dla formularzy) | 2,75 |
| 7 | **TD5** — naprawy, Hammer Glass, FAQ, blog, prawne, 404, PWA, poradnik | 3 | TD1 | 2,5 |
| 7b | **TD5b** — strony konkretnych napraw `/naprawy/…` | 1 | TD5, lista napraw od serwisu | 1,5 |
| 8 | **TD6** — QA, sprzątanie, staging → produkcja | 3 | TD2–TD5 | 2 |
| | **Razem** | | | **≈ 20,25 + niedziela migracji** |

Dlaczego więcej niż 12–14 z planu czatu: po przeglądzie kodu doszły izolacja od paneli (wspólny projekt Next), połączenie dwóch formularzy zgłoszenia (1281 + 572 linii), testy kontraktu, siedem stron urządzeń i pełne wymagania dla telefonu i tabletu. 14.11 doszły dodatki z SPEC §12 (status godzin przy punktach, PWA, poradnik, strony napraw): +2 wieczory; potem pomiar, „Moje naprawy”, ekran sukcesu z QR, nawigacja, komunikat i sekcja zaufania (§12.5–§12.9): +1 wieczór.

**Poza kodem, przed TD2 (czat projektu):** plansze telefonu i tabletu dla strony głównej, zgłoszenia i punktów (`docs/design/tech/zrzuty/390-*.webp`, `768-*.webp`). Bez nich TD2 składa telefon według `RESPONSYWNOSC.md`. Da się, ale wynik jest mniej przewidywalny.

**Poza kodem, przed TD5b (Krystian z serwisem):** wybór do 12 napraw z SPEC §12.4 i dla każdej potwierdzony czas, gwarancja, czy na miejscu. Bez tego TD5b robi szablon i strony z `verified: false` (nie publikują się).

## 2. Kalendarz (rekomendacja; kolejność wobec Biznesu i pro-kom.eu ustala Krystian)
| Kiedy | Co |
|---|---|
| do 20.11 | Gaming ma pierwszeństwo. Tech: tylko wgranie pakietu (PR 1 z T0, 10 minut) |
| 21–22.11 | **T0** |
| 23–27.11 | **TM**: PR infrastruktury, PR w prokom-web (Nginx), próba generalna na stagingu |
| **ndz 29.11** | **przełączenie** (zapas: 6.12) |
| od 30.11 | TD1 → TD2/TD3 → TD4 → TD5 → TD5b → TD6, w wieczory, gdy Biznes nie ma pracy w kodzie (Biznes czeka na materiały szefa) |
| przed świętami | staging z całą nową stroną, akceptacja szefa |
| **ndz 3.01 albo 10.01.2027** | produkcja nowego wyglądu (nie wdrażamy w grudniowym szczycie sprzedaży telefonów) |

Ryzyko: w grudniu jest też nowa pro-kom.eu (plan: do 20.12) i produkcja Biznesu. Przy 3 wieczorach na Tech w tygodniu TD kończy się w połowie stycznia. Migracja (TM) nie zależy od tego, robimy ją w listopadzie.

## 3. Kolejność cięcia przy braku czasu
1. Kolejne strony miejscowości (zostają Rabka-Zdrój i Zakopane).
2. Strony napraw powyżej pierwszych 6 (reszta po produkcji, ten sam szablon).
3. Szyna boczna ≥ 1400 px.
4. Bogate mega menu (zostaje proste rozwijane menu).
5. Ruch dekoracyjny (marquee, pływające telefony) — zostaje statycznie.

**Bez cięć:** strefa zakazana i panele nietknięte, kontrakt, zgłoszenie, status, powłoka, telefon jak aplikacja, tablet, strona główna z kreatorem, punkty, kontakt, `/serwis-telefonow`, SEO techniczne, 301, tryb ciemny.

## 4. Prompty

### T0 — start, porządki, rozpoznanie
```
/zadanie T0 — start przebudowy PRO-KOM Tech i przygotowanie migracji. Bez zmian w kodzie aplikacji.
Przeczytaj CLAUDE.md, docs/tech/00-INDEKS.md, docs/tech/SPEC.md, docs/tech/KONTRAKT-BACKEND.md, docs/tech/MIGRACJA-VPS.md, docs/STAN.md.

PR 1 — docs/tech-pakiet (jeśli Krystian jeszcze nie wgrał pakietu ręcznie):
- pakiet z czatu (CLAUDE.md, docs/, .claude/commands/) jak jest;
- .gitignore: .claude/settings.local.json, .claude/worktrees/, .claire/, tmp/, frontend/.env.local; `git rm --cached` dla śledzonych dziś .claude/settings.local.json, .claude/launch.json (zapytaj, czy launch.json jest potrzebny) i całego .claire/ (pliki zostają lokalnie);
- PR do master (same dokumenty i .gitignore, kod aplikacji bez zmian). Po scaleniu utwórz gałąź develop z master i wypchnij ją — od teraz PR-y idą do develop.

PR 2 — chore/tech-t0 (do develop):
1. scripts/tech/strefa-zakazana.sh: porównuje `git diff --name-only origin/develop...HEAD` (w CI: base PR-a) ze strefą zakazaną z SPEC §2; przepuszcza tylko pliki z tabeli w docs/tech/WYJATKI.md; czytelny błąd z listą plików. Job w .github/workflows/frontend-ci.yml (osobny krok, nie psuje istniejącego buildu). Test: zmiana próbna w backend/ wywala skrypt (pokaż wynik, nie commituj zmiany).
2. Skan sekretów w CAŁEJ historii (najpierw `git fetch --unshallow`, jeśli klon jest płytki): gitleaks (Docker albo binarka, bez dodawania zależności do projektu). Wynik w docs/tech/BEZPIECZENSTWO.md BEZ wartości: plik, commit, typ. Jeśli coś jest — zatrzymaj się: lista sekretów do zmiany (rotacja) i decyzja Krystiana o publicznym repo (repo jest publiczne).
3. docs/tech/LOKALNIE.md: sprawdzone uruchomienie lokalne backendu (SQLite, config.settings.local) i frontendu na porcie 3003 — czy zgłoszenie z /zgloszenie przechodzi lokalnie (czy potrzebny Redis/Celery; jeśli tak — docker-compose.dev.yml tylko z redis i mailpit, porty 63792 i 1027/8027, bez zmian w settings), jak założyć konto pracownika do testów.
4. docs/tech/MAPA-PLIKOW.md: każdy plik strony publicznej (app/(public), sections, components/layout, components/hammer-glass, components/blog, features/zgloszenie, publiczne bloki globals.css — lista selektorów i plików, które ich używają) → nowy komponent/strona z SPEC §6–§7 → sesja TD. Osobno: co z globals.css, kroju (Syne, DM Sans, Unbounded, Plus Jakarta) i lib/theme.ts używają panele — dowód grep.
5. Weryfikacja kontraktu: porównaj docs/tech/KONTRAKT-BACKEND.md z kodem (serializers/public_submit.py, views/track_views.py, services/public_tracking.py, communications/views/inquiry_views.py, common/enums.py, settings throttle). Różnice → popraw KONTRAKT (to dokument, nie backend) i wypisz je w PR. Zapisz prawdziwe przykładowe odpowiedzi (lokalnie) do tests/tech/fixtures/ (dane fikcyjne).
6. docs/tech/INWENTARZ.md (MIGRACJA §2): część z repo (klucze .env bez wartości, które zależą od domeny/serwera; zadania Celery w kodzie; co wysyła maile do klientów) + gotowa lista komend dla Krystiana do uruchomienia na Hetznerze i w DNS (docker ps, du wolumenów, pg_database_size, zadania django_celery_beat, crontab, dig A/AAAA/MX/TXT/NS dla prokomserwis.pl i www, inne usługi na serwerze). Krystian wkleja wyniki BEZ sekretów → uzupełnij tabelę.
7. scripts/vps/anonimizuj.sql — projekt wg MIGRACJA §6 na podstawie modeli (wszystkie tabele z e-mailem, telefonem, nazwiskiem, adresem, tokenami klientów) + zapytania kontrolne. Uruchom na lokalnej kopii z fikcyjnymi danymi.
8. STAN: wynik T0, decyzje do podjęcia (repo publiczne/prywatne, rejestrator DNS, termin TM).
DoD: CI zielone, strefa-zakazana działa, żadnych zmian w backend/ ani frontend/ poza .gitignore i CI.
```

### TM — migracja 1:1 na VPS webh.pl
```
/zadanie TM — migracja prokomserwis.pl z Hetznera na VPS webh.pl, 1:1, wg docs/tech/MIGRACJA-VPS.md. Zero zmian w kodzie aplikacji (backend/ i frontend/app, components, lib). Każdy krok na serwerze, w DNS i w bazie tylko po moim „tak”.
Przeczytaj docs/tech/MIGRACJA-VPS.md, docs/tech/INWENTARZ.md, docs/STAN.md. Sprawdź warunki wejścia z §1 i wypisz je z odhaczeniem; brak któregoś = stop.

PR 1 — chore/tech-vps (do master, bo produkcja wdraża się z master, a workflow obrazów musi być na master; zawiera tylko infrastrukturę — kod aplikacji bez zmian; po scaleniu develop ← master):
1. compose.vps.yml + compose.prod.yml + compose.staging.yml (MIGRACJA §4: usługi, sieć zewnętrzna prokom-proxy tylko dla gateway z aliasem, wolumeny, mem_limit, healthchecki, GUNICORN_CMD_ARGS, staging bez celery i celery-beat). Stary docker-compose.prod.yml i nginx/ zostają bez zmian.
2. gateway/nginx.conf (reguły z nginx/default.conf bez TLS; X-Forwarded-Proto z $http_x_forwarded_proto — wyjaśnij w komentarzu dlaczego; client_max_body_size 20M; static i media z wolumenów).
3. .github/workflows/obrazy.yml: develop → backend + frontend-staging, master → backend + frontend (build args z GitHub Variables/Secrets, nie z repo), tag = pełny sha, push do ghcr.io/krystian2077/prokom-tech-*; paczki prywatne. Obecne CI bez zmian.
4. scripts/vps/: deploy.sh <prod|staging> <sha> (pull, up -d, migrate tylko po potwierdzeniu i kopii na prod, collectstatic, smoke), backup.sh (pg_dump -Fc + tar mediów, sha256, rclone na cel prokom-web, retencja 14 dzienne + 8 tygodniowe), restore.sh (do wskazanej bazy, z potwierdzeniem nazwy stosu), anonimizuj.sql (z T0), smoke.sh (MIGRACJA §7 pkt 3), strona-503/ (statyczna strona techniczna dla Hetznera).
5. docs/tech/WDROZENIE.md: jak wdrożyć staging/prod, jak cofnąć, gdzie leżą .env, jak zalogować serwer do GHCR (token tylko do odczytu), cron kopii, monitoring.
6. Test lokalny: `docker compose -f compose.vps.yml -f compose.staging.yml config`, uruchomienie stosu staging lokalnie na obrazach z Actions z bazą z fixtures, gateway: strona, /api/, /admin/, /static/, /media/, nagłówki X-Forwarded-*. Wynik w PR.

PR 2 — w repo prokom-web (osobna sesja w tamtym folderze, wzór Gaming G16): hosty staging.prokomserwis.pl (hasło, noindex) → prokom-tech-staging-gateway; przygotowane (wyłączone do niedzieli) prokomserwis.pl i www → prokom-tech-prod-gateway; client_max_body_size 20M; certyfikat stagingu. Prompt do tamtej sesji przygotuj w opisie PR 1.

Próba generalna (po scaleniu obu PR, ze mną na żywo): MIGRACJA §6 i §7 — kopia z Hetznera → staging → anonimizacja → kontrola → smoke → pomiar → test odtworzenia kopii. Tabela wyników do STAN.
Na koniec: plan niedzieli z §8 jako lista komend z moimi danymi (bez sekretów), do odhaczania krok po kroku.
```

### TM — niedziela, przełączenie
```
/zadanie TM-PRZELACZENIE — przełączenie prokomserwis.pl na VPS wg docs/tech/MIGRACJA-VPS.md §8. Prowadź mnie krok po kroku: przed każdym krokiem pokaż komendę i czego się spodziewasz, po moim „tak” i wklejeniu wyniku — sprawdź wynik i przejdź dalej. Na każdym kroku pamiętaj o warunku powrotu (§9). Nic nie robisz sam w DNS ani na serwerze.
```

### TD1 — fundament i powłoka
```
/zadanie TD1 — fundament nowej strony publicznej i powłoka PRO-KOM Tech (SPEC §2–§5, §7; RESPONSYWNOSC; wzorzec docs/design/tech).
Najpierw przeczytaj docs/tech/MAPA-PLIKOW.md. Panele i backend nietknięte (strefa-zakazana).

PR 1 — feat/tech-fundament:
1. Narzędzia i testy (zanim zmienisz jakikolwiek wygląd): Vitest (jednostkowe) i Playwright (e2e) jako devDependencies frontendu; tests/tech/panele.spec.ts — zrzuty bazowe ekranów: /panel/login, /client/login, /admin-panel (stan po wejściu bez logowania), /panel po zalogowaniu kontem testowym (lokalnie) w motywie jasnym i ciemnym panelu; test „zmiana motywu strony publicznej nie zmienia data-theme ani prokom-theme”. scripts/tech/zrzuty.mjs, scripts/tech/porownaj.mjs, tests/tech/responsywnosc.spec.ts, tests/tech/literaly.test.ts (RESPONSYWNOSC §6, SPEC §11).
2. Node 22 LTS w frontend/Dockerfile i .github/workflows/frontend-ci.yml (Node 20 bez wsparcia od 30.04.2026); next do najnowszej 14.2.x (bez zmiany wersji głównej), `npm audit` — wynik w PR. Build i panele zielone.
3. frontend/config/prokom.ts (SPEC §5, z polem closures) + frontend/lib/tech/ (hours.ts wg SPEC §12.1: getOpeningStatus, święta ustawowe z Wielkanocą i Wigilią, closures, zmiana czasu; punkty opublikowane; flaga NEXT_PUBLIC_TECH_DRAFT) z testami — m.in. sobota 13:40, niedziela, 24.12, poniedziałek wielkanocny, noc zmiany czasu.
4. frontend/app/(public)/tech.css: tokeny (SPEC §4) pod .tech i html[data-tech-theme="dark"] .tech, baza typografii (clamp), kontener, siatki zakresów (RESPONSYWNOSC §1). Kroje Archivo (wdth) i Manrope przez next/font w app/(public)/layout.tsx. Skrypt motywu (data-tech-theme, pk-theme, system) jako pierwszy element layoutu publicznego.
5. Pomiar (SPEC §12.5): skrypt Umami w layoucie publicznym tylko przy NEXT_PUBLIC_UMAMI_WEBSITE_ID, lib/tech/track-event.ts (nazwy zdarzeń jako typ, no-op bez Umami, zakaz danych osobowych w parametrach — test); test, że panele nie ładują skryptu.
6. JSON-LD z root layoutu → layout publiczny, generowany z prokom.ts (tylko punkty published). Root layout: metadane domyślne „PRO-KOM Tech”, bez zmian dla paneli (sprawdź tytuły stron panelu).
DoD: panele.spec zielony (zero różnic), build, testy.

PR 2 — feat/tech-powloka (wzorzec: T.Naglowek, T.Stopka, T.Logo, T.Mapa w prototypie; zrzuty 1440 i telefon-6-ekranow):
1. components/tech/: TechShell, BrandBar, Capsule (menu SPEC §6, mega menu Naprawy i Punkty z mostkiem i opóźnieniem), SectionRail (≥ 1400), Footer, LinesBand, LegalBar, Logo, NoticeBar (SPEC §12.9, notices z prokom.ts), ThemeToggle, OpeningStatus (komunikaty dosłownie z SPEC §12.1, klient po hydratacji, szkielet o stałej szerokości), OsmMap; telefon: TabBar (Start · Naprawy · Zgłoś · Punkty · Menu), MenuSheet (arkusz, gest, Esc, focus trap, motyw Jasny/Ciemny/Auto), kapsuła chowana przy przewijaniu. Tablet wg RESPONSYWNOSC §3.
2. app/(public)/layout.tsx używa TechShell zamiast ConditionalPublicLayout (stare strony renderują się w nowej powłoce — to OK przejściowo; stary plik zostaje do TD6).
3. Szybka poprawka treści: usuń WhatsApp z sections/MostCommonRepairs.tsx i app/(public)/serwis-drukarek (decyzja 01.11).
DoD (SPEC §11): porownaj.mjs nagłówka i stopki z wzorcem 1440 w obu motywach, zrzuty 360/390/768/1024/1440/1920, responsywnosc.spec, panele.spec, strefa-zakazana, /przeglad.
```

### TD2 — strona główna i kreator
```
/zadanie TD2 — strona główna wg wzorca #glowna (zrzuty/1440-glowna-*.webp, T.Main w prototypie), telefon i tablet wg RESPONSYWNOSC (i zrzutów 390/768, jeśli są w docs/design/tech/zrzuty).

PR 1 — feat/tech-glowna-1: hero (scena, H1 „Serwis telefonów i komputerów”, podtytuł z punktów opublikowanych, 2 przyciski, 3 obietnice, pasek punktów), pas marek, kreator „Co się zepsuło?” (components/tech/RepairWizard + wizard-data.ts przeniesione z T.Main: DV, usterki per urządzenie, punkty na zdjęciach w % względem kadru, etykieta wybranej usterki; dostarczenie: Rabka-Zdrój, Zakopane tylko published, kurier — BEZ paczkomatu; wynik → /zgloszenie?category=…&usterka=…&punkt=…&dostawa=… wg KONTRAKT §1.4), „Co naprawiamy”. Telefon: kreator krok po kroku na pełnym ekranie. Zdjęcia urządzeń do public/tech/ (WebP/AVIF, wymiary), źródło każdego pliku w frontend/config/media-zrodla.json (do potwierdzenia przez Krystiana — SPEC §10).
Testy: wizard-data (każde urządzenie ma usterki, każdy punkt na zdjęciu ma usterkę z listy, kody kategorii = KONTRAKT §1.1), e2e: wybór urządzenia → usterki się zmieniają → „Dalej” buduje poprawny adres.

PR 2 — feat/tech-glowna-2: najczęstsze naprawy, „Dwa punkty. Jeden serwis.” (PodhaleMap z prototypu, „Sprawdź, gdzie masz bliżej” — tabela miejscowość → punkt w lib/tech, Zakopane tylko published), „Od zgłoszenia do odbioru” (5 kroków + panel statusu z etapami z KONTRAKT §3), blok Hammer Glass, „Dlaczego”, obsługiwane miejscowości, FAQ, CTA. Sekcje z data-rail-label dla SectionRail.
DoD: SPEC §11 + porownaj.mjs całej strony z 1440-glowna-jasny/ciemny + Lighthouse telefon strony głównej ≥ 90 (wynik w PR).
```

### TD3 — kontrakt, zgłoszenie, status
```
/zadanie TD3 — zgłoszenie naprawy, status i przypisanie naprawy zgodnie z docs/tech/KONTRAKT-BACKEND.md (wygrywa z wzorcem). Wzorzec: #zglos-naprawe, #status-naprawy, telefon-6-ekranow.

PR 1 — feat/tech-kontrakt: frontend/lib/tech/contract.ts (typy + buildSubmitPayload, buildInquiryPayload, mapowanie błędów DRF na pola) + tests/tech/contract.test.ts (KONTRAKT §6) na fixtures z T0. Najpierw testy.
PR 2 — feat/tech-zgloszenie: JEDEN formularz /zgloszenie (RepairForm, 5 kroków jak we wzorcu: urządzenie i usterka → dostarczenie i zwrot (punkt albo kurier z adresem; bez paczkomatu) → folia Hammer Glass (hammer_glass_interest) i kopia danych → dane kontaktowe (preferred_contact: telefon/SMS/e-mail) → podsumowanie i zgoda). model_name wymagany zawsze, brand_name dla telefonu/tabletu/smartwatcha. Punkt przyjęcia do additional_notes (KONTRAKT §2). Parametry z kreatora (§1.4), dane z /clients/me/ dla zalogowanego. Ekran sukcesu: SuccessCard wg SPEC §12.7 (numer, QR bez cyfr telefonu, Udostępnij, Zapisz jako obraz, punkt z godzinami i nawigacją, PrepChecklist). Zdarzenia zgloszenie_start/krok/wyslane/blad (§12.5). Limit 429 i błędy sieci obsłużone. Stary features/zgloszenie/SubmissionForm.tsx i stary page.tsx przestają być używane (usunięcie w TD6). Telefon: krok na ekran, przyklejone „Dalej”.
PR 3 — feat/tech-status: /track (TrackForm + RepairTracker: oś 5 etapów, przerwanie, historia z etykietami backendu, szczegóły bez pustych wierszy, blok serwisu z odpowiedzi API, „Zadzwoń”), /claim-repair (nowa skórka, logika bez zmian). „Moje naprawy” wg SPEC §12.6 (zgoda domyślnie wyłączona, maks. 5, usuwanie, try/catch) na /track i w MenuSheet; testy jednostkowe magazynu i e2e: zapamiętaj → wróć → „Odśwież” → „Usuń”.
e2e: na lokalnym backendzie zgłoszenie → numer → /track pokazuje „Przyjęte”; bez backendu — z fixtures. Ręcznie: zgłoszenie widoczne w panelu pracownika z „Punkt przyjęcia: …” w uwagach.
DoD: SPEC §11 + contract.test zielony + zero zmian w lib/api.ts.
```

### TD4 — punkty, kontakt, o firmie, strony lokalne, SEO
```
/zadanie TD4 — Punkty serwisowe, Kontakt, O firmie, strony lokalne i SEO (SPEC §6, §9; wzorzec #punkty-serwisowe, #kontakt, #o-firmie, #serwis-telefonow-zakopane).

PR 1 — feat/tech-punkty-kontakt: /punkty-serwisowe, /kontakt (InquiryForm wg KONTRAKT §4: e-mail i wiadomość wymagane, telefon zalecany, interest = temat + punkt), /o-firmie (liczby z flagą tylko po potwierdzeniu — SPEC §10, bez zdjęć ludzi). Punkty z prokom.ts, Zakopane tylko published (na stagingu z ramką przy NEXT_PUBLIC_TECH_DRAFT=1). PointCard ze statusem „Otwarte teraz” per punkt (SPEC §12.1), NavigateButtons i parkingNote (§12.8), openingHoursSpecification w JSON-LD. DataSafety (§12.9) za flagą do czasu akceptacji treści. Zdarzenia telefon_klik, nawigacja_klik, kontakt_wyslany.
PR 2 — feat/tech-lokalne-seo: szablon strony lokalnej (lib/tech/local-pages.ts: dane miejscowości, bliższy punkt, dojazd, parking, FAQ lokalne — strona bez unikalnej treści nie publikuje się), strony /serwis-telefonow-rabka-zdroj i /serwis-telefonow-zakopane (ta druga tylko przy published Zakopanego), prawdziwa /serwis-telefonow (usuń przekierowanie z next.config.js), /obslugiwane-miejscowosci; metadane każdej strony (tytuł 30–60, opis 120–155, kanoniczny, OG), JSON-LD (LocalBusiness per punkt, Service, FAQPage, BreadcrumbList — sprawdź w validator.schema.org), sitemap.ts z danych; 301: /akcesoria → /hammer-glass, /oferta → / (next.config.js redirects, permanent) i usunięcie tych stron.
Test: tests/tech/seo.test.ts (każda strona publiczna: 1×H1, tytuł i opis w normie, kanoniczny, JSON-LD parsuje się, sitemap bez stron published:false i bez /akcesoria, /oferta).
DoD: SPEC §11.
```

### TD5 — pozostałe podstrony
```
/zadanie TD5 — pozostałe podstrony w nowej skórce (SPEC §6).
PR 1 — feat/tech-naprawy: /uslugi jako hub „Naprawy” (wszystkie urządzenia), szablon strony urządzenia (hero, typowe naprawy, marki, 4 kroki, FAQ, CTA do /zgloszenie?category=…) i strony: serwis-laptopow, -tabletow, -komputerow, -drukarek, -konsol, -smartwatchy, odzyskiwanie-danych. Treści z obecnych stron przeniesione i poprawione do zasad SPEC §8 (bez cen, WhatsApp, paczkomatu); kategorie = KONTRAKT §1.1.
PR 2 — feat/tech-hammer-blog: /hammer-glass wg wzorca #hammer-glass (wybór 9 folii z podglądem, kroki, specyfikacja; film plotera ładowany po kliknięciu z posterem, jeden plik mp4), /faq, /blog i /blog/[slug] (treści z lib/blog-posts.ts bez zmian, tylko skórka), /polityka-prywatnosci i /regulamin (skórka; hosting: webh.pl, Polska, jeśli migracja zrobiona — tekst do akceptacji Krystiana/prawnika), własna 404.
PR 3 — feat/tech-pwa-przygotowanie (SPEC §12.2, §12.3): manifest.ts w layoucie publicznym (skróty, ikony 192/512/maskable, apple-touch-icon, theme-color jasny/ciemny), safe-area dla TabBar, public/sw.js tylko ze stroną /offline — test e2e, że SW nie przechwytuje /api, /panel, /admin-panel, /client i nie keszuje HTML; InstallHint w MenuSheet; procedura wyrejestrowania SW w docs/tech/WDROZENIE.md. Strona /jak-przygotowac-sprzet (zakładki per urządzenie, druk, Article + BreadcrumbList), PrepChecklist w kroku 5 formularza, na ekranie sukcesu i na /track przy „Przyjęte”, link w FAQ i stopce. Teksty kroków do akceptacji Krystiana (lista w PR).
DoD: SPEC §11 + Lighthouse: strona instalowalna (PWA), panele.spec zielony (manifest i SW nie dotykają paneli).
```

### TD5b — strony konkretnych napraw
```
/zadanie TD5b — strony konkretnych napraw /naprawy/[slug] wg SPEC §12.4. Najpierw sprawdź w docs/STAN.md listę napraw potwierdzoną przez serwis; jeśli jej nie ma — zrób szablon i dane z verified:false i zatrzymaj się przed treścią.
PR 1 — feat/tech-naprawy-szablon: frontend/config/naprawy.ts (typ i dane), app/(public)/naprawy/[slug]/page.tsx (generateStaticParams tylko published && verified; staging z ramką przy NEXT_PUBLIC_TECH_DRAFT=1), RepairPage, metadane, JSON-LD Service + FAQPage + BreadcrumbList, sitemap; linki: /uslugi i strony urządzeń → naprawy urządzenia, kreator „Dowiedz się więcej” przy usterce z istniejącą stroną, blok „Powiązana naprawa” w szablonie wpisu bloga (treść wpisów bez zmian). Test: tests/tech/naprawy.test.ts (unikalny tytuł/opis/H1, kategoria i usterka zgodne z KONTRAKT §1.1 i wizard-data, wspólny tekst między stronami < 30% poza szablonem, brak cen/WhatsApp/paczkomatu, strona bez verified nie trafia do sitemap ani buildu prod).
PR 2 — content/tech-naprawy: treści dla potwierdzonych napraw (≥ 400 słów własnego tekstu na stronę, objawy, przebieg, czas i gwarancja tylko z danych serwisu, 3–5 unikalnych FAQ). Każdy tekst do mojej akceptacji przed ustawieniem verified:true — lista w PR.
DoD: SPEC §11 + seo.test i naprawy.test zielone.
```

### TD6 — QA, sprzątanie, produkcja
```
/zadanie TD6 — kontrola jakości, sprzątanie i wdrożenie nowego wyglądu (SPEC §9–§11, RESPONSYWNOSC, MIGRACJA §4 deploy.sh). Produkcja dopiero po akceptacji szefa w Asanie.
PR 1 — chore/tech-qa: na `npm run build && npm start`: scripts/tech/zrzuty.mjs wszystkich stron na szerokościach z RESPONSYWNOSC §1 w obu motywach (tmp/zrzuty/index.html), responsywnosc.spec, seo.test, contract.test, panele.spec, axe (zero krytycznych), Lighthouse telefon na 10 stronach ≥ 90 (tabela w PR), PWA: instalowalność na Androidzie i iOS (ręcznie, zrzuty), Umami: zdarzenia z §12.5 widoczne na stagingu (testowa witryna) i bez danych osobowych, SW nie przechwytuje paneli i API, status godzin w dniach testowych (święto, sobota po zamknięciu), testy treści (WhatsApp, cennik, paczkomat, sklep, zaślepki, literały). Poprawki P0/P1 w osobnych małych PR-ach, P2 do STAN.
PR 2 — chore/tech-sprzatanie: usuń nieużywany kod starej strony wg MAPA-PLIKOW (sections/, components/layout/Public*, ConditionalPublicLayout, ScopeBar, LiveBadge, components/hammer-glass, components/blog, features/zgloszenie, publiczne bloki globals.css, kroje Syne i Plus Jakarta) — każdy plik z dowodem grep, że nic go nie importuje; panele.spec po każdym kroku. Ciężkie pliki z public/ (drugi mp4, zdjęcia z internetu bez prawa, zip-y) — lista do decyzji Krystiana, usuwamy po zgodzie.
PR 3 — release: develop → master; staging na obrazie z develop przeszedł smoke i przegląd; checklista produkcji w STAN (akceptacja szefa, dane Zakopanego albo published:false, prawa do zdjęć, polityka prywatności, kopia bazy); `deploy.sh prod <sha>` w niedzielę wieczorem, smoke, test zgłoszenia, cofnięcie gotowe (poprzedni sha). Po wdrożeniu: Search Console (sitemap), sprawdzenie 301, lista dla Krystiana: wizytówki Google obu punktów (NAP = prokom.ts), prośby o opinie.
```
