# Moduł Zadania wewnętrzne (Tasks)

Lekki moduł operacyjny: przypomnienia, delegowanie, dopinanie tematów, komentarze, kontrola wykonania.  
Dostęp: **staff** i **admin** (pracownik widzi tylko swoje zadania, admin — wszystkie).

---

## Modele

### Task
- **title**, **description**
- **created_by** (FK User), **assigned_to** (FK User)
- **status**: new, in_progress, waiting, completed, cancelled
- **priority**: low, standard, important, urgent
- **due_date**, **completed_at**
- **related_repair** (FK RepairRequest), **related_client** (FK Client), **related_customer_order** (FK CustomerOrder), **related_store_order** (FK StoreSupplyOrder)
- **is_archived**
- **created_at**, **updated_at** (z BaseModel)

### TaskComment
- **task** (FK Task), **author** (FK User), **body**, **created_at**

---

## Uprawnienia

**Pracownik (staff):**
- Tworzy zadania dla siebie i dla dowolnego pracownika/admina
- Widzi **tylko zadania przypisane do siebie**
- Komentuje swoje zadania
- Zmienia **tylko status** swojego zadania (bez przepisywania i pełnej edycji)
- Nie usuwa zadań

**Admin:**
- Widzi wszystkie zadania
- Edytuje wszystko, zmienia terminy, **przepisuje zadania** do innych
- Archiwizuje / anuluje / usuwa

---

## API

Baza: **/api/v1/tasks/**

| Endpoint | Opis |
|----------|------|
| GET/POST / | Lista / tworzenie (staff: tylko swoje w liście; przy tworzeniu można podać assigned_to) |
| GET/PUT/PATCH/DELETE /<id>/ | Szczegóły / edycja / usuwanie (staff: tylko swoje; edycja tylko status) |
| POST /<id>/comments/ | Dodaj komentarz (body) |
| GET /mine/ | Moje zadania (alias listy) |
| GET /due-today/ | Na dziś (termin = dziś, nie zakończone) |
| GET /urgent/ | Pilne (priorytet urgent) |
| GET /overdue/ | Zaległe (termin w przeszłości) |
| GET /completed/ | Zakończone |
| GET /no-due-date/ | Bez terminu |
| GET /dashboard/ | Liczby: due_today_count, urgent_count, overdue_count, new_count (dla zalogowanego) |
| GET /team-dashboard/ | **Tylko admin**: open_count, overdue_count, urgent_count, no_due_date_count, by_assigned_to |

Filtry listy: **status**, **priority**, **assigned_to**, **created_by**, **is_archived**.

---

## Powiadomienia (StaffNotification)

Moduł tworzy powiadomienia systemowe gdy:
- **task_assigned** — przypisano nowe zadanie (do assigned_to)
- **task_comment** — ktoś dodał komentarz do zadania (do assigned_to, jeśli nie autor)
- **task_due_changed** — zmieniono termin zadania (do assigned_to)

---

## Django Admin

Sekcja **Zadania wewnętrzne**:
- **Zadanie** — lista z tytułem, przypisany, status, priorytet, termin, zaległe; inline komentarzy
- **Komentarz do zadania** — task, autor, treść, data

---

## Integracja

Zadanie może być powiązane z: naprawą, klientem, zamówieniem klienta, zamówieniem sklepowym. Dzięki temu z karty zadania można przejść do powiązanego obiektu.
