# Moduł: Zarządzanie pracownikami (Staff Management)

Dostęp tylko dla **admina**. API w aplikacji `accounts`.

---

## 1. Lista pracowników

**GET /api/v1/accounts/staff/**

- Zwraca wszystkich użytkowników z rolami **admin** i **staff**.
- W każdym wierszu: id, email, full_name, first_name, last_name, role, role_display, is_active, last_login, date_joined, is_superadmin, staff_profile (specialization, calendar_color, display_name, is_visible_in_rankings, is_available, accepts_shipment_repairs), **active_repairs_count**, **completed_repairs_count**, **health_score_level** (green/yellow/red).

**Filtry (query params):**

- `role` — admin | staff
- `is_active` — true | false
- `specialization` — np. phone_tablet, laptop_printer, general

---

## 2. Dodawanie pracownika

**POST /api/v1/accounts/staff/**

Body (JSON):

- **first_name**, **last_name**, **email** — wymagane
- **password** — opcjonalne (dla staff można pominąć — wygenerowane tymczasowe hasło)
- **phone** — opcjonalne
- **role** — `admin` | `staff` (domyślnie staff)
- Dla staff: **specialization**, **calendar_color**, **display_name**, **is_visible_in_rankings**, **is_available**, **accepts_shipment_repairs**

Dla **staff** tworzony jest też **StaffProfile**. Dla **admin** — tylko User z role=admin, is_staff=True.

---

## 3. Szczegóły pracownika

**GET /api/v1/accounts/staff/<uuid>/**  

Pełny wiersz jak na liście (z liczbami napraw i health score).  
Szczegółowy panel (statystyki, health, naprawy, audit) — **GET /api/v1/analytics/staff/<uuid>/manager-view/** (istniejący endpoint).

---

## 4. Edycja pracownika

**PATCH /api/v1/accounts/staff/<uuid>/update/**

Można wysłać częściowe pola: first_name, last_name, email, phone, role, is_active, specialization, calendar_color, display_name, is_visible_in_rankings, is_available, accepts_shipment_repairs.

- **Superadmin** (is_superadmin=True): nie można ustawić **is_active=False** (blokada dezaktywacji).

---

## 5. Reset hasła

**POST /api/v1/accounts/staff/<uuid>/reset-password/**

Body:

- **action**: `generate` | `send_link`
- **new_password** (opcjonalnie): przy `generate` — nowe hasło; jeśli brak — generowane losowe (zwracane w odpowiedzi jako `temporary_password`).
- **send_link**: wysyła e-mail z resetem (wymaga skonfigurowanej poczty).

---

## 6. Blokada / aktywacja konta

- **POST /api/v1/accounts/staff/<uuid>/deactivate/** — ustawia **is_active=False** (zablokowany nie może się logować).  
  Dla **superadmina** zwracany błąd 400.
- **POST /api/v1/accounts/staff/<uuid>/activate/** — ustawia **is_active=True**.

Usuwanie użytkownika: tylko **soft** — przez dezaktywację. Hard delete nie jest udostępniony w API; w Django Admin nie można usunąć użytkownika z **is_superadmin=True**.

---

## 7. Logi logowania

**GET /api/v1/accounts/staff/<uuid>/login-activity/?limit=50**

Zwraca listę wpisów **LoginActivity**: ip_address, user_agent, login_status (success/failed), logged_in_at.  
Logowanie jest zapisywane przy każdym **POST /api/v1/accounts/login/** (sukces i niepowodzenie).

---

## 8. Modele (rozszerzenia)

- **User**: **is_superadmin** (Boolean) — konto nie może być usunięte ani dezaktywowane; służy do odzyskania systemu.
- **StaffProfile**: **accepts_shipment_repairs** (Boolean) — czy pracownik przyjmuje naprawy wysyłkowe.

**LoginActivity** i **StaffProfile** (specialization, calendar_color, is_visible_in_rankings, is_available) istniały wcześniej.

---

## 9. Superadmin

- W Django Admin: użytkownik z **is_superadmin=True** nie może być usunięty (`has_delete_permission` zwraca False).
- W API: dezaktywacja takiego konta zwraca błąd.

---

## 10. Ranking i health score

- **Ranking pracowników**: GET /api/v1/analytics/staff-ranking/?days=30  
- **Health score pracownika**: GET /api/v1/analytics/staff/<uuid>/health-score/  
- **Widok menedżerski** (profil + statystyki + health + naprawy + audit): GET /api/v1/analytics/staff/<uuid>/manager-view/

---

*Dokument utworzony na podstawie prokom.md (moduł Zarządzanie pracownikami).*
