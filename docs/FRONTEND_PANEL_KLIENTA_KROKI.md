# Frontend panelu klienta — kolejne kroki

Plan implementacji **tylko** frontendu dla klienta (panel klienta). Pracownicy i admin — później.

---

## Co już mamy (strona publiczna)

- Strona główna, podstrony usług, Hammer Glass, Akcesoria, Kontakt, FAQ
- Formularz zgłoszenia online (`/zgloszenie`) → `POST /api/v1/repairs/submit/`
- Layout publiczny (navbar, footer), design system (Button, Card, Input, Select, Textarea)

---

## Backend API dla klienta (istniejące)

| Endpoint | Opis |
|----------|------|
| `POST /api/v1/accounts/login/` | Logowanie — body: `{ "email", "password" }`, zwraca `{ "token", "user" }` |
| `POST /api/v1/accounts/logout/` | Wylogowanie (Authorization: Token) |
| `GET /api/v1/accounts/me/` | Bieżący użytkownik (role: admin, staff, client) |
| `GET /api/v1/clients/me/` | Profil klienta (tylko dla role=client z powiązanym Client) |
| `PATCH /api/v1/clients/me/` | Aktualizacja profilu przez klienta |
| `GET /api/v1/repairs/` | Lista napraw — dla klienta: tylko jego naprawy |
| `GET /api/v1/repairs/<id>/` | Szczegóły naprawy |
| `GET /api/v1/repairs/<id>/messages/` | Wiadomości (notatki publiczne, tylko odczyt) |
| `GET /api/v1/repairs/<id>/status/` | Status (minimalny, do pollingu) |
| `GET /api/v1/repairs/my-summary/` | Podsumowanie: count, by_status, latest_repairs |
| `POST /api/v1/repairs/<id>/quote-respond/` | Odpowiedź na wycenę: `{ "action": "accept" \| "reject", "comment": "..." }` |
| `POST /api/v1/repairs/<id>/submit-satisfaction-survey/` | Ankieta: `{ "rating", "would_recommend", "comment" }` |

**Uwaga:** Klient musi mieć konto (User z role=client powiązane z Client). Tworzenie konta klienta (np. zaproszenie e‑mailem lub rejestracja) może być po stronie admina/staff lub osobny flow — na ten moment zakładamy, że konto jest już utworzone (np. przez pracownika).

---

## Kolejne kroki implementacji (w kolejności)

### Krok 1 — Auth i layout panelu klienta

- **Ścieżki:** `app/(client)/` (route group), np. `/client` (redirect do dashboard lub login), `/client/login`, `/client/dashboard`.
- **Logowanie:** strona `/client/login` — formularz e-mail + hasło, wywołanie `POST /api/v1/accounts/login/`. Zapis tokenu (np. w cookie lub localStorage). Po sukcesie: jeśli `user.role === "client"` → redirect do `/client/dashboard`, w przeciwnym razie (staff/admin) → redirect do przyszłego panelu staff lub informacja „To konto jest dla pracowników”.
- **Ochrona tras:** middleware lub layout — jeśli brak tokena i trasa wymaga auth → redirect na `/client/login` (z returnUrl).
- **Layout klienta:** prosty topbar (logo, „Moje naprawy”, „Profil”, Wyloguj), bez sidebaru lub z prostym menu (dashboard, naprawy, profil). Breadcrumb opcjonalnie.
- **Kontekst auth:** provider (React Context) lub hook `useAuth()` z tokenem i danymi user; przekazywanie tokena do `api.get/post(..., token)`.

**Efekt:** użytkownik może się zalogować i zobaczyć szkielet panelu (np. pusty dashboard).

---

### Krok 2 — Dashboard klienta

- **Strona:** `/client/dashboard` (lub `/client`).
- **API:** `GET /api/v1/repairs/my-summary/` — zwraca `count`, `by_status`, `latest_repairs`.
- **UI:** kafelki typu: Aktywne naprawy, Gotowe do odbioru, Oczekujące na decyzję (wycena), Ostatnie naprawy (lista 5–10 z linkami do szczegółów). Kolory statusów (zielony/pomarańcz/czerwony) zgodnie z designem.
- **Empty state:** brak napraw — krótki komunikat + link do „Zgłoś naprawę” (formularz publiczny).

**Efekt:** klient po wejściu widzi podsumowanie i szybki dostęp do napraw.

---

### Krok 3 — Lista napraw

- **Strona:** `/client/naprawy` (lub `/client/repairs`).
- **API:** `GET /api/v1/repairs/` (z tokenem) — lista już przefiltrowana po kliencie.
- **UI:** tabela lub karty: numer naprawy, urządzenie (np. z device), status (publiczny), data przyjęcia, szacowany termin, badge reklamacja/gwarancja (jeśli API zwraca), przycisk „Szczegóły”.
- **Filtry (opcjonalnie):** status, okres — jeśli backend wspiera query params.
- **Empty state:** brak napraw + CTA do zgłoszenia.

**Efekt:** pełna lista napraw klienta z wejściem do szczegółów.

---

