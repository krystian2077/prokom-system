# PRO-KOM Serwis — Analiza stanu projektu

Data analizy: 2025-03-07

## 1. Podsumowanie wykonawcze

**Zaimplementowane:** Etapy 1–6 (fundament, modele, API, auth, panel staff, panel klienta, pricing, inventory).  
**Brakuje:** Etapy 7–11 (Hammer Glass, akcesoria, komunikacja, dokumenty, RODO/backup, analytics), frontend, testy automatyczne, część ulepszeń operacyjnych.

---

## 2. Co jest zaimplementowane i dobrze zrobione

### 2.1. Konfiguracja i infrastruktura

- **Settings:** Podział `base` / `local` / `prod` / `render`, django-environ, CORS, DRF, drf-spectacular, whitenoise.
- **Struktura appek:** Zgodna z dokumentacją (common, accounts, clients, devices, repairs, diagnostics, pricing, inventory, accessories, hammer_glass, communications, timelines, calendar_app, documents, analytics, compliance).
- **Clean code:** Małe pliki, selectors, services, rozdzielone serializery (np. `repairs/serializers/repair_request.py`, `staff_dashboard.py`, `timeline.py`).

### 2.2. Common

- **Modele bazowe:** `BaseModel`, `TimestampedModel`, `UUIDModel`, `SoftDeleteModel`.
- **Enums:** `DeviceCategory`, `RepairStatus`, `RepairPriority`, `DeliveryMethod`, `ReturnMethod`, `ContactPreference`, `ConsentType`, `MessageType`, `DocumentType`, `PaymentStatus`.
- **Utils:** `generate_repair_number`, `generate_client_number`, `get_public_repair_status`, `get_status_badge_color`, `format_polish_phone`, `calculate_estimated_completion_date`.
- **Validators:** `validate_polish_phone`, `validate_imei`, `validate_serial_number` (z obsługą pustych pól).
- **Permissions:** `IsStaffOrAdmin`, `get_client_for_user()`.

### 2.3. Accounts

- **User:** Custom user (email, role: admin/staff/client), `UserManager`, `StaffProfile`.
- **Auth API:** `POST /accounts/login/`, `POST /accounts/logout/`, `GET /accounts/me/` (token + user).

### 2.4. Clients

- **Modele:** `Client`, `ClientConsent`, `ClientNote`, `ClientAddress` (soft delete, client_number).
- **API:** CRUD + `GET/PATCH /clients/me/` (profil klienta), serializery list/detail/create.

### 2.5. Devices

- **Modele:** `Brand`, `DeviceModel`, `Device`, `DeviceImage`.
- **API:** ViewSety dla brands, models, devices (CRUD, filtry, wyszukiwanie).

### 2.6. Repairs

- **Modele:** `RepairRequest`, `RepairStatusHistory`, `RepairAssignment`, `RepairImage`, `RepairNote`.
- **Selectors:** `repair_list`, `repair_by_id`, `repair_by_number`, `staff_dashboard_data`, kubełki dashboardu.
- **Services:** `create_repair_request`, `change_repair_status`, `submit_repair_from_public_form`, `assign_repair`.
- **API:**
  - CRUD napraw (staff/admin); klient tylko list + retrieve własnych.
  - `POST /repairs/submit/` — publiczny formularz (AllowAny).
  - `POST /repairs/<id>/change-status/`, `POST /repairs/<id>/notes/`, `POST /repairs/<id>/images/`, `POST /repairs/<id>/assign/`.
  - `GET /repairs/dashboard/` — dashboard staff.
  - `GET /repairs/<id>/timeline/`, `GET /repairs/<id>/messages/`, `GET /repairs/<id>/status/`.
  - Panel klienta: `GET /repairs/my-summary/`, `POST /repairs/<id>/quote-respond/`.
  - Etap 6: `GET/POST /repairs/<id>/parts/` (PartUsage), `GET /repairs/<id>/cost-summary/`.
