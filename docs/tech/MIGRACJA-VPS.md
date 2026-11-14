# Runbook: przenosiny prokomserwis.pl z Hetznera na VPS webh.pl (sesja TM)

Wersja 1.0 · 14.11.2026. Wykonuje Krystian z Claude Code. **Każdy krok na serwerze, w DNS i w bazie tylko po wyraźnym „tak” Krystiana w sesji.**

## 0. Zasada: 1:1, jedna zmiana naraz
- Przenosimy **ten sam commit** (stan `master`), te same wersje: PostgreSQL 16, Redis 7, Python 3.12, Node jak w obecnym `frontend/Dockerfile`. Zero zmian w kodzie aplikacji. Zmienia się tylko miejsce i sposób uruchomienia: obrazy z GitHub Actions, wspólny Nginx, kopie.
- Nowy wygląd (TD1+) wchodzi dopiero po udanej migracji. Gdy coś padnie, od razu wiadomo, że to serwer, a nie frontend.
- Okno przełączenia: **niedziela wieczorem** (serwis zamknięty, poniedziałek od 9:00 pracuje). Proponowany termin: **29.11.2026**, zapasowy 6.12. Nie 22.11: to pierwsza niedziela po starcie Gaming (20.11), na wspólnym Nginx i serwerze nie robimy dwóch dużych rzeczy w jednym tygodniu.

## 1. Warunki wejścia (blokery — bez nich nie zaczynamy przełączenia)
1. Gaming działa stabilnie na tym samym VPS co najmniej 5 dni (wspólny Nginx bez incydentów).
2. **Dostęp do DNS domeny prokomserwis.pl** — ✔ od 14.11.2026 strefa w **Seohost** (`dns1/dns2.microhost.pl`, TM+ etap A), rejestracja: transfer z cyber_Folks do Seohost (TM+ A5). Poczty (MX) nie ma. Stan i dziennik zmian: `docs/tech/DNS-PROKOMSERWIS.md`.
3. Kopie zapasowe działają: ten sam cel `rclone` co prokom-web (runbook prokom-web §1.8/§7), **test odtworzenia** bazy Tech na stagingu zrobiony.
4. Staging `staging.prokomserwis.pl` przeszedł próbę generalną (§7) na kopii bazy z produkcji.
5. Wolne zasoby VPS po Gaming: `free -h` i `df -h`. Potrzeba ok. 2,5 GB RAM (prod + staging, §4) i ok. 5 GB dysku plus rozmiar mediów razy trzy (wolumen, kopia lokalna, zapas).
6. Krystian ma dostęp SSH do Hetznera i do VPS, a w menedżerze haseł: `.env.prod` z Hetznera, hasło aplikacji Gmail (SMTP), Google OAuth.

## 2. Inwentaryzacja (robi T0, wynik w `docs/tech/INWENTARZ.md` bez wartości sekretów)
- Serwer Hetzner: system, `docker ps`, `docker compose ls`, wolumeny i rozmiary (`postgres_data`, `mediafiles`, `staticfiles`, `certbot_certs`), crontab (kopie? odnowienia?), inne usługi na serwerze (np. panel ofert smartfonów — **przed wyłączeniem Hetznera nic innego nie może tam działać**).
- Baza: rozmiar (`pg_database_size`), liczba zgłoszeń i klientów, wersja serwera.
- Zadania okresowe Celery beat (`django_celery_beat` w bazie: nazwy, harmonogram, czy wysyłają maile lub SMS do klientów).
- `.env.prod`: lista kluczy (bez wartości) i które zależą od domeny lub serwera (`ALLOWED_HOSTS`, `FRONTEND_BASE_URL`, `NEXT_PUBLIC_*`, `DATABASE_URL`, `REDIS_URL`, `EMAIL_*`, `STAFF_NOTIFICATION_EMAILS`, `GOOGLE_*`).
- DNS prokomserwis.pl: ✔ T0/TM+ (`INWENTARZ.md` §B, `DNS-PROKOMSERWIS.md`): A `@` i `www` → `62.238.0.240`, 2× TXT, **brak AAAA, MX i CAA**, DNSSEC wyłączony. Strefa od 14.11 w Seohost — wszystkie zmiany DNS migracji robimy tam.
- Poczta: czy `@prokomserwis.pl` ma skrzynki (MX). **MX, SPF, DKIM i DMARC nie ruszamy przy migracji.** Maile aplikacji idą dziś przez Gmail SMTP (`EMAIL_HOST`). To nie zależy od serwera i zostaje bez zmian.
- Google OAuth: dozwolone adresy w Google Cloud Console (`https://prokomserwis.pl`). Domena się nie zmienia, więc logowanie Google działa po przenosinach. Na stagingu nie zadziała, chyba że Krystian doda adres stagingu (opcjonalne).

