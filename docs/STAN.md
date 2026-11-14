# STAN — prokom-system (prokomserwis.pl → PRO-KOM Tech)

Aktualizuje `/koniec-sesji` na końcu każdej sesji. Najnowsze na górze.

## Teraz
- **Produkcja:** Hetzner (CX23, Helsinki), `docker-compose.prod.yml` z własnym Nginx i certbotem, obrazy budowane na serwerze. Ostatnia zmiana kodu: 04.10.2026 (ffdcc5f).
- **W toku:** **TM+**. Etap A: A1–A4 ✔ (delegacja na Seohost opublikowana 14.11 18:35), A5 (transfer) — 15.11. Etap C: PR #13 (infrastruktura) scalony, obrazy w GHCR (prywatne); **staging na VPS działa od 14.11 18:43** (`dd8e8a3`, `/srv/prokom/prokom-tech`, gateway `127.0.0.1:3301`, smoke 11/11); czeka na vhost w prokom-web (sesja w toku).
- **Następny krok:** (1) PR prokom-web z vhostami Tech → certyfikat stagingu → `https://staging.prokomserwis.pl` za hasłem. (2) Próba generalna (MIGRACJA §6–§7): kopia `D:\PRO-KOM\kopie\prokom-tech-import-20261114T181620Z.tar` → VPS → `restore.sh --no-start` → `anonimizuj.sql` → start → smoke + test ręczny. (3) A5 transfer domeny (15.11). (4) Etap B — `kontakt@` na SH 1. (5) `.env.prod` i cron kopii na VPS przed niedzielą 29.11.

## Pilne
- ✖ **Sobota w Rabce: 9:00–14:00** (decyzja Krystiana 14.11.2026; SPEC §5 bez zmian). Blok „Twój serwis” w `/track` i wydruki biorą godziny z `SERWIS_PRINT_HOURS` — ustawić w `.env.prod` na Hetznerze (i od razu na VPS w TM) `Pn–Pt 9:00–17:00 · Sob 9:00–14:00`, potem restart `backend` i `celery`. Domyślna wartość w `base.py` (13:00) zostaje — backlog `WYJATKI.md`.
- ✔ 14.11.2026: hasła kont z `seed_initial.py`/`seed_staff_profiles.py` zmienione na produkcji (Krystian). Poprawka seedów → backlog w `WYJATKI.md`.
- ✔ 14.11.2026: build frontu naprawiony bez zmian w panelach (`frontend/scripts/patch-next-font.js` jako `prebuild`, commit `85b96bf`). Usunąć po aktualizacji Nexta, gdy ten obsłuży adresy Google Fonts bez rozszerzenia.
- ✖ Brak kopii zapasowych produkcji (0 wpisów `BackupLog`, brak crona) — ręczny `pg_dump` przed TM, na VPS kopie od pierwszego dnia.

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
| Część ręczna (panel, lista napraw, PDF, upload 20 MB) | — | po vhoście `staging.prokomserwis.pl` (prokom-web) |
| Test odtworzenia kopii (`backup.sh` → B2 → `restore.sh`) | ✔ | `.env.backup` (ten sam `age.pub` i bucket co Gaming); kopia 432 KB w `offsite:prokom-backups-r7k2/tech-staging/daily/`; zgłoszenie testowe dodane po kopii (4) → po odtworzeniu z B2: 3 = manifest; smoke core ok; `age.key` usunięty (`shred -u`) |

## Plan (szczegóły i prompty: `docs/zadania/tech.md`)
| Sesja | Zakres | Stan |
|---|---|---|
| T0 | start, porządki, rozpoznanie, inwentaryzacja do migracji | gotowe i scalone (14.11): #6–#10 |
| TM+ | domena → Seohost, kontakt@ na SH 1, migracja 1:1 na VPS webh.pl | **w toku** (od 14.11): etap A |
| TD1 | fundament i powłoka (izolacja, tokeny, dane, nagłówek, stopka, telefon) | czeka na TM |
| TD2 | strona główna + kreator | czeka na TD1 |
| TD3 | zgłoszenie, status, przypisanie naprawy (kontrakt) | czeka na TD1 |
| TD4 | punkty, kontakt, o firmie, strony lokalne, `/serwis-telefonow`, 301 | czeka na TD1 |
| TD5 | pozostałe podstrony, Hammer Glass, blog, prawne, 404, PWA, poradnik „jak przygotować sprzęt” | czeka na TD1 |
| TD5b | strony konkretnych napraw `/naprawy/…` (SPEC §12.4) | czeka na TD5 i listę napraw od serwisu |
| TD6 | QA, wydajność, SEO, sprzątanie, staging → produkcja | czeka na TD2–TD5 |

