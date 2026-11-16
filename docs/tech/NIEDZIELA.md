# Przełączenie prokomserwis.pl na VPS — ściągawka na niedzielę 29.11.2026

Kolejność z `MIGRACJA-VPS.md` §8 i runbooka prokom-web §9.2, z gotowymi komendami. **Jedna komenda naraz**, po każdej porównaj z „oczekiwane”. Przy każdym kroku jest terminal:

- **[Hetzner]** `ssh root@62.238.0.240`, katalog `/app`. **Każde `docker compose` z `--env-file .env.prod`** (incydent 14.11).
- **[Komputer]** lokalny PowerShell.
- **[VPS-tech]** `ssh prokom-vps`, katalog `/srv/prokom/prokom-tech`.
- **[VPS-web]** `ssh prokom-vps`, katalog `/srv/prokom/prokom-web` (wspólny Nginx).
- **[Seohost]** panel klienta, DNS → Strefy DNS → `prokomserwis.pl`.

Skróty (wkleić raz na początku sesji w danym terminalu):
```bash
# [Hetzner]
hz="docker compose --env-file .env.prod -f docker-compose.prod.yml"
# [VPS-tech]
prod="docker compose --env-file .env.prod -f compose.vps.yml -f compose.prod.yml"
```

Stan wejściowy (sprawdzony 14.11): stos `prokom-tech-prod` na VPS działa na pustej bazie z `61f8f54` (`master`; kod = Hetzner `50f926c` + poprawka budowania `patch-next-font.js`), smoke prod ok. Vhost `tech-prod` czeka w prokom-web, `TECH_PROD_HOST=prokomserwis.pl` w `.env.proxy`. Warunek stop: coś nie działa po 30 minutach → **§ Powrót** na dole.

## Piątek 27.11, ok. 18:00 (T−48 h)
1. **[Seohost]** TTL rekordów A `@` i `www` (`62.238.0.240`) z 3600 na **300**. Nic więcej nie zmieniamy. Wpis w `DNS-PROKOMSERWIS.md` (dziennik).
2. **[Komputer]** sprawdzenie (po kilku minutach): `Resolve-DnsName prokomserwis.pl -Type A -Server dns1.microhost.pl -DnsOnly | ft Name,TTL,IPAddress` — TTL 300.
3. Komunikat dla serwisu: „W niedzielę wieczorem przerwa techniczna strony i panelu, w poniedziałek od rana wszystko działa”.

## Niedziela, T−0 (np. 18:00)

### A. Stary serwer stop (nowe dane przestają powstawać)
1. **[Komputer]** strona 503 na Hetzner (z katalogu repo):
   `scp scripts/vps/strona-503/default.conf root@62.238.0.240:/app/eksport/strona-503.conf`
2. **[Hetzner]**
   ```bash
   cd /app && cp nginx/default.conf nginx/default.conf.przed-migracja && cp eksport/strona-503.conf nginx/default.conf && $hz exec nginx nginx -t && $hz exec nginx nginx -s reload
   ```
   Oczekiwane: `test is successful`; `https://prokomserwis.pl/` w przeglądarce → „Przerwa techniczna”.
3. **[Hetzner]** `$hz stop celery celery-beat backend frontend && $hz ps` — działają tylko `db`, `redis`, `nginx` (baza zostaje do zrzutu).

