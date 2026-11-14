# Wyjątki od strefy zakazanej i backlog backendu

## Zatwierdzone wyjątki (zmiana w strefie zakazanej za zgodą Krystiana)
Format: data · plik · co i dlaczego · kto zatwierdził · PR. Skrypt `scripts/tech/strefa-zakazana.sh` przepuszcza tylko pliki z tej tabeli.

| Data | Plik | Zmiana i powód | Zgoda | PR |
|---|---|---|---|---|
| — | — | — | — | — |

## Backlog zmian backendu (poza przebudową — osobne decyzje)
- **Punkt przyjęcia (`service_point`)** w zgłoszeniu i w śledzeniu (wariant B z KONTRAKT §2): filtr w panelu, właściwy adres punktu w statusie naprawy.
- **Formularz kontaktowy:** `fail_silently=True` ukrywa błędy wysyłki maila (klient widzi sukces, wiadomość może przepaść); temat maila „Nowe zapytanie z oferty” nie pasuje do strony Kontakt; brak zapisu zapytania w bazie.
- **Gunicorn:** liczba procesów liczona z liczby rdzeni (`cpu_count() * 2 + 1`). Na wspólnym VPS obchodzimy to przez `GUNICORN_CMD_ARGS` (MIGRACJA-VPS §4), docelowo wartość ze zmiennej w `gunicorn.conf.py`.
- **Ustawienia `prod.py`:** nagłówek mówi „Render”, CORS ma wpisane na stałe domeny produkcji. Na stagingu to nie przeszkadza (ta sama domena dla API i strony), ale warto ujednolicić.
- **Panel Django `/admin/`** dostępny publicznie (za logowaniem). Do rozważenia ograniczenie dostępu na poziomie Nginx.
