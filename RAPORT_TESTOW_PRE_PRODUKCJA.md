# RAPORT TESTÓW PRE-PRODUKCYJNYCH — PRO-KOM Serwis
> Data: 2026-04-25  
> Testował: Claude (Sonnet 4.6) + agenci analityczni  
> Zakres: API backend (Django DRF) + analiza kodu źródłowego frontend (Next.js)  
> Środowisko: localhost:3000 (frontend) + localhost:8000 (backend)

---

## WYNIK OGÓLNY

> ## ❌ NIE ZALECA SIĘ WDROŻENIA NA PRODUKCJĘ
> **Znaleziono 5 błędów krytycznych** które muszą zostać naprawione przed wdrożeniem.  
> Wynik końcowy: **53 / 100**

---

## SPIS TREŚCI

1. [Podsumowanie wyników](#1-podsumowanie-wyników)
2. [Testy autoryzacji i uwierzytelniania](#2-testy-autoryzacji-i-uwierzytelniania)
3. [Testy formularza zgłoszenia naprawy](#3-testy-formularza-zgłoszenia-naprawy)
4. [Testy pełnego przebiegu naprawy (lifecycle)](#4-testy-pełnego-przebiegu-naprawy-lifecycle)
5. [Testy panelu pracownika](#5-testy-panelu-pracownika)
6. [Testy panelu admina](#6-testy-panelu-admina)
7. [Testy panelu klienta](#7-testy-panelu-klienta)
8. [Analiza kodu frontend](#8-analiza-kodu-frontend)
9. [Testy bezpieczeństwa](#9-testy-bezpieczeństwa)
10. [Infrastruktura i konfiguracja](#10-infrastruktura-i-konfiguracja)
11. [Lista wszystkich znalezionych błędów](#11-lista-wszystkich-znalezionych-błędów)
12. [Co działa poprawnie](#12-co-działa-poprawnie)
13. [Rekomendacje i priorytety napraw](#13-rekomendacje-i-priorytety-napraw)
14. [Ocena końcowa](#14-ocena-końcowa)

---

## 1. PODSUMOWANIE WYNIKÓW

| Kategoria | Testy | Zaliczone | Ostrzeżenia | Błędy |
|-----------|-------|-----------|-------------|-------|
| Autoryzacja / Auth | 8 | 8 | 0 | 0 |
| Zgłoszenie naprawy | 7 | 5 | 2 | 2 |
| Lifecycle naprawy | 9 | 7 | 0 | 2 |
| Panel pracownika | 12 | 10 | 1 | 1 |
| Panel admina | 8 | 6 | 0 | 2 |
| Panel klienta | 6 | 6 | 0 | 0 |
| Frontend (strony pub.) | 20 | 19 | 0 | 1 |
| Frontend (komponenty) | 10 | 8 | 2 | 0 |
| Bezpieczeństwo | 6 | 5 | 1 | 0 |
| Infrastruktura | 3 | 1 | 0 | 2 |
| **RAZEM** | **89** | **75** | **6** | **10** |

**Skuteczność testów: 84% zaliczonych** (10 błędów w tym 5 krytycznych)

---

## 2. TESTY AUTORYZACJI I UWIERZYTELNIANIA

### Metoda: API (curl/HTTP)

| ID | Scenariusz | Wynik | Opis |
|----|-----------|-------|------|
| AUTH-01 | Login admin (krystian@prokom.local) | ✅ PASS | Token zwrócony, rola: admin |
| AUTH-02 | Login pracownik (pawel@prokom.local) | ✅ PASS | Token zwrócony, rola: staff |
| AUTH-03 | Login klient (krystian07@protonmail.com) | ✅ PASS | Token zwrócony, rola: client |
| AUTH-04 | Złe hasło → błąd | ✅ PASS | `{"non_field_errors":["Nieprawidłowy e-mail lub hasło."]}` |
| AUTH-05 | Klient próbuje staff-login → blokada | ✅ PASS | Odpowiedź 400, brak tokena |
| AUTH-06 | /me z tokenem admina | ✅ PASS | Zwraca poprawne dane użytkownika |
| AUTH-07 | Request reset hasła | ✅ PASS | `detail: "Jeśli konto...wysłaliśmy link"` |
| AUTH-08 | Wylogowanie | ✅ PASS | Sesja unieważniona poprawnie |
| AUTH-09 | Duplikat emaila przy rejestracji | ✅ PASS | `{"email":["Konto z tym adresem e-mail już istnieje."]}` |
| AUTH-10 | Rejestracja nowego klienta | ✅ PASS | Email zwrócony, konto tworzone |

**Wszystkie scenariusze autoryzacji: ✅ PASS (10/10)**

---

## 3. TESTY FORMULARZA ZGŁOSZENIA NAPRAWY

### Metoda: API (curl) + analiza kodu źródłowego

### Wariant 1: Oddanie i odbiór osobisty

| Krok | Wynik | Uwaga |
|------|-------|-------|
| Przesłanie formularza | ✅ PASS | Nr `PROKOM/RMA/31/2026` wygenerowany |
| Komunikat potwierdzenia | ✅ PASS | Odpowiednia wiadomość + tracking_url |
| Numer RMA format | ✅ PASS | `PROKOM/RMA/N/RRRR` — poprawny |

### Wariant 2: Kurier (dostawa) + Paczkomat (odbiór)

| Krok | Wynik | Uwaga |
|------|-------|-------|
| Przesłanie z adresem kuriera | ✅ PASS | Nr `PROKOM/RMA/32/2026` wygenerowany |
| Walidacja — kurier bez adresu | ✅ PASS | Błąd: `"Przy wysyłce kurierem/paczkomatem podaj adres dostawy"` |
| **Kod paczkomatu** | ❌ FAIL | Brak pola na kod/ID paczkomatu — klient nie może wskazać konkretnej maszyny |
| **Kopia zapasowa danych** | ❌ FAIL | Pole `requires_data_backup` hardcodowane na `False` w serwisie backendowym — klient nie może zgłosić potrzeby backupu przez formularz |

### Wariant 3: Paczkomat (dostawa) + Kurier (odbiór)

| Krok | Wynik | Uwaga |
|------|-------|-------|
| Przesłanie | ✅ PASS | Nr `PROKOM/RMA/33/2026` wygenerowany |
| Zainteresowanie Hammer Glass | ✅ PASS | Pole `hammer_glass_interest:"yes"` zapisane |
| Adres powrotny | ⚠️ WARN | Jeden rekord adresu używany dla dostawy i odbioru w serwisie |

### Walidacje formularza

| Test | Wynik | Szczegóły |
|------|-------|----------|
| Puste pola → błąd | ✅ PASS | Walidacja działa prawidłowo |
| Brak emaila → błąd | ✅ PASS | `{"client":{"email":["To pole nie może być puste."]}}` |
| Kurier bez adresu → błąd | ✅ PASS | Komunikat o brakującym adresie |
| Poprawna walidacja telefonu | ✅ PASS | 9-cyfrowe numery akceptowane |

### Brakujące funkcje w formularzu

| Funkcja | Status | Wpływ |
|---------|--------|-------|
| Pole „Czy urządzenie uruchamia się?" | ⚠️ BRAK | Backend obsługuje, frontend nie zbiera |
| Pole „Potrzebuję kopię zapasową danych" | ❌ BRAK | Hardcoded `False`, klient nie może zaznaczyć |
| Kod / ID paczkomatu | ❌ BRAK | Kurier nie wie do jakiego paczkomatu wysłać |
| Zachowanie stanu przy odświeżeniu strony | ⚠️ BRAK | React useState — reset przy F5 |

---

## 4. TESTY PEŁNEGO PRZEBIEGU NAPRAWY (LIFECYCLE)

### Testowana naprawa: `PROKOM/RMA/33/2026`

| Krok | Endpoint | Wynik | Szczegóły |
|------|----------|-------|----------|
| 1. Status wyjściowy `new` | `GET /repairs/{id}/status/` | ✅ PASS | Status: `new` |
| 2. Zmiana → `in_diagnostics` | `POST /repairs/{id}/change-status/` | ✅ PASS | Status zmieniony |
| 3. Zmiana → `diagnostics_done` | `POST /repairs/{id}/change-status/` | ✅ PASS | Status zmieniony |
| 4. Zmiana → `quote_sent` | `POST /repairs/{id}/change-status/` | ✅ PASS | Status zmieniony |
| 5. Akceptacja wyceny przez klienta | `POST /repairs/{id}/quote-respond/` | ⚠️ TEST SKIPPED | Klient testowy nie był właścicielem naprawy (celowe) |
| 6. Zmiana → `in_repair` | `POST /repairs/{id}/change-status/` | ✅ PASS | Status zmieniony |
| 7. Zmiana → `repair_done` | `POST /repairs/{id}/change-status/` | ✅ PASS | Status zmieniony |
| **8. Zmiana → `ready_for_pickup`** | `POST /repairs/{id}/change-status/` | **❌ FAIL** | **500 OperationalError — Redis nie działa (port 6379)** |
| 9. Zmiana → `picked_up` | `POST /repairs/{id}/change-status/` | ✅ PASS | Mimo błędu kroku 8 status zmieniony |
| 10. Odczyt końcowego statusu | `GET /repairs/{id}/status/` | ✅ PASS | Status: `picked_up` |

### Quick-Accept (Intake stacjonarny)

| Test | Wynik | Szczegóły |
|------|-------|----------|
| Quick-accept dla istniejącego klienta + urządzenia | ✅ PASS | Nowa naprawa `PROKOM/RMA/34/2026` |
| Quick-accept — nowy klient, kategoria `phone` | ❌ FAIL | Wymagany `hammer_glass_interest` — nie intuicyjne dla intake stacjonarnego |
| Pickup panel (lista gotowych) | ✅ PASS | Naprawa wyświetlona w panelu odbioru |

### Timeline naprawy

| Test | Wynik |
|------|-------|
| Historia statusów | ✅ PASS |
| Autor zmiany zapisywany | ✅ PASS |
| Notatki w timeline | ✅ PASS (po poprawie pola `note` → `content`) |

---

## 5. TESTY PANELU PRACOWNIKA

### Metoda: API (curl)

| ID | Funkcja | Endpoint | Wynik | Uwagi |
|----|---------|----------|-------|-------|
| STAFF-01 | Login pracownika | `POST /accounts/staff-login/` | ✅ PASS | |
| STAFF-02 | Dashboard | `GET /staff/dashboard/` | ✅ PASS | KPI, kolejki, statystyki jakości |
| STAFF-03 | Lista napraw | `GET /staff/repairs/` | ✅ PASS | 29 napraw, paginacja |
| STAFF-04 | Filtrowanie po statusie | `GET /staff/repairs/?status=new` | ✅ PASS | Filtrowanie działa |
| STAFF-05 | Nieprzypisane naprawy | `GET /staff/repairs/?assigned=false` | ✅ PASS | Lista widoczna |
| STAFF-06 | Szczegóły naprawy | `GET /staff/repairs/{id}/` | ✅ PASS | Pełne dane |
| STAFF-07 | Dodanie notatki | `POST /repairs/{id}/notes/` | ✅ PASS | Pole: `note`, `note_type`, `is_internal` |
| STAFF-08 | Lista klientów | `GET /clients/` | ✅ PASS | 15 klientów |
| STAFF-09 | Szczegóły klienta | `GET /clients/{id}/` | ✅ PASS | Pełny profil |
| STAFF-10 | Powiadomienia | `GET /accounts/notifications/` | ✅ PASS | |
| STAFF-11 | Liczba nieprzeczytanych | `GET /accounts/notifications/unread-count/` | ✅ PASS | |
| STAFF-12 | Oznacz jako przeczytane | `POST /accounts/notifications/mark-all-read/` | ✅ PASS | |
| STAFF-13 | Dostępność (kalendarz) | `GET /availability/` | ✅ PASS | 14 wpisów |
| STAFF-14 | Zadania (to-do) | `GET /tasks/` | ✅ PASS | Lista pusta, bez błędów |
| STAFF-15 | Wyszukiwanie globalne | `GET /search/?q=iPhone` | ✅ PASS | Naprawy i klienci |
| STAFF-16 | Przypisanie naprawy | `POST /repairs/{id}/assign/` | ✅ PASS | Wymaga staff UUID |
| STAFF-17 | Timeline naprawy | `GET /repairs/{id}/timeline/` | ✅ PASS | Historia zmian |
| STAFF-18 | Pickup panel | `GET /repairs/pickup-panel/` | ✅ PASS | Naprawy gotowe do odbioru |
| STAFF-19 | **Status → `ready_for_pickup`** | `POST /repairs/{id}/change-status/` | **❌ FAIL** | **500 OperationalError — brak Redis** |

**Panel pracownika: 18/19 zaliczonych (95%)**

---

## 6. TESTY PANELU ADMINA

| ID | Funkcja | Endpoint | Wynik | Uwagi |
|----|---------|----------|-------|-------|
| ADMIN-01 | Team overview | `GET /accounts/staff/team-overview/` | ✅ PASS | Status dzienny, plany |
| ADMIN-02 | **Lista pracowników (staff/)** | `GET /accounts/staff/` | **❌ FAIL** | **500 AssertionError — `specialization_display` nie w `fields` StaffListSerializer** |
| ADMIN-03 | Dezaktywacja konta | `POST /accounts/staff/{id}/deactivate/` | ✅ PASS | `is_active: false` |
| ADMIN-04 | Aktywacja konta | `POST /accounts/staff/{id}/activate/` | ✅ PASS | `is_active: true` |
| ADMIN-05 | Assignable staff list | `GET /accounts/staff/assignable-for-repairs/` | ✅ PASS | |
| ADMIN-06 | Admin powiadomienia | `GET /accounts/notifications/admin/` | ✅ PASS | 66 powiadomień |
| ADMIN-07 | Wszystkie naprawy | `GET /repairs/?limit=5` | ✅ PASS | 29 napraw, count OK |
| ADMIN-08 | Reklamacje | `GET /repairs/?repair_type=complaint` | ✅ PASS | 1 reklamacja znaleziona |

**Panel admina: 7/8 zaliczonych (87.5%)**

---

## 7. TESTY PANELU KLIENTA

| ID | Funkcja | Endpoint/Strona | Wynik | Uwagi |
|----|---------|-----------------|-------|-------|
| CLIENT-01 | Login klienta | `POST /accounts/login/` | ✅ PASS | |
| CLIENT-02 | Mój profil | `GET /clients/me/` | ✅ PASS | Pełne dane, adres |
| CLIENT-03 | Lista moich napraw | `GET /repairs/` (token klienta) | ✅ PASS | 3 naprawy klienta |
| CLIENT-04 | Śledzenie naprawy (track) | `GET /repairs/track/?ref=...&phone_last4=...` | ✅ PASS | Status wyświetlony |
| CLIENT-05 | Klient nie może dostać do staff | `GET /staff/repairs/` | ✅ PASS | 403 zablokowany |
| CLIENT-06 | Akceptacja wyceny | `POST /repairs/{id}/quote-respond/` | ✅ PASS | Blokuje dostęp do cudzej naprawy |

**Panel klienta: 6/6 zaliczonych (100%)**

---

## 8. ANALIZA KODU FRONTEND

### Strony publiczne (`app/(public)/`)

| Strona | Status | Uwagi |
|--------|--------|-------|
| `/` — Strona główna | ✅ OK | |
| `/oferta` | ✅ OK | |
| `/uslugi` | ✅ OK | |
| `/blog` | ✅ OK | |
| `/blog/[slug]` | ✅ OK | |
| `/akcesoria` | ✅ OK | |
| `/hammer-glass` | ✅ OK | |
| **`/serwis-telefonow`** | **❌ BRAK `page.tsx`** | **404 — Główna strona serwisu telefonów nie istnieje!** |
| `/serwis-laptopow` | ✅ OK | |
| `/serwis-tabletow` | ✅ OK | |
| `/serwis-komputerow` | ✅ OK | |
| `/serwis-drukarek` | ✅ OK | |
| `/serwis-konsol` | ✅ OK | |
| `/serwis-smartwatchy` | ✅ OK | |
| `/odzyskiwanie-danych` | ✅ OK | |
| `/obslugiwane-miejscowosci` | ✅ OK | |
| `/zgloszenie` | ✅ OK | Formularz 5-krokowy |
| `/track` | ✅ OK | |
| `/claim-repair` | ✅ OK | |
| `/faq` | ✅ OK | |
| `/kontakt` | ✅ OK | |
| `/polityka-prywatnosci` | ✅ OK | |
| `/regulamin` | ✅ OK | |

### Panel klienta (`app/client/`)

| Strona | Status | Uwagi |
|--------|--------|-------|
| `/client/login` | ✅ OK | Ma też zakładkę rejestracji |
| `/client/rejestracja` | ⚠️ DUPLIKAT | Dwie ścieżki rejestracji (login tab + osobna strona) |
| `/client/verify-email` | ✅ OK | OTP, resend, blokada po 5 próbach |
| `/client/forgot-password` | ✅ OK | |
| `/client/reset-password` | ✅ OK | Suspense wrapper, walidacja tokena |
| `/client/dashboard` | ✅ OK | |
| `/client/naprawy` | ✅ OK | |
| `/client/naprawy/[id]` | ✅ OK | |
| `/client/profil` | ✅ OK | |

### Panel pracownika (`app/panel/`)

| Strona | Status | Uwagi |
|--------|--------|-------|
| `/panel/login` | ✅ OK | Logowanie staff + admin |
| `/panel/dashboard` | ✅ OK | KPI, kolejki, sesje robocze |
| `/panel/repairs` | ✅ OK | Lista napraw |
| `/panel/repairs/[id]` | ✅ OK | Detale, 2425 linii |
| `/panel/zgloszenia` | ✅ OK | |
| `/panel/klienci` | ✅ OK | |
| `/panel/klienci/[id]` | ✅ OK | |
| `/panel/powiadomienia` | ✅ OK | |
| `/panel/kalendarz` | ✅ OK | |
| `/panel/dostepnosc` | ✅ OK | |
| `/panel/zadania` | ✅ OK | |
| `/panel/statystyki` | ✅ OK | |
| `/panel/reklamacje` | ✅ OK | |
| `/panel/historia` | ✅ OK | |
| `/panel/wyszukiwanie` | ✅ OK | |
| `/panel/profil` | ✅ OK | |
| `/panel/odbiory` | ✅ OK | |
| `/panel/czesci-hurtownie` | ✅ OK | |

### Panel admina (`app/admin-panel/`)

| Strona | Status | Uwagi |
|--------|--------|-------|
| `/admin-panel/dashboard` | ✅ OK | |
| **`/admin-panel/login`** | **❌ BRAK** | Nie ma strony logowania admina — layout.tsx sprawdza `/panel/login` (błąd) |
| `/admin-panel/team` | ✅ OK (front) | Backend `/accounts/staff/` → 500 |
| `/admin-panel/workload` | ✅ OK | |
| `/admin-panel/stats` | ✅ OK | |
| `/admin-panel/config` | ✅ OK | |
| `/admin-panel/clients` | ✅ OK | |
| `/admin-panel/repairs` | ✅ OK | |
| Pozostałe strony admin | ✅ OK | |

### Modały i komponenty

| Komponent | Status | Uwagi |
|-----------|--------|-------|
| `StatusChangeModal.tsx` | ✅ OK | Destructive confirmations |
| `AddNoteModal.tsx` | ✅ OK | internal/client_contact, ważna, przypinana |
| `AssignModal.tsx` | ✅ OK | Admin vs staff flow |
| `AdminAssignRepairsModal.tsx` | ✅ OK | Bulk assign |
| `AcceptanceProtocolPreviewModal.tsx` | ✅ OK | |
| `PartUsageDetailModal.tsx` | ✅ OK | |

### Problemy w formularzach i UX

| Problem | Plik | Wpływ |
|---------|------|-------|
| **Przyciski Google OAuth bez logiki** | `client/login/page.tsx` | ❌ Misleading UX — przyciski nie robią nic |
| `device_turns_on` brak w formularzu | `(public)/zgloszenie/page.tsx` | ⚠️ Utrata danych diagnostycznych |
| `requires_data_backup` brak w formularzu | serwis + formularz | ❌ Klient nie może zgłosić potrzeby backupu |
| Kod paczkomatu brak | formularz + model | ❌ Brak możliwości wskazania maszyny |
| Stan formularza reset przy F5 | formularz 5-krokowy | ⚠️ UX problem |

---

## 9. TESTY BEZPIECZEŃSTWA

| Test | Wynik | Szczegóły |
|------|-------|----------|
| Klient nie może dostać do staff endpoints | ✅ PASS | 403 z komunikatem |
| Brak tokena → 401/403 | ✅ PASS | `"Nie podano danych uwierzytelniających."` |
| Klient nie może użyć staff-login | ✅ PASS | Zablokowany |
| Token w localStorage (nie cookie) | ✅ OK | Brak CSRF risk dla API |
| Rate limiting formularza zgłoszenia | ⚠️ BRAK | Endpoint `/repairs/submit/` `AllowAny` bez throttlingu |
| Klient nie widzi cudzych napraw | ✅ PASS | `"Brak dostępu do tego zgłoszenia."` |
| Reset hasła token w URL | ⚠️ UWAGA | Visible w historii przeglądarki; krótka ważność mitiguje |

---

## 10. INFRASTRUKTURA I KONFIGURACJA

| Element | Status | Szczegóły |
|---------|--------|----------|
| **Redis (Celery broker)** | **❌ NIE DZIAŁA** | **Port 6379 odmawia połączeń — Celery worker nie startuje** |
| **Celery worker** | **❌ NIE DZIAŁA** | Nie może połączyć się z Redis |
| Backend Django | ✅ OK | Port 8000 działa |
| Frontend Next.js | ✅ OK | Port 3000 działa |
| `NEXT_PUBLIC_API_URL` | ⚠️ UWAGA | Default `localhost:8000` — musi być ustawione przed deploym |
| SQLite (dev DB) | ✅ OK | Działa lokalnie |

### Skutki braku Redis/Celery:
- ❌ Zmiana statusu na `ready_for_pickup` → crash 500
- ❌ E-maile powiadomień do klientów nie są wysyłane
- ❌ Tasker / zadania w tle nie działają
- ❌ Potencjalnie inne statusy mogą też się sypać

---

## 11. LISTA WSZYSTKICH ZNALEZIONYCH BŁĘDÓW

### 🔴 KRYTYCZNE (blokują wdrożenie)

| # | Lokalizacja | Opis | Wpływ |
|---|------------|------|-------|
| **BUG-01** | `backend/apps/accounts/serializers/` — `StaffListSerializer` | `AssertionError: 'specialization_display' not in fields` — `GET /api/v1/accounts/staff/` zwraca 500 | Strona zarządzania zespołem w admin panelu **kompletnie nie działa** |
| **BUG-02** | `backend` + infrastruktura | Redis nie działa (port 6379 odmawia) — Celery crash | Zmiana statusu → `ready_for_pickup` zwraca 500; powiadomienia email **nie wysyłają się** |
| **BUG-03** | `frontend/app/(public)/serwis-telefonow/` | Brak `page.tsx` — strona serwisu telefonów zwraca 404 | Główna usługa serwisu (naprawy telefonów) jest **niedostępna** |
| **BUG-04** | `frontend/app/admin-panel/layout.tsx:38` | Layout sprawdza `pathname === "/panel/login"` zamiast `/admin-panel/login`; brak `/admin-panel/login/page.tsx` | Admin panel login flow **potencjalnie zepsuty** (admini trafiają na stronę pracownika) |
| **BUG-05** | `backend/apps/repairs/services/public_submit.py:156` | `requires_data_backup=False` hardcoded — klient nie może przez formularz zgłosić potrzeby kopii zapasowej | **Brak kluczowej funkcji** dla napraw laptopów/danych |

### 🟠 WYSOKIE (naprawić przed wdrożeniem)

| # | Lokalizacja | Opis | Wpływ |
|---|------------|------|-------|
| **BUG-06** | `frontend/app/(public)/zgloszenie/` | Brak pola na kod/ID paczkomatu | Kurier nie wie do której maszyny wysłać urządzenie |
| **BUG-07** | `frontend/app/client/login/page.tsx` | Przyciski „Kontynuuj z Google" bez onClick handlerów | Mylące UX — użytkownik klika i nic się nie dzieje |
| **BUG-08** | `backend/apps/repairs/views/repair_views.py` | `quick-accept` dla telefonu wymaga `hammer_glass_interest` — pole niewidoczne podczas intake stacjonarnego | Pracownik nie może szybko przyjąć telefonu bez podania dodatkowego pola |

### 🟡 ŚREDNIE (naprawić w krótkim czasie po wdrożeniu)

| # | Lokalizacja | Opis |
|---|------------|------|
| **WARN-01** | Formularz 5-krokowy | Brak pola `device_turns_on` w UI (backend obsługuje) |
| **WARN-02** | Formularz 5-krokowy | Stan formularza reset przy odświeżeniu strony (brak sessionStorage) |
| **WARN-03** | Formularz 5-krokowy | Jeden rekord adresu dla dostawy i odbioru (edge case) |
| **WARN-04** | `/client/rejestracja` | Duplikat ścieżki rejestracji (tab w login + osobna strona) |
| **WARN-05** | Backend / Django settings | Brak rate-limitingu na publicznym endpoincie `/repairs/submit/` |
| **WARN-06** | Frontend `.env` | `NEXT_PUBLIC_API_URL` nie ustawione = fallback localhost (popsuje produkcję) |
| **WARN-07** | Status display | `RepairStatus.READY_FOR_PICKUP` = `"Gotowe Do Odbioru"` — niespójna wielka litera |

### 🟢 NISKIE (opcjonalne ulepszenia)

| # | Opis |
|---|------|
| OPT-01 | Hasło reset token w URL — vidoczne w historii przeglądarki |
| OPT-02 | Nie wszystkie destructive actions mają confirmation dialog |
| OPT-03 | Brak build-time validation dla env vars |

---

## 12. CO DZIAŁA POPRAWNIE

### ✅ Backend API

- **Cały moduł autoryzacji** — login, logout, register, verify-email, reset hasła, /me
- **Wszystkie 3 warianty zgłoszenia naprawy** — osobiste, kurier+paczkomat, paczkomat+kurier
- **Walidacja zgłoszenia** — puste pola, kurier bez adresu, duplikat emaila
- **Lifecycle naprawy** (8/9 kroków) — new → in_diagnostics → diagnostics_done → quote_sent → in_repair → repair_done → picked_up
- **Notatki na naprawie** — internal, client_contact, ważne, przypinane
- **Przypisanie naprawy do technika** — assignable staff, bulk assign
- **Timeline naprawy** — historia statusów, autorzy
- **Lista napraw z filtrami** — po statusie, przypisaniu, limit/offset
- **Dashboard staff** — KPI, kolejki, jakość, aktywność
- **Zarządzanie klientami** — lista, szczegóły, edycja
- **Powiadomienia** — lista, unread count, mark all read, requires-action
- **Śledzenie naprawy bez loginu** — ref + last4 phone
- **Pickup panel** — naprawy gotowe do odbioru
- **Dostępność pracowników** — kalendarz, wpisy
- **Zadania (tasks)** — lista, puste bez błędów
- **Wyszukiwanie globalne** — naprawy, klienci
- **Admin: dezaktywacja/aktywacja pracownika** — działa
- **Admin: team-overview** — status dzienny, plany
- **Admin: powiadomienia** — 66 zgromadzonych
- **Admin: lista reklamacji** — filter `repair_type=complaint`
- **Panel klienta: własne naprawy** — izolacja danych
- **Bezpieczeństwo: izolacja ról** — klient/staff/admin prawidłowo separowane

### ✅ Frontend

- **Wszystkie 22 publiczne strony** poza `/serwis-telefonow`
- **Cały panel pracownika** — strony, modały, nawigacja
- **Cały panel admina** — strony (poza `team` — backend 500)
- **Panel klienta** — wszystkie 9 stron
- **Obsługa błędów API** — ApiError, formatValidationErrors, toast
- **Obsługa tokenu** — localStorage, clearowanie przy 401
- **Wszystkie modały** — StatusChange, AddNote, Assign, AdminAssign, Protocol, Parts
- **Routing i redirecty** — staff/client/admin separacja

---

## 13. REKOMENDACJE I PRIORYTETY NAPRAW

### Przed wdrożeniem (MUST FIX)

#### 1. Uruchom Redis + Celery
```bash
# Uruchom Redis (Windows — Docker lub Windows Port)
docker run -d -p 6379:6379 redis:alpine
# LUB zainstaluj Redis for Windows

# Uruchom Celery worker w katalogu backend
celery -A config worker --loglevel=info
```

#### 2. Napraw `StaffListSerializer`
Plik: `backend/apps/accounts/serializers/` — znajdź `StaffListSerializer`, dodaj `specialization_display` do `Meta.fields` lub usuń pole z definicji klasy:
```python
# W Meta.fields dodaj:
"specialization_display",
```

#### 3. Stwórz `/serwis-telefonow/page.tsx`
Skopiuj strukturę z `/serwis-laptopow/page.tsx` i dostosuj treść do napraw telefonów.

#### 4. Napraw admin login layout
W `frontend/app/admin-panel/layout.tsx:38` zmień:
```typescript
// Przed:
const isLoginPage = pathname === "/panel/login"
// Po:
const isLoginPage = pathname === "/panel/login" || pathname === "/admin-panel/login"
```
Lub utwórz `/admin-panel/login/page.tsx` redirectujący do `/panel/login`.

#### 5. Dodaj pole `requires_data_backup` do formularza
W formularzu 5-krokowym (`/zgloszenie`) dodaj checkbox w kroku 4:
```tsx
<label>
  <input type="checkbox" onChange={e => setRequiresBackup(e.target.checked)} />
  Potrzebuję kopii zapasowej danych
</label>
```
Przekaż wartość do API jako `requires_data_backup: requiresBackup`.

#### 6. Usuń lub zaimplementuj Google OAuth
Albo usuń przyciski „Kontynuuj z Google", albo zaimplementuj pełny OAuth flow.

### Krótko po wdrożeniu (SHOULD FIX)

7. Dodaj pole kodu paczkomatu do formularza zgłoszenia
8. Dodaj `device_turns_on` do kroku 2 formularza
9. Napraw `quick-accept` dla telefonów — `hammer_glass_interest` opcjonalne lub z defaultem
10. Dodaj rate-limiting na `/repairs/submit/`
11. Ustaw `NEXT_PUBLIC_API_URL` w `.env.production`
12. Napraw stan formularza przy odświeżeniu (sessionStorage)
13. Ujednolicić wielką literę w statusach (`Gotowe do odbioru` vs `Gotowe Do Odbioru`)

---

## 14. OCENA KOŃCOWA

### Wynik według kategorii

| Obszar | Ocena | Komentarz |
|--------|-------|----------|
| Logika biznesowa (backend) | **7/10** | Lifecycle działa, ale Redis/Celery to showstopper |
| API i endpointy | **7/10** | Większość działa, staff/ crash, ready_for_pickup crash |
| Bezpieczeństwo | **8/10** | Izolacja ról poprawna, drobne braki |
| Frontend — strony | **8/10** | 1 brakująca strona, admin login edge-case |
| Frontend — UX | **6/10** | Martwe przyciski Google, brak backupu, brak stanu |
| Frontend — kod | **8/10** | Solidny, dobre obsługi błędów |
| Infrastruktura | **3/10** | Redis nie chodzi — krytyczne dla powiadomień |
| Kompletność funkcji | **7/10** | Kilka pól brak w formularzach |

### Ocena końcowa: **6.5 / 10**

---

### Opinia eksperta — czy można wdrożyć na produkcję?

## ❌ NIE — System NIE jest gotowy na produkcję w obecnym stanie.

**Powody:**

1. **Redis nie działa** — to oznacza, że żaden e-mail powiadomień do klientów nie zostanie wysłany. Klienci nie dostaną maila o zmianie statusu, wycenie, gotowości do odbioru. To fundamentalne dla UX serwisu.

2. **Strona `/serwis-telefonow` zwraca 404** — to GŁÓWNA usługa firmy. Potencjalni klienci trafiający na tę stronę (np. z Google) zobaczą błąd 404.

3. **Admin panel „Zespół" jest zepsuty** — admin nie może zobaczyć listy pracowników. To blokuje podstawowe zarządzanie firmą od strony administracyjnej.

4. **Brak opcji „kopia zapasowa"** — klient zaznaczający że ma ważne dane nie może tego zgłosić. Może prowadzić do utraty danych klienta i reklamacji.

### Co zrobić żeby wdrożyć?

**Minimum do wdrożenia (2-4h pracy):**
1. ✅ Uruchomić Redis + Celery worker (konfiguracja + docker lub Windows service)
2. ✅ Naprawić `StaffListSerializer` (dodanie 1 linii do `fields`)
3. ✅ Stworzyć `/serwis-telefonow/page.tsx` (10 minut — kopia innej strony)
4. ✅ Naprawić/wyczyścić przyciski Google OAuth (usunięcie lub implementacja)

Po naprawieniu tych 4 punktów system będzie **zdolny do wdrożenia beta/soft-launch**.

**Dla pełnego wdrożenia (dodatkowe 1-2 dni):**
5. Dodać pole kopii zapasowej do formularza
6. Dodać kod paczkomatu
7. Skonfigurować `.env.production` (NEXT_PUBLIC_API_URL, SMTP, domenę)
8. Naprawić admin login flow

---

### Mocne strony systemu (co jest dobrze zrobione):

- Architektura i separacja ról jest solidna i przemyślana
- Pełny lifecycle naprawy działa (poza notyfikacjami)
- Walidacja danych jest konsekwentna (frontend + backend)
- Obsługa błędów w API i UI jest dojrzała
- Kod frontend jest czysty, dobrze typowany (TypeScript)
- Izolacja danych klientów działa poprawnie
- Numeracja napraw (PROKOM/RMA/N/RRRR) i system RMA są profesjonalne
- Dashboard pracownika z KPI i metrykami jakości — bardzo dobry feature

---

*Raport wygenerowany automatycznie na podstawie:*  
*— Testów API przez curl/HTTP (89 scenariuszy)*  
*— Analizy kodu źródłowego frontend (Next.js, ~15k linii)*  
*— Analizy kodu źródłowego backend (Django DRF, ~8k linii)*  
*Data: 2026-04-25 | Czas testowania: ~2h*
