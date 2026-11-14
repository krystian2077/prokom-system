# STAN — prokom-system (prokomserwis.pl → PRO-KOM Tech)

Aktualizuje `/koniec-sesji` na końcu każdej sesji. Najnowsze na górze.

## Teraz
- **Produkcja:** Hetzner (CX23, Helsinki), `docker-compose.prod.yml` z własnym Nginx i certbotem, obrazy budowane na serwerze. Ostatnia zmiana kodu: 04.10.2026 (ffdcc5f).
- **W toku:** **TM+**. Etap A ✔: A1–A4, **A5 transfer do Seohost ✔ 14.11 21:04** (abonent od razu PRO-KOM Tadeusz Wójciak, wygasa 28.04.2027, DNS bez zmian); auto-odnawianie w Seohost ✔, rezygnacja z usługi domeny w cyber_Folks złożona ✔ (14.11). **Etap B:** domena `prokomserwis.pl` w DirectAdmin SH 1 (`h99.seohost.pl`, bez SSL/PHP), skrzynka `kontakt@prokomserwis.pl` (2000 MB, 300/dzień, hasło w menedżerze), rekordy poczty w strefie Seohost ✔, **testy ✔ 14.11 ~20:30**: mail-tester **10/10** (SPF/DKIM/DMARC pass, rDNS ok), Gmail → kontakt@ dochodzi, odpowiedź kontakt@ → Gmail w Odebranych z SPF/DKIM/DMARC PASS. Wysyłka z aplikacji nadal przez Gmail (etap D). Etap C: staging na VPS za Nginx (`https://staging.prokomserwis.pl`, hasło, cert LE do 12.02.2027), próba automatyczna ✔, kopie + heartbeat ✔, `.env.prod` na VPS gotowy (prod wyłączony do 29.11).
- **TD1 (fundament i powłoka) — ruszyło 14.11, przed przełączeniem TM** (decyzja Krystiana 14.11: praca idzie tylko do `develop`; nic z `develop` nie trafia do `master` przed 29.11, przełączenie jest 1:1 z `master`; 29.11 TD stoi). Scalone: **#26** (PR 1 fundament: Vitest + Playwright, `panele.spec` ze zrzutami bazowymi z czystego develop, Node 22, next 14.2.35, `config/prokom.ts` z e-mailem `kontakt@prokomserwis.pl`, `lib/tech` — godziny/święta/punkty/motyw/pomiar/JSON-LD, `tech.css` z tokenami). Otwarte: **#27** `feat/tech-powloka` (5e80ea2 + STAN) — TechShell, BrandBar, Capsule z mega menu, Footer, LinesBand, LegalBar, Logo, OsmMap, OpeningStatus, NoticeBar, TabBar, MenuSheet, SectionRail; 47/47 e2e, porownaj 1440: nagłówek 5–7%, stopka ~10% (status na żywo, jedna karta punktu). Pracowano w worktree `D:PRO-KOMeposprokom-system-td1`.
- **Następny krok:** (1) Przełączenie produkcji na VPS w niedzielę 29.11 (MIGRACJA §8) + heartbeat i cron kopii prod. (2) Etap D: wysyłka z aplikacji przez SH 1, potem SPF bez Gmaila. (3) Krystian: przegląd i scalenie #27 (squash). (4) Po 29.11: `/zadanie TD2 — strona główna i kreator (docs/zadania/tech.md, sekcja TD2). Powłoka i fundament z TD1 są w develop (components/tech, lib/tech, config/prokom.ts, tech.css); przed kodem przeczytaj docs/tech/LOKALNIE.md §7 (testy, port 3002).`

