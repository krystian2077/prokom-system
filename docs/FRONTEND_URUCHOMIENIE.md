# Frontend PRO-KOM — uruchomienie i integracja z backendem

## Wymagania

- Node.js 18+
- Backend Django uruchomiony (np. `http://localhost:8000`) — opcjonalnie do integracji API

## Instalacja i uruchomienie

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Aplikacja będzie dostępna pod **http://localhost:3000**.

## Zmienne środowiskowe

W pliku `.env.local`:

| Zmienna | Opis | Domyślnie |
|--------|------|-----------|
| `NEXT_PUBLIC_API_URL` | Adres backendu Django | `http://localhost:8000` |

Przykład:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Proxy API

Next.js przekierowuje żądania z frontendu pod `/api/proxy/*` na backend `NEXT_PUBLIC_API_URL/api/v1/*`.  
Klient API (`lib/api.ts`) domyślnie wywołuje backend bezpośrednio (z `NEXT_PUBLIC_API_URL`).  
CORS na backendzie musi zezwalać na origin frontendu (np. `http://localhost:3000`). W `backend/config/settings/local.py` są ustawione `CORS_ALLOWED_ORIGINS` dla localhost:3000.

## Etap 1 — co jest zaimplementowane

- **Layouty:** root layout, layout publiczny (navbar + footer)
- **Design system:** kolory PRO-KOM w Tailwind, `Button`, `Card`, `Input`, `Select`, `Textarea`
- **Strona główna (public):** hero, sekcja usług, Hammer Glass / Akcesoria, CTA
- **Formularz zgłoszenia** `/zgloszenie`: 5 kroków (dane kontaktowe → urządzenie → dostarczenie/zwrot → Hammer Glass/akcesoria → podsumowanie), walidacja, wysyłka do `POST /api/v1/repairs/submit/`
- **Podstrony publiczne:** Serwis telefonów (pełna), Hammer Glass, Akcesoria, Kontakt, FAQ, Regulamin, Polityka prywatności; pozostałe usługi (tablety, smartwatchy, laptopy, komputery, drukarki, konsole, odzyskiwanie danych) — strony placeholder z CTA do zgłoszenia
- **Nawigacja:** PublicNavbar, PublicFooter z linkami do podstron
- **API client:** `lib/api.ts` (get, post, patch, put, delete) z opcjonalnym tokenem
- **Środowisko:** `.env.local.example` z `NEXT_PUBLIC_API_URL`

## Kolejne kroki (Etap 2)

- Panel klienta (logowanie, lista napraw, szczegóły, wiadomości, wyceny)
- Layout staff/admin (sidebar + topbar) i pierwsze widoki

## Build produkcyjny

```bash
npm run build
npm start
```
