# Moduł katalogu części i hurtowni (Inventory)

Krótki opis API: katalog części, hurtownie, statusy użycia w naprawie, karta części, autocomplete, kolejka części.

## Baza hurtowni (Suppliers)

- **GET/POST** `/api/v1/inventory/suppliers/` — lista, tworzenie
- **GET/PUT/PATCH/DELETE** `/api/v1/inventory/suppliers/<id>/` — szczegóły, edycja

Pola hurtowni: `name`, `tax_id` (NIP), `email`, `phone`, `address`, `website_url`, `notes` (notatka wewnętrzna), `is_active`.

Uprawnienia: staff — dodawanie/edycja; admin — pełne zarządzanie, archiwizacja.

---

## Katalog części (Parts)

- **GET/POST** `/api/v1/inventory/parts/` — lista, tworzenie
- **GET/PUT/PATCH/DELETE** `/api/v1/inventory/parts/<id>/` — szczegóły, edycja

Pola części (katalog): `name`, `code`, `device_category`, `brand`, `device_model_name`, `part_type`, `quality_variant`, `notes`, `is_active` oraz ceny/magazyn: `purchase_price`, `sell_price`, `quantity_in_stock`, `min_quantity`, `unit`, `category`, `supplier`.

Filtry listy: `is_active`, `supplier`, `category`, `device_category`, `brand`, `part_type`, `quality_variant`.  
Wyszukiwanie: po nazwie, kodzie, modelu, marce, typie części, wariancie.

### Autocomplete części

- **GET** `/api/v1/inventory/parts/autocomplete/?q=<fraza>&repair_id=<id>&limit=20`

Podpowiedzi części do dodania do naprawy. Opcjonalnie `repair_id` — wtedy system może zawęzić wyniki do kategorii/marki urządzenia z naprawy. Parametry: `device_category`, `brand` — bezpośrednie zawężenie.

### Karta szczegółów części

- **GET** `/api/v1/inventory/parts/<id>/card/`

Zwraca:
- `part` — dane części (pełny serializer)
- `usage_count` — ile razy część była użyta
- `last_used_at`, `last_supplier`, `last_purchase_cost`
- `most_used_supplier` — najczęściej wybierana hurtownia
- `avg_purchase_cost`, `min_purchase_cost`, `max_purchase_cost`
- `recent_repairs` — ostatnie użycia z `repair_number`, `usage_status`, `purchase_cost`, `created_at`

---

## Statusy części w naprawie (PartUsage)

Enum `PartUsageStatus`: **ordered** (zamówiona), **arrived** (dotarła), **used** (użyta w naprawie), **unused** (niewykorzystana).

Części do naprawy dodaje się w kontekście naprawy: **POST** `/api/v1/repairs/<id>/parts/` z polami: `part`, `supplier` (opcjonalnie), `quantity`, `purchase_cost`, `usage_status` (domyślnie `ordered`), `notes`. System ustawia `added_by=request.user`. Koszt naprawy jest liczony z `purchase_cost` z PartUsage (jeśli podane), w przeciwnym razie z `part.purchase_price`.

---

## Kolejka części (Parts queue)

- **GET** `/api/v1/inventory/parts-queue/?status=ordered|arrived|used|unused&assigned_to=<user_id>`

Lista użyć części (PartUsage) z wybranym statusem. `assigned_to` — filtrowanie po przypisaniu naprawy do użytkownika. Zwraca listę z danymi części, naprawy, hurtowni (PartUsageSerializer).

---

## Czego nie robimy na tym etapie

- Pełne stany magazynowe, rezerwacje, przyjęcia, inwentaryzacja, pełny ERP.  
Na teraz: katalog + hurtownie + status części w naprawie + kolejka + karta części + autocomplete.

---

## Seed startowy (konta + dane słownikowe)

Komenda: **python manage.py seed_initial** tworzy konta startowe dla zespołu:

| Login (email)   | Rola  | Imię i nazwisko      | Specjalizacja / uwagi |
|-----------------|-------|----------------------|------------------------|
| krystian@…      | admin | Krystian Potaczek    | admin / zarządzanie    |
| szef@…          | admin | Szef PRO-KOM         | admin / właściciel     |
| kuba@…          | staff | Jakub Filas          | telefony, tablety, smartwatche, odzyskiwanie |
| rafal@…         | staff | Rafał Smółka         | laptopy, komputery, drukarki, konsole |
| pawel@…         | staff | Paweł Górka          | proste naprawy serwisowe |

- Domena e-mail domyślnie: **prokom.local** (zmienna **SEED_EMAIL_DOMAIN**).
- Tymczasowe hasło domyślnie: **ZmienHaslo1!** (zmienna **SEED_TEMP_PASSWORD**).
- Dla każdego konta ustawione: **wymuś zmianę hasła przy pierwszym logowaniu** (pole `User.must_change_password`).
- Dla staffu tworzone są profile (specjalizacja, kolor w kalendarzu).

Opcja **--with-dicts**: dodatkowo tworzy podstawowe marki (Apple, Samsung, Lenovo, …) oraz przykładowe hurtownie.

Uruchomienie bez pytania (np. w skrypcie): **python manage.py seed_initial --no-input**
