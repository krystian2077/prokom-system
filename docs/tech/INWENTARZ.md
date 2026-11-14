# Inwentarz przed migracją (MIGRACJA-VPS §2) — T0, 14.11.2026

Część A pochodzi z repo (sprawdzona w T0). Część B — wyniki komend z części C, zebrane 14.11.2026 (**bez haseł i wartości z `.env`**).

## A. Z repo

### A1. Stos produkcyjny (`docker-compose.prod.yml`)
| Usługa | Obraz / build | Uwagi |
|---|---|---|
| `db` | `postgres:16-alpine` | wolumen `postgres_data` |
| `redis` | `redis:7-alpine`, `--requirepass` | wolumen `redis_data`; **wymagany** — bez niego formularz zgłoszenia wisi (`LOKALNIE.md`) |
| `backend` | build `backend/` (gunicorn) | `staticfiles`, `mediafiles` |
| `celery` | ten sam obraz, `worker --concurrency=2` | |
| `celery-beat` | ten sam obraz, `DatabaseScheduler` | harmonogram **w bazie** (`django_celery_beat`), nie w kodzie |
| `frontend` | build `frontend/` (Next 14) | `NEXT_PUBLIC_*` jako build args; build przechodzi od commita `85b96bf` (obejście kroju Unbounded: `frontend/scripts/patch-next-font.js` jako `prebuild`) |
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
| `REDIS_URL`, `REDIS_PASSWORD`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | **serwer** | `base.py` ma domyślnie `redis://localhost:6379/0`, ale `prod.py` nadpisuje `CELERY_*` wartością z `REDIS_URL` — na produkcji `CELERY_*` nieustawione i to działa (B) |
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

## B. Wyniki z Hetznera i DNS (zebrane 14.11.2026, ok. 14:10 UTC)
Zebrane komendami z części C (tylko odczyt) przez `ssh root@62.238.0.240`; DNS z 1.1.1.1 i 8.8.8.8 (CAA przez DoH Cloudflare i Google).

| Pozycja | Wynik |
|---|---|
| System, `docker compose ls`, `docker ps` | Ubuntu 24.04.4 LTS, kernel 6.8.0-110, hostname `prokomserwis`, IPv4 `62.238.0.240`, IPv6 `2a01:4f9:c015:3d91::1`. Jeden projekt compose: `app` (`/app/docker-compose.prod.yml`), 8 kontenerów `Up 2 months`: frontend, backend, celery, celery-beat, db (healthy), redis (healthy), nginx (80/443 na v4 i v6), certbot. Kod w `/app` = commit `50f926c` (19.08.2026), bez zmian lokalnych poza `.env.prod.bak-20260819-201109`. |
| Wolumeny i rozmiary | `app_postgres_data` 73,8 MB · `app_staticfiles` 3,5 MB · `app_certbot_certs` 32 kB · `app_redis_data` 423 B · **`app_mediafiles` 0 B** · `app_certbot_www` 0 B · anonimowy wolumen certbota 0 B |
| Wersja Postgresa, `pg_database_size`, liczba zgłoszeń / klientów | PostgreSQL 16.13 (Alpine) · baza **16 MB** · `repairs_repairrequest`: **3** (ostatnie 20.10.2026) · `clients_client`: **8** · `compliance_backuplog`: **0** |
| Zadania `django_celery_beat` | **Tylko 1:** `celery.backend_cleanup` — crontab `0 4 * * *`, włączone, ostatnio 14.11.2026 03:00 UTC. **Brak** `send_smart_reminders`, `run_backup`, `build_employee_stats_snapshots`. Worker połączony z `redis://redis:6379/0`. |
| Klucze ustawione w `.env.prod` (same nazwy) | `ALLOWED_HOSTS`, `DATABASE_URL`, `DEFAULT_FROM_EMAIL`, `DJANGO_SETTINGS_MODULE`, `EMAIL_HOST`, `EMAIL_HOST_PASSWORD`, `EMAIL_HOST_USER`, `EMAIL_PORT`, `FRONTEND_BASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_SITE_URL`, `PARCEL_LOCKER_ADDRESS`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `POSTGRES_USER`, `REDIS_PASSWORD`, `REDIS_URL`, `SECRET_KEY`, `SERWIS_PRINT_*` (7: ADDRESS, COMPANY_NAME, EMAIL, HOURS, PHONE, TAGLINE, WEBSITE), `STAFF_NOTIFICATION_EMAILS` — razem 29. **Nieustawione:** `DEBUG`, `CELERY_*` (prod.py bierze je z `REDIS_URL` — OK), `EMAIL_TIMEOUT`, `EMAIL_INBOUND_WEBHOOK_SECRET`, `INBOUND_IMAP_*`, `RENDER_EXTERNAL_HOSTNAME`, `DJANGO_ENV`, `SEED_EMAIL_DOMAIN`. Uprawnienia `.env.prod` i `.bak`: **644**. |
| crontab (root i użytkownicy), timery systemd | Brak crontabów (root i pozostali). `/etc/cron.d`: tylko systemowe (`e2scrub_all`, `sysstat`). Timery: wyłącznie systemowe (apt, logrotate, sysstat, fstrim, man-db…). **Brak odnowienia certyfikatu i kopii poza kontenerami.** |
| Inne usługi na serwerze (porty, kontenery spoza stosu) | Nasłuch: 22 (sshd), 80/443 (docker-proxy → nginx), 53 lokalnie (systemd-resolved). **Nic poza stosem `app`** — po migracji serwer można wyłączyć. |
| Zasoby: `free -h`, `df -h`, `nproc` | 2 vCPU · RAM 3,7 GiB (użyte 1,6 GiB, dostępne 2,1 GiB), **bez swapu** · dysk 38 GB, zajęte 13 GB (35%). `docker stats`: backend 438 MiB, celery 175, frontend 168, beat 89, db 33, nginx 8, certbot 7, redis 4 (razem ok. 920 MiB). |
| DNS: NS, A, AAAA, MX, TXT, CAA dla `@` i `www` (2 resolwery) | Oba resolwery zgodne. NS: `dns1/dns2/dns3.tld.pl` (TTL 3600). SOA: `dns1.tld.pl`, serial `2026111201`, TTL domyślny 3600. A `@` i `www`: `62.238.0.240` (TTL 3600; `www` to rekord A, nie CNAME). **AAAA: brak** (choć serwer ma IPv6). **MX: brak.** TXT `@`: `google-site-verification=8vUskG…` oraz 64-znakowy hash `8ece6fb5…` (pochodzenie do ustalenia). **CAA: brak.** |
| Certyfikat TLS | Let's Encrypt (YE1), SAN `prokomserwis.pl`, `www.prokomserwis.pl`, ważny do **17.01.2027** |
| Konta `@prokom.local` na produkcji: hasła zmienione 14.11.2026 | ✔ (Krystian) |