## Pilne
- ✖ **Sobota w Rabce: 9:00–14:00** (decyzja Krystiana 14.11.2026; SPEC §5 bez zmian). Blok „Twój serwis” w `/track` i wydruki biorą godziny z `SERWIS_PRINT_HOURS` — ustawić w `.env.prod` na Hetznerze (i od razu na VPS w TM) `Pn–Pt 9:00–17:00 · Sob 9:00–14:00`, potem restart `backend` i `celery`. Domyślna wartość w `base.py` (13:00) zostaje — backlog `WYJATKI.md`.
- ✔ 14.11.2026: hasła kont z `seed_initial.py`/`seed_staff_profiles.py` zmienione na produkcji (Krystian). Poprawka seedów → backlog w `WYJATKI.md`.
- ✔ 14.11.2026: build frontu naprawiony bez zmian w panelach (`frontend/scripts/patch-next-font.js` jako `prebuild`, commit `85b96bf`). Usunąć po aktualizacji Nexta, gdy ten obsłuży adresy Google Fonts bez rozszerzenia.
- ✖ Brak kopii zapasowych produkcji (0 wpisów `BackupLog`, brak crona) — ręczny `pg_dump` przed TM, na VPS kopie od pierwszego dnia.

## Poczta kontakt@prokomserwis.pl (TM+ etap B, 14.11.2026)
- Hosting poczty Seohost SH 1 (DirectAdmin `h99.seohost.pl`, ten sam co skrzynki prokombiznes/software/instalacje/gaming), skrzynka 2000 MB, limit 300 wysłanych/dzień, hasło w menedżerze haseł („Poczta kontakt@prokomserwis.pl”).
- **Thunderbird / programy pocztowe:** IMAP `h99.seohost.pl:993` SSL/TLS, SMTP `h99.seohost.pl:465` SSL/TLS, normalne hasło, login = pełny adres. (Nie `mail.prokomserwis.pl` — certyfikat serwera jest na `*.seohost.pl`.) Webmail: Roundcube z DirectAdmin.
- Etap D (wysyłka z aplikacji przez SH 1): z serwera aplikacji host `srv128408.seohost.com.pl` (certyfikat SMTP na tę nazwę), jak w prokom-web; potem SPF bez `include:_spf.google.com`.

## Próba generalna — część automatyczna (14.11.2026, VPS, staging)
| Krok (MIGRACJA §7) | Wynik | Dowód |
|---|---|---|
| Eksport z Hetznera (`eksport-hetzner.sh`, strona działa) | ✔ | `prokom-tech-import-20261114T181620Z.tar`, 430 KB, sha256 `034b69cb…` zgodny: Hetzner → komputer → VPS |
| Import do stagingu (`restore.sh --no-start`) | ✔ | 3 naprawy, `source_commit=50f926c` |
| Anonimizacja (`anonimizuj.sql`) | ✔ | 12 kontroli = 0; e-maile `klient-N@example.test` |
| Start + smoke | ✔ | 5 kontenerów healthy, smoke all ok; dane: 3 naprawy, 8 klientów |
| Zgłoszenie testowe (`SMOKE_SUBMIT=1`, przed importem) | ✔ | `PROKOM/RMA/1/2026` → `/track` 200 |
| Pamięć (staging, pusty) | ✔ | backend 178/512 MB, frontend 40/320, db 37/384, gateway 5/64, redis 3/96 |
| Plik importu usunięty z VPS (`shred -u`) | ✔ | `/srv/prokom/import` pusty; kopia zostaje w `D:\PRO-KOM\kopie` i na Hetznerze |
| Cron kopii stagingu | ✔ | `30 3 * * *` UTC (`scripts/vps/backup.sh staging`), po prokom-web 02:30/02:45 i Gaming 03:00/03:15; prod Tech — po przełączeniu (MIGRACJA §8 pkt 10); heartbeat Better Stack — do dodania |
| Heartbeat kopii stagingu (Better Stack „Kopia Tech staging”, 1 d + 3 h, e-mail) | ✔ | po `backup.sh staging` status Up; prod — w niedzielę |
| `.env.prod` na VPS | ✔ | z `.env.prod` Hetznera (ten sam `SECRET_KEY`, Gmail, Google, `SERWIS_PRINT_*`), nowe hasła bazy/Redisa, `GATEWAY_PORT=3300`; kopia z Hetznera usunięta (`shred -u`); compose config OK |
| Część ręczna (14.11 ~21:00, `https://staging.prokomserwis.pl`) | ✔ | basic auth ✔, logowanie do panelu admina kontem pracownika ✔ (konta staff zostają po anonimizacji), lista napraw (2 aktywne) i klientów (8, zanonimizowani) ✔, szczegóły naprawy ✔, PDF protokołu przyjęcia („Podgląd wydruku / druk”) ✔, strona główna i `/zgloszenie` bez błędów w konsoli ✔, `X-Robots-Tag: noindex` ✔; limit 20 MB przez oba Nginxy: 19 MB dochodzi do Django, 21,5 MB → 413 ✔. Uwaga: panel nie ma pola do wgrywania zdjęć (backend przyjmuje plik tylko w `mark-package-received`), więc „upload zdjęcia w panelu” sprawdzono samym limitem |
| Pomiar (14.11 ~21:15) | ✔ | staging Tech: restarts=0, backend 186/512 MB, frontend 73/320, db 47/384; `/` 0,05 s, `/admin/login/` 0,01 s; serwer: 11,3 GB RAM wolne z 15,9 GB |
| Stos prod na VPS — próbny start na pustej bazie | ✔ | `deploy.sh prod 61f8f54` (14.11 21:24): obrazy prod, migracje na pustej bazie, collectstatic, smoke prod all ok; DNS nadal na Hetzner, więc ruchu brak. Wcześniej błąd w `obrazy.yml` (front prod szedł do `-staging`) — poprawka #22/#23 |
| Test odtworzenia kopii (`backup.sh` → B2 → `restore.sh`) | ✔ | `.env.backup` (ten sam `age.pub` i bucket co Gaming); kopia 432 KB w `offsite:prokom-backups-r7k2/tech-staging/daily/`; zgłoszenie testowe dodane po kopii (4) → po odtworzeniu z B2: 3 = manifest; smoke core ok; `age.key` usunięty (`shred -u`) |

