# Inwentarz przed migracją (MIGRACJA-VPS §2) — T0, 14.11.2026

Część A pochodzi z repo (sprawdzona w T0). Część B uzupełnia Krystian wynikami komend z części C (**bez haseł i wartości z `.env`**).

## A. Z repo

### A1. Stos produkcyjny (`docker-compose.prod.yml`)
| Usługa | Obraz / build | Uwagi |
|---|---|---|
| `db` | `postgres:16-alpine` | wolumen `postgres_data` |
| `redis` | `redis:7-alpine`, `--requirepass` | wolumen `redis_data`; **wymagany** — bez niego formularz zgłoszenia wisi (`LOKALNIE.md`) |
| `backend` | build `backend/` (gunicorn) | `staticfiles`, `mediafiles` |
| `celery` | ten sam obraz, `worker --concurrency=2` | |
| `celery-beat` | ten sam obraz, `DatabaseScheduler` | harmonogram **w bazie** (`django_celery_beat`), nie w kodzie |
| `frontend` | build `frontend/` (Next 14) | `NEXT_PUBLIC_*` jako build args; **build dziś nie przechodzi** (krój Unbounded, `WYJATKI.md`) |
| `nginx` + `certbot` | `nginx:alpine`, `certbot/certbot` | `certbot_certs`, `certbot_www`; na VPS zastępuje je wspólny Nginx prokom-web |

### A2. Klucze `.env.prod` (bez wartości)
Źródło: `.env.prod.example` + to, co kod naprawdę czyta (`config/settings/*.py`).

| Klucz | Zależy od domeny / serwera? | Uwagi |
|---|---|---|
| `SECRET_KEY` | nie | przenieść bez zmian (zmiana unieważni sesje i tokeny) |
| `DEBUG`, `DJANGO_SETTINGS_MODULE` | nie | |
| `ALLOWED_HOSTS` | **domena** | domyślnie w `prod.py`: `prokomserwis.pl, www.prokomserwis.pl`; staging potrzebuje własnej wartości |
| `FRONTEND_BASE_URL` | **domena** | linki w mailach do klientów; na stagingu inny adres |
| `DATABASE_URL`, `POSTGRES_DB/USER/PASSWORD` | **serwer** | host bazy w nowym stosie |
| `REDIS_URL`, `REDIS_PASSWORD`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | **serwer** | `CELERY_*` mają domyślnie `redis://localhost:6379/0` — sprawdzić, które ustawia `.env.prod` |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | **domena** (build args) | na VPS idą do GitHub Variables (obrazy w Actions) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | domena (Google Console) | domena się nie zmienia → działa; staging tylko po dodaniu adresu |
| `EMAIL_HOST/PORT/HOST_USER/HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`, `EMAIL_TIMEOUT` | nie | Gmail SMTP; przy migracji bez zmian (TM+ etap D przenosi na SH 1) |
| `STAFF_NOTIFICATION_EMAILS` | nie | **na stagingu pusta albo adres testowy** |
| `EMAIL_INBOUND_WEBHOOK_SECRET`, `INBOUND_IMAP_HOST/USER/PASSWORD/MAILBOX` | nie | czy używane na produkcji — sprawdzić w B (`poll_inbound_imap`) |
| `SERWIS_PRINT_*` (7 kluczy) | nie | treść bloku „Twój serwis” w `/track` i na wydrukach |
| `PARCEL_LOCKER_ADDRESS` | nie | paczkomat nie jest oferowany |
| `RENDER_EXTERNAL_HOSTNAME`, `DJANGO_ENV`, `SEED_EMAIL_DOMAIN` | — | pozostałości (Render, seedy); sprawdzić, czy są ustawione |

`prod.py` ma na stałe: `SECURE_SSL_REDIRECT = True`, `SECURE_PROXY_SSL_HEADER = X-Forwarded-Proto` (stąd wymóg przekazania nagłówka przez wspólny Nginx — MIGRACJA §4) i `CORS_ALLOWED_ORIGINS` = obie domeny produkcji.

### A3. Zadania Celery w kodzie
| Zadanie | Plik | Co robi | Kontakt z klientem? |
|---|---|---|---|
| `send_new_repair_staff_notification_task` | `communications/tasks.py` | mail do serwisu o nowym zgłoszeniu (`STAFF_NOTIFICATION_EMAILS`) | nie (serwis) |
| `send_notification_for_repair_event` | `communications/tasks.py` | powiadomienie o zdarzeniu naprawy (szablony) | **tak — e-mail/SMS do klienta** |
| `send_smart_reminders` | `repairs/tasks.py` | przypomnienia: brak wyceny 24 h, nieodebrane, umówione wizyty, niedokończona akceptacja | **tak** (przez `send_notification_for_repair_event`) |
| `build_employee_stats_snapshots` | `analytics/tasks.py` | statystyki pracowników | nie |
| `run_backup` | `compliance/tasks.py` | kopia bazy/mediów (`BackupLog`) | nie — ale **sprawdzić cel kopii** (B) |
| `debug_task` | `config/celery.py` | — | nie |