## 3. Co się nie zmienia (świadomie)
Domena i adresy, baza (te same dane), maile (Gmail SMTP), logowanie Google, panele, API, zadania Celery, PDF-y. E-mail `kontakt@prokomserwis.pl` (SH 1 w Seohost) to **osobny krok po migracji**: zmiana MX może odciąć obecne skrzynki, więc najpierw inwentaryzacja poczty i decyzja Krystiana.

## 4. Architektura na VPS
```
/srv/prokom/prokom-tech/            (pliki z `git archive` — deploy keys w organizacji wyłączone; repo jest na koncie krystian2077, metoda jak w prokom-web)
  compose.vps.yml                   (wspólny opis usług)
  compose.prod.yml / compose.staging.yml (nadpisania środowisk)
  gateway/nginx.conf                (wewnętrzny router stosu)
  .env.prod / .env.staging          (chmod 600, właściciel root, poza gitem)
  scripts/vps/{deploy,backup,restore,anonimizuj,smoke}.sh
```
- **Dwa stosy (nazwy projektów compose):** `prokom-tech-prod` i `prokom-tech-staging`, obok `prokom-web-*` i `prokom-gaming-*`.
- **Usługi produkcji:** `db` (postgres:16-alpine), `redis` (redis:7-alpine z hasłem), `backend` (gunicorn), `celery`, `celery-beat`, `frontend` (Next standalone), `gateway` (nginx:alpine).
- **Usługi stagingu:** `db`, `redis`, `backend`, `frontend`, `gateway`. **Bez `celery` i `celery-beat`**, żeby żadne zadanie okresowe nie wysłało maila do klienta z kopii bazy.
- **`gateway` to wewnętrzny router stosu (bez TLS, port tylko na `127.0.0.1`: prod 3300, staging 3301 — dla smoke testu):** `/static/` i `/media/` z wolumenów, `/api/` i `/admin/` → `backend:8000`, reszta → `frontend:3000`, `client_max_body_size 20M`. Przenosi reguły z dzisiejszego `nginx/default.conf` bez części TLS (`gateway/nginx.conf`). Dzięki temu wspólny Nginx prokom-web ma dla Tech jeden prosty upstream, a routing Tech zostaje w repo Tech. `www` nie jest dziś przekierowywane (Hetzner obsługuje obie nazwy tak samo) — zostaje tak (1:1).
- **Krytyczne:** `gateway` przekazuje dalej nagłówek `X-Forwarded-Proto` **od wspólnego Nginx** (`proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;`), a nie `$scheme`, bo wewnątrz jest `http`. Django ma `SECURE_SSL_REDIRECT = True` i `SECURE_PROXY_SSL_HEADER`, więc bez tego strona wpadnie w pętlę przekierowań. Tak samo `Host` i `X-Forwarded-For`.
- **Sieci:** każdy stos ma własną sieć wewnętrzną. Do zewnętrznej sieci `prokom-proxy` (wspólny Nginx) podłączony jest **tylko** `gateway`. Wspólny Nginx łączy się po **nazwie kontenera** (`prokom-tech-prod-gateway-1:80`, `prokom-tech-staging-gateway-1:80`, zmienna upstream + `resolver 127.0.0.11`), bez aliasów — tak jak Gaming G16. Baza i Redis nie mają portów na hoście.
- **Limity pamięci (`deploy.resources.limits.memory`, konwencja VPS):** prod: db 512m, redis 128m, backend 768m, celery 384m, celery-beat 192m, frontend 384m, gateway 64m (razem ok. 2,4 GB). Staging: db 384m, redis 96m, backend 512m, frontend 320m, gateway 64m. Pomiar na Hetznerze (T0, `INWENTARZ.md` B1.5) mieści się z zapasem; VPS ma 16 GB RAM i 4 GB swap.
- **Gunicorn bez zmiany kodu:** `gunicorn.conf.py` liczy procesy z rdzeni (`cpu_count()*2+1` = 9 na VPS 4 vCPU). Nadpisujemy zmienną środowiskową `GUNICORN_CMD_ARGS="--workers=3 --threads=2"` (prod) i `--workers=2` (staging). Gunicorn stawia ją wyżej niż plik konfiguracyjny. TM sprawdza w logach startu, że działa (liczba „Booting worker”).
- **Obrazy z GitHub Actions do GHCR** (zasada projektu: nie budujemy na serwerze): `ghcr.io/krystian2077/prokom-tech-backend:<sha>`, `…/prokom-tech-frontend:<sha>` (prod) i `…/prokom-tech-frontend-staging:<sha>`. Frontend jest osobny dla każdego środowiska, bo `NEXT_PUBLIC_API_URL` i `NEXT_PUBLIC_SITE_URL` wchodzą do obrazu przy budowie. Workflow `.github/workflows/obrazy.yml`: push do `develop` buduje backend i frontend-staging, push do `master` buduje backend i frontend prod. Paczki prywatne. Serwer loguje się do GHCR tokenem tylko do odczytu (`read:packages`), zapisanym w pliku z uprawnieniami 600.
- **Wdrożenie:** `scripts/vps/deploy.sh <prod|staging> <sha>` uruchamiany przez Krystiana po SSH (decyzja 14.11: ręcznie; bramka i automatyczny staging jak w Gaming — później): (prod) kopia `predeploy` → `pull` obrazów `<sha>` → `migrate` (na prod po kopii i potwierdzeniu `MIGRUJ`) → `collectstatic` → `up -d --wait` → smoke. Cofnięcie = automatycznie, gdy nie było migracji, albo `deploy.sh prod <poprzedni-sha>`. Lock i log wspólne z prokom-web i Gaming (`/srv/prokom/.deploy.lock`, `deploys.log`). Kopie: `age` + `rclone` do `offsite:prokom-backups-r7k2/tech-<stack>/`. Szczegóły: `docs/tech/WDROZENIE.md`.
- **Wspólny Nginx (PR w prokom-web, wzór jak Gaming G16):** hosty `prokomserwis.pl` i `www.prokomserwis.pl` → `http://prokom-tech-prod-gateway`, `staging.prokomserwis.pl` → staging (hasło, `X-Robots-Tag: noindex`), `client_max_body_size 20M`, nagłówki `X-Forwarded-*`, certyfikat (§8, krok 7). `www` → 301 na wersję bez `www` (tak jak dziś, jeśli dziś tak jest — sprawdź).

