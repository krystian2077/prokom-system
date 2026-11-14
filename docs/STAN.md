# STAN — prokom-system (prokomserwis.pl → PRO-KOM Tech)

Aktualizuje `/koniec-sesji` na końcu każdej sesji. Najnowsze na górze.

## Teraz
- **Produkcja:** Hetzner (CX23, Helsinki), `docker-compose.prod.yml` z własnym Nginx i certbotem, obrazy budowane na serwerze. Ostatnia zmiana kodu: 04.10.2026 (ffdcc5f).
- **W toku:** T0 gotowe: PR 1 (#6, pakiet) i PR 2 (#7, `chore/tech-t0`) czekają na scalenie. Inwentarz Hetznera i DNS uzupełniony (`INWENTARZ.md` §B, §B1).
- **Następny krok:** (1) scalić PR 1, utworzyć `develop` i przestawić PR 2 na `develop`; (2) na Hetznerze `chmod 600` dla `.env.prod` i `.env.prod.bak-*` (dziś 644); (3) przed TM ręczny `pg_dump` z Hetznera — **nie ma żadnych kopii zapasowych** (`INWENTARZ.md` B1.2); (4) TM+ (domena, poczta, VPS).

## Pilne
- ✔ 14.11.2026: hasła kont z `seed_initial.py`/`seed_staff_profiles.py` zmienione na produkcji (Krystian). Poprawka seedów → backlog w `WYJATKI.md`.
- ✔ 14.11.2026: build frontu naprawiony bez zmian w panelach (`frontend/scripts/patch-next-font.js` jako `prebuild`, commit `85b96bf`). Usunąć po aktualizacji Nexta, gdy ten obsłuży adresy Google Fonts bez rozszerzenia.
- ✖ Brak kopii zapasowych produkcji (0 wpisów `BackupLog`, brak crona) — ręczny `pg_dump` przed TM, na VPS kopie od pierwszego dnia.

## Plan (szczegóły i prompty: `docs/zadania/tech.md`)
| Sesja | Zakres | Stan |
|---|---|---|
| T0 | start, porządki, rozpoznanie, inwentaryzacja do migracji | gotowe (14.11): PR #6 + PR #7 do scalenia |
| TM | migracja 1:1 na VPS webh.pl (staging → przełączenie w niedzielę) | czeka na T0 i start Gaming (20.11) |
| TD1 | fundament i powłoka (izolacja, tokeny, dane, nagłówek, stopka, telefon) | czeka na TM |
| TD2 | strona główna + kreator | czeka na TD1 |
| TD3 | zgłoszenie, status, przypisanie naprawy (kontrakt) | czeka na TD1 |
| TD4 | punkty, kontakt, o firmie, strony lokalne, `/serwis-telefonow`, 301 | czeka na TD1 |
| TD5 | pozostałe podstrony, Hammer Glass, blog, prawne, 404 | czeka na TD1 |
| TD6 | QA, wydajność, SEO, sprzątanie, staging → produkcja | czeka na TD2–TD5 |

## Otwarte (blokują produkcję, nie budowę) — SPEC §10
- [SZEF] dane punktu Zakopane; liczby i obietnice; zdjęcia i prawa.
- [Krystian] oficjalny SVG znaku PRO-KOM TECH.
- [Krystian] decyzja: repo publiczne czy prywatne (`BEZPIECZENSTWO.md` — po zmianie haseł brak twardego powodu do zamknięcia).
- [Krystian] termin TM: plan 23–27.11 (staging), przełączenie ndz 29.11.
- [Krystian] czy 3 zgłoszenia i 8 klientów na produkcji to dane prawdziwe czy testowe (jeśli testowe — VPS może ruszyć na czystej bazie; `INWENTARZ.md` B1.1).
- [Krystian/TD6] `PublicNavbar`/`PublicFooter` używa logowanie klienta (`app/client/ClientGate.tsx`) → zostają zamrożone albo wyjątek (`MAPA-PLIKOW.md`, TODO).
- DNS prokomserwis.pl: rejestrator i strefa w **cyber_Folks**; plan przeniesienia do Seohost i skrzynki kontakt@ w promptcie TM+.

## Pomysły na później
- Zastąpić prompt TM w `docs/zadania/tech.md` promptem TM+ (domena → Seohost, kontakt@ na SH 1, VPS) — tekst od Krystiana z 14.11.
- Backend (osobne decyzje, `WYJATKI.md`): hasła w seedach, zawieszanie zgłoszenia bez Redisa, escapowanie HTML w mailu z formularza kontaktowego, atrapa SMS.

## Historia
- 14.11.2026 — **T0**: pakiet w repo (PR 1), strażnik strefy zakazanej + CI, skan sekretów (gitleaks czysty, ale hasła kont w seedach → zmienione), `LOKALNIE.md` (sprawdzone zgłoszenie z formularza na 3003), `MAPA-PLIKOW.md`, KONTRAKT poprawiony wg kodu + 17 fixtures, `INWENTARZ.md` (część z repo + komendy), `anonimizuj.sql` (test na Postgres 16: 12 kontroli = 0). Wykryte: build frontu pada przez Google Fonts (Unbounded).
- 14.11.2026 — pakiet przebudowy i migracji przygotowany w czacie projektu (wizualizacja, specyfikacja, kontrakt, runbook, plan sesji).
