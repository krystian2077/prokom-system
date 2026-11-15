# Wyjątki od strefy zakazanej i backlog backendu

## Zatwierdzone wyjątki (zmiana w strefie zakazanej za zgodą Krystiana)
Format: data · plik · co i dlaczego · kto zatwierdził · PR. Skrypt `scripts/tech/strefa-zakazana.sh` przepuszcza tylko pliki z tej tabeli.

| Data | Plik | Zmiana i powód | Zgoda | PR |
|---|---|---|---|---|
| 15.11.2026 | `frontend/app/globals.css` | Usunięcie publicznych bloków starej strony (TD6 PR 2b, −1056 linii); reguły używane przez panele zostają, `panele.spec` bez różnic | Krystian (czat, 15.11) | #52 |
| 15.11.2026 | `frontend/app/client/layout.tsx` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |
| 15.11.2026 | `frontend/app/client/ClientFrame.tsx` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |
| 15.11.2026 | `frontend/app/client/ClientGate.tsx` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |
| 15.11.2026 | `frontend/app/client/client-tech.css` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |
| 15.11.2026 | `frontend/app/client/login/page.tsx` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |
| 15.11.2026 | `frontend/app/client/rejestracja/page.tsx` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |
| 15.11.2026 | `frontend/app/client/forgot-password/page.tsx` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |
| 15.11.2026 | `frontend/app/client/reset-password/page.tsx` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |
| 15.11.2026 | `frontend/app/client/verify-email/page.tsx` | Skórka Tech konta klienta (logowanie, rejestracja, reset hasła, weryfikacja e-mail), logika bez zmian | Krystian (czat, 15.11) | #67 |

## Backlog zmian backendu (poza przebudową — osobne decyzje)
- **Punkt przyjęcia (`service_point`)** w zgłoszeniu i w śledzeniu (wariant B z KONTRAKT §2): filtr w panelu, właściwy adres punktu w statusie naprawy.
- **Formularz kontaktowy:** `fail_silently=True` ukrywa błędy wysyłki maila (klient widzi sukces, wiadomość może przepaść); temat maila „Nowe zapytanie z oferty” nie pasuje do strony Kontakt; brak zapisu zapytania w bazie.
- **Gunicorn:** liczba procesów liczona z liczby rdzeni (`cpu_count() * 2 + 1`). Na wspólnym VPS obchodzimy to przez `GUNICORN_CMD_ARGS` (MIGRACJA-VPS §4), docelowo wartość ze zmiennej w `gunicorn.conf.py`.
- **Ustawienia `prod.py`:** nagłówek mówi „Render”, CORS ma wpisane na stałe domeny produkcji. Na stagingu to nie przeszkadza (ta sama domena dla API i strony), ale warto ujednolicić.
- **Panel Django `/admin/`** dostępny publicznie (za logowaniem). Do rozważenia ograniczenie dostępu na poziomie Nginx.
- **[T0, pilne] Hasła w seedach:** `seed_initial.py` i `seed_staff_profiles.py` mają hasła kont wpisane w kod (publiczne repo). Hasła na produkcji zmienione 14.11.2026. Do zrobienia: hasła ze zmiennej środowiskowej albo losowe z `must_change_password=True`. Szczegóły: `BEZPIECZENSTWO.md`.
- **[T0] Zgłoszenie wisi bez Redisa:** `.delay()` w `transaction.on_commit` (`repairs/services/public_submit.py`) blokuje odpowiedź, gdy broker nie działa (Celery ponawia połączenie bez końca). Na produkcji awaria Redisa = formularz zgłoszenia przestaje odpowiadać. Poprawka: limit ponowień przy publikacji (`broker_connection_retry`/`retry=False` w `.apply_async`) albo zlecanie w osobnym wątku.
- **[T0] Formularz kontaktowy wstawia dane klienta do HTML maila bez escapowania** (`inquiry_views.py`, `_build_inquiry_html`): ktoś może wstrzyknąć HTML (np. link) do maila, który dostaje serwis. Poprawka: `django.utils.html.escape`. Komunikat 400 jest bez polskich znaków.
- **[T0] Krój Unbounded psuje `next build`** (Google zwraca `/l/font?kit=…` bez rozszerzenia, a `next/font` 14.2.x tego nie obsługuje). Unbounded jest ładowany w `app/layout.tsx`, w stronach publicznych i w 5 stronach `app/client/*` (strefa zakazana). Poprawka wymaga wyjątku w tabeli powyżej. Musi być gotowa przed TM, bo dziś nie buduje się nawet `master`.
- **[T0] SMS to atrapa:** `communications/services/send.py: send_sms` zwraca `True` bez wysyłki (TODO SMSAPI). Kod przypisania naprawy SMS-em i przypomnienia SMS nie dochodzą do klientów.
- **[14.11] Godziny soboty:** domyślne `SERWIS_PRINT_HOURS` w `config/settings/base.py` to „Sob 9:00–13:00”, a obowiązuje 9:00–14:00 (decyzja Krystiana). Na produkcji wartość ustawiamy w `.env.prod`; domyślną poprawić przy najbliższej zmianie backendu.
- **[14.11] Numer przesyłki zwrotnej niewidoczny dla klienta:** backend ma `service_tracking_number` i `service_courier` (`repairs/models.py`, serializer pracownika), ale `/track` ich nie zwraca, a konto klienta (`features/client-naprawy/ClientNaprawyDetail.tsx`, strefa zakazana) pokazuje tylko pole na numer wysyłki od klienta. Dotyczy naprawy wysyłkowej (SPEC §12.10).
- **[15.11] Mail po zgłoszeniu z kurierem podaje tylko adres Rabki:** potwierdzenie zgłoszenia bierze adres serwisu z `SERWIS_PRINT_*` (jeden punkt), a od 15.11 klient może wysłać sprzęt do każdego opublikowanego salonu (Rabka-Zdrój i Zakopane, `/naprawa-kurierem`, ekran sukcesu). Przy `dropoff = courier` mail mógłby wymieniać oba salony (adresy i godziny) i prosić o włożenie numeru zgłoszenia do paczki. Front niczego nie obiecuje ponad to, co pokazuje sam.