## Plan (szczegóły i prompty: `docs/zadania/tech.md`)
| Sesja | Zakres | Stan |
|---|---|---|
| T0 | start, porządki, rozpoznanie, inwentaryzacja do migracji | gotowe i scalone (14.11): #6–#10 |
| TM+ | domena → Seohost, kontakt@ na SH 1, migracja 1:1 na VPS webh.pl | **w toku** (od 14.11): etap A |
| TD1 | fundament i powłoka (izolacja, tokeny, dane, nagłówek, stopka, telefon) | **PR 1 scalony (#26), PR 2 w przeglądzie (#27)** — ruszyło 14.11 przed TM (decyzja 14.11) |
| TD2 | strona główna + kreator | czeka na TD1 |
| TD3 | zgłoszenie, status, przypisanie naprawy (kontrakt) | **scalone (#28, #30, #32)** — zostało: test na żywym backendzie, porównanie z planszami |
| TD4 | punkty, kontakt, o firmie, strony lokalne, `/serwis-telefonow`, 301 | czeka na TD1 |
| TD5 | pozostałe podstrony, Hammer Glass, blog, prawne, 404, PWA, poradnik „jak przygotować sprzęt” | czeka na TD1 |
| TD5b | strony konkretnych napraw `/naprawy/…` (SPEC §12.4) | czeka na TD5 i listę napraw od serwisu |
| TD6 | QA, wydajność, SEO, sprzątanie, staging → produkcja | czeka na TD2–TD5 |

## Otwarte (blokują produkcję, nie budowę) — SPEC §10
- [Krystian, TD1] lista miejscowości Zakopanego w JSON-LD (`lib/tech/jsonld.ts`, `TODO(krystian)`) — przed `published: true`; strona „Dostępność” do paska prawnego (TD5).
- [SZEF] dane punktu Zakopane; liczby i obietnice; zdjęcia i prawa.
- [Krystian] oficjalny SVG znaku PRO-KOM TECH.
- ✔ 14.11.2026: repo `prokom-system` **prywatne** (plan Free) → zmienne buildu frontu jako zmienne repozytorium (`STAGING_`/`PRODUCTION_NEXT_PUBLIC_*`), bez GitHub Environments. Minuty Actions w prywatnym repo: limit planu Free (2000 min/mies.). [Krystian] paczka `prokom-tech-backend` w GHCR nadal publiczna → przełączyć na prywatną (Package settings → Change visibility).
- [Krystian] termin TM: plan 23–27.11 (staging), przełączenie ndz 29.11.
- [Krystian] czy 3 zgłoszenia i 8 klientów na produkcji to dane prawdziwe czy testowe (jeśli testowe — VPS może ruszyć na czystej bazie; `INWENTARZ.md` B1.1).
- [Krystian/TD6] `PublicNavbar`/`PublicFooter` używa logowanie klienta (`app/client/ClientGate.tsx`) → zostają zamrożone albo wyjątek (`MAPA-PLIKOW.md`, TODO).
- [Krystian + serwis] lista do 12 napraw na `/naprawy/…` z czasem, gwarancją i „na miejscu” (SPEC §12.4) — przed TD5b.
- [Krystian] Umami dla Tech: identyfikator strony (`UMAMI_WEBSITES` w `.env.prod` prokom-web) i dopisek w polityce prywatności (SPEC §12.5). Skrypt idzie przez Nginx prokom-web (`/_s/script.js`), więc zadziała dopiero po TM.
- [SZEF/serwis] treść sekcji „Twoje dane są bezpieczne” (SPEC §12.9) — do tego czasu sekcja ukryta flagą.
- [SZEF] naprawa wysyłkowa — 5 odpowiedzi z SPEC §10/§12.10 (promujemy? kto płaci w obie strony, płatność przy wysyłce, rezygnacja po wycenie, zasięg). Do tego czasu `/naprawa-kurierem` ma `published: false`.
- [Krystian] wstępy 4 kategorii bloga i przypisanie wpisów (SPEC §12.11).
- [Krystian] **Zakopane — została tylko pinezka:** ul. Stanisława Staszica 8 (centrum, przy ul. Weteranów Wojny i parku miejskim; powiat tatrzański), tel. 18 541 20 15, pn–pt 10:00–16:30, sob–nd zamknięte, ploter Hammer Glass jest, odbiór w innym punkcie można. Współrzędne w SPEC są przybliżone (centrum miasta: 49.2990, 19.9489) — przed `published: true` wziąć dokładne z pinezki w Mapach Google. Opis położenia przyda się na stronę lokalną Zakopanego (TD4).
- [TM, etap C] Backend **nie ma `/api/health/`** (404 na produkcji, 14.11). `smoke.sh` i healthchecki w compose muszą sprawdzać istniejące adresy (np. `/`, `/panel/login`, `/api/v1/repairs/track/` → 400 bez parametrów, `/admin/login/`), a nie `/api/health/`.
- DNS prokomserwis.pl: rejestrator i strefa w **cyber_Folks**; plan przeniesienia do Seohost i skrzynki kontakt@ w promptcie TM+.

## Pomysły na później
- [TD1] `npm audit`: krytyczna podatność `next` 14.x ma poprawkę dopiero w Next 15/16 (zmiana wersji głównej — osobna decyzja, panele też na Next); wysokie: `postcss`, `browserslist`, `picomatch`.
- [TD1] `/client/login` traci `<title>` po hydratacji (stan zastany na develop, strefa zakazana).
- [TD1] `next start` (standalone) zgłasza brak `sharp` przy obrazach starych stron — sprawdzić obraz Dockera przed TD2 (obrazy `next/image`).
- [TD1] `panele.spec` działa tylko lokalnie (zrzuty Windows); w CI do rozważenia zrzuty linuksowe z kontenera Playwright.
- prokom-gaming (nie ten projekt): `prokom-gaming-prod-app-1` używa 916 MB z limitu 1 GB (pomiar 14.11) — sprawdzić w Gaming, czy limit nie jest za ciasny.
- Staging: `/api/` odpowiada bez basic auth (strona za hasłem, API nie) — rozważyć hasło też na `/api/` albo zostawić świadomie (dane i tak zanonimizowane); `meta robots` na stagingu mówi `index, follow` (chroni nagłówek `X-Robots-Tag` i hasło).
- [TD3] `NavigateButtons` i `PrepChecklist` powstały w wersji minimalnej dla ekranu sukcesu — TD4 (nawigacja z arkuszem i `parkingNote`) i TD5 (poradnik, `PREP_GUIDE_READY=true`) je rozbudują.
- [TD3] Wspólne klasy pomocnicze TD3 (`t-card`, `t-lead`, `t-eyebrow`, `t-btn--ghost`…) są zawężone do `.t-zgl/.t-trk/.t-claim` — po scaleniu TD2 ujednolicić z jego globalnymi wersjami.
- Backend (osobne decyzje, `WYJATKI.md`): hasła w seedach, zawieszanie zgłoszenia bez Redisa, escapowanie HTML w mailu z formularza kontaktowego, atrapa SMS.

## Historia
- 14/15.11.2026 — **TD3** scalone do `develop`: #28 kontrakt, #30 formularz zgłoszenia, #32 status i „Moje naprawy”.
- 14.11.2026 18:16–18:28 UTC — **incydent na Hetznerze**: komenda compose bez `--env-file .env.prod` (przy zmianie `SERWIS_PRINT_HOURS`) odtworzyła `db`/`redis` z pustą konfiguracją, a po naprawie Nginx trzymał stare IP backendu → API i panel 502 przez ok. 12 min. Naprawa: `up -d` z `--env-file` + `nginx -s reload`. Danych nie stracono. Wnioski w `INWENTARZ.md` B2 i MIGRACJA §8–§9. Kopia produkcji: `prokom-tech-import-20261114T181620Z.tar` (sha256 `034b69cb…`), `.env.prod` ma już 600.
- 14.11.2026 — stan DNS „przed” z panelu cyber_Folks w `docs/tech/DNS-PROKOMSERWIS.md` (A przez „Przekierowanie IP”, abonent prywatny).
- 14.11.2026 — Zakopane od szefa: godziny pn–pt 10:00–16:30, ploter Hammer Glass jest, można oddać w jednym punkcie i odebrać w drugim (KONTRAKT §2: linia „Punkt odbioru”).
- 14.11.2026 — punkt Zakopane: ul. Stanisława Staszica 8, 34-500 Zakopane, tel. 18 541 20 15 (SPEC §5).
- 14.11.2026 — SPEC §12.10 (naprawa wysyłkowa) i §12.11 (kategorie bloga), plan ≈ 21,25 wieczoru, **zakres zamknięty**. Liczby bloga przeliczone: 49 obiektów / 48 wpisów.
- 14.11.2026 — SPEC §12.5–§12.9 (Umami, „Moje naprawy”, ekran sukcesu z QR, nawigacja, komunikat i sekcja zaufania), plan ≈ 20,25 wieczoru. Sobota w Rabce: 9:00–14:00.
- 14.11.2026 — SPEC 1.0 z dodatkami §12 (status godzin, PWA, poradnik, strony napraw) i plan sesji z TD5 PR 3 i TD5b (≈ 19,25 wieczoru). W SPEC dopisane uwagi z T0 (ScopeBar/LiveBadge i PublicNavbar/Footer zostają).
- 14.11.2026 — **T0**: pakiet w repo (PR 1), strażnik strefy zakazanej + CI, skan sekretów (gitleaks czysty, ale hasła kont w seedach → zmienione), `LOKALNIE.md` (sprawdzone zgłoszenie z formularza na 3003), `MAPA-PLIKOW.md`, KONTRAKT poprawiony wg kodu + 17 fixtures, `INWENTARZ.md` (część z repo + komendy), `anonimizuj.sql` (test na Postgres 16: 12 kontroli = 0). Wykryte: build frontu pada przez Google Fonts (Unbounded).
- 14.11.2026 — pakiet przebudowy i migracji przygotowany w czacie projektu (wizualizacja, specyfikacja, kontrakt, runbook, plan sesji).