### Krok 4 — Szczegóły naprawy

- **Strona:** `/client/naprawy/[id]` (np. id lub repair_number).
- **API:** `GET /api/v1/repairs/<id>/`, ewentualnie `GET /api/v1/repairs/<id>/status/` do odświeżania.
- **Sekcje:**
  - Nagłówek: numer naprawy, status publiczny, urządzenie.
  - Timeline (jeśli API zwraca events) — lista zdarzeń (status, notatki publiczne).
  - Wycena: kwota, pozycje (części/robocizna), przyciski „Zaakceptuj” / „Odrzuć” gdy status = quote_sent (wywołanie `POST .../quote-respond/`).
  - Szacowany termin realizacji / odbioru (jeśli w API).
  - Wiadomości: osobna sekcja lub zakładka (Krok 5).
  - Zdjęcia: tylko te z `is_visible_to_client` (API w szczegółach naprawy je filtruje).
  - Dane urządzenia (z API).
- **Decyzje klienta:** po zaakceptowaniu/odrzuceniu wyceny — komunikat sukcesu i odświeżenie statusu.
- **Ankieta satysfakcji:** po odebraniu naprawy (status picked_up/shipped/delivered) — formularz 1–5, „Czy polecisz?”, komentarz; `POST .../submit-satisfaction-survey/`.

**Efekt:** klient widzi pełny obraz naprawy, może zaakceptować/odrzucić wycenę i wypełnić ankietę.

---

### Krok 5 — Wiadomości (w kontekście naprawy)

- **Miejsce:** sekcja lub zakładka w szczegółach naprawy (`/client/naprawy/[id]`).
- **API:** `GET /api/v1/repairs/<id>/messages/` — lista notatek publicznych (is_internal=false).
- **UI:** wątek wiadomości (chronologicznie), autor („Serwis”), data, treść. Czytelny chat-like view.
- **Uwaga:** backend obecnie nie udostępnia endpointu do **wysyłania** odpowiedzi przez klienta (dodawanie notatki jest tylko dla staff). Można dodać placeholder „Masz pytanie? Zadzwoń / napisz do nas” lub w przyszłości backend: `POST /repairs/<id>/client-reply/`.

**Efekt:** klient widzi historię wiadomości z serwisem przy danej naprawie.

---

### Krok 6 — Profil klienta

- **Strona:** `/client/profil` (lub `/client/profile`).
- **API:** `GET /api/v1/clients/me/`, `PATCH /api/v1/clients/me/`.
- **UI:** formularz: imię, nazwisko, e-mail, telefon, preferowany kontakt, adres (ulica, miasto, kod). Zapisywanie przez PATCH. Komunikat sukcesu/błąd.
- **Rozszerzenia (jeśli API/backend wspiera):** historia napraw (linki), lista urządzeń, zgody (RODO) — tylko odczyt lub edycja w zależności od API. Wnioski: eksport danych, usunięcie danych — jeśli są endpointy w `compliance`, podlinkować lub dodać formularze.

**Efekt:** klient może przeglądać i edytować swoje dane.

---

### Krok 7 — Dopracowanie UX i edge case’y

- **Redirect po logowaniu:** zapamiętanie returnUrl (np. `/client/naprawy/123`) i przekierowanie po zalogowaniu.
- **Wylogowanie:** wywołanie `POST /accounts/logout/`, usunięcie tokena, redirect na stronę publiczną lub `/client/login`.
- **Wygaśnięcie tokena:** przy 401 z API — wylogowanie i redirect na login z komunikatem.
- **Responsywność:** panel klienta ma być wygodny na telefonie (mobile-first dla tej części).
- **Loading / empty / error:** spójne stany ładowania, brak danych i błędów (np. toast lub alert).

---

## Podsumowanie kolejności

| # | Zadanie | Priorytet |
|---|---------|-----------|
| 1 | Auth (login, token, redirect) + layout panelu klienta (`(client)`) | Najpierw |
| 2 | Dashboard klienta (my-summary, kafelki) | |
| 3 | Lista napraw | |
| 4 | Szczegóły naprawy (timeline, wycena, akceptacja/odrzucenie, zdjęcia, ankieta) | |
| 5 | Wiadomości przy naprawie (odczyt) | |
| 6 | Profil klienta (GET/PATCH me) | |
| 7 | UX: returnUrl, 401, wylogowanie, mobile, loading/error | |

---

## Uwagi

- **Konto klienta:** Backend zakłada, że User z role=client ma powiązany Client (client_profile). Tworzenie takich kont może być dziś tylko z poziomu admina/staff. Ewentualny „rejestracja klienta” lub „odzyskiwanie hasła” to osobny zakres (backend + frontend).
- **Ścieżki:** Można użyć `/client` zamiast `/panel` lub `/moje-konto`, aby było spójne z dokumentacją.
- Po zakończeniu tych kroków frontend dla klienta będzie kompletny w zakresie: logowanie, dashboard, lista i szczegóły napraw, wiadomości (odczyt), wycena (akceptacja/odrzucenie), ankieta, profil.
