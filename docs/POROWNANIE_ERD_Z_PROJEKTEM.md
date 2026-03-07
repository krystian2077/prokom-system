# PRO-KOM — Porównanie diagramu ERD z aktualnym projektem

Data: 2025-03-07  
Odniesienie: `PROKOM_PELNY_DIAGRAM_BAZY_DANYCH_ERD.md`

**Porównanie z wymaganiami biznesowymi (prokom.md):** patrz **[POROWNANIE_PROKOM_MD.md](POROWNANIE_PROKOM_MD.md)** — tam zestawienie projektu z opisem systemu z pliku `prokom.md`.

## 1. Cel dokumentu

Weryfikacja, które encje i pola z pełnego diagramu ERD są zaimplementowane w projekcie Django, a czego brakuje lub jest uproszczone.

---

## 2. Legenda

| Symbol | Znaczenie |
|--------|-----------|
| ✅ | Zaimplementowane (model / odpowiednik) |
| ⚠️ | Częściowo (uproszczenie, inne nazwy, brak pól) |
| ❌ | Brak w projekcie |

---

## 3. Accounts / użytkownicy

| Encja ERD | Stan | Uwagi |
|-----------|------|--------|
| **USER** | ✅ | `accounts.User`: email (bez username), first_name, last_name, phone, role, is_active, is_staff, date_joined. Id: UUID (w projekcie), w ERD bigint. |
| **EMPLOYEE_PROFILE** | ⚠️ | `accounts.StaffProfile`: user, position, bio, avatar, is_available, total_repairs, active_repairs. Brak: display_name, login_alias, specialization, calendar_color, is_visible_in_rankings. |
| **LOGIN_ACTIVITY** | ✅ | `accounts.LoginActivity`: user, ip_address, user_agent, login_status, logged_in_at. Logowanie przy POST /accounts/login/. |

---

## 4. Clients

| Encja ERD | Stan | Uwagi |
|-----------|------|--------|
| **CLIENT** | ✅ | `clients.Client`: first_name, last_name, email, phone, adres, preferred_contact, internal_notes, total_repairs, total_spent, is_vip, is_blacklisted, client_number, user (FK). Brak: sms_opt_in, email_opt_in jako osobne (mamy accepts_marketing). |
| **CLIENT_ADDRESS** | ✅ | `clients.ClientAddress`: label, street, city, postal_code, country, phone, additional_info, is_default. ERD: line1/line2 — u nas street. |
| **CLIENT_CONSENT** | ✅ | `clients.ClientConsent`: consent_type, is_granted, consent_text, granted_at, withdrawn_at, ip_address, user_agent. Brak FK do TERMS_VERSION. |
| **GDPR_REQUEST** | ✅ | `compliance.GdprRequest`: client, request_type (export/deletion), status, reason, resolution_note, requested_at, resolved_at, handled_by. Przy usunięciu konta tworzony jest wpis. |
| **TERMS_VERSION** | ✅ | `compliance.TermsVersion`: code, version, document_type, published_at, is_active. W `ClientConsent` dodane FK terms_version (opcjonalne). |

---

## 5. Devices

| Encja ERD | Stan | Uwagi |
|-----------|------|--------|
| **DEVICE_CATEGORY** | ⚠️ | W projekcie enum `DeviceCategory` (common.enums), nie tabela. Wystarczy na start. |
| **BRAND** | ✅ | `devices.Brand`: name, slug, logo, is_active, description. |
| **DEVICE_MODEL** | ✅ | `devices.DeviceModel`: brand, category (enum), name, slug, full_name, release_year, processor, ram, storage_options, image, is_active, popularity_score. Brak: os_family, connector_type, recommended_watts, supports_hammer_glass, supports_tempered_glass. |
| **CLIENT_DEVICE** | ✅ | `devices.Device`: client, category, brand, device_model, model_name, serial_number, imei, condition_on_arrival, has_screen_protector, has_case, accessories_included, password, notes. Brak: color (ERD). |
| **DEVICE_PROTECTION_COMPATIBILITY** | ⚠️ | Brak tabeli. W projekcie: `HammerGlassProduct.compatible_device_categories` (JSON). |
| **ACCESSORY_COMPATIBILITY_RULE** | ⚠️ | Brak tabeli. W projekcie: `AccessoryProduct.compatible_device_categories` (JSON). |

