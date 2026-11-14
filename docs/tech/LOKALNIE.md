# Uruchomienie lokalne (sprawdzone w T0, 14.11.2026, Windows 11)

Wynik: zgłoszenie z `/zgloszenie` (front 3003) przechodzi do lokalnego backendu i dostaje numer (`PROKOM/RMA/…`), `/track` je pokazuje, a konto pracownika loguje się do panelu. **Potrzebny jest Redis** (niżej wyjaśniam dlaczego). Celery worker i SMTP nie są potrzebne.

## Wymagania
| Co | Wersja | Uwagi |
|---|---|---|
| Python | **3.12** (jak w CI) | Na 3.14 nie zainstaluje się `Pillow 10.4`. Na Windows: `py -3.12`. |
| Node | 24 (lokalnie), CI ma 20 | `npm`, bo repo ma `package-lock.json`. |
| Docker | dowolny aktualny | tylko dla Redisa. |

## 1. Redis (Docker)
```bash
docker compose -f docker-compose.dev.yml -p prokom-system-dev up -d
```
Redis jest na `localhost:63792`, a nie na 6379, żeby nie kolidował z innymi projektami.

**Dlaczego Redis jest wymagany:** po zapisaniu zgłoszenia backend zleca Celery zadanie „powiadom serwis” (`send_new_repair_staff_notification_task.delay()` w `transaction.on_commit`). Bez brokera `.delay()` w nieskończoność ponawia próby połączenia, więc **żądanie wisi**, choć zgłoszenie jest już w bazie (sprawdzone: timeout po 60 s). Worker Celery nie jest potrzebny: zadanie trafia do kolejki i tam zostaje.

Mailpita z planu T0 nie dodałem. `config.settings.local` bez `EMAIL_HOST_USER` i `EMAIL_HOST_PASSWORD` używa backendu konsolowego (maile widać w logu `runserver`), a z nimi wymusza `EMAIL_USE_TLS=True`, którego Mailpit bez certyfikatu nie obsłuży. Użycie Mailpita wymagałoby zmiany ustawień, a ich nie zmieniamy.

## 2. Backend (SQLite, `config.settings.local`)
```bash
cd backend
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python manage.py migrate
```
Uruchomienie z Redisem z punktu 1 (zmienne środowiskowe ustawiamy w poleceniu, bez zmian w settings i bez pliku `.env`):

PowerShell:
```powershell
$env:CELERY_BROKER_URL="redis://localhost:63792/0"; $env:CELERY_RESULT_BACKEND="redis://localhost:63792/0"; .venv\Scripts\python manage.py runserver 8000
```
Git Bash:
```bash
CELERY_BROKER_URL=redis://localhost:63792/0 CELERY_RESULT_BACKEND=redis://localhost:63792/0 .venv/Scripts/python manage.py runserver 8000
```
- Maile (potwierdzenie zgłoszenia, wiadomości z formularza kontaktowego) idą do konsoli `runserver`.
- Testy backendu (tylko uruchamiamy): `.venv\Scripts\python -m pytest`.
- Blok `service` w `/track` pochodzi z `SERWIS_PRINT_*` (domyślne wartości w `base.py`).

## 3. Frontend na porcie 3003
```bash
cd frontend
npm ci
npx next dev -p 3003
```
- `NEXT_PUBLIC_API_URL` ma domyślną wartość `http://localhost:8000` (`lib/api.ts`), więc lokalnie `frontend/.env.local` nie jest potrzebny. Jeśli go tworzysz, wzorem jest `.env.local.example`.
- CORS w `local.py` przepuszcza porty 3000–3004 (sprawdzone dla 3003). Porty 3000–3002 zajmuje prokom-web.
- `.claude/launch.json` uruchamia ten sam serwer na 3003 (podgląd w aplikacji Claude).
- **`next build` dziś nie przechodzi** (także w CI): Google Fonts zwraca dla kroju Unbounded adresy bez rozszerzenia (`/l/font?kit=…`), a `next/font` w 14.2.18 (i 14.2.35) się na tym wykłada. `next dev` działa. Poprawka: osobny PR przed TM (patrz `docs/STAN.md`).

