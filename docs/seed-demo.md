# seed_demo — dane demo do zrzutów panelu pracownika

Komenda `seed_demo` wgrywa na **stagingu** (albo lokalnie) 10 fikcyjnych napraw przypisanych do konta „Serwisant Demo”. Służy tylko do zrzutów panelu do portfolio. **Na produkcji odmawia działania.**

## Tryby

| Komenda | Co robi |
|---|---|
| `python manage.py seed_demo` | Dry run: wypisuje plan, istniejące demo, rekordy „TEST AUDYT…”. Nic nie zapisuje. |
| `python manage.py seed_demo --yes-staging` | Usuwa poprzednie demo i wgrywa nowe (jedna transakcja). Na końcu podsumowanie i hasło. |
| `python manage.py seed_demo --clear --yes-staging` | Usuwa tylko dane demo. |
| `python manage.py seed_demo --clear` | Dry run usuwania. |

## Na stagingu (VPS webh.pl)

Uruchamia Krystian albo sesja po jego wyraźnej zgodzie (to zmiana danych stagingu). Jedna komenda naraz:

```bash
docker exec prokom-tech-staging-backend-1 python manage.py seed_demo
```

```bash
docker exec prokom-tech-staging-backend-1 python manage.py seed_demo --yes-staging
```

Po zrzutach:

```bash
docker exec prokom-tech-staging-backend-1 python manage.py seed_demo --clear --yes-staging
```

**Nigdy** w `prokom-tech-prod-backend-1` (i tak odmówi: baza `prokom_tech_prod`, domena produkcji w `ALLOWED_HOSTS`).

## Logowanie

- Panel: `https://staging.prokomserwis.pl/panel`
- Login: **`demo.serwisant@example.com`** (logowanie w systemie jest e-mailem, nie nazwą użytkownika).
- Hasło: losowe, wypisane raz w konsoli po `--yes-staging`. Każde ponowne wgranie tworzy konto od nowa z nowym hasłem.
- Zrzuty: Chrome 1600×1000, skala 2×.

## Co powstaje

- Konto „Serwisant Demo” (rola pracownik serwisu, w profilu „Serwisant — Rabka-Zdrój”; backend nie ma modelu oddziałów).
- 10 klientów (9 osób + Firma Demo Sp. z o.o.), e-maile `demo.*@example.com`, telefony `+48 111 222 301`–`310`.
- 10 napraw z historią statusów, opisem klienta, notatką techniczną, akcesoriami i stanem wizualnym, wycenami (brutto) i częścią „dotarła” przy Galaxy S24.
- Wiadomości klient ↔ serwis przy 3 naprawach, 3 zadania na dziś, 2 nieprzeczytane powiadomienia. Bez sesji czasu pracy.

| # | Urządzenie | Status (kod) | Uwagi |
|---|---|---|---|
| 1 | iPhone 15 | `in_repair` | termin dziś, wycena 1 099 zł zaakceptowana |
| 2 | Galaxy S24 | `waiting_for_parts` | bateria dotarła dziś, 349 zł |
| 3 | Lenovo Legion 5 | `ready_for_pickup` | gotowe od wczoraj, 249 zł |
| 4 | Redmi Note 13 | `new` | pilne, dziś rano, wycena do przygotowania |
| 5 | HP LaserJet Pro M404 | `in_diagnostics` | firma, termin jutro |
| 6 | Dell Latitude 5520 | `in_repair` | termin jutro, 529 zł |
| 7 | iPad 10. gen. | `quote_sent` | czeka na akceptację, 599 zł |
| 8 | Pixel 8 | `new` | **nieprzypisane**, dziś |
| 9 | MSI Katana 15 | `picked_up` | odebrane 3 dni temu, 449 zł |
| 10 | Apple Watch Series 9 | `picked_up` | odebrane wczoraj, 289 zł |

Spodziewane liczniki dashboardu: Aktywnych 7, W trakcie Naprawy 5, Gotowe do Odbioru 1, Wiadomości 1 (ten kafelek liczy wysłane wyceny), Zakończonych: Dziś 0 / Ten miesiąc 2 (Ten tydzień zależy od dnia tygodnia). „Nieprzypisane” to licznik globalny — na kopii produkcji może być większy niż 1 (dry run to wypisze).

## Bezpieczniki

- Działa tylko na lokalnym SQLite albo bazie `prokom_tech_staging`; domena produkcji w `ALLOWED_HOSTS` albo baza z „prod” w nazwie = odmowa.
- Bez `--yes-staging` nic nie zapisuje.
- Jedna transakcja; przy błędzie nic nie zostaje w bazie.
- Na czas działania e-mail idzie do `locmem`, a każde zlecenie zadania Celery jest blokowane. Komenda nie wywołuje widoków ani serwisów wysyłających powiadomienia; backend nie ma sygnałów `post_save`. Staging i tak nie ma Celery ani beat.
- Dane demo rozpoznaje po dwóch znacznikach (prefiks `[DEMO]` w notatce wewnętrznej + e-mail `demo.*@example.com`) i po rejestrze ID w `SystemSetting` o kluczu `seed_demo.registry`. Rekordy „TEST AUDYT…” i wszystkie inne są tylko wypisywane, nigdy zmieniane.
- Nie tworzy marek urządzeń (używa istniejących albo wpisuje markę ręcznie w urządzeniu).

Uwagi: każde wgranie zużywa 10 numerów z licznika `PROKOM/RMA/N/RRRR` (licznik się nie cofa). Zalogowanie się jako pracownik samo zapisuje obecność na dziś (`EmployeeAvailability`) — `--clear` usuwa ją razem z kontem.

Testy: `cd backend && python -m pytest tests/test_seed_demo.py`.