### B. Zrzut końcowy i przeniesienie
4. **[Hetzner]** `cd /app && bash eksport-hetzner.sh prokom_tech_prod` — oczekiwane: `written …/prokom-tech-import-<UTC>.tar`, `repairs=<N>`, sha256. Zapisz N i pierwsze 8 znaków sumy.
5. **[Komputer]** `scp root@62.238.0.240:/app/eksport/prokom-tech-import-<UTC>.tar D:\PRO-KOM\kopie\` → `(Get-FileHash D:\PRO-KOM\kopie\prokom-tech-import-<UTC>.tar).Hash.ToLower()` = suma z kroku 4.
6. **[Komputer]** `scp D:\PRO-KOM\kopie\prokom-tech-import-<UTC>.tar prokom-vps:/srv/prokom/import/`
7. **[VPS-tech]** `chmod 600 ../import/*.tar && sha256sum ../import/prokom-tech-import-<UTC>.tar` = ta sama suma.

### C. Dane do stosu prod na VPS
8. **[VPS-tech]** `RESTORE_CONFIRM=prokom-tech-prod scripts/vps/restore.sh ../import/prokom-tech-import-<UTC>.tar prokom-tech-prod prokom_tech_prod`
   Oczekiwane: manifest z `database=prokom_tech_prod`, `repairs in the restored database: <N>` (= krok 4), `done — started again`. **Bez anonimizacji** (to produkcja).
9. **[VPS-tech]** migracje: `$prod run --rm --no-deps -T backend python manage.py showmigrations --plan | grep '\[ \]' || echo "brak oczekujących"` — oczekiwane: `brak oczekujących`. Coś oczekuje → **stop i decyzja** (nie migrujemy w ciemno).
10. **[VPS-tech]** `scripts/vps/smoke.sh prod` — `all ok` (przez `127.0.0.1:3300`, nagłówek `prokomserwis.pl`). Zgłoszenia testowego skrypt na prod nie wysyła.
11. **[VPS-tech]** `shred -u ../import/prokom-tech-import-<UTC>.tar` (kopia zostaje w `D:\PRO-KOM\kopie` i na Hetznerze).

> Test w przeglądarce przed DNS (MIGRACJA §8 pkt 5) nie wyjdzie: certyfikatu `prokomserwis.pl` na VPS jeszcze nie ma, a Django przekierowuje na HTTPS. Smoke z kroku 10 sprawdza to samo przez `gateway`; ręczne testy robimy po kroku 15, wciąż w oknie przerwy (Hetzner pokazuje 503, więc nikt nie pracuje na dwóch serwerach).

### D. DNS, certyfikat, Nginx
12. **[Seohost]** A `@` i `www` → **`194.28.50.70`** (TTL zostaje 300). Wpis w `DNS-PROKOMSERWIS.md`: przed `62.238.0.240`, po `194.28.50.70`.
13. **[VPS-web]** czekaj, aż wszystkie podają VPS:
    ```bash
    for s in dns1.microhost.pl 1.1.1.1 8.8.8.8; do dig +short @$s prokomserwis.pl A; dig +short @$s www.prokomserwis.pl A; done
    ```
14. **[VPS-web]** certyfikat `prokom-tech-prod` — runbook prokom-web §0 „Nowy certyfikat bez zatrzymywania Nginx” z `<domeny>` = `prokomserwis.pl www.prokomserwis.pl` i `--cert-name prokom-tech-prod -d prokomserwis.pl -d www.prokomserwis.pl`: **najpierw `--dry-run`**, po zielonym to samo bez `--dry-run`, potem usunięcie tymczasowego bloku. Błąd dry-runu = DNS jeszcze nie dotarł do Let's Encrypt → odczekaj kilka minut, powtórz dry-run (limit: 5 nieudanych prawdziwych walidacji na godzinę).
15. **[VPS-web]** Nginx z nakładką `tech-prod` (runbook §9.2 pkt 4): **pełne aktualne polecenie startu z runbooka prokom-web §0** (od 16.11 także `hub-prod.yml`; lista: `WDROZENIE.md` → „Wspólny Nginx”) + `-f docker/compose.proxy.tech-prod.yml` — najpierw `run --rm --no-deps nginx nginx -t`, po `successful` → `up -d nginx`, `ps nginx` (`Up`), `logs --tail 20 nginx`.

### E. Kontrola
16. **[Komputer]**
    ```powershell
    foreach ($u in "https://prokomserwis.pl/","https://www.prokomserwis.pl/","https://prokomserwis.pl/panel/login","https://prokomserwis.pl/client/login") { curl.exe -s -o NUL -w "%{http_code} $u`n" $u }
    ```
    Oczekiwane: 200 wszędzie, `www` bez 301.
17. Przeglądarka (Krystian): logowanie do `/panel` na `prokomserwis.pl` i na `www`, lista napraw (liczba = N), szczegóły naprawy z załącznikami, PDF protokołu, panel admina, konto klienta (`/client/login`).
18. Zgłoszenie testowe przez `/zgloszenie` → widać w panelu → oznaczyć jako testowe i anulować w panelu (bez kasowania w bazie). Mail potwierdzenia przyszedł (Gmail, jak dotąd).
19. **[VPS-tech]** `$prod logs --since 15m backend celery celery-beat | tail -50` — bez błędów, `celery-beat` wysyła zadania. Telefon w sieci komórkowej (bez Wi-Fi): strona się otwiera.

### F. Kopie i monitoring (od pierwszej nocy)
20. Better Stack: heartbeat „Kopia Tech prod” (1 dzień + 3 h, e-mail) → adres do `.env.backup` na VPS jako `BACKUP_HEARTBEAT_URL_PROD=` (wkleja Krystian w terminalu, nie w czacie). Monitor HTTP `https://prokomserwis.pl/` co 3 min (jeśli nie założony wcześniej).
21. **[VPS-tech]** `scripts/vps/backup.sh prod` — `done`, heartbeat Up; plik w `offsite:prokom-backups-r7k2/tech-prod/daily/`.
22. **[VPS-tech]** cron: `crontab -e` → dopisać `45 3 * * * cd /srv/prokom/prokom-tech && scripts/vps/backup.sh prod >> ../backups/backup.log 2>&1` (`WDROZENIE.md` §5); `crontab -l | grep tech` — dwa wpisy (staging 3:30, prod 3:45).
23. Wpisy: `DNS-PROKOMSERWIS.md` (dziennik), `STAN.md` (przełączone, czas przerwy), runbook prokom-web §0 z nakładką `tech-prod` na stałe (mały PR w prokom-web).

## Poniedziałek 8:30
Krystian z serwisem: logowanie, nowe zgłoszenie, zmiana statusu, wydruk, mail do klienta. Hetzner zostaje w trybie 503 (serwer działa, nic nie przyjmuje) — wyłączenie i usunięcie dopiero po 14 dniach (MIGRACJA §10).

## Powrót (coś nie działa po 30 minutach)
1. **[Seohost]** A `@` i `www` z powrotem na **`62.238.0.240`** (TTL 300 → minuty).
2. **[Hetzner]**
   ```bash
   cd /app && cp nginx/default.conf.przed-migracja nginx/default.conf && $hz start backend frontend celery celery-beat && $hz exec nginx nginx -t && $hz exec nginx nginx -s reload
   ```
   **`nginx -s reload` po starcie backendu jest obowiązkowy** (inaczej 502 — incydent 14.11). Sprawdzenie: `curl -s -o /dev/null -w '%{http_code}\n' https://prokomserwis.pl/api/v1/repairs/track/` = 400.
3. Dane z VPS po przełączeniu (zwykle zero) — ręcznie, lista z panelu.
4. Nginx na VPS może zostać z nakładką (certyfikat ważny, ruch wraca na Hetznera). Wpis w STAN: co zawiodło, nowy termin.