---

## 6. Repairs

| Encja ERD | Stan | Uwagi |
|-----------|------|--------|
| **REPAIR_REQUEST** | ✅ | `repairs.RepairRequest`: repair_number, client, device, assigned_to, status, priority, problem_description, delivery_method, return_method, adresy, accepted_at, estimated_completion_date, completed_at, ready_for_pickup_at, picked_up_at, is_urgent, is_same_day, is_warranty, estimated_cost, final_cost, internal_notes, created_by, source, payment_status, internal_status, estimated_duration_days_min/max. Brak w modelu: repair_type, public_status/contact_status (mamy status + get_public_repair_status), title, quoted_total, parts_cost_total, labor_cost_total, upsell_total, profit_total, is_incomplete, is_shipping (mamy delivery_method). |
| **REPAIR_STATUS_HISTORY** | ✅ | `repairs.RepairStatusHistory`: repair, old_status, new_status, changed_by, notes, created_at. ERD: status_type, changed_at. |
| **REPAIR_ASSIGNMENT_HISTORY** | ✅ | `repairs.RepairAssignment`: repair, assigned_to, assigned_by, assigned_at, unassigned_at, is_current, notes. Odpowiednik REPAIR_ASSIGNMENT_HISTORY. |
| **REPAIR_SHIPPING** | ⚠️ | Brak osobnej tabeli. W RepairRequest: delivery_method, return_method, delivery_address, return_address. Brak: inbound/outbound_method, customer_pays_inbound, prokom_pays_return, locker_code, package_received_at, package_ok, request_number_attached. |
| **REPAIR_VISIT_SCHEDULE** | ✅ | `repairs.RepairVisitSchedule`: repair (OneToOne), visit_date, visit_time, estimated_duration_minutes, estimated_pickup_time, no_show, confirmed_at. |
| **DIAGNOSTIC_REPORT** | ✅ | `diagnostics.DiagnosticReport`: repair (OneToOne), created_by, findings, recommendation, risk_note, completed_at. |
| **REPAIR_QUOTE** | ✅ | `pricing.Quote`: repair, status, total (current_total), created_by. Brak w Quote: eta_label, estimated_pickup_date, sent_at, decided_at (można dodać). |
| **REPAIR_QUOTE_VERSION** | ❌ | Brak wersji wyceny (REPAIR_QUOTE_VERSION, QUOTE_DECISION). Jedna wycena, pozycje w QuoteItem. |
| **QUOTE_DECISION** | ❌ | Brak. Jest endpoint quote-respond (akceptacja/odrzucenie), bez osobnej tabeli decyzji. |
| **LABOR_ENTRY** | ⚠️ | Odpowiednik: `pricing.QuoteItem` z item_type=labour + `LabourType`. Nie osobna tabela „labor entry” per naprawa. |
| **REPAIR_PART_USAGE** | ✅ | `inventory.PartUsage`: repair, part, quantity, unit_cost (u nas w PartUsage). ERD: part_name_snapshot, purchase_cost, is_original, usage_status. |
| **CHECKLIST_TEMPLATE** | ✅ | `repairs.ChecklistTemplate`: name, device_category_code, is_active. |
| **CHECKLIST_TEMPLATE_ITEM** | ✅ | `repairs.ChecklistTemplateItem`: template, label, item_type (checkbox/text/select), sort_order. |
| **CHECKLIST_RUN** | ✅ | `repairs.ChecklistRun`: repair, template, started_by, status, started_at, completed_at. |
| **CHECKLIST_RUN_ITEM** | ✅ | `repairs.ChecklistRunItem`: run, template_item, result, note, checked_by, checked_at. |
| **REPAIR_PHOTO** | ✅ | `repairs.RepairImage`: repair, image, caption, image_type, uploaded_by, is_visible_to_client. |
| **TIMELINE_EVENT** | ⚠️ | Brak tabeli. Timeline budowany z: RepairStatusHistory, RepairNote, CommunicationLog (API zwraca złożoną listę). |
| **AUDIT_LOG_ENTRY** | ✅ | `common.AuditLogEntry`: repair (nullable), actor, action, target_type, target_id, change_payload (JSON), created_at. |

---

## 7. Communications

