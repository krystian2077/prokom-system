# PRO-KOM Serwis — Etapy implementacji brakującego backendu

Data: 2025-03-07  
Źródła: **POROWNANIE_PROKOM_MD.md**, **POROWNANIE_ERD_Z_PROJEKTEM.md**

Cel: doprowadzić backend do pełnej zgodności z wymaganiami (prokom.md + ERD), bez frontendu.  
Kolejność etapów uwzględnia zależności (np. Celery przed reminderami i backupem).

---

## Przegląd etapów

| Etap | Nazwa | Priorytet | Zależności |
|------|--------|------------|------------|
| **1** | Fundament zadań w tle (Celery, Redis) + backup | Wysoki | — |
| **2** | Reklamacja, wysyłka/paczka, szybkie przyjęcie, rozszerzenie pracowników | Wysoki | — |
| **3** | SLA, health score, widoki specjalne | Wysoki | — |
| **4** | Wersjonowanie wyceny (QUOTE_VERSION, QUOTE_DECISION) | Średni | — |
| **5** | Komunikacja: reguły powiadomień, warianty szablonów, automatyka | Średni | Etap 1 |
| **6** | Remindery (smart reminders) | Średni | Etap 1, 3 |
| **7** | Pakiety akcesoriów + rekomendacje, stała paczkomatu | Średni | — |
| **8** | Snapshoty pracowników, widok menedżerski, wyszukiwanie globalne | Średni | — |
| **9** | Dopracowanie: dokument skrócony, RepairNote, formularz publiczny | Niski | — |

---

## Etap 1 — Fundament zadań w tle (Celery, Redis) + backup

**Cel:** Umożliwić zadania okresowe i w tle (remindery, backup, e-mail).

### 1.1 Celery + Redis

