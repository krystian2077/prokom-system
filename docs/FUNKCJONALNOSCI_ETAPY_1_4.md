# Funkcjonalności z prokom.md — Etapy 1–4 (wdrożenie backendu)

Data: 2025-03-07  
Źródło: specyfikacja „Wdrażamy więc te rozszerzenia” (karta klienta, segmentacja, panel odbiorów, health score itd.).

---

## Etap 1: Karta klienta, klient wraca, typ/segment, firma

### Model Client (rozszerzenia)
- **client_type**: `individual` | `business` (osoba prywatna / firma).
- **client_segment**: `new` | `returning` | `regular` | `premium` | `business`.
- **visit_count**, **last_visit_at** — do badge „klient wraca”.
- **Dane firmy** (gdy client_type=business): company_name, nip, contact_person, company_email, company_phone.

### Enumy (common.enums)
- **ClientType**: individual, business.
- **ClientSegment**: new, returning, regular, premium, business.

### API
- **GET /api/v1/clients/<id>/premium-card/** — karta klienta premium (staff/admin): client, repairs, devices, complaints_warranties, notes, is_returning, visit_count, badge („klient wraca” / „stały klient” / „klient biznesowy”).
- **GET /api/v1/clients/search/?q=...** — wyszukiwanie po telefonie, nazwisku, e-mailu (limit 20). Dla flow „klient wraca”.
- Lista klientów: filtry **client_type**, **client_segment**; w odpowiedzi pola client_type, client_segment, visit_count.

### Logika
- **update_client_visit_and_segment(client_id)** wywoływane przy tworzeniu naprawy **standardowej** (create_repair_request): inkrementacja visit_count, last_visit_at, aktualizacja segmentu (returning przy 2 wizytach, regular przy 3+; business bez zmian).

### Migracja
- **clients.0003_client_type_segment_and_business**.

---

## Etap 2: Automatyczne tagi, „czeka na klienta od X dni”, panel odbiorów

### RepairRequest
- **quote_sent_at** — ustawiane przy zmianie statusu na QUOTE_SENT (change_repair_status).
- **waiting_for_client_days** (property) — liczba dni od quote_sent_at przy statusie QUOTE_SENT; w API w liście i szczegółach.
- **get_auto_tags()** — tagi systemowe: pilne, same_day, wysyłkowe, reklamacja, gwarancja, niekompletne, czeka_na_czesc, klient_wraca, firma, apple, samsung, odzyskiwanie_danych, hammer_glass, sprzedaz_dodatkowa. Zwracane w polu **auto_tags** w list/detail.
- **Filtrowanie listy**: **?tag=pilne** lub **?tags=reklamacja,gwarancja** (parametry tag/tags).

### Panel odbiorów
- **GET /api/v1/repairs/pickup-panel/?assigned_to=<uuid>** (staff/admin):  
  ready_for_pickup, unclaimed_3_days, unclaimed_7_days, to_prepare_shipment (return_method != in_person), issued_today.

### Migracje
- **repairs.0011_repair_quote_sent_at_and_auto_tags**
- **repairs.0012_repair_image_type_choices** (nowe typy zdjęć: package, damage_detail).

---

## Etap 3: Kolejka części, zdjęcia przed/po

### Kolejka części (PartUsage)
- **PartOrderStatus**: to_order, ordered, arrived, delayed.
- Pola na **PartUsage**: order_status, ordered_at, ordered_by, purchase_order (FK), blocks_repair.
- Lista/filtry po statusie zamówienia — do rozbudowy w API inventory (np. GET /api/v1/inventory/parts-queue/?status=to_order).

### Zdjęcia przed/po
- **RepairImage** już ma: image_type (before, during, after, **package**, **damage_detail**, issue, other), **is_visible_to_client**. Staff widzi wszystko; klient tylko przy is_visible_to_client=True. Nowe wartości: package (paczka po odbiorze), damage_detail (uszkodzenie szczegółowe).

### Migracje
- **inventory.0002_part_usage_order_queue**
- **repairs.0012** (AlterField image_type).

---

## Etap 4: Health score pracownika

### Logika
- **staff_health_score(user_id)** (repairs.selectors): zwraca **level** (green | yellow | red), **factors** (lista przyczyn), **metrics** (słownik z staff_dashboard_quality_metrics).
- Kryteria: czerwony przy zaległych 3+, brak aktualizacji 5+, reklamacyjność ≥ 15%; żółty przy zaległych 1+, brak aktualizacji 2+, czas odpowiedzi > 24 h, reklamacje.

### Gdzie pokazujemy
- **Dashboard staff**: GET /api/v1/repairs/dashboard/ — w obiekcie **quality** dodane **health_score**: { level, factors }.
- **Widok pracownika (admin)**: GET /api/v1/analytics/staff/<user_id>/manager-view/ — w odpowiedzi **health_score**.
- **GET /api/v1/analytics/staff/<user_id>/health-score/** — tylko health score (level, factors, metrics, employee_id, employee_name). Tylko admin.

---

## Kolejność wdrożenia (zgodna z rekomendacją)

1. Etap 1 — karta klienta, klient wraca, typ/segment, firma.  
2. Etap 2 — tagi, czeka na klienta, panel odbiorów.  
3. Etap 3 — kolejka części (PartUsage), zdjęcia (rozszerzenie RepairImage).  
4. Etap 4 — health score pracownika.

---

*Dokument można uzupełniać o kolejne endpointy (np. lista kolejki części w inventory) i ewentualne poprawki.*
