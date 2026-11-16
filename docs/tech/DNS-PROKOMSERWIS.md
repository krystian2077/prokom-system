# DNS prokomserwis.pl — stan i zmiany

Zasada (TM+): przed każdą zmianą DNS zapisujemy tu stan „przed”, po zmianie stan „po” i wynik sprawdzenia (`Resolve-DnsName` z `-Server 1.1.1.1` i `8.8.8.8`). Jedna zmiana naraz. Jeśli coś nie działa po 30 minutach, wracamy do stanu „przed”.

## Stan „przed” — 14.11.2026 (panel cyber_Folks, zrzuty od Krystiana + resolwery z `INWENTARZ.md` §B)

### Domena
| Pozycja | Wartość |
|---|---|
| Rejestrator | **Seohost (PERSKIMEDIA Szymon Perski) od 14.11.2026 21:04** (transfer A5); wcześniej cyber_Folks (usługa „FreeDNS — parking domeny”) |
| Utworzona / wygasa | 28.04.2026 / **28.04.2027** (okres roczny, proforma) |
| Abonent | **PRO-KOM Tadeusz Wójciak (firma) od 14.11.2026** — zmiana razem z transferem (formularz Seohost pozwalał tylko na kontakt firmowy; kod AuthInfo od dotychczasowego abonenta = zgoda), potwierdzone mailem NASK „zmiana abonenta domeny”. Wcześniej osoba prywatna (Krystian) |
| Serwery DNS | `dns1.tld.pl`, `dns2.tld.pl`, `dns3.tld.pl` (strefa w cyber_Folks) |
| DNSSEC | **wyłączony** — brak rekordu DS w `.pl` (sprawdzone 14.11), więc zmiana serwerów DNS nie wymaga wyłączania DNSSEC |

### Strefa
| Nazwa | Typ | TTL | Wartość | Uwagi |
|---|---|---|---|---|
| `prokomserwis.pl` | A | 3600 | `62.238.0.240` (Hetzner) | **zarządzany przez „Przekierowanie IP”** (wiersz nieedytowalny w strefie) |
| `www.prokomserwis.pl` | A | 3600 | `62.238.0.240` | jw.; `www` to rekord A, nie CNAME |
| `prokomserwis.pl` | NS | 3600 | `dns1.tld.pl`, `dns2.tld.pl`, `dns3.tld.pl` | |
| `prokomserwis.pl` | SOA | 3600 | `dns1.tld.pl. hostmaster.prokomserwis.pl.` refresh 10800, retry 3600, expire 604800, minimum 3600 | serial wg resolwerów: `2026111201` |
| `prokomserwis.pl` | TXT | 3600 | 63-znakowy ciąg hex `8ece6fb5…` | pochodzenie do ustalenia — **nie usuwać** |
| `prokomserwis.pl` | TXT | 3600 | `google-site-verification=8vUskG…` | Search Console — **nie usuwać** |

Brak: AAAA, MX, CAA, CNAME, SRV. Poczty `@prokomserwis.pl` dziś nie ma.

### Przekierowania (parking)
| Domena | Typ | Cel |
|---|---|---|
| `prokomserwis.pl` (i `www`) | Przekierowanie IP | `62.238.0.240` |

**Ważne dla migracji (TM+ etap C, MIGRACJA §8):** dopóki strefa jest w cyber_Folks, zmiana IP na VPS (`194.28.50.70`) to edycja „Przekierowania IP” (Modyfikuj), a nie wierszy A — te generuje przekierowanie. Po przeniesieniu strefy do Seohost (TM+ etap A) rekordy A wpisujemy normalnie w strefie Seohost, a przekierowanie w cyber_Folks przestaje mieć znaczenie.

