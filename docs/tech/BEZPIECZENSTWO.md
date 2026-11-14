# Bezpieczeństwo repo — skan sekretów (T0, 14.11.2026)

Repo `krystian2077/prokom-system` jest **publiczne**. Ten dokument nie zawiera żadnych wartości, tylko plik, commit i typ.

## Zakres
- Pełny klon (nie płytki), wszystkie gałęzie: `master` i 4 zdalne `claude/*` (`git log --all`): 95 commitów, z czego gitleaks przeskanował 94 (jeden commit nie ma zmian w treści). Ok. 10,8 MB.
- Narzędzie: `gitleaks 8.30.1` (lokalna binarka, bez zależności w projekcie):
  `gitleaks git . --log-opts="--all" --redact --no-banner -f json -r <plik poza repo>`
- Do tego ręczna heurystyka (gitleaks nie łapie zwykłych haseł bez charakterystycznego formatu):
  - pliki w historii o nazwach `.env*`, `*secret*`, `*credential*`, `*.pem`, `*.key`, `id_rsa`, `client_secret*.json`;
  - dodane linie z `SECRET_KEY|PASSWORD|API_KEY|TOKEN|CLIENT_SECRET` = dosłowna wartość (bez `os.environ`/`env()`).

## ⚠ KRYTYCZNE — hasła kont pracowników i adminów w publicznym kodzie
Znalezione ręcznie przy pisaniu `LOKALNIE.md` (gitleaks tego nie łapie: hasła są zwykłymi napisami w słowniku Pythona).

| Plik | Od commita | Co | Konta |
|---|---|---|---|
| `backend/apps/common/management/commands/seed_initial.py` | `50ab934` (09.03.2026), ostatnio `f01500d` (27.04.2026, opis commita: „production accounts … secure passwords”) | Hasła wpisane w kod, konta tworzone z `must_change_password=False`; admini dostają `is_superuser=True` | 4 × pracownik (`kuba`, `rafal`, `pawelg`, `pawelw`) + 2 × admin/superuser (`krystian`, `tadek`), e-mail `<login>@prokom.local` |
| `backend/apps/accounts/management/commands/seed_staff_profiles.py` | `f592bc1` (19.03.2026) | Słabe hasła wpisane w kod | `kuba@`, `rafal@`, `pawel@prokom.local` |

**Ryzyko:** jeśli `seed_initial` był uruchomiony na produkcji, a hasła nie zostały potem zmienione, każdy może zalogować się do panelu pracownika (`/panel`) i do panelu Django (`/admin/`, publicznie dostępny) jako superuser — z dostępem do danych wszystkich klientów. Repo jest publiczne co najmniej od 04.10.2026.

**Do zrobienia przez Krystiana (natychmiast, przed resztą T0):**
1. Na produkcji zmień hasła wszystkich kont z tabeli, które istnieją (najpierw dwa konta superuser). Komendy w `docs/STAN.md` → „Pilne”.
2. Sprawdź `last_login` tych kont (czy ktoś się logował, kiedy nie powinien).
3. Usunięcie haseł z kodu nie usuwa ich z historii gita — zmiana haseł jest jedyną skuteczną poprawką. Poprawka seedów (hasła ze zmiennej środowiskowej albo losowe + `must_change_password=True`) to zmiana backendu → wpis do backlogu w `WYJATKI.md`, decyzja Krystiana.
4. Ten plik trafia do publicznego repo dopiero po zmianie haseł.

## Wynik
| Typ | Plik | Commit | Ocena |
|---|---|---|---|
| gitleaks (wszystkie reguły) | — | — | **0 trafień** |
| Hasła kont w seedach | patrz sekcja „KRYTYCZNE” | | **Wymaga zmiany haseł** |
| Pliki `.env` w historii | tylko `.env.prod.example`, `backend/.env.example`, `frontend/.env.local.example` | — | Wartości to zaślepki („HASLO…”, „zmien…”, „twoje…”, „xxxx”), puste pola Google OAuth. OK. |
| Dane logowania do kont testowych (admin, pracownik, klient) | `README.md` (sekcja „Test Credentials (Development)”) | `6488907` (29.04.2026), usunięte w `dbeeeba` | E-maile w domenie `example.com`, hasła w stylu demo (8–9 znaków). Konta lokalne do testów. **Ryzyko niskie** — tylko gdyby takie konto istniało na produkcji z tym samym hasłem. |
| Hasła w kodzie | serializery, formularze, testy | — | Tylko nazwy pól i dane testowe w testach. OK. |

## Do zrobienia (Krystian)
- [ ] Na produkcji sprawdź, że nie ma kont z e-mailem w domenie `example.com` (panel Django `/admin/` → Użytkownicy, filtr po e-mailu). Jeśli są — usuń albo zmień hasła.
- [ ] Decyzja: repo zostaje publiczne czy prywatne. Po zmianie haseł z sekcji „KRYTYCZNE” nie ma twardego powodu, żeby je zamykać (zamknięcie repo nie cofa tego, co już wyciekło). Argumenty za prywatnym: szczegóły architektury i endpointów panelu są publiczne. Za publicznym: portfolio.

Rotacja kluczy i tokenów (SECRET_KEY, SMTP, OAuth) nie jest potrzebna — nie ma ich w historii. Zmiana haseł kont z sekcji „KRYTYCZNE” — tak.

## Jak powtórzyć
Przed zmianą widoczności repo i przed TD6 uruchom ponownie polecenie gitleaks z sekcji „Zakres”. Raport zapisuj **poza repo**.
