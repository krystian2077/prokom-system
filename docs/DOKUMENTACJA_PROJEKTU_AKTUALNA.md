# PRO-KOM Serwis — dokumentacja projektu (stan aktualny)

**Wygenerowano na podstawie kodu źródłowego repozytorium.**  
Starszy plik [ANALIZA_STANU_PROJEKTU.md](ANALIZA_STANU_PROJEKTU.md) (2025-03-07) nie opisuje już pełnego stanu — m.in. brak w nim rozbudowanego frontendu i wielu modułów backendu, które obecnie istnieją.

---

## 1. Cel i zakres systemu

**PRO-KOM Serwis** to platforma operacyjna dla serwisu elektroniki (PRO-KOM, Rabka-Zdrój). Obejmuje:

| Warstwa | Opis |
|--------|------|
| **Strona publiczna** | SEO, oferta, usługi, FAQ, kontakt, formularz zgłoszenia, śledzenie naprawy, Hammer Glass, akcesoria, regulamin, polityka prywatności |
| **Panel klienta** (`/client/*`) | Rejestracja, logowanie, weryfikacja e-mail, reset hasła, dashboard, naprawy, profil |
| **Panel pracowniczy / staff** (`/panel/*`) | Dashboard, naprawy, klienci, zadania, kalendarz, części, wyszukiwanie, komunikacja, archiwum, konfiguracja itd. |
| **Panel administracyjny (frontend)** (`/admin-panel/*`) | KPI, statystyki, naprawy, klienci, zadania, kalendarz, zamówienia, części, zespół, workload, dostępność, wyszukiwanie |
| **Django Admin** | `/admin/` — klasyczny panel Django |
| **REST API** | `/api/v1/*` — Django REST Framework, autoryzacja tokenem i sesją |

---

## 2. Stack technologiczny (faktyczne wersje z repozytorium)

### Backend

| Technologia | Uwagi |
|---------------|--------|
| **Python** | Projekt deklaruje w README Python 3.14; `requirements.txt` nie pinuje konkretnej wersji interpretera |
| **Django** | `>=5.1,<5.2` |
| **Django REST Framework** | `>=3.15,<3.16` |
| **Baza danych** | **Produkcja:** PostgreSQL (`psycopg`, `dj-database-url`). **Lokalnie (`config.settings.local`):** domyślnie **SQLite** (`db.sqlite3`) |
| **CORS** | `django-cors-headers` |
| **Filtry** | `django-filter` |
| **Dokumentacja API** | `drf-spectacular` — Swagger `/api/docs/`, ReDoc `/api/redoc/`, schema `/api/schema/` (tylko gdy `DEBUG=True` w konfiguracji URL) |
| **Statyczne pliki** | WhiteNoise |
| **Obrazy** | Pillow |
| **Audyt** | `django-simple-history` + middleware |
| **PDF / QR** | reportlab, qrcode |
| **Zadania w tle** | **Celery** + **Redis** + `django-celery-beat` (harmonogram w bazie) |
| **HTTP klient** | httpx |
| **Testy (narzędzia)** | pytest, pytest-django, coverage (katalog testów zależy od implementacji w repo) |

### Frontend

| Technologia | Wersja (z `package.json`) |
|-------------|---------------------------|
| **Next.js** | 14.2.18 *(README w root wspomina „Next.js 15” — to nie jest zgodne z aktualnym `package.json`)* |
| **React** | 18.x |
| **TypeScript** | 5.x |
| **Styl** | Tailwind CSS 3.x |
| **Stan / dane** | Zustand, TanStack React Query |
| **Animacje** | Framer Motion |
| **Ikony** | lucide-react |

**Proxy API:** w `next.config.js` skonfigurowano rewrite ` /api/proxy/:path*` → `${NEXT_PUBLIC_API_URL}/api/v1/:path*`. Bezpośrednie wywołania z `lib/api.ts` używają `NEXT_PUBLIC_API_URL` + `/api/v1`.

---

## 3. Struktura katalogów (wysoki poziom)

```
prokom-system/
├── backend/                 # Django — API, modele, serwisy
│   ├── config/              # settings (base, local, prod, render), urls, wsgi, asgi, celery.py
│   ├── apps/                # aplikacje domenowe (patrz §4)
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # Next.js (App Router)
│   ├── app/                 # routy: (public), client, panel, admin-panel
│   ├── components/
│   ├── lib/                 # api.ts, panel-api.ts, auth-storage.ts, format.ts
│   └── .env.local.example
├── docs/                    # dokumentacja modułowa i ta plik
└── README.md
```

Katalog `infra/` w README jest wymieniony — w bieżącym stanie workspace może być pusty lub niezcommitowany; szczegóły wdrożenia należy weryfikować w repozytorium i na hostingu.

---

