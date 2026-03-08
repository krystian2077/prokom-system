# Moduł Dostępności pracowników (Availability)

Moduł **informacyjny**: kto jest dziś w firmie, na wyjeździe, nieobecny, wróci później, ma wolne.  
Ułatwia przypisywanie napraw i zadań oraz unikanie pomyłek organizacyjnych.

---

## Kto może korzystać

- **Ustawiać swoją dostępność**: każdy pracownik i admin.
- **Przeglądać dostępność zespołu**: wszyscy (staff i admin).

**Pracownik (staff):**
- Dodaje / edytuje / usuwa **tylko własne** wpisy.
- Widzi **cały zespół** (lista wpisów wszystkich).

**Admin:**
- Dodaje wpis dla **dowolnego** pracownika.
- Edytuje / usuwa **dowolny** wpis.
- Filtruje po pracowniku, typie, dacie.

---

## Typy dostępności

- **available** — Dostępny
- **service_trip** — Wyjazd serwisowy
- **installation** — Montaż
- **temporarily_unavailable** — Niedostępny czasowo
- **day_off** — Dzień wolny
- **vacation** — Urlop
- **sick_leave** — Chorobowe

---

## Tryby wpisu

- **Cały dzień** — `is_all_day=True` (start_time/end_time puste).
- **Przedział godzinowy** — `is_all_day=False`, `start_time`, `end_time` obowiązkowe.

---

## Model EmployeeAvailability

- **employee** (FK User), **availability_type**, **date**
- **is_all_day**, **start_time**, **end_time**
- **note**
- **created_by**, **updated_by**, **created_at**, **updated_at**, **is_active**

---

## API

Baza: **/api/v1/availability/**

| Endpoint | Opis |
|----------|------|
| GET/POST / | Lista wpisów (wszyscy widzą zespół) / tworzenie (staff: tylko dla siebie) |
| GET/PUT/PATCH/DELETE /<id>/ | Szczegóły / edycja / usunięcie (staff: tylko własne) |
| GET /team-today/ | Dostępność zespołu **na dziś** (do dashboardu) |
| GET /today/ | Wpisy na dziś |
| GET /tomorrow/ | Wpisy na jutro |
| GET /week/ | Wpisy na bieżący tydzień |
| GET /check/?employee=<uuid>&date=YYYY-MM-DD | Sprawdzenie dostępności pracownika (do ostrzeżenia przy przypisywaniu) — zwraca **entries** i **has_unavailability** |

Filtry listy: **employee**, **availability_type**, **date**, **is_active**.

---

## Ostrzeżenia przy przypisywaniu

Przy przypisywaniu **naprawy**, **zadania** itd. frontend może wywołać **GET /availability/check/?employee=<id>&date=...**.  
Jeśli **has_unavailability** jest true, wyświetlić komunikat typu: *„Ten pracownik jest obecnie niedostępny”*.  
System **nie blokuje** operacji — tylko informuje.

---

## Django Admin

Sekcja **Dostępność pracowników**: lista wpisów (pracownik, typ, data, cały dzień / godziny, notatka), filtry, date_hierarchy.

---

## Integracja

- **Dashboard** — sekcja „Dostępność zespołu dziś” / „Zespół dziś” (GET /team-today/).
- **Kalendarz** — wpisy dostępności jako bloki (inny kolor niż naprawy/zadania) — po stronie frontendu.
- **Wyszukiwarka globalna** — po wyszukaniu pracownika można pokazać status dostępności na dziś (GET /check/).
