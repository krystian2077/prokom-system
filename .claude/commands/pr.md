---
description: Utwórz PR do develop (PRO-KOM Tech)
---
1. Upewnij się, że build, lint, testy i `scripts/tech/strefa-zakazana.sh` przechodzą.
2. Commit po polsku w trybie rozkazującym, push gałęzi.
3. `gh pr create --base develop` z opisem: cel (sesja i PR z `docs/zadania/tech.md`), co zmienione, czego świadomie nie ruszano, jak sprawdzić, zrzuty przed/po (1440, 1024, 768, 390, 360 — jasny i ciemny), wynik testów, ryzyka, odhaczona lista DoD (SPEC §11).
4. Nie scalaj sam — scala Krystian po przeglądzie (squash).