## 4. Backend — aplikacje Django (`LOCAL_APPS`)

| App | Rola (skrót) |
|-----|----------------|
| **common** | Modele bazowe (`BaseModel`, `UUIDModel`, `TimestampedModel`, `SoftDeleteModel`), enumy statusów, permissions, utils, walidatory |
| **accounts** | Użytkownik (`User`), role (`admin` / `staff` / `client`), `StaffProfile`, powiadomienia staff, logowanie, weryfikacja e-mail, reset hasła, zarządzanie pracownikami (endpointy admin) |
| **clients** | Klienci, zgody, notatki, adresy |
| **devices** | Marki, modele urządzeń, urządzenia, zdjęcia |
| **repairs** | Naprawy (`RepairRequest`), historia statusów, przypisania, zdjęcia, notatki, checklisty, wizyty, ankiety, komunikacja zespołu (`TeamThreadMessage`), śledzenie, claim przez token/SMS, smart reminders (Celery) |
| **diagnostics** | Raporty diagnostyczne |
| **pricing** | Typy robocizny, wyceny (`Quote`), pozycje, kaucje (`Deposit`) |
| **inventory** | Dostawcy, części, zamówienia zakupowe, użycie części w naprawie |
| **orders** | Zamówienia sklepu / kategorie / produkty (moduł zamówień) |
| **tasks** | Zadania wewnętrzne + komentarze |
| **availability** | Dostępność pracowników |
| **accessories** | Kategorie, produkty, pakiety, oferty przy naprawie |
| **hammer_glass** | Typy folii, produkty, oferty przy naprawie |
| **communications** | Szablony wiadomości, logi komunikacji, wysyłka (`send`) |
| **timelines** | Rejestrowana w `INSTALLED_APPS` (szczegóły implementacji w kodzie) |
| **calendar_app** | Wydarzenia kalendarza, blokady slotów |
| **documents** | PDF (protokół przyjęcia), kody QR naprawy |
| **analytics** | KPI, rankingi, raporty, snapshoty pracowników, dashboard admina |
| **compliance** | RODO (eksport, usunięcie konta), wersje regulaminów, logi backupów |
| **search** | Wyszukiwanie globalne, intake, advanced |

---

## 5. Mapowanie API REST (`/api/v1/`)

Prefixy z `config/urls.py`:

| Prefix | Zawartość |
|--------|-----------|
| `accounts/` | Logowanie (klient + staff), rejestracja, weryfikacja e-mail, hasła, `me`, powiadomienia staff, CRUD pracowników (admin) |
| `clients/` | Klienci |
| `devices/` | Urządzenia, marki, modele |
| `repairs/` | ViewSet napraw + `submit/`, `track/`, `claim/`, kody claim, itd. |
| `accessories/` | Kategorie, produkty, bundlery, oferty napraw |
| `hammer-glass/` | Typy folii, produkty, oferty napraw |
| `communications/` | Szablony, logi, `send/` |
| `documents/` | PDF protokołu, QR dla naprawy |
| `compliance/` | Eksport danych, wnioski RODO, endpointy admin (regulaminy, backup) |
| `analytics/` | KPI, rankingi, raporty, snapshoty, health score |
| `search/` | `global/`, `intake/`, `advanced/` |
| `inventory/` | Magazyn, zamówienia do dostawców |
| `orders/` | zamówienia sklepu |
| `tasks/` | zadania |
| `availability/` | dostępność |
| `calendar/` | kalendarz |
| `pricing/` | robocizna, wyceny, kaucje |
| `staff/repairs/` | Lista napraw staff (osobny widok) |
| `staff/repairs/<uuid>/` | Szczegół naprawy staff |
| `staff/dashboard/` | Dashboard staff |
| `config/parcel-locker-address/` | Adres paczkomatu (formularz, etykiety) |

Dokumentacja interaktywna: **Swagger UI** (`/api/docs/`), **ReDoc** (`/api/redoc/`) — zgodnie z `config/urls.py` i ustawieniami `DEBUG`.

---

## 6. Frontend — główne obszary routingu (App Router)

### Publiczne (`app/(public)/`)

Strona główna, usługi, oferta, kontakt, FAQ, regulamin, polityka prywatności, zgłoszenie (`zgloszenie`), śledzenie (`track`), claim reklamacji, Hammer Glass, akcesoria, podstrony serwisu (laptopy, komputery, konsole, drukarki, tablety, smartwatche, odzyskiwanie danych) itd.

### Klient (`app/client/`)

Logowanie, rejestracja, weryfikacja e-mail, forgot/reset hasła, dashboard, lista i szczegół naprawy, profil. Layout z `ClientGate` (ochrona tras).

### Panel staff (`app/panel/`)