## Etap A — sprawdzenie (TM+ A1, A2) — 14.11.2026
- Resolwery `1.1.1.1` i `8.8.8.8` zgodne ze strefą w panelu: A `@` i `www` = `62.238.0.240`, NS `dns1–3.tld.pl`, SOA serial `2026111201`, 2× TXT; **0 × AAAA, 0 × MX, 0 × CAA**. TTL NS w cache Google 365 s (reszta 3600).
- **Poczty nie ma (brak MX)** → A2: idziemy dalej bez planu przenoszenia skrzynek.
- Hosting w cyber_Folks: na zrzucie tylko usługa „FreeDNS — parking domeny”. TODO(krystian): rozwiń „Dodatki (addons)” i potwierdź, że nic tam nie ma.
- Seohost `dns1.microhost.pl`: strefy `prokomserwis.pl` jeszcze nie ma (NXDOMAIN) — stan oczekiwany przed A3.

## Etap A3 — strefa do wpisania w Seohost (1:1, TTL 3600)
NS i SOA ustawia Seohost sam (`dns1.microhost.pl`, `dns2.microhost.pl`). Wpisujemy tylko:

| Nazwa | Typ | TTL | Wartość |
|---|---|---|---|
| `@` (prokomserwis.pl) | A | 3600 | `62.238.0.240` |
| `www` | A | 3600 | `62.238.0.240` |
| `@` | TXT | 3600 | `google-site-verification=8vUskGsYJnyr5rq_dpzDdOy_azqSiY2UlzUwblNN50A` |
| `@` | TXT | 3600 | `8ece6fb5f49cfbd14415065aa5e0df2356e0c9fc07a875b7492c42a478f0e85` |

Bez MX, bez AAAA (poczta dochodzi w etapie B, IPv6 nie używamy). Jeśli Seohost przy zakładaniu strefy doda sam rekordy domyślne (np. A na swój hosting, MX `mail.prokomserwis.pl`, CNAME `ftp`/`mail`), **usuń je** — strefa ma być dokładnie taka jak wyżej. Wartości TXT są publiczne (każdy je odczyta z DNS), dlatego są tu w całości.

Kontrola po wpisaniu (zanim zmienisz serwery DNS w cyber_Folks):
```powershell
foreach ($t in "SOA","NS","A","AAAA","MX","TXT") { Resolve-DnsName prokomserwis.pl -Type $t -Server dns1.microhost.pl -DnsOnly -ErrorAction SilentlyContinue | ? Section -eq Answer | ft Name,Type,TTL,IPAddress,NameHost,Strings -AutoSize }
Resolve-DnsName www.prokomserwis.pl -Type A -Server dns2.microhost.pl -DnsOnly | ? Section -eq Answer | ft Name,Type,TTL,IPAddress -AutoSize
```
Oczekiwane: SOA i NS z `microhost.pl`, A `62.238.0.240` dla `@` i `www` na obu serwerach, 2× TXT jak wyżej, brak AAAA i MX.