## 5. Zmienne środowiskowe
Klucze jak w `.env.prod.example`. Różnice między środowiskami:

| Klucz | prod | staging |
|---|---|---|
| `ALLOWED_HOSTS` | `prokomserwis.pl,www.prokomserwis.pl` | `staging.prokomserwis.pl` |
| `FRONTEND_BASE_URL`, `NEXT_PUBLIC_SITE_URL` | `https://prokomserwis.pl` | `https://staging.prokomserwis.pl` |
| `NEXT_PUBLIC_API_URL` | `https://prokomserwis.pl` | `https://staging.prokomserwis.pl` (ta sama domena, więc CORS nie przeszkadza) |
| `DATABASE_URL`, `REDIS_URL` | host `db` / `redis` w stosie prod | host `db` / `redis` w stosie staging (osobne hasła) |
| `STAFF_NOTIFICATION_EMAILS` | jak dziś | **tylko adres Krystiana** |
| `EMAIL_*` | jak dziś (Gmail) | jak dziś. Bezpieczne dzięki anonimizacji (§6) i braku Celery |
| `GUNICORN_CMD_ARGS` | `--workers=3 --threads=2` | `--workers=2 --threads=2` |
| `NEXT_PUBLIC_TECH_DRAFT` | brak | `1` (od TD1: pokazuje punkty `published:false` z ramką) |

