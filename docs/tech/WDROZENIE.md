# Wdrożenie prokom-tech na VPS (webh.pl)

Jak wdrażać, cofać i utrzymywać stosy `prokom-tech-prod` i `prokom-tech-staging` na wspólnym VPS (194.28.50.70, bez IPv6). Dlaczego tak: `MIGRACJA-VPS.md` §4. Wzór: prokom-gaming G16 (`prokom-gaming/docs/wdrozenia.md`, `runbook.md`), wspólny Nginx: prokom-web.

## 0. Gdzie co jest
| Co | Gdzie |
|---|---|
| Pliki wdrożenia (bez gita) | `/srv/prokom/prokom-tech/`: `compose.vps.yml`, `compose.prod.yml`, `compose.staging.yml`, `gateway/`, `scripts/vps/`, `REVISION` |
| Sekrety (chmod 600) | `/srv/prokom/prokom-tech/.env.prod`, `.env.staging`, `.env.backup` — wzór `.env.vps.example` |
| Obrazy | `ghcr.io/krystian2077/prokom-tech-backend:<sha>`, `…/prokom-tech-frontend:<sha>` (prod, z `master`), `…/prokom-tech-frontend-staging:<sha>` (z `develop`) — prywatne |
| Kopie | lokalnie `/srv/prokom/backups/tech/<stack>/<rodzaj>/`, poza serwerem `offsite:prokom-backups-r7k2/tech-<stack>/<rodzaj>/` (szyfrowane `age`) |
| Logi wdrożeń | `/srv/prokom/deploys.log` (jedna linia na wdrożenie, wspólny dla wszystkich aplikacji), `/srv/prokom/deploy-output.log` |
| Lock | `/srv/prokom/.deploy.lock` (jedno wdrożenie naraz na serwerze) |
| Wspólny Nginx | prokom-web, projekt `prokom-proxy`; vhosty Tech → `prokom-tech-<stack>-gateway-1:80` w sieci `prokom-proxy` |
| Porty na 127.0.0.1 | gateway: prod `3300`, staging `3301` (smoke test, tunel SSH) |

Skróty w powłoce (w `/srv/prokom/prokom-tech`):
```bash
prod="docker compose --env-file .env.prod -f compose.vps.yml -f compose.prod.yml"
staging="docker compose --env-file .env.staging -f compose.vps.yml -f compose.staging.yml"
```

## 1. Jak to działa
- **Obrazy buduje GitHub Actions** (`.github/workflows/obrazy.yml`): push do `develop` → backend + frontend-staging, push do `master` → backend + frontend. Tag = pełny SHA. Na serwerze nic się nie buduje.
- **Frontend ma osobny obraz na środowisko**, bo `NEXT_PUBLIC_*` wchodzą do obrazu przy budowie. Wartości są w zmiennych repozytorium (GitHub → Settings → Secrets and variables → Actions → Variables): `STAGING_NEXT_PUBLIC_API_URL`, `STAGING_NEXT_PUBLIC_SITE_URL`, `STAGING_NEXT_PUBLIC_GOOGLE_CLIENT_ID` i to samo z prefiksem `PRODUCTION_`. Nie GitHub Environments — repo jest prywatne na planie Free, gdzie Environments nie działają (14.11.2026).
- **Wdrożenie ręczne** (decyzja 14.11, automatyczny staging i bramka jak w Gaming — później): `scripts/vps/deploy.sh <prod|staging> <sha>` po SSH.
- **Migracje** robi `deploy.sh` jawnie: na prod po kopii `predeploy` i po wpisaniu `MIGRUJ` (albo `MIGRATE_CONFIRM=1`). Kontener backendu przy starcie uruchamia tylko gunicorna.
- **Staging bez Celery.** Redis jest, bo formularz zgłoszenia zleca zadanie Celery i bez brokera wisi (`LOKALNIE.md`).
- **Healthchecki:** backend `/admin/login/` z nagłówkami `Host` i `X-Forwarded-Proto: https` (Django wymusza HTTPS), frontend `node fetch /`, gateway `/gateway-health`. Backend nie ma `/api/health/`.

## 2. Wdrożenie
```bash
ssh prokom-vps
cd /srv/prokom/prokom-tech
scripts/vps/deploy.sh staging <pełny-sha-z-develop>
scripts/vps/deploy.sh prod <pełny-sha-z-master>       # pyta o MIGRUJ, gdy są migracje
```
Co robi: (prod) kopia `predeploy` → pobranie obrazów (brak = stop, nic się nie zmienia) → `APP_IMAGE_TAG` w `.env.<stack>` → `db` i `redis` → lista migracji (prod: potwierdzenie) → `migrate` → `collectstatic` → `up -d --wait` → `scripts/vps/smoke.sh <stack>`.