## 4. Konto pracownika do testów (lokalnie)
Seedów z repo (`seed_initial`, `seed_staff_profiles`) **nie używaj**: mają hasła wpisane w kod (`docs/tech/BEZPIECZENSTWO.md`). Własne konto z hasłem tylko u Ciebie:
```bash
cd backend
.venv\Scripts\python manage.py shell
```
```python
from getpass import getpass
from apps.accounts.models import User, UserRole, StaffProfile
u, _ = User.objects.get_or_create(email="pracownik.test@example.com", defaults=dict(first_name="Test", last_name="Pracownik", role=UserRole.STAFF, is_staff=True, is_active=True))
u.set_password(getpass("Hasło: ")); u.must_change_password = False; u.save()
StaffProfile.objects.get_or_create(user=u)
```
Logowanie: `http://localhost:3003/panel/login` (API: `POST /api/v1/accounts/staff-login/` → `{token, user}`, sprawdzone). Konto admina: `python manage.py createsuperuser`.

## 5. Szybki test całości
1. `http://localhost:3003/zgloszenie?category=phone` → 5 kroków → „Wyślij zgłoszenie” → numer `PROKOM/RMA/n/2026`.
2. `http://localhost:3003/track?ref=<numer>` + 4 ostatnie cyfry telefonu → „Zgłoszenie przyjęte”.
3. Panel pracownika → zgłoszenie na liście.

Znany drobiazg starego formularza: w „Podglądzie zgłoszenia” pole „Urządzenie” pokazuje „Nie wybrano”, mimo że model jest wpisany. Formularz zastępujemy w TD3, więc tego nie poprawiamy.

## 6. Fixtures kontraktu
`tests/tech/fixtures/*.json`: prawdziwe odpowiedzi lokalnego backendu na fikcyjnych danych (żądanie + status + treść), zebrane 14.11.2026 skryptem w Pythonie (httpx). Pokrywają: zgłoszenie 201 (telefon/punkt, laptop/kurier), każdy kształt błędu 400, `track` 200/400/404 i `inquiry` 200/400. Gdy backend się zmieni, zbierz je ponownie.

## 7. Testy frontu i narzędzia wyglądu (od TD1)
W `frontend/`:
```bash
npm run test          # Vitest: lib/tech/*.test.ts, tests/tech/*.test.ts (godziny, dane, literały, pomiar, JSON-LD)
npm run lint          # ESLint tylko dla nowego kodu (panele w ignorePatterns, bez zmian w nich)
npm run build
npx playwright install chromium   # raz
npx playwright test               # e2e: panele.spec.ts, responsywnosc.spec.ts
```
- Playwright sam uruchamia `next start` z **tego** checkoutu na porcie `TECH_PORT` (domyślnie **3002**; CORS w `local.py` przepuszcza 3000–3004). Nie podpina się pod serwer, który już działa na porcie — stary build dawałby fałszywe „zero różnic”. Port zajęty → ustaw inny wolny: `$env:TECH_PORT="3001"; npx playwright test`.
- `panele.spec.ts` porównuje z bazowymi zrzutami z TD1 (`tests/tech/__zrzuty__/`, Windows — w CI nie działa). Ekran `/panel` po zalogowaniu wymaga backendu na 8000 i konta pracownika w `frontend/tests/tech/.panel-test.local.json` (`{"email": "...", "password": "..."}`, poza gitem; konto zakładasz jak w §4). Bez pliku ten test jest pomijany. Liczniki dashboardu zależą od danych w lokalnej bazie — po ich zmianie zrzuty `panel-dashboard-*` trzeba zrobić na nowo z czystego `develop` (`--update-snapshots`).
- Zrzuty i porównanie ze wzorcem (z korzenia repo, przy działającym `next start -p 3002`):
  ```bash
  node scripts/tech/zrzuty.mjs --pages=/ --widths=360,390,768,1024,1440,1920
  node scripts/tech/porownaj.mjs --page=/ --wzorzec=glowna --region=header
  ```
  Wynik w `tmp/zrzuty/index.html` i `tmp/porownaj/*.html` (poza gitem).