- **Uprawnienia:** Staff/admin pełny dostęp; klient tylko własne naprawy, bez internal_notes, tylko zdjęcia `is_visible_to_client`.

### 2.7. Inventory

- **Modele:** `Supplier`, `Part`, `PurchaseOrder`, `PurchaseOrderItem`, `PartUsage`.
- **API:** CRUD suppliers, parts, purchase-orders (IsStaffOrAdmin). Pozycje zamówienia tylko w adminie lub przez inline (brak osobnego endpointu do dodawania items przy tworzeniu PO).

### 2.8. Pricing

- **Modele:** `LabourType`, `Quote`, `QuoteItem`, `Deposit`.
- **API:** CRUD labour-types, quotes, deposits; `POST /pricing/quotes/<id>/items/` — dodawanie pozycji wyceny.
- **Zysk:** `GET /repairs/<id>/cost-summary/` (parts_cost, revenue, profit).

### 2.9. Admin Django

- Zarejestrowane: User, StaffProfile, Client, ClientConsent, ClientNote, ClientAddress, Brand, DeviceModel, Device, DeviceImage, RepairRequest + inlines, Supplier, Part, PurchaseOrder, PartUsage, LabourType, Quote, Deposit.

---

## 3. Drobne luki i możliwe ulepszenia (już w zakresie Etapów 1–6)

| Obszar | Stan | Uwaga |
|--------|------|--------|
| **PurchaseOrder + items** | Częściowo | Tworzenie zamówienia z listą pozycji (nested write) nie jest w API — items tylko read_only; dodawanie przez admin lub osobny endpoint. |
| **Stan magazynowy** | Brak automatyki | Przy dodaniu `PartUsage` nie ma automatycznego odejmowania `quantity_in_stock` w `Part` — można dodać sygnał lub serwis. |
| **simple_history** | Nieużywane | W `INSTALLED_APPS` i middleware jest; żaden model nie ma `HistoricalRecords()` — można dodać do kluczowych modeli (np. RepairRequest, Quote). |
| **Walidacja Quote** | OK | Tworzenie wyceny z `repair` — w porządku; wersjonowanie (np. przy odrzuceniu nowa wersja) można doprecyzować w logice biznesowej. |
| **Testy** | Brak | `pytest`, `pytest-django`, `coverage` w requirements — brak katalogu `tests/` i testów. |
| **Frontend** | Brak | W README jest `frontend/` (Next.js), w repo brak katalogu `frontend/` — tylko backend. |

---

## 4. Co nie jest jeszcze zaimplementowane (Etapy 7–11 i inne)

### Etap 7 — Hammer Glass, akcesoria, upselle

- **hammer_glass:** Tylko `apps.py` — brak modeli (produkty, cechy, porównania, wybory klienta).
- **accessories:** Tylko `apps.py` — brak modeli (akcesoria, pakiety, upselle, sprzedaż dodatkowa).
- Brak API i integracji z naprawą (sugestie upselli przy naprawie, „najczęściej kupowane z tą naprawą”).

### Etap 8 — E-mail, notatki wewnętrzne, komunikacja zespołu, SMS

- **communications:** Tylko `apps.py` — brak modeli (wiadomości do klienta, notatki wewnętrzne już są w `RepairNote`; brak dedykowanego modułu wiadomości / wątków).
- Brak: wysyłka e-maili (szablony, kolejka), integracja SMS (np. SMSAPI), szablony komunikatów (e-mail / panel / SMS) i powiązania z statusami naprawy.

### Etap 9 — PDF, dokumenty, QR, etykiety

- **documents:** Tylko `apps.py` — brak modeli i API.
- Brak: generowanie PDF (protokoły, wyceny, etykiety), QR do śledzenia naprawy, etykiety na urządzenia.

### Etap 10 — RODO, backup, compliance

