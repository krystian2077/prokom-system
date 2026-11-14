# DNS prokomserwis.pl — stan i zmiany

Zasada (TM+): przed każdą zmianą DNS zapisujemy tu stan „przed”, po zmianie stan „po” i wynik sprawdzenia (`Resolve-DnsName` z `-Server 1.1.1.1` i `8.8.8.8`). Jedna zmiana naraz. Jeśli coś nie działa po 30 minutach, wracamy do stanu „przed”.

## Stan „przed” — 14.11.2026 (panel cyber_Folks, zrzuty od Krystiana + resolwery z `INWENTARZ.md` §B)

### Domena
| Pozycja | Wartość |
|---|---|
| Rejestrator | cyber_Folks (usługa „FreeDNS — parking domeny”) |
| Utworzona / wygasa | 28.04.2026 / **28.04.2027** (okres roczny, proforma) |
| Abonent | **osoba prywatna (Krystian), nie firma PRO-KOM Tadeusz Wójciak** — decyzja 14.11: transfer do Seohost bez zmiany abonenta (AuthInfo i potwierdzenia po stronie obecnego abonenta), **zmiana abonenta na firmę (NIP) w Seohost zaraz po zakończonym transferze** |
| Serwery DNS | `dns1.tld.pl`, `dns2.tld.pl`, `dns3.tld.pl` (strefa w cyber_Folks) |
| DNSSEC | brak informacji na zrzucie (do sprawdzenia przed zmianą serwerów DNS) |

### Strefa
| Nazwa | Typ | TTL | Wartość | Uwagi |
|---|---|---|---|---|
| `prokomserwis.pl` | A | 3600 | `62.238.0.240` (Hetzner) | **zarządzany przez „Przekierowanie IP”** (wiersz nieedytowalny w strefie) |
| `www.prokomserwis.pl` | A | 3600 | `62.238.0.240` | jw.; `www` to rekord A, nie CNAME |
| `prokomserwis.pl` | NS | 3600 | `dns1.tld.pl`, `dns2.tld.pl`, `dns3.tld.pl` | |
| `prokomserwis.pl` | SOA | 3600 | `dns1.tld.pl. hostmaster.prokomserwis.pl.` refresh 10800, retry 3600, expire 604800, minimum 3600 | serial wg resolwerów: `2026111201` |
| `prokomserwis.pl` | TXT | 3600 | 64-znakowy hash `8ece6fb5…` | pochodzenie do ustalenia — **nie usuwać** |
| `prokomserwis.pl` | TXT | 3600 | `google-site-verification=8vUskG…` | Search Console — **nie usuwać** |

Brak: AAAA, MX, CAA, CNAME, SRV. Poczty `@prokomserwis.pl` dziś nie ma.

### Przekierowania (parking)
| Domena | Typ | Cel |
|---|---|---|
| `prokomserwis.pl` (i `www`) | Przekierowanie IP | `62.238.0.240` |

**Ważne dla migracji (TM+ etap C, MIGRACJA §8):** dopóki strefa jest w cyber_Folks, zmiana IP na VPS (`194.28.50.70`) to edycja „Przekierowania IP” (Modyfikuj), a nie wierszy A — te generuje przekierowanie. Po przeniesieniu strefy do Seohost (TM+ etap A) rekordy A wpisujemy normalnie w strefie Seohost, a przekierowanie w cyber_Folks przestaje mieć znaczenie.

## Dziennik zmian
| Data | Zmiana | Przed | Po | Sprawdzenie |
|---|---|---|---|---|
| — | — | — | — | — |