| Encja ERD | Stan | Uwagi |
|-----------|------|--------|
| **MESSAGE_TEMPLATE** | ✅ | `communications.MessageTemplate`: name, channel, message_type, subject, body, is_active, sort_order, suggested_for_status. ERD: code UK, category. U nas bez code/category. |
| **MESSAGE_TEMPLATE_VARIANT** | ❌ | ERD: warianty per kanał (channel, subject, body, is_default). U nas jeden szablon = jeden kanał (pole channel). |
| **NOTIFICATION_RULE** | ❌ | Brak reguł (event_name, send_panel, send_email, send_sms). Automatyka wysyłki nie jest sterowana tabelą. |
| **REPAIR_MESSAGE** | ⚠️ | Odpowiednik: `communications.CommunicationLog`: repair, template, channel, recipient, subject, body_snapshot, sent_at, sent_by, status. Brak: client_id FK, direction, visible_to_client. |
| **INTERNAL_NOTE** | ✅ | `repairs.RepairNote` z is_internal=True. Brak: note_type, pinned. |
| **TEAM_THREAD_MESSAGE** | ✅ | `repairs.TeamThreadMessage`: repair, author, mentioned_user, body, created_at. |
| **SMS_MESSAGE** | ⚠️ | SMS wpisywane w CommunicationLog (channel=sms). Brak osobnej tabeli z provider, provider_message_id, delivery_status. |

---

## 8. Hammer Glass / Akcesoria

| Encja ERD | Stan | Uwagi |
|-----------|------|--------|
| **HAMMER_GLASS_CATEGORY** | ⚠️ | W projekcie: `HammerGlassFilmType` (Clear, Matt, Privacy, Smartwatch, Tablet). Nazwa inna, sens ten sam. |
| **HAMMER_GLASS_PRODUCT** | ✅ | `hammer_glass.HammerGlassProduct`: film_type, name, sku, price, protection_level, features, compatible_device_categories. Brak: price_from, device_scope, is_featured (mamy sort_order, is_active). |
| **HAMMER_GLASS_FEATURE** | ❌ | Brak tabeli cech (name, slug). U nas pole tekstowe `features`. |
| **HAMMER_GLASS_PRODUCT_FEATURE** | ❌ | Brak. |
| **REPAIR_HAMMER_GLASS_SELECTION** | ✅ | `hammer_glass.RepairHammerGlassOffer`: repair, product, quantity, unit_price_snapshot, offered_by, accepted, accepted_at. ERD: decision, offer_status, installation_required. |
| **ACCESSORY_CATEGORY** | ✅ | `accessories.AccessoryCategory`: name, slug, description, sort_order, is_active. |
| **ACCESSORY_PRODUCT** | ✅ | `accessories.AccessoryProduct`: category, name, sku, price, compatible_device_categories. Brak: connector_type, wattage, capacity_mah, brand (ERD). |
| **ACCESSORY_BUNDLE** | ❌ | Brak pakietów (bundle + bundle_items). |
| **ACCESSORY_BUNDLE_ITEM** | ❌ | Brak. |
| **REPAIR_ACCESSORY_INTEREST** | ✅ | `accessories.RepairAccessoryInterest`: repair, product, source (staff/client/suggestion), choose_for_me, note. |
| **REPAIR_UPSELL_SALE** | ✅ | Odpowiednik: `RepairAccessoryOffer` i `RepairHammerGlassOffer` z accepted=True. ERD: sale_type, sale_source, custom_name, sold_by. |

---

## 9. Documents / Calendar / Compliance / Analytics

| Encja ERD | Stan | Uwagi |
|-----------|------|--------|
| **GENERATED_DOCUMENT** | ⚠️ | Brak tabeli. PDF/QR generowane on-the-fly (endpointy `/documents/repair/<id>/acceptance-protocol/`, `/documents/repair/<id>/qr/`). Nie zapisujemy ścieżek plików. |
| **CALENDAR_EVENT** | ✅ | `calendar_app.CalendarEvent`: repair (nullable), employee, event_type (visit/pickup/other), event_date, start_time, end_time, title, is_locked. |
| **TIMESLOT_BLOCK** | ✅ | `calendar_app.TimeslotBlock`: employee, block_date, start_time, end_time, reason. |
| **EMPLOYEE_STATS_SNAPSHOT** | ❌ | Brak snapshotów dziennych (repairs_count, delayed_repairs_count, upsell_total, quote_total, profit_total). Statystyki liczone on-the-fly w `/analytics/kpi/`, `/analytics/staff-ranking/`. |
| **SATISFACTION_SURVEY** | ✅ | `repairs.SatisfactionSurvey`: repair (OneToOne), client, rating (1–5), would_recommend, comment, submitted_at. API: POST /repairs/<id>/submit-satisfaction-survey/. |
| **BACKUP_LOG** | ✅ | `compliance.BackupLog`: triggered_by, backup_type (database/media/full), status, storage_path, started_at, finished_at, error_message. |

