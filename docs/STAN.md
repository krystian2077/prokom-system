# STAN — prokom-system (prokomserwis.pl → PRO-KOM Tech)

Aktualizuje `/koniec-sesji` na końcu każdej sesji. Najnowsze na górze.

## Teraz
- **Produkcja:** Hetzner (CX23, Helsinki), `docker-compose.prod.yml` z własnym Nginx i certbotem, obrazy budowane na serwerze. Ostatnia zmiana kodu: 04.10.2026 (ffdcc5f).
- **W toku:** wgranie pakietu PRO-KOM Tech (`docs/tech/`, `docs/design/tech/`, `docs/zadania/tech.md`, `CLAUDE.md`) → sesja **T0**.
- **Następny krok:** T0 według `docs/zadania/tech.md`.

## Plan (szczegóły i prompty: `docs/zadania/tech.md`)
| Sesja | Zakres | Stan |
|---|---|---|
| T0 | start, porządki, rozpoznanie, inwentaryzacja do migracji | do zrobienia |
| TM | migracja 1:1 na VPS webh.pl (staging → przełączenie w niedzielę) | czeka na T0 i start Gaming (20.11) |
| TD1 | fundament i powłoka (izolacja, tokeny, dane, nagłówek, stopka, telefon) | czeka na TM |
| TD2 | strona główna + kreator | czeka na TD1 |
| TD3 | zgłoszenie, status, przypisanie naprawy (kontrakt) | czeka na TD1 |
| TD4 | punkty, kontakt, o firmie, strony lokalne, `/serwis-telefonow`, 301 | czeka na TD1 |
| TD5 | pozostałe podstrony, Hammer Glass, blog, prawne, 404 | czeka na TD1 |
| TD6 | QA, wydajność, SEO, sprzątanie, staging → produkcja | czeka na TD2–TD5 |

## Otwarte (blokują produkcję, nie budowę) — SPEC §10
- [SZEF] dane punktu Zakopane; liczby i obietnice; zdjęcia i prawa.
- [Krystian] DNS i poczta prokomserwis.pl (gdzie jest strefa, MX); oficjalny SVG znaku PRO-KOM TECH.

## Pomysły na później
- (puste)

## Historia
- 14.11.2026 — pakiet przebudowy i migracji przygotowany w czacie projektu (wizualizacja, specyfikacja, kontrakt, runbook, plan sesji).