Dashboard, naprawy (lista, szczegół `[id]`), klienci, zadania, kalendarz, części, hurtownie, wyszukiwanie, komunikacja, archiwum, konfiguracja, dostępność, odbiór, pickupi, zamówienia, statystyki, powiadomienia, profil, zespół, reklamacje, intake, nieprzypisane naprawy itd.

### Panel admin (frontend) (`app/admin-panel/`)

Dashboard, naprawy, klienci, zamówienia, części, zadania, kalendarz, statystyki, workload, zespół, wyszukiwanie, komunikacja, konfiguracja, archiwum, dostępność, pickupi, reklamacje, intake, nieprzypisane, notyfikacje itd.

### Inne

- `app/panel/login/` — logowanie staff  
- Root layout w `app/layout.tsx`

---

## 7. Uwierzytelnianie i autoryzacja

- **DRF:** `SessionAuthentication` + `TokenAuthentication` (domyślnie `IsAuthenticated`).
- Frontend przechowuje token (np. `lib/auth-storage.ts`) i dołącza go do żądań API.
- Role użytkownika rozróżniają dostęp do endpointów staff/admin vs klient (szczegóły w permissionach i widokach poszczególnych aplikacji).

---

## 8. Zmienne środowiskowe

### Backend (`backend/.env` — wzór: `.env.example`)

- `SECRET_KEY`, opcjonalnie `DJANGO_SETTINGS_MODULE`
- PostgreSQL: `DB_*` lub w produkcji `DATABASE_URL`
- E-mail SMTP: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` — bez pełnych danych SMTP w dev e-maile mogą iść do konsoli (`local.py`)
- Celery: `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` (domyślnie Redis lokalnie)
- `FRONTEND_BASE_URL` — linki w e-mailach (śledzenie, claim)
- `PARCEL_LOCKER_ADDRESS` — adres paczkomatu (domyślna wartość w `base.py`)

### Frontend (`frontend/.env.local` — wzór: `.env.local.example`)

- `NEXT_PUBLIC_API_URL` — np. `http://localhost:8000`

---

## 9. Uruchomienie lokalne

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Ustaw `DJANGO_SETTINGS_MODULE=config.settings.local` (lub zgodnie z `.env`).

### Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

### Celery (opcjonalnie)

Zobacz [CELERY_URUCHOMIENIE.md](CELERY_URUCHOMIENIE.md): worker, beat, przykładowe periodic tasks (backup, przypomnienia, snapshoty analityki).

---

## 10. Git i gałęzie (z README)

- `main` — produkcja  
- `develop` — integracja / staging  
- `feature/*`, `fix/*`, `hotfix/*` — konwencje nazw

---

## 11. Etapy roadmapy (README głównego)

README wymienia etapy 1–6 jako zrealizowane oraz 7–11 jako częściowo lub w toku. **Stan kodu** obejmuje już m.in. moduły Hammer Glass, akcesoria, komunikacja, dokumenty (PDF/QR), compliance, analytics, wyszukiwanie, kalendarz, zadania — należy je traktować jako **zaimplementowane w kodzie**, a nie wyłącznie według starej tabeli „❌” w `ANALIZA_STANU_PROJEKTU.md`.

Do dalszego doprecyzowania w projekcie: testy automatyczne, pełna dokumentacja operacyjna backupów, ewentualne rozszerzenia SMS/ S3 wskazane w `.env.example`.

---

## 12. Powiązane dokumenty w `docs/`

Moduły opisane osobno (mogą wymagać synchronizacji z kodem):

- [SEARCH_MODULE.md](SEARCH_MODULE.md)  
- [INVENTORY_PARTS_MODULE.md](INVENTORY_PARTS_MODULE.md)  
- [ORDERS_MODULE.md](ORDERS_MODULE.md)  
- [TASKS_MODULE.md](TASKS_MODULE.md)  
- [AVAILABILITY_MODULE.md](AVAILABILITY_MODULE.md)  
- [STAFF_MANAGEMENT.md](STAFF_MANAGEMENT.md)  
- [FRONTEND_URUCHOMIENIE.md](FRONTEND_URUCHOMIENIE.md)  
- [CELERY_URUCHOMIENIE.md](CELERY_URUCHOMIENIE.md)  
- [NOWE_FUNKCJONALNOSCI_PROKOM.md](NOWE_FUNKCJONALNOSCI_PROKOM.md)  

---

## 13. Uwagi końcowe

- **Jedno źródło prawdy dla API:** uruchomiony backend + `/api/docs/` lub schema OpenAPI.  
- **Ten dokument** opisuje architekturę i moduły na podstawie struktury repo; szczegóły pól modeli i reguł biznesowych są w kodzie (modele, serwisy, serializery).  
- Przy zmianach wersji Next.js/Django w `package.json` / `requirements.txt` należy zaktualizować §2 niniejszego pliku oraz README root.