- [x] Dodać do `requirements.txt`: `celery`, `redis`, `django-celery-beat`.
- [x] Utworzyć `backend/config/celery.py` (app Celery, autodiscover tasks).
- [x] W `config/settings/base.py`: zmienne `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `CELERY_BEAT_SCHEDULER`, `CELERY_ACCEPT_CONTENT`, `CELERY_TASK_SERIALIZER`.
- [x] W `config/__init__.py`: importować celery app przy starcie Django.
- [x] Utworzyć katalog `backend/apps/*/tasks.py` (np. `compliance/tasks.py`, `repairs/tasks.py`) — na razie puste lub z jednym taskiem testowym.
- [x] Dokumentacja: `docs/CELERY_URUCHOMIENIE.md` — jak uruchomić worker i beat lokalnie.

### 1.2 Zadanie backupu

- [x] W `compliance/tasks.py`: task `run_backup(backup_type='database'|'media'|'full')`:
  - tworzy wpis `BackupLog` (status=started),
  - wykonuje backup (pg_dump dla PostgreSQL, kopia pliku dla SQLite; kopiowanie MEDIA_ROOT),
  - zapisuje ścieżkę / wynik, aktualizuje `BackupLog` (success / failed, error_message).
- [x] Harmonogram: django-celery-beat (DatabaseScheduler) — użytkownik dodaje Periodic Task w adminie (np. codziennie 2:00).
- [x] Komenda `manage.py run_backup [database|media|full]` oraz `--sync` do wykonania bez workera.

**Kryterium ukończenia:** Uruchomienie Celery worker + beat, wykonanie backupu z wpisem w `BackupLog`.

---

## Etap 2 — Reklamacja, wysyłka/paczka, szybkie przyjęcie, rozszerzenie pracowników

**Cel:** Typ „reklamacja”, śledzenie odbioru paczki, flow szybkiego przyjęcia, specjalizacje i auto-przypisanie.

### 2.1 Reklamacja

- [x] W `repairs.RepairRequest`: pole `parent_repair` (FK do self), `repair_type` (standard, warranty, complaint, scheduled).
- [x] Enum `RepairType` w common.enums; migracja `0006_reklamacja_i_odbior_paczki`.
- [x] Admin i serializery (create z parent_repair, repair_type; walidacja: reklamacja wymaga parent_repair).

### 2.2 Wysyłka / odbiór paczki (pola na RepairRequest)

- [x] **Wariant B:** Pola na `RepairRequest`: `package_received_at`, `package_received_by`, `package_ok`, `request_number_attached`, `package_notes`, `package_photo`.
- [x] API: `POST /repairs/<id>/mark-package-received/` (staff); opcjonalnie `change_status_to`.

### 2.3 Szybkie przyjęcie

- [x] Endpoint `POST /repairs/quick-accept/`, pole `is_incomplete` (już wcześniej zaimplementowane).
- [x] Filtry listy: `is_incomplete`, `repair_type`.

### 2.4 Rozszerzenie pracowników (StaffProfile)

- [x] Pola: `specialization` (StaffSpecialization: phone_tablet, laptop_printer, general), `calendar_color`, `display_name`, `login_alias`, `is_visible_in_rankings`.
- [x] Migracja `accounts.0003_staff_profile_extension`, admin.

### 2.5 Automatyczne przypisanie według kategorii urządzenia

- [x] Serwis `suggest_assignment(repair)` w `repairs/services/assignment_suggest.py`; mapowanie kategoria → specjalizacja.
- [x] W `create_repair_request`: po utworzeniu naprawy, jeśli brak assigned_to, ustawienie z suggest_assignment.
- [x] Endpoint `GET /repairs/<id>/suggest-assignment/`.

**Kryterium ukończenia:** Reklamacja (parent_repair + repair_type), odbiór paczki w API, szybkie przyjęcie (endpoint + is_incomplete), StaffProfile rozszerzony, auto-przypisanie przy tworzeniu naprawy.

---

## Etap 3 — SLA, health score, widoki specjalne

**Cel:** Reguły SLA w DB, wyliczanie health score per naprawa, endpointy widoków „co wymaga reakcji”, „nieodebrane”, „wymaga decyzji”.

### 3.1 Modele SLA

- [ ] Opcjonalnie: model `SlaRule` w DB. Obecnie: stałe w kodzie (`repairs/services/health_score.py`).

### 3.2 Health score naprawy

- [x] Funkcja `get_repair_health_score(repair)` w `repairs/services/health_score.py` (green/yellow/red + lista issues).
- [x] W API szczegółów naprawy: pola `health_score`, `health_issues` (SerializerMethodField).
- [x] Endpoint `GET /analytics/health-overview/` — lista napraw żółtych/czerwonych + count.

### 3.3 Widoki specjalne (endpointy)

- [x] `GET /repairs/special-views/requires-action/` — do wyceny, do kontaktu, do zamówienia, szybkie przyjęcia, gotowe do odbioru, zaległe. Query: assigned_to.
- [x] `GET /repairs/special-views/unclaimed-devices/?days_min=3` — nieodebrane od N dni.
- [x] `GET /repairs/special-views/requires-decision/` — quote_sent, quote_accepted, waiting_for_parts.

**Kryterium ukończenia:** Health score w API naprawy + overview; trzy endpointy widoków specjalnych działające.

---

## Etap 4 — Wersjonowanie wyceny (REPAIR_QUOTE_VERSION, QUOTE_DECISION)

**Cel:** Historia wersji wyceny, jawna decyzja klienta (akceptacja/odrzucenie) z zapisem.

### 4.1 Modele

- [x] `QuoteVersion` (quote FK, version_number, total_amount, items_snapshot JSON, created_at, created_by). Migracja `pricing.0002_quote_version_and_decision`.
- [x] `QuoteDecision` (quote OneToOne, decision, decided_at, decided_by, comment). Jedna decyzja na wycenę.
- [x] Admin: QuoteVersion, QuoteDecision.

### 4.2 Logika

- [x] Przy wysłaniu wyceny: `POST /pricing/quotes/<id>/send/` ustawia status=sent, sent_at i wywołuje `create_quote_version_snapshot(quote)`.
- [x] `POST /repairs/<id>/quote-respond/` zapisuje `QuoteDecision` (accepted/rejected, decided_by, comment) dla wyceny w statusie sent.
- [x] `GET /pricing/quotes/<id>/versions/` — lista snapshotów wersji. W QuoteSerializer pole `decision` (read-only).

**Kryterium ukończenia:** Historia wersji wyceny dostępna w API, decyzja klienta zapisana w QuoteDecision.

---

## Etap 5 — Komunikacja: reguły powiadomień, warianty szablonów, automatyka

**Cel:** Sterowanie tym, kiedy wysyłać e-mail/panel/SMS; opcjonalnie warianty szablonów per kanał; automatyczne wysyłanie przy zdarzeniach.

### 5.1 NOTIFICATION_RULE

- [x] Model `communications.NotificationRule`: event_name (np. `quote_sent`, `status_ready_for_pickup`, `reminder_unclaimed`), send_panel (bool), send_email (bool), send_sms (bool), is_active, template (FK do MessageTemplate, opcjonalnie).
- [x] Migracja, admin. Seed: domyślne reguły — opcjonalnie w adminie (ręcznie lub fixture).
- [x] Helper: `get_notification_rules(event_name)` → zwraca aktywne reguły; na tej podstawie task/sygnał decyduje, czy wysłać e-mail/SMS/panel.

### 5.2 MESSAGE_TEMPLATE_VARIANT (opcjonalnie)

- [ ] Model `MessageTemplateVariant`: template FK, channel (email/sms/panel), subject (dla email), body, is_default. Jeden szablon może mieć wiele wariantów (jeden per kanał).
- [ ] Przy wysyłce: wybór wariantu po channel; jeśli brak wariantu — fallback do głównego body szablonu.
- [ ] Migracja, admin, aktualizacja logiki wysyłki (gdy będzie zaimplementowana).

### 5.3 Automatyka wysyłki (po uruchomieniu Celery)

- [x] Sygnały Django lub wywołania w serwisach: po wysłaniu wyceny (`POST …/send/`) i przy zmianie statusu na `ready_for_pickup` wywołanie tasku `send_notification_for_repair_event(repair_id, event_name)`.
- [x] Task: pobiera reguły dla `event_name`, dla każdej (send_email/send_panel/send_sms) wywołuje `send_template_to_repair` (e-mail/SMS/panel). Zapis w CommunicationLog.
- [x] Konfiguracja: ustawienia e-mail (EMAIL_BACKEND, host, port) w settings; SMS — placeholder (stub w `send_sms`).

**Kryterium ukończenia:** NotificationRule w DB i używane w tasku; po zdarzeniu (np. quote_sent) wpis w CommunicationLog i e-mail (jeśli skonfigurowany).

---

## Etap 6 — Remindery (smart reminders)

**Cel:** Zadania okresowe przypominające o: braku wyceny, nieodebranych urządzeniach, umówionych naprawach, szybkim przyjęciu do uzupełnienia itd.

### 6.1 Taski Celery

- [x] `repairs/tasks.py`: task `send_smart_reminders()` (wywoływany przez beat — dodać Periodic Task w adminie django-celery-beat, np. codziennie 8:00):
  - naprawy „do wyceny” (QUOTE_PENDING) starsze niż 24h → `reminder_no_quote`;
  - naprawy „gotowe do odbioru” 3+ dni → `reminder_unclaimed`;
  - naprawy z RepairVisitSchedule.visit_date na dziś → `reminder_scheduled_visit`;
  - szybkie przyjęcia (is_incomplete) nieuzupełnione 2h → `reminder_quick_accept_incomplete`.
- [x] Model `ReminderLog` (repair FK, event_name, sent_at) — ogranicza spam (raz na 24h / 2h w zależności od typu). Admin: ReminderLog.
- [x] Integracja z NotificationRule: eventy `reminder_no_quote`, `reminder_unclaimed`, `reminder_scheduled_visit`, `reminder_quick_accept_incomplete`. Task wywołuje `send_notification_for_repair_event.delay()` i zapisuje ReminderLog.

**Kryterium ukończenia:** Zadanie beat uruchamia remindery; wybrane typy generują wpis ReminderLog i powiadomienie (jeśli skonfigurowane reguły w NotificationRule). W adminie Celery Beat dodać Periodic Task: task `repairs.send_smart_reminders`, np. crontab 0 8 * * * (codziennie 8:00).

---

## Etap 7 — Pakiety akcesoriów + rekomendacje, stała paczkomatu

**Cel:** Pakiety (bundle) w akcesoriach; endpoint rekomendacji dla urządzenia; stały adres paczkomatu w konfiguracji.

### 7.1 ACCESSORY_BUNDLE

- [x] Model `accessories.AccessoryBundle`: name, slug, description, total_price (wyliczane z pozycji), is_active, sort_order.
- [x] Model `accessories.AccessoryBundleItem`: bundle FK, product FK (AccessoryProduct), quantity, optional fixed_price (override).
- [x] Migracja `accessories.0003_accessory_bundle`, admin. API: `GET /api/v1/accessories/bundles/`, `GET /api/v1/accessories/bundles/<id>/`.

### 7.2 Rekomendacje akcesoriów

- [x] Endpoint `GET /api/v1/repairs/<id>/recommended-products/` zwraca już: accessories, hammer_glass; rozszerzony o **bundles** (pakiety z co najmniej jednym produktem dopasowanym do kategorii urządzenia).
- [ ] Opcjonalnie: cache (Redis) na krótki czas.

### 7.3 Adres paczkomatu PRO-KOM

- [x] W `config/settings/base.py`: `PARCEL_LOCKER_ADDRESS` z env (default: "Zakopiańska 10f, Rabka-Zdrój 34-700, przy stacji benzynowej Moya").
- [x] Endpoint `GET /api/v1/config/parcel-locker-address/` (AllowAny) — zwraca `{"parcel_locker_address": "..."}`.

**Kryterium ukończenia:** Bundle w API, endpoint rekomendacji zwraca listę, adres paczkomatu dostępny przez API/konfigurację.

---

## Etap 8 — Snapshoty pracowników, widok menedżerski, wyszukiwanie globalne

**Cel:** Dzienny snapshot statystyk pracownika; API widoku menedżerskiego; rozszerzenie wyszukiwania.

### 8.1 EMPLOYEE_STATS_SNAPSHOT

- [x] Model `analytics.EmployeeStatsSnapshot`: employee FK (User), date, repairs_count, delayed_repairs_count, quotes_sent_count, ready_for_pickup_count, upsell_total, profit_total.
- [x] Task Celery `analytics.build_employee_stats_snapshots`: dla każdego staff wypełnia snapshot za poprzedni dzień (agregacja z RepairRequest). Harmonogram: beat np. 0 1 * * *.
- [x] Migracja `analytics.0001_employee_stats_snapshot`, admin. API: `GET /api/v1/analytics/staff/<user_id>/snapshots/?from=&to=` (tylko admin).

### 8.2 Widok menedżerski pracownika

- [x] Endpoint `GET /api/v1/analytics/staff/<user_id>/manager-view/` (tylko admin):
  - dane pracownika (User + StaffProfile), last_login,
  - statystyki: in_progress_count, overdue_count, ready_for_pickup_count, revenue_total,
  - health (yellow_count, red_count dla przypisanych napraw),
  - lista napraw (assigned_to), ostatnie działania (AuditLogEntry).
- [x] Sprawdzenie roli admin w widoku.

### 8.3 Globalne wyszukiwanie

- [x] Endpoint `GET /api/v1/search/?q=<query>` (staff/admin) — już zaimplementowany w `common.views.GlobalSearchView`: repairs, clients, devices.

**Kryterium ukończenia:** Snapshoty zapisują się codziennie; manager-view zwraca pełny zestaw; /search/?q= zwraca repairs, clients, devices.

---

## Etap 9 — Dopracowanie

**Cel:** Dokument skrócony A4, RepairNote (pinned, note_type), formularz publiczny (walidacja, HG w payloadzie).

### 9.1 Skrócony dokument A4 (naprawa z umówionym terminem)

- [x] W `documents/services/pdf.py`: `build_acceptance_protocol_short_pdf(repair)` — numer naprawy, klient, urządzenie, zakres, godzina przyjęcia, przewidywany odbiór (z RepairVisitSchedule).
- [x] Endpoint `GET /api/v1/documents/repair/<id>/acceptance-protocol-short/` — tylko dla napraw z RepairVisitSchedule (404 w przeciwnym razie).

### 9.2 RepairNote rozszerzenie

- [x] W `repairs.RepairNote`: `note_type` (internal, system, client_contact), `pinned` (Boolean). Migracja `0008_repair_note_note_type_pinned`, API (POST notes z note_type, pinned; GET zwraca pola).

### 9.3 Formularz publiczny (submit)

- [x] Walidacja wg kategorii: w `PublicSubmitDeviceSerializer.validate()` dla phone/tablet/smartwatch wymagane model_name lub device_model_id.
- [x] Payload: `hammer_glass_interest` (yes/no/ask_later/free_with_quote) — zapis w `RepairRequest.hammer_glass_interest` (migracja `0009_hammer_glass_interest`).
- [x] Payload: `accessory_interest` (lista product_id) i `accessory_choose_for_me` — zapis w RepairAccessoryInterest (source=client). Product nullable (migracja accessories `0004_repair_accessory_interest_product_nullable`).

**Kryterium ukończenia:** Skrócony PDF dostępny; notatki z pinned/note_type; submit waliduje wg kategorii i zapisuje HG + akcesoria.

---

## Podsumowanie zależności

```
Etap 1 (Celery + backup) ─────────────────────────────────────────┐
                                                                   │
Etap 2 (reklamacja, paczka, szybkie przyjęcie, staff)               │
Etap 3 (SLA, health, widoki specjalne)                             │
Etap 4 (wersje wyceny)                                              │
Etap 7 (bundle, rekomendacje, paczkomat)                            │
Etap 8 (snapshoty, manager-view, search)                           │
Etap 9 (dokument, notatki, formularz)                              │
                                                                   │
Etap 5 (NotificationRule, automatyka) ─────────────────────────────┤
Etap 6 (remindery) ────────────────────────────────────────────────┘
```

Etapy 2, 3, 4, 7, 8, 9 można realizować równolegle (poza drobnymi zależnościami). Etap 5 i 6 wymagają działającego Etapu 1.

---

## Szacowany nakład (orientacyjnie)

| Etap | Złożoność | Szacunek |
|------|-----------|----------|
| 1 | Średnia | 1–2 dni |
| 2 | Średnia | 1–2 dni |
| 3 | Średnia | 1 dzień |
| 4 | Średnia | 1 dzień |
| 5 | Średnia | 1–2 dni |
| 6 | Niska | 0.5–1 dzień |
| 7 | Średnia | 1 dzień |
| 8 | Średnia | 1–2 dni |
| 9 | Niska | 0.5–1 dzień |

Razem: ok. 8–12 dni roboczych (w zależności od szczegółów i testów).

---

*Dokument można aktualizować po ukończeniu kolejnych etapów (oznaczenie [x] w checklistach).*