### B1. Wnioski z T0 (do MIGRACJA-VPS)
1. **Dane są małe** (16 MB bazy, 0 B mediów, 3 zgłoszenia) — zrzut i odtworzenie to minuty; okno przerwy można skrócić. Media 0 B: potwierdzić, że załączniki rzeczywiście nie trafiają gdzie indziej (np. do obrazu/ścieżki poza wolumenem). TODO(krystian): czy 3 zgłoszenia i 8 klientów to dane prawdziwe, czy testowe? Jeśli testowe — rozważyć start VPS na czystej bazie.
2. **Nie ma żadnych kopii zapasowych** (0 wpisów `BackupLog`, `run_backup` niezaplanowane, brak crona) — poza ewentualnymi snapshotami Hetznera. Przed migracją ręczny `pg_dump`; na VPS ustawić kopie od pierwszego dnia.
3. **Przypomnienia do klientów nie działają** (`send_smart_reminders` niezaplanowane). Na VPS zachować ten stan (ten sam zrzut bazy przeniesie harmonogram 1:1); włączenie to osobna decyzja biznesowa.
4. **Brak AAAA i MX** — w kroku DNS migracji nie ma czego usuwać/przywracać; poczta `@prokomserwis.pl` dziś nie istnieje (zgodne z planem TM+ — Seohost). TXT zostawić bez zmian.
5. **Limity pamięci** z MIGRACJA-VPS (§ `mem_limit`) mają zapas wobec pomiaru: backend 438/768, celery 175/384, beat 89/192, frontend 168/384, db 33/512.
6. **Certyfikat ważny do 17.01.2027**, więc kopiowanie go na czas przełączenia (MIGRACJA §8, krok 7) jest wykonalne.
7. **Bezpieczeństwo starego serwera:** `.env.prod` i `.env.prod.bak-*` mają 644 (czytelne dla każdego użytkownika), logowanie SSH jako root. Do czasu wyłączenia: `chmod 600`; na VPS od razu 600 i bez roota.
8. Pozostałości w `.env.prod.example`/A2 (`RENDER_EXTERNAL_HOSTNAME`, `DJANGO_ENV`, `SEED_EMAIL_DOMAIN`, `INBOUND_*`) nie są ustawione na produkcji — na VPS ich nie przenosimy.

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