Harmonogram jest w bazie (`django_celery_beat_periodictask`), więc pełną listę daje dopiero zapytanie z części C.

### A4. Co wysyła wiadomości do klientów (ważne dla stagingu)
- `communications/services/send.py`: `send_repair_submission_confirmation`, `send_guest_repair_confirmation`, `send_template_to_repair`, `send_quote_summary_email_to_client`, `send_repair_completion_thank_you_email`, `send_freeform_email_to_repair_client` + zadania z A3.
- Konta: weryfikacja e-maila, reset hasła (`accounts`).
- `send_sms` to atrapa (nic nie wysyła).
- **Wniosek dla stagingu:** baza po anonimizacji (`scripts/vps/anonimizuj.sql`), **bez `celery` i `celery-beat`**, `STAFF_NOTIFICATION_EMAILS` puste, SMTP najlepiej wyłączone (brak `EMAIL_HOST_USER`/`PASSWORD` → konsola). Ale uwaga: `.delay()` bez Redisa wiesza zgłoszenie, więc staging potrzebuje Redisa nawet bez workera.

### A5. Domena (z ustaleń Krystiana, 14.11.2026)
- Rejestrator i strefa DNS `prokomserwis.pl`: **cyber_Folks** (Krystian ma dostęp do panelu).
- Plan (prompt TM+): strefa i rejestracja → Seohost (`dns1/dns2.microhost.pl`), skrzynka `kontakt@prokomserwis.pl` na Seohost SH 1. Stan „przed” każdą zmianą: `docs/tech/DNS-PROKOMSERWIS.md` (powstanie w TM+).

## B. Wyniki z Hetznera i DNS (uzupełnia Krystian)
| Pozycja | Wynik |
|---|---|
| System, `docker compose ls`, `docker ps` | TODO(krystian) |
| Wolumeny i rozmiary (`postgres_data`, `mediafiles`, `staticfiles`, `certbot_certs`) | TODO(krystian) |
| Wersja Postgresa, `pg_database_size`, liczba zgłoszeń / klientów | TODO(krystian) |
| Zadania `django_celery_beat` (nazwa, zadanie, harmonogram, włączone) | TODO(krystian) |
| Klucze ustawione w `.env.prod` (same nazwy) | TODO(krystian) |
| crontab (root i użytkownik), timery systemd | TODO(krystian) |
| Inne usługi na serwerze (porty, kontenery spoza stosu) | TODO(krystian) |
| Zasoby: `free -h`, `df -h`, `nproc` | TODO(krystian) |
| DNS: NS, A, AAAA, MX, TXT, CAA dla `@` i `www` (2 resolwery) | TODO(krystian) |
| Konta `@prokom.local` na produkcji: hasła zmienione 14.11.2026 | ✔ (Krystian) |

## C. Komendy do uruchomienia (Krystian)
Wklejasz wynik w czacie sesji. **Nie wklejaj wartości z `.env.prod` ani haseł** — komendy niżej wypisują tylko nazwy kluczy.

### C1. Hetzner (SSH), w katalogu projektu
```bash
uname -a; cat /etc/os-release | head -2; nproc; free -h; df -h /
docker compose ls; docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker system df -v | sed -n '/VOLUME NAME/,/^$/p'
```
```bash
cut -d= -f1 .env.prod | grep -v '^#' | grep -v '^$' | sort
```
```bash
docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "select version();" -c "select pg_size_pretty(pg_database_size(current_database()));" -c "select count(*) from repairs_repairrequest;" -c "select count(*) from clients_client;"'
```
```bash
docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select t.name, t.task, t.enabled, c.minute, c.hour, c.day_of_week, i.every, i.period, t.last_run_at from django_celery_beat_periodictask t left join django_celery_beat_crontabschedule c on c.id=t.crontab_id left join django_celery_beat_intervalschedule i on i.id=t.interval_id order by t.name;"'
```
```bash
crontab -l; sudo crontab -l; systemctl list-timers --no-pager | head -20
sudo ss -tlnp | grep -v '127.0.0.53'
```

### C2. DNS (PowerShell u Ciebie)
```powershell
foreach ($srv in "1.1.1.1","8.8.8.8") { foreach ($n in "prokomserwis.pl","www.prokomserwis.pl") { foreach ($t in "NS","A","AAAA","MX","TXT","CAA") { Resolve-DnsName $n -Type $t -Server $srv -ErrorAction SilentlyContinue | Format-Table -AutoSize } } }
```
Do tego z panelu cyber_Folks: pełna lista rekordów strefy z TTL, data wygaśnięcia domeny i abonent (TM+ etap A1).
