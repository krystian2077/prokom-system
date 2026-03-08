# Nowe funkcjonalności z prokom.md — plan i stan implementacji

Data: 2025-03-07  
Źródło: zaktualizowany **prokom.md** (Staff Notifications Center, dashboardy, reklamacje/gwarancje, „inne urządzenie”).

---

## 1. Staff Notifications Center ✅ (backend)

### Zaimplementowane
- **Model `StaffNotification`** (accounts): user, notification_type, priority, repair, title, description, status (unread/read/archived), link, created_at.
- **API:**
  - `GET /api/v1/accounts/notifications/` — lista powiadomień (filtr: status, priority, type, limit).
  - `PATCH /api/v1/accounts/notifications/<id>/` — oznacz read/archived.
  - `POST /api/v1/accounts/notifications/mark-all-read/`.
  - `GET /api/v1/accounts/notifications/requires-action/` — naprawy z `requires_attention=True` (kolejka reakcji).
- **Triggery:** przypisanie naprawy, dodanie notatki (inny niż przypisany), zaakceptowanie/odrzucenie wyceny. Anti-spam: brak duplikatu (user, type, repair) w 2 min.
- **Priorytety:** low, standard, important, urgent.

### Do dokończenia (opcjonalnie)
- Powiadomienia: część dotarła, naprawa zbliża się do terminu, SLA przekroczone, reklamacja/gwarancja przypisana, szybkie przyjęcie nieuzupełnione — wymagają wywołania `create_staff_notification` w odpowiednich miejscach (inventory, health/reminders, tworzenie reklamacji).
- Ustawianie `repair.requires_attention`, `last_client_message_at`, `last_staff_reply_at`, `last_activity_at` w logice (komunikacja, notatki, statusy).

---

## 2. Rozszerzenia RepairRequest i Device ✅

### RepairRequest
- `requires_attention` (bool) — do widoku „wymaga reakcji”.
- `last_client_message_at`, `last_staff_reply_at`, `last_activity_at` — do statystyk i SLA.
- `complaint_warranty_status` — status reklamacji/gwarancji: accepted, verification, awaiting_decision, recognized, rejected, in_progress, closed.
- Enum `ComplaintWarrantyStatus` w common.enums.

### Device — „inne urządzenie”
- `manual_device_name`, `manual_brand`, `manual_model` — dla kategorii „other”; `get_device_name()` korzysta z nich.
- Serializery i API przyjmują te pola.

---

## 3. Reklamacje i gwarancje (moduł)

### Już było
- `parent_repair`, `repair_type` (standard/complaint/warranty/scheduled).
- Własny numer sprawy (każda naprawa ma repair_number; typ w polu repair_type).

### Dodane
- `complaint_warranty_status` — osobny status dla reklamacji/gwarancji.
- Badge na liście: frontend może używać `repair_type` (reklamacja / gwarancja).
- Powiązane reklamacje: `repair.complaint_repairs` (related_name); w API szczegółów naprawy można dodać pole `related_complaints_warranties`.

### Zaimplementowane (backend)
- Lista napraw obsługuje filtr `complaint_warranty_status`; filtr `repair_type=complaint` / `repair_type=warranty` daje listy reklamacji/gwarancji.
- W szczegółach naprawy (RepairRequestSerializer) pole **related_complaints_warranties** — lista powiązanych reklamacji/gwarancji (id, repair_number, repair_type, status, complaint_warranty_status). Dla klienta pole ukryte.

### Do rozbudowy (opcjonalnie)
- Osobne ścieżki typu `/repairs/complaints/`, `/repairs/warranties/` (aliasy z domyślnym filtrem).
- ComplaintDecision / WarrantyDecision (koszt po stronie firmy, części/robocizna) — opcjonalne modele.

---

## 4. Dashboard staff — KPI jakościowe (N3) ✅

### Zaimplementowane
- Dashboard: `GET /api/v1/repairs/dashboard/` zwraca dodatkowo blok **quality** z metrykami:
  - **messages_to_clients_count** — wiadomości wysłane przeze mnie do klientów (CommunicationLog).
  - **open_repairs_count** — liczba niezamkniętych spraw (przypisanych do mnie).
  - **average_response_time_hours** — średni czas odpowiedzi (last_staff_reply_at − last_client_message_at).
  - **complaints_to_my_repairs_count**, **warranties_to_my_repairs_count** — reklamacje/gwarancje do moich napraw.
  - **reclamation_rate** — wskaźnik reklamacyjności (reklamacje / zakończone naprawy standardowe).
  - **over_sla_count**, **without_update_count** — zaległe i bez aktualizacji.
- Widok „wymaga reakcji”: `GET /api/v1/accounts/notifications/requires-action/` (naprawy z requires_attention).

---

## 5. Rozbudowany dashboard admina (N5) ✅

### Zaimplementowane
- **GET /api/v1/analytics/admin-dashboard/?days=30&assigned_to=&lt;uuid&gt;** (tylko admin):
  - **kpi:** new_count, in_progress_count, ready_for_pickup_count, overdue_count, unclaimed_count (gotowe do odbioru &gt; 7 dni), revenue_total, quote_value_total, complaints_count, warranties_count.
  - **tables:** top_staff (ranking), most_overdue (do 20), no_quote_repairs (bez wyceny, do 20), unclaimed_repairs (nieodebrane, do 20), active_complaints, active_warranties (do 20).
  - **charts:** repairs_by_status, repairs_over_time (dzień, count, revenue).
  - Opcjonalny filtr **assigned_to** (uuid pracownika) dla wszystkich zestawów.
- Istniejące endpointy (kpi, staff-ranking, repairs-report, summary, health-overview) pozostają bez zmian.

---

## 6. Konta startowe (kuba, rafal, pawel, krystian, szef)

- Role admin/staff i profile (StaffProfile, specjalizacje) są w modelu.
- Konta tworzy się ręcznie w adminie lub przez fixture/komendę seed — poza scope niniejszej implementacji.

---

## Kolejność wdrożenia (rekomendacja)

1. ✅ Rozszerzenia RepairRequest i Device, StaffNotification + API + podstawowe triggery.
2. Uzupełnienie triggerów (część dotarła, SLA, reklamacja przypisana) i ustawianie `requires_attention` / `last_*_at`.
3. Endpointy reklamacje/gwarancje (lista, filtry) i ewentualnie ComplaintDecision.
4. Dashboard staff — blok jakościowy (nowy endpoint).
5. Rozbudowa analytics pod admin dashboard.

---

*Dokument można uzupełniać w miarę realizacji kolejnych punktów.*