Pliki wdrożenia (compose, gateway, skrypty) aktualizujesz, gdy zmieniły się w repo — przed `deploy.sh`, z komputera:
```bash
git archive --format=tar <sha> compose.vps.yml compose.prod.yml compose.staging.yml gateway scripts/vps .env.vps.example | ssh prokom-vps 'tar -x -C /srv/prokom/prokom-tech && echo <sha> > /srv/prokom/prokom-tech/REVISION'
```
Te same pliki obsługują oba stosy: aktualizacja przed wdrożeniem stagingu zmienia też skrypty, z których korzysta prod.

## 3. Cofnięcie
- **Automatycznie:** jeśli po zmianie obrazu coś zawiedzie, a w tym wdrożeniu nie było migracji, `deploy.sh` wraca do poprzedniego SHA i sprawdza go smoke testem `core`.
- **Ręcznie, sam obraz:** `scripts/vps/deploy.sh prod <poprzedni-sha>` (poprzedni SHA: `tail /srv/prokom/deploys.log`).
- **Obraz + baza** (były migracje, które psują stary kod):
  1. klucz prywatny `age` z menedżera haseł do pliku: `prokom-web/scripts/server/age-key-temp.sh` (wpis `AGE_IDENTITY` w `.env.backup`);
  2. `scripts/vps/restore.sh --no-start ../backups/tech/prod/predeploy/<plik> prokom-tech-prod prokom_tech_prod`;
  3. `APP_IMAGE_TAG=<poprzedni-sha>` w `.env.prod` (`sed -i`), `$prod up -d --wait`, `scripts/vps/smoke.sh prod`;
  4. `shred -u` pliku z kluczem.

## 4. Pierwsze uruchomienie stosu (raz)
1. `sudo mkdir -p /srv/prokom/prokom-tech && sudo chown krystian: /srv/prokom/prokom-tech`; pliki przez `git archive` (§2).
2. `.env.staging` i `.env.prod` z `.env.vps.example` (`chmod 600`). Hasła bazy i Redisa: `openssl rand -hex 24`, osobne dla prod i staging. `SECRET_KEY` prod = ten z Hetznera (sesje i tokeny zostają ważne). `APP_IMAGE_TAG` = SHA do pierwszego wdrożenia.
3. `.env.backup`: `AGE_RECIPIENT="$(cat /srv/prokom/secrets/age.pub)"`, `RCLONE_REMOTE=offsite:prokom-backups-r7k2`, `BACKUP_HEARTBEAT_URL_PROD=…`, `BACKUP_HEARTBEAT_URL_STAGING=…` (`chmod 600`).
4. GHCR: **każda nowa paczka** (`prokom-tech-backend`, `-frontend`, `-frontend-staging`) po pierwszym buildzie jest publiczna — przełącz ją na prywatną (Package settings → Change visibility) i sprawdź anonimowo (manifest ma zwrócić 403). Serwer musi czytać paczki z konta `krystian2077`. Token z samym `read:packages` (konto, które ma dostęp do tych paczek): `docker login ghcr.io -u krystian2077`. Sprawdzenie: `docker pull ghcr.io/krystian2077/prokom-tech-backend:<sha>`.
5. Pierwszy start: `scripts/vps/deploy.sh staging <sha>` (bez poprzedniego SHA nie ma automatycznego cofnięcia).
6. Wspólny Nginx: PR w prokom-web (prompt w opisie PR `chore/tech-vps`) → certyfikat → nakładka `compose.proxy.tech-staging.yml` w poleceniu startu proxy (`prokom-web/docs/runbook.md`).
7. Kopie i monitoring (§5).

## 5. Kopie i monitoring
Cron użytkownika `krystian` (UTC), obok wpisów prokom-web i Gaming:
```
30 3 * * * cd /srv/prokom/prokom-tech && scripts/vps/backup.sh staging >> ../backups/backup.log 2>&1
45 3 * * * cd /srv/prokom/prokom-tech && scripts/vps/backup.sh prod >> ../backups/backup.log 2>&1
```
- Retencja: dzienne 14 dni, miesięczne (kopia z 1. dnia) 93 dni, `predeploy` 30 dni.
- Better Stack: heartbeat na stos (okres 1 dzień, zapas 3 h) i monitor HTTP `https://prokomserwis.pl/` co 3 min (staging z loginem `monitor`).
- Test odtworzenia (MIGRACJA §7 pkt 5): `backup.sh staging` → `restore.sh` do świeżego stosu → liczba zgłoszeń z manifestu = liczba po odtworzeniu.