- **compliance:** Tylko `apps.py` — brak modeli.
- Brak: wnioski RODO (usunięcie / eksport danych), log obsługi żądań, polityki/regulaminy (wersje).
- Backup: brak zadań Celery/skryptów (backup bazy, plików, retencja 7/4/6), brak konfiguracji Celery/Redis w projekcie (wymienione w README).

### Etap 11 — Dashboard admina, KPI, statystyki, rankingi

- **analytics:** Tylko `apps.py` — brak modeli i API.
- Brak: KPI (nowe zgłoszenia, w toku, gotowe do odbioru, nieodebrane, przychód, zysk), rankingi pracowników, statystyki Hammer Glass, statystyki akcesoriów, statystyki SMS, raporty.

### Inne (z dokumentacji)

- **diagnostics:** Tylko `apps.py` — brak modeli (diagnoza, checklisty, testy).
- **timelines:** Tylko `apps.py` — timeline jest w repairs (status_history + notes); ewentualnie wspólny audit log.
- **calendar_app:** Tylko `apps.py` — brak kalendarza, slotów, blokad.
- **Frontend:** Brak aplikacji Next.js (strona publiczna, panele: client, staff, admin).
- **Celery + Redis:** W README; w `config/` brak `celery.py` i konfiguracji kolejki.
- **PostgreSQL w dev:** W `local.py` domyślnie SQLite; przełączenie na PostgreSQL jest w komentarzu.

---

## 5. Rekomendacje kolejnych kroków

1. **Priorytet 1 (jeśli chcesz „zamknąć” backend Etapów 7–11):**
   - Etap 7: modele Hammer Glass + Accessories, API, powiązanie z naprawą (upselle).
   - Etap 8: modele/konfiguracja komunikacji, szablony wiadomości, integracja e-mail + SMS (Celery).
   - Etap 9: app documents — generowanie PDF/QR/etykiet (np. reportlab, qrcode).
   - Etap 10: app compliance — RODO (wnioski, log), backup (zadania + storage).
   - Etap 11: app analytics — endpointy KPI, rankingi, statystyki.

2. **Priorytet 2 (jakość i utrzymanie):**
   - Dodać katalog `backend/tests/`, podstawowe testy (auth, tworzenie naprawy, public submit, cost-summary).
   - Opcjonalnie: `HistoricalRecords()` na wybranych modelach (np. RepairRequest, Quote).
   - Opcjonalnie: endpoint lub rozszerzenie tworzenia PurchaseOrder o listę pozycji (nested).

3. **Priorytet 3 (frontend i infrastruktura):**
   - Inicjalizacja frontendu Next.js (struktura z workflow: (public), (client), (staff), (admin)).
   - Konfiguracja Celery + Redis (celery.py, kolejka zadań, np. e-mail/SMS/backup).

---

## 6. Tabela zgodności z etapami (workflow)

| Etap | Zawartość | Status |
|------|-----------|--------|
| 1 | Repo, backend, frontend, settings, PostgreSQL, Redis, User | ✅ Backend + settings + User; ⏳ brak frontend, Redis/Celery, PostgreSQL w dev |
| 2 | clients, devices, repairs, statusy, assignment | ✅ |
| 3 | auth, lista/szczegóły/tworzenie napraw | ✅ + public submit |
| 4 | panel staff, dashboard, szybkie akcje, timeline | ✅ |
| 5 | panel klienta, naprawy, wiadomości, wycena, status | ✅ |
| 6 | pricing, inventory, części, robocizna, zysk | ✅ |
| 7 | Hammer Glass, akcesoria, upselle | ❌ |
| 8 | e-mail, notatki wewn., komunikacja, SMS | ❌ (notatki w RepairNote są) |
| 9 | PDF, dokumenty, QR, etykiety | ❌ |
| 10 | RODO, backup, compliance | ❌ |
| 11 | dashboard admina, KPI, statystyki, rankingi | ❌ |

---

*Dokument wygenerowany na podstawie przeglądu repozytorium i dokumentów PROKOM_WORKFLOW_RENDER_GIT_PODSUMOWANIE oraz analizy projektu.*