---

## 4. Podsumowanie

### Zaimplementowane w całości lub niemal w całości
- User, StaffProfile (uproszczony), Client, ClientAddress, ClientConsent, Brand, DeviceModel, Device, RepairRequest (bogaty), RepairStatusHistory, RepairAssignment, RepairImage, RepairNote, Quote, QuoteItem, Part, Supplier, PurchaseOrder, PartUsage, MessageTemplate, CommunicationLog, HammerGlassFilmType, HammerGlassProduct, RepairHammerGlassOffer, AccessoryCategory, AccessoryProduct, RepairAccessoryOffer, eksport/usunięcie RODO, KPI/rankingi/raporty.

### Częściowo lub uproszczone
- EMPLOYEE_PROFILE (brak pól kalendarz/alias), GDPR (endpointy bez modelu wniosków), TERMS_VERSION (brak), DEVICE_CATEGORY (enum zamiast tabeli), REPAIR_SHIPPING (pola na RepairRequest), DIAGNOSTIC_REPORT (app jest), REPAIR_MESSAGE vs CommunicationLog, INTERNAL_NOTE (RepairNote bez pinned/note_type), SMS (jeden log), GENERATED_DOCUMENT (bez zapisu), EMPLOYEE_STATS_SNAPSHOT (liczone na żywo).

### Brak w projekcie (do rozważenia w kolejnych iteracjach)
- REPAIR_QUOTE_VERSION, QUOTE_DECISION  
- MESSAGE_TEMPLATE_VARIANT, NOTIFICATION_RULE  
- Osobna tabela SMS_MESSAGE (provider, delivery_status)  
- HAMMER_GLASS_FEATURE, HAMMER_GLASS_PRODUCT_FEATURE  
- ACCESSORY_BUNDLE, ACCESSORY_BUNDLE_ITEM  
- ACCESSORY_COMPATIBILITY_RULE, DEVICE_PROTECTION_COMPATIBILITY (tabele zamiast JSON)  
- EMPLOYEE_STATS_SNAPSHOT (tabela snapshotów)  

---

## 5. Rekomendacje na najbliższe kroki

1. **Szablony wiadomości** — dodane seedem (`python manage.py seed_message_templates`); w adminie można edytować i dodawać nowe.
2. **KPI/raporty** — rozbudowane: KPI (wg statusu, źródła, priorytetu, średni czas), staff-ranking, repairs-report (group_by day/week/month), summary (widgety: in_progress, overdue, ready_for_pickup, waiting_for_decision).
3. **Zaimplementowane w tej iteracji:**  
   LOGIN_ACTIVITY, GDPR_REQUEST, TERMS_VERSION (+ FK w ClientConsent), SATISFACTION_SURVEY (z API submit), DIAGNOSTIC_REPORT, REPAIR_VISIT_SCHEDULE, CHECKLIST_TEMPLATE/ITEM/RUN/RUN_ITEM, AUDIT_LOG_ENTRY, CALENDAR_EVENT, TIMESLOT_BLOCK, BACKUP_LOG, REPAIR_ACCESSORY_INTEREST, TEAM_THREAD_MESSAGE.  
   **Opcjonalnie dalej:** REPAIR_QUOTE_VERSION/QUOTE_DECISION, MESSAGE_TEMPLATE_VARIANT, NOTIFICATION_RULE, ACCESSORY_BUNDLE, EMPLOYEE_STATS_SNAPSHOT.

**Plan implementacji brakujących elementów (backend):** patrz **[ETAPY_IMPLEMENTACJI_BACKEND.md](ETAPY_IMPLEMENTACJI_BACKEND.md)**.