## 6. Staging na danych z produkcji — anonimizacja (RODO i bezpieczeństwo maili)
- Kopia bazy z produkcji trafia na staging **tylko po anonimizacji** skryptem `scripts/vps/anonimizuj.sql` (tworzy T0 po przejrzeniu modeli, bez zmian w backendzie). Skrypt zamienia:
  - e-maile klientów na `klient-<id>@example.test` (domena zarezerwowana, maile nigdzie nie dojdą),
  - telefony na `500` + 6 cyfr z id (format przechodzi walidację),
  - nazwiska i adresy na wartości zastępcze,
  - tokeny przypisania i resetu na puste.
  Pracowników zostawiamy (logowanie do panelu stagingu), ale `STAFF_NOTIFICATION_EMAILS` idzie tylko do Krystiana.
- Po anonimizacji test: `SELECT count(*) FROM <tabela klientów> WHERE email NOT LIKE '%@example.test'` = 0 (i analogicznie w innych tabelach z danymi kontaktowymi znalezionych w T0). Inaczej staging nie rusza.
- Staging za hasłem (basic auth we wspólnym Nginx), `noindex`, bez Celery.

## 7. Próba generalna na stagingu (TM, przed przełączeniem)
1. Na Hetznerze `pg_dump -Fc` (bez zatrzymywania produkcji) i `tar` wolumenu mediów → kopia na komputer Krystiana → VPS. Na serwerze nie zostawiamy plików z danymi poza wolumenami i katalogiem kopii (uprawnienia 600).
2. Odtworzenie do stosu staging → `anonimizuj.sql` → kontrola z §6 → start.
3. Smoke `scripts/vps/smoke.sh staging`: strona główna 200, `/api/v1/` 200/401 zgodnie z dziś, `/admin/` 302, statyczne pliki Django 200, media 200, `/zgloszenie` wysyła zgłoszenie testowe (numer naprawy wraca), `/track` z tym numerem pokazuje status, logowanie do `/panel`, lista napraw w panelu, PDF protokołu przyjęcia się generuje, upload zdjęcia w panelu działa (limit 20 MB).
4. Pomiar: `docker stats` w czasie testów, czas odpowiedzi strony głównej i `/api/`, limity pamięci bez restartów (`docker inspect … RestartCount`).
5. Test odtworzenia kopii: `backup.sh staging` → `restore.sh` do świeżej bazy → liczba zgłoszeń się zgadza.
Wynik: tabela „krok → wynik → dowód” w opisie PR TM i w `docs/STAN.md`.

