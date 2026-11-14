# prokom-system — prokomserwis.pl (PRO-KOM Tech)

System serwisu PRO-KOM: Django 5.1 + DRF (backend, PostgreSQL, Redis, Celery) i Next.js 14 (frontend: strona publiczna + panel pracownika `/panel` + panel admina `/admin-panel` + konto klienta `/client`). Działa produkcyjnie: serwis przyjmuje tu zgłoszenia i pracuje w panelu codziennie.

Trwa **przebudowa strony publicznej na PRO-KOM Tech** i **przenosiny z Hetznera na VPS webh.pl**. Zanim cokolwiek zrobisz, przeczytaj `docs/tech/00-INDEKS.md` i `docs/STAN.md`.

## Zasady nienaruszalne
1. **Backendu nie zmieniamy.** Frontend dostosowujemy do backendu (`docs/tech/KONTRAKT-BACKEND.md`). Gdy czegoś nie da się zrobić bez backendu, zatrzymaj się i zapytaj.
2. **Panele (`/panel`, `/admin-panel`, `/client`) zostają bez zmian, także wizualnie.** Strefa zakazana: `docs/tech/SPEC.md` §2. Pilnuje jej `scripts/tech/strefa-zakazana.sh` (od T0). Wyjątek tylko wpisany w `docs/tech/WYJATKI.md` za zgodą Krystiana.
3. **Nowy wygląd jest odizolowany:** style pod `.tech` w `frontend/app/(public)/tech.css`, motyw `data-tech-theme` + `pk-theme` (nie ruszamy `data-theme` / `prokom-theme` paneli), kroje tylko w layoucie publicznym (SPEC §3).
4. **Dane kontaktowe tylko z `frontend/config/prokom.ts`.** Punkt z `published: false` nie renderuje się na produkcji.
5. **Treść:** bez WhatsAppa, bez zdjęć ludzi, bez cen, bez paczkomatu, bez sklepu. Nazwa „PRO-KOM Tech”, słowo „serwis” zostaje w treściach (SPEC §8).
6. **Bez sekretów w repo i w czacie:** `.env*` poza gitem, hasła tylko w menedżerze haseł Krystiana. Nie wypisuj wartości zmiennych środowiskowych w logach ani w PR.
7. **Produkcja i serwer:** żadnych zmian na serwerze, w DNS ani w bazie produkcyjnej bez wyraźnej zgody Krystiana w tej sesji. Przenosiny tylko według `docs/tech/MIGRACJA-VPS.md`.
8. **Nowy pomysł w trakcie sesji = wpis do `docs/STAN.md` („Pomysły na później”), nie „przy okazji”.**

## Gałęzie i PR-y
- `master` = produkcja. `develop` = integracja (staging wdraża się z `develop` od TM).
- Jedna sesja = jedno zadanie z `docs/zadania/tech.md`. Duże sesje robimy jako kilka PR-ów piętrowych (`feat/tech-…`), każdy do `develop`, squash merge, commit po polsku w trybie rozkazującym.
- Przed PR: build, lint, testy, `scripts/tech/strefa-zakazana.sh`, zrzuty przed/po (SPEC §11), `/przeglad`.

## Uruchomienie lokalne (od T0; szczegóły w `docs/tech/LOKALNIE.md` z T0)
- Backend: `cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && python manage.py migrate && python manage.py runserver 8000` (ustawienia `config.settings.local`, SQLite).
- Frontend: `cd frontend && npm ci && npx next dev -p 3003` (port 3003: CORS w `local.py` przepuszcza 3000–3004, a 3000–3002 zajmuje prokom-web). `NEXT_PUBLIC_API_URL=http://localhost:8000` w `frontend/.env.local`.
- Testy backendu (tylko uruchamiamy, nie zmieniamy): `cd backend && python -m pytest`.
- Testy frontu (od TD1): `npm run test` (jednostkowe), `npx playwright test` (e2e i responsywność).

## Rytuał sesji
1. Start: przeczytaj `CLAUDE.md`, `docs/STAN.md` („W toku”, „Następny krok”) i zadanie z `docs/zadania/tech.md`. Zacznij od `git status` i `git log -5`.
2. Plan sesji (pliki, PR-y, testy) pokaż Krystianowi przed kodem.
3. Kod → testy → zrzuty → `/przeglad` → `/pr`.
4. Koniec: `/koniec-sesji` (STAN: scalone, w toku, gałąź, niedokończone, następny krok, pytania do Krystiana). Push wszystkiego.

## Język
Rozmowa, dokumentacja, commity i opisy PR po polsku, prostym językiem. Kod i nazwy w kodzie po angielsku, teksty interfejsu po polsku (z wzorca).