## Otwarte (blokują produkcję, nie budowę) — SPEC §10
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
- [Krystian] **abonent domeny prokomserwis.pl:** decyzja 14.11 — transfer do Seohost jako osoba prywatna, potem w Seohost zmiana abonenta na PRO-KOM Tadeusz Wójciak (NIP). Dopisać do listy kontrolnej TM+ etap A5 (po transferze: zmiana abonenta, auto-odnawianie, rezygnacja z usług w cyber_Folks). Domena wygasa 28.04.2027.
- [TM, etap C] Backend **nie ma `/api/health/`** (404 na produkcji, 14.11). `smoke.sh` i healthchecki w compose muszą sprawdzać istniejące adresy (np. `/`, `/panel/login`, `/api/v1/repairs/track/` → 400 bez parametrów, `/admin/login/`), a nie `/api/health/`.
- DNS prokomserwis.pl: rejestrator i strefa w **cyber_Folks**; plan przeniesienia do Seohost i skrzynki kontakt@ w promptcie TM+.

## Pomysły na później
- Backend (osobne decyzje, `WYJATKI.md`): hasła w seedach, zawieszanie zgłoszenia bez Redisa, escapowanie HTML w mailu z formularza kontaktowego, atrapa SMS.

## Historia
- 14.11.2026 18:16–18:28 UTC — **incydent na Hetznerze**: komenda compose bez `--env-file .env.prod` (przy zmianie `SERWIS_PRINT_HOURS`) odtworzyła `db`/`redis` z pustą konfiguracją, a po naprawie Nginx trzymał stare IP backendu → API i panel 502 przez ok. 12 min. Naprawa: `up -d` z `--env-file` + `nginx -s reload`. Danych nie stracono. Wnioski w `INWENTARZ.md` B2 i MIGRACJA §8–§9. Kopia produkcji: `prokom-tech-import-20261114T181620Z.tar` (sha256 `034b69cb…`), `.env.prod` ma już 600.
- 14.11.2026 — stan DNS „przed” z panelu cyber_Folks w `docs/tech/DNS-PROKOMSERWIS.md` (A przez „Przekierowanie IP”, abonent prywatny).
- 14.11.2026 — Zakopane od szefa: godziny pn–pt 10:00–16:30, ploter Hammer Glass jest, można oddać w jednym punkcie i odebrać w drugim (KONTRAKT §2: linia „Punkt odbioru”).
- 14.11.2026 — punkt Zakopane: ul. Stanisława Staszica 8, 34-500 Zakopane, tel. 18 541 20 15 (SPEC §5).
- 14.11.2026 — SPEC §12.10 (naprawa wysyłkowa) i §12.11 (kategorie bloga), plan ≈ 21,25 wieczoru, **zakres zamknięty**. Liczby bloga przeliczone: 49 obiektów / 48 wpisów.
- 14.11.2026 — SPEC §12.5–§12.9 (Umami, „Moje naprawy”, ekran sukcesu z QR, nawigacja, komunikat i sekcja zaufania), plan ≈ 20,25 wieczoru. Sobota w Rabce: 9:00–14:00.
- 14.11.2026 — SPEC 1.0 z dodatkami §12 (status godzin, PWA, poradnik, strony napraw) i plan sesji z TD5 PR 3 i TD5b (≈ 19,25 wieczoru). W SPEC dopisane uwagi z T0 (ScopeBar/LiveBadge i PublicNavbar/Footer zostają).
- 14.11.2026 — **T0**: pakiet w repo (PR 1), strażnik strefy zakazanej + CI, skan sekretów (gitleaks czysty, ale hasła kont w seedach → zmienione), `LOKALNIE.md` (sprawdzone zgłoszenie z formularza na 3003), `MAPA-PLIKOW.md`, KONTRAKT poprawiony wg kodu + 17 fixtures, `INWENTARZ.md` (część z repo + komendy), `anonimizuj.sql` (test na Postgres 16: 12 kontroli = 0). Wykryte: build frontu pada przez Google Fonts (Unbounded).
- 14.11.2026 — pakiet przebudowy i migracji przygotowany w czacie projektu (wizualizacja, specyfikacja, kontrakt, runbook, plan sesji).