## 6. Staging z danymi produkcji (próba generalna, MIGRACJA §6–§7)
1. Hetzner: `scp scripts/vps/eksport-hetzner.sh <hetzner>:/app/` → `cd /app && bash eksport-hetzner.sh prokom_tech_staging` → plik `eksport/prokom-tech-import-<UTC>.tar` + `.sha256`.
2. Kopia Hetzner → komputer → VPS (`/srv/prokom/import/`, `chmod 600`), porównanie `sha256sum` po każdej kopii.
3. VPS: `scripts/vps/restore.sh --no-start ../import/<plik>.tar prokom-tech-staging prokom_tech_staging`.
4. **Anonimizacja przed startem:** `docker exec -i prokom-tech-staging-db-1 psql -v ON_ERROR_STOP=1 -U prokom -d prokom_tech_staging < scripts/vps/anonimizuj.sql` — wszystkie kontrole = 0, inaczej staging nie rusza.
5. `$staging up -d --wait` → `scripts/vps/smoke.sh staging` → `SMOKE_SUBMIT=1 scripts/vps/smoke.sh staging` (zgłoszenie testowe i status) → ręcznie: logowanie do `/panel`, lista napraw, PDF protokołu, upload zdjęcia (20 MB).
6. Plik importu usunięty wszędzie (`shred -u`).

## 7. Dzień przełączenia
Lista z MIGRACJA §8, komendy w `docs/tech/NIEDZIELA.md`. Pomocne pliki: `scripts/vps/eksport-hetzner.sh prokom_tech_prod` (zrzut końcowy), `scripts/vps/strona-503/default.conf` (strona techniczna na Hetznerze), `restore.sh` do `prokom-tech-prod` **bez** anonimizacji, `deploy.sh prod <sha>` (migracje: oczekiwane „no pending migrations” — inaczej stop i decyzja).

## 8. Service worker — co robi i jak go wyłączyć (od TD5, SPEC §12.2)
**Co robi:** `frontend/public/sw.js` (rejestruje go tylko layout publiczny, po `load`, `components/tech/SwRegister.tsx`). Trzyma **jedną** kopię strony `/offline` (style wklejone, bez skryptów) w keszu `pk-tech-offline-v<N>` i podaje ją tylko wtedy, gdy przejście na stronę publiczną nie dojdzie do sieci. Nie przechwytuje `/api`, `/panel`, `/admin-panel`, `/client`, `/admin`, `/_next`, zapytań innych niż GET ani niczego poza nawigacją — nic innego nie jest keszowane (test `tests/tech/pwa.spec.ts`).

**Zmiana w SW:** każda zmiana pliku = podbij `VERSION` w `sw.js` (stary kesz `pk-tech-*` kasuje się przy aktywacji). Przeglądarka sprawdza `sw.js` przy każdej nawigacji (max co 24 h) — Nginx nie może go keszować długo: `location = /sw.js { add_header Cache-Control "no-cache"; }` (jeśli Nginx dokłada własne nagłówki keszowania dla `public/`).

**Wyłączenie awaryjne (np. SW psuje stronę):**
1. Najszybciej, bez nowego builda frontu: podmień `public/sw.js` na serwerze/w obrazie na wersję „samobójczą” i wdroż:
   ```js
   self.addEventListener("install", () => self.skipWaiting());
   self.addEventListener("activate", (e) => e.waitUntil((async () => {
     for (const k of await caches.keys()) if (k.startsWith("pk-tech-")) await caches.delete(k);
     await self.registration.unregister();
     for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
   })()));
   ```
   Każda przeglądarka z zarejestrowanym SW pobierze go przy następnej wizycie, wyczyści kesz, wyrejestruje się i przeładuje kartę.
2. Na stałe: zmienna buildu `NEXT_PUBLIC_TECH_SW=0` (`.env.prod` / zmienne repo `PRODUCTION_NEXT_PUBLIC_TECH_SW`) — `SwRegister` przestaje rejestrować i wyrejestrowuje istniejące SW. Zostaw wersję „samobójczą” `sw.js` co najmniej 30 dni.
3. Sprawdzenie: Chrome → DevTools → Application → Service Workers (brak wpisu dla domeny) i Cache Storage (brak `pk-tech-*`).

Panele nie rejestrują SW, ale SW o zasięgu `/` „widzi” ich adresy — dlatego lista wykluczeń w `sw.js` jest częścią testów i nie wolno jej skracać.

## Wspólny Nginx (`prokom-proxy`) — start tylko ze wszystkimi nakładkami
Od 16.11.2026 proxy obsługuje 7 nakładek. **Pominięta nakładka zdejmuje swoją domenę** (16.11 o 21:08 start z nakładką Tech prod bez `hub-prod.yml` wyłączył pro-kom.eu na ok. 10 min). Źródło prawdy: `prokom-web/docs/runbook.md` §0 — przed każdym startem sprawdź tam aktualną listę. Stan na 16.11 (w `/srv/prokom/prokom-web`, najpierw to samo z `run --rm --no-deps nginx nginx -t` zamiast `up …`):
```bash
docker compose --env-file .env.proxy -f docker/compose.proxy.yml -f docker/compose.proxy.prod.yml -f docker/compose.proxy.gaming-staging.yml -f docker/compose.proxy.gaming-prod.yml -f docker/compose.proxy.tech-staging.yml -f docker/compose.proxy.tech-prod.yml -f docker/compose.proxy.hub-prod.yml up -d --force-recreate --no-deps nginx
```
Sprawdzenie listy na serwerze: `docker compose ls | grep prokom-proxy` (kolumna CONFIG FILES).
