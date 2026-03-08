# Moduł wyszukiwania premium (Search)

Centralny element systemu: **Global Search**, **Intake Search**, **Advanced Search**.  
Dostęp: **staff** i **admin**.

---

## 1. Global Search

**GET /api/v1/search/**  
**GET /api/v1/search/global/?q=...&limit=15**

- **q** (min. 2 znaki): fraza po której szukamy.
- **limit** (opcjonalnie, max 30): liczba wyników w każdej grupie (domyślnie 15).

**Szukane pola:**
- Klienci: imię, nazwisko, e-mail, telefon, numer klienta, nazwa firmy, NIP.
- Naprawy: numer naprawy, klient (imię, nazwisko, e-mail, telefon, firma, NIP), urządzenie (model, serial, IMEI, ręczna nazwa/marka/model), opis usterki.
- Urządzenia: model, serial, IMEI, ręczna nazwa/marka/model, dane klienta.

**Odpowiedź:**
- **clients** — lista klientów (indywidualni i firmy; frontend może grupować po `client_type`: individual / business). Każdy: id, client_number, full_name, email, phone, client_type, company_name, nip, visit_count, last_visit_at, **repair_count**, **device_count**, **last_repair_summary**, **badges** (np. klient_wraca, firma).
- **repairs** — lista napraw (id, repair_number, status, repair_type, client_name, device_name, problem_description, assigned_to, created_at).
- **devices** — lista urządzeń (id, device_name, category, serial_number, imei, client_name, repair_count, created_at).

---

## 2. Intake Search (przyjęcie naprawy)

**GET /api/v1/search/intake/?q=...**  
Wyszukiwanie **klienta / firmy** do flow „najpierw klient, potem urządzenie, potem formularz naprawy”.

- **q** (min. 2 znaki): telefon, e-mail, imię, nazwisko, firma, NIP.
- **limit** (opcjonalnie): jak wyżej.

**Odpowiedź:**
- **clients** — jak w Global, z **repair_count**, **device_count**, **last_repair_summary**, **badges** (klient_wraca, firma).
- **devices** — pusta (urządzenia pobieramy osobnym wywołaniem po wyborze klienta).

**GET /api/v1/search/intake/?client_id=&lt;uuid&gt;**  
Urządzenia wybranego klienta (do wyboru „istniejące urządzenie” przy przyjęciu).

- **Odpowiedź:** **devices** — lista urządzeń klienta (id, device_name, category, serial_number, imei, client). **clients** — pusta.

**Flow antyduplikaty:**  
Frontend przy nowej naprawie najpierw wywołuje Intake Search. Jeśli są dopasowania — pokazuje je i wymaga wyboru „istniejący klient” lub świadomego „Dodaj nowego klienta”. Po wyborze klienta wywołuje `?client_id=` i pokazuje urządzenia; użytkownik wybiera urządzenie lub „Dodaj nowe”.

---

## 3. Advanced Search

**GET /api/v1/search/advanced/?q=...&type=...&status=...&repair_type=...&assigned_to=...&source=...&client_type=...&date_from=...&date_to=...&limit=20**

- **q** — fraza (opcjonalna).
- **type** — `clients` | `repairs` | `devices` | `complaints` | `warranties`. Bez type = wyszukiwanie we wszystkich typach.
- **status** — status naprawy (np. quote_sent, in_repair).
- **repair_type** — standard | complaint | warranty.
- **assigned_to** — uuid pracownika.
- **source** — źródło zgłoszenia (online, in_person, …).
- **client_type** — individual | business.
- **date_from**, **date_to** — zakres dat (created_at), format YYYY-MM-DD.
- **limit** (max 30).

**Odpowiedź:** jak w Global Search (clients, repairs, devices), z uwzględnieniem filtrów.

---

## 4. Wydajność

- Limity wyników (domyślnie 15/20, max 30).
- Lekkie serializery (tylko pola potrzebne w wynikach).
- Indeksy w modelach: repair_number, phone, email, last_name, company_name, nip, imei, serial_number (istniejące w Client, Device, RepairRequest).
- Po stronie frontu: **debounce** (np. 300 ms), opcjonalnie „ostatnio wyszukiwane” i nawigacja klawiaturową.

---

## 5. Struktura backendu

- **apps/search/**  
  - **selectors.py** — `global_search(q)`, `intake_search(q)`, `intake_search_devices_for_client(client_id)`, `advanced_search(...)`.
  - **serializers.py** — GlobalSearchClientSerializer, IntakeSearchClientSerializer, GlobalSearchRepairSerializer, GlobalSearchDeviceSerializer, IntakeSearchDeviceSerializer.
  - **views.py** — GlobalSearchAPIView, IntakeSearchAPIView, AdvancedSearchAPIView.
  - **urls.py** — `""`, `global/`, `intake/`, `advanced/`.

Stary endpoint **GET /api/v1/search/?q=** został zastąpiony przez ten sam moduł (path `""` = Global Search). Kształt odpowiedzi jest rozszerzony (np. clients z repair_count, badges); pola `repairs` i `devices` pozostają.