## 8. Przełączenie — niedziela (lista do odhaczania)
**T−48 h:** TTL rekordów A dla `@` i `www` na 300 s **w strefie Seohost** (AAAA nie ma). Komunikat dla serwisu: „W niedzielę wieczorem przerwa techniczna strony i panelu, w poniedziałek od rana wszystko działa”.
**T−0 (np. 18:00):**
1. Stary serwer: strona techniczna 503 dla całego ruchu (tymczasowa konfiguracja Nginx na Hetznerze z prostą stroną „Przerwa techniczna, wracamy wkrótce. Pilne: 883 200 151”). Od tej chwili nie powstają nowe dane.
2. Stary serwer: `docker compose --env-file .env.prod -f docker-compose.prod.yml stop celery celery-beat backend frontend` (baza zostaje uruchomiona do zrzutu). **Na Hetznerze zawsze z `--env-file .env.prod`** — bez tego compose podstawia puste hasła i odtwarza `db`/`redis` (incydent 14.11.2026, 12 min bez API).
3. Zrzut końcowy: `pg_dump -Fc` + `tar` mediów → sumy kontrolne (`sha256sum`) → przeniesienie na VPS → porównanie sum.
4. VPS: odtworzenie do **pustej** bazy stosu prod (bez anonimizacji), media do wolumenu, start stosu prod z `<sha>` = commit z Hetznera. `migrate` nie powinien mieć nic do zrobienia (ten sam commit). Jeśli ma — **stop i decyzja**.
5. Test przed DNS: `curl --resolve prokomserwis.pl:443:194.28.50.70 …` i plik `hosts` na komputerze Krystiana: strona, logowanie do panelu, lista napraw, szczegóły naprawy z załącznikami, PDF, panel admina, konto klienta.
6. Zgłoszenie testowe przez stronę → widoczne w panelu → oznaczyć jako testowe i anulować (procedura z panelu, bez kasowania w bazie).
7. Certyfikat: na czas przełączenia skopiuj ważny certyfikat z Hetznera (`certbot_certs`) do magazynu certyfikatów wspólnego Nginx (zgodnie z runbookiem prokom-web). Po propagacji DNS wystaw nowy certyfikat przez certbot prokom-web (`--expand` albo osobny, wg runbooka) i przełącz Nginx na niego. Bez tego HTTP-01 nie zadziała przed zmianą DNS.
8. DNS **w strefie Seohost**: A `@` i `www` → `194.28.50.70`. AAAA nie ma (sprawdzone w T0) — nic do usuwania. TXT i pozostałe bez zmian. Wpis „przed/po” w `DNS-PROKOMSERWIS.md`.
9. Kontrola przez 1–2 h: `dig` z kilku resolverów (1.1.1.1, 8.8.8.8), test z telefonu w sieci komórkowej, logi `gateway`, `backend` i `celery` (beat uruchomiony, zadania przechodzą), certyfikat, maile (np. reset hasła testowego konta).
10. Kopia zaraz po przełączeniu (`scripts/vps/backup.sh prod`) i włączenie crona kopii (`WDROZENIE.md` §5: prod 03:45 UTC, dzienne 14 dni + miesięczne 93 dni, cel `offsite:prokom-backups-r7k2/tech-prod/`) oraz monitora dostępności i heartbeatu kopii w Better Stack.
**Poniedziałek 8:30:** Krystian sprawdza z serwisem: logowanie, nowe zgłoszenie, zmiana statusu, wydruk, mail do klienta.

## 9. Powrót (gdy coś nie działa i nie da się naprawić w 30 minut)
1. DNS z powrotem na IP Hetznera (TTL 300 s, więc szybko) i przywrócenie AAAA, jeśli był.
2. Na Hetznerze: zdjęcie strony 503, `docker compose --env-file .env.prod -f docker-compose.prod.yml start backend frontend celery celery-beat`, potem **`docker compose --env-file .env.prod -f docker-compose.prod.yml exec nginx nginx -s reload`** — Nginx Hetznera pamięta IP kontenerów z chwili startu; po starcie/odtworzeniu backendu bez przeładowania zwraca 502 (incydent 14.11.2026). Sprawdzenie: `curl -s -o /dev/null -w '%{http_code}' https://prokomserwis.pl/api/v1/repairs/track/` = 400.
3. Dane, które powstały na VPS po przełączeniu (zwykle zero w niedzielę wieczorem), trzeba przenieść ręcznie. Lista z logów i panelu.
4. Wpis w STAN: co zawiodło. Nowy termin.

## 10. Po migracji
- Hetzner: serwer **zatrzymany, nieusunięty przez 14 dni**, kopie Hetznera zostają. Po 14 dniach: ostatni zrzut do archiwum (zaszyfrowany, 2 miejsca) → usunięcie serwera i wyłączenie płatności. Wcześniej sprawdzić, że nic innego tam nie działa (§2).
- Polityka prywatności: hosting w Polsce (webh.pl, Łódź) zamiast Hetzner (Helsinki) — w TD5 albo osobnym małym PR od razu po migracji.
- Search Console: kontrola błędów indeksowania po tygodniu.
- `docs/STAN.md`, Asana (zadanie migracji odhaczone), 00-STAN w czacie projektu.
- Stary `docker-compose.prod.yml` i katalog `nginx/` zostają w repo do końca okresu powrotu, potem PR je usuwa (opis nowego sposobu w `docs/tech/WDROZENIE.md`).
