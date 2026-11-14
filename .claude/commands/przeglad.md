---
description: Przegląd zmian przed PR (PRO-KOM Tech)
---
Przejrzyj zmiany na bieżącej gałęzi względem `develop` (`git diff develop...HEAD`) jak wymagający senior:
1. **Strefa zakazana:** `bash scripts/tech/strefa-zakazana.sh` (jeśli skrypt jeszcze nie istnieje: żadnych zmian w `backend/`, `frontend/app/panel|admin-panel|client/`, `frontend/components/panel/`, `frontend/features/client-*/`, `frontend/contexts/`, `frontend/lib/{api,panel-api,auth-storage,theme}.ts`, `frontend/middleware.ts`).
2. **Kontrakt:** każde wywołanie API zgodne z `docs/tech/KONTRAKT-BACKEND.md` (pola, wartości, wymagane, błędy). Brak `parcel_locker` w ofercie.
3. **Izolacja:** nowe style tylko pod `.tech`, brak nowych reguł globalnych, motyw `data-tech-theme`/`pk-theme`, panele nietknięte (`tests/tech/panele.spec.ts`).
4. **Treść:** brak WhatsApp, cen, paczkomatu, sklepu, literałów kontaktowych poza `prokom.ts`, zaślepek `[…]` na buildzie produkcyjnym; punkt `published:false` niewidoczny.
5. **Jakość:** typy, błędy i stany ładowania, dostępność (fokus, etykiety, kontrast), `prefers-reduced-motion`, brak `console.log`, brak martwego kodu.
6. **Urządzenia:** zgodność z `docs/tech/RESPONSYWNOSC.md` na szerokościach testowych, oba motywy.
Wynik: lista problemów (P0 blokuje PR, P1 poprawić teraz, P2 do STAN) i poprawki P0/P1.