## Dziennik zmian
| Data | Zmiana | Przed | Po | Sprawdzenie |
|---|---|---|---|---|
| 14.11.2026 | A3: strefa `prokomserwis.pl` założona w Seohost (serial `2026111400`); usunięte domyślne A z TTL 86400 | brak strefy w Seohost | 2× A `62.238.0.240` TTL 3600, 2× TXT, NS `dns1/dns2.microhost.pl`, bez MX/AAAA/CNAME | `dns1` i `dns2.microhost.pl` zgodne z tabelą A3 ✔. Ruch nadal idzie przez `dns1–3.tld.pl` (cyber_Folks) — serwerów DNS jeszcze nie zmieniono |
| 14.11.2026 | A4: serwery DNS w cyber_Folks → „Zewnętrzne serwery DNS”: `dns1.microhost.pl`, `dns2.microhost.pl` (FreeDNS/parking wyłączony) | `dns1–3.tld.pl` | WHOIS NASK: `dns1/dns2.microhost.pl`, last modified 2026.11.14 16:11:32, DNSSEC unsigned | rejestr przyjął zmianę; `a-dns.pl`/`b-dns.pl` jeszcze podają `tld.pl` (publikacja strefy `.pl` w toku). Strona `/`, `www`, `/panel/login`, `/client/login` = 200 z `62.238.0.240`. **Do potwierdzenia: delegacja w `a-dns.pl` i resolwery** |
| 14.11.2026 18:35 | A4 ✔ potwierdzenie publikacji | `a-dns.pl`/`b-dns.pl`: `tld.pl` | `a-dns.pl`/`b-dns.pl`: `dns1/dns2.microhost.pl` | 1.1.1.1, 8.8.8.8, 9.9.9.9: NS Seohost, A `@`/`www` `62.238.0.240`, 2× TXT; strona, `/panel/login`, `/client/login` 200, API 400 (bez parametrów) — bez przerwy. Transfer (A5) najwcześniej po kilku godzinach od tej chwili |
| 14.11.2026 | etap C: rekord `staging` A `194.28.50.70` TTL 3600 w strefie Seohost | brak | `staging.prokomserwis.pl` A `194.28.50.70` | `dns1`/`dns2.microhost.pl`, 1.1.1.1, 8.8.8.8 zgodne; brak AAAA; `@`/`www` bez zmian (Hetzner). Do certyfikatu stagingu w prokom-web |
| 14.11.2026 ~20:00 | etap B: poczta SH 1 — A `mail` `91.236.131.99`, MX `10 mail.prokomserwis.pl`, TXT SPF `v=spf1 include:_spf-h99.microhost.pl include:_spf.google.com ~all`, TXT `x._domainkey` (DKIM z DirectAdmin `h99.seohost.pl`), TXT `_dmarc` `v=DMARC1; p=none; rua=mailto:kontakt@prokomserwis.pl` (wszystkie TTL 3600) | brak poczty | 5 rekordów poczty | `dns1`/`dns2.microhost.pl`, 1.1.1.1, 8.8.8.8 zgodne. SPF z Gmailem do etapu D (aplikacja wysyła przez Gmail); DMARC `p=none` zamiast proponowanego przez hosting `quarantine` (jak prokom-web). Rekordów A `@`/`www`/`ftp`/`pop`/`smtp` i NS z DirectAdmin nie przenosimy |
| 14.11.2026 21:01–21:04 | A5: transfer rejestracji cyber_Folks → Seohost (konto firmowe) ze zmianą abonenta na firmę | rejestrator cyber_Folks, abonent prywatny | rejestrator PERSKIMEDIA (Seohost), abonent PRO-KOM Tadeusz Wójciak | AuthInfo z cyber_Folks (nie w repo), zamówienie Seohost 21:01, potwierdzenie linkiem NASK `dns.pl/trconfirm`, maile NASK: „przeniesiona do rejestratora PERSKIMEDIA” i „zmiana abonenta”; Seohost: status zakończony 21:04, wygasa **28.04.2027** (bez zmian), delegacja `dns1/dns2.microhost.pl` w `a-dns.pl`, 8.8.8.8, 1.1.1.1; strona, `www`, `/panel/login`, `/client/login` 200 — bez przerwy, poczta bez zmian |
| 16.11.2026 21:45 | TTL A `@` i `www` 3600 → 300 (przełączenie przyspieszone z 29.11 decyzją Krystiana) | TTL 3600 | TTL 300 | `dns1.microhost.pl`: 62.238.0.240, TTL 300 |
| 16.11.2026 22:06 | **Przełączenie:** A `@` i `www` → `194.28.50.70` (VPS webh.pl) | `62.238.0.240` (Hetzner) | `194.28.50.70`, TTL 300 | `dns1`/`dns2.microhost.pl`, 1.1.1.1, 8.8.8.8 zgodne w kilka minut; certyfikat `prokom-tech-prod` (LE, do 14.02.2027); strona, `www`, `/panel/login`, `/client/login`, `/zgloszenie` 200, API 400, HSTS |
