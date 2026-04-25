# Scenariusze Użytkowników — PRO-KOM Serwis

> System zarządzania serwisem elektroniki (telefony, laptopy, tablety, drukarki, konsole, smartwatche).  
> Role: **Gość/Klient**, **Pracownik (Staff)**, **Administrator (Admin)**

---

## SPIS TREŚCI

1. [Scenariusze Gościa / Klienta Niezalogowanego](#1-scenariusze-gościa--klienta-niezalogowanego)
2. [Scenariusze Klienta Zalogowanego](#2-scenariusze-klienta-zalogowanego)
3. [Scenariusze Pracownika (Staff)](#3-scenariusze-pracownika-staff)
4. [Scenariusze Administratora (Admin)](#4-scenariusze-administratora-admin)

---

## 1. SCENARIUSZE GOŚCIA / KLIENTA NIEZALOGOWANEGO

### SC-G-01 — Przeglądanie oferty serwisu
**Aktor:** Dowolny odwiedzający  
**Ścieżka:** `/oferta`, `/uslugi`, strony usługowe  
**Kroki:**
1. Użytkownik wchodzi na stronę główną (`/`).
2. Przegląda sekcje usług: naprawa telefonów, laptopów, tabletów, drukarek, konsol, smartwatchy, odzyskiwanie danych.
3. Klika w interesującą go usługę (np. `/serwis-telefonow`).
4. Zapoznaje się ze szczegółami — zakresem napraw, cenami orientacyjnymi, czasem realizacji.
5. Opcjonalnie przechodzi do `/oferta` lub `/uslugi` po pełne zestawienie.

---

### SC-G-02 — Zapoznanie się z FAQ i regulaminem
**Aktor:** Dowolny odwiedzający  
**Ścieżka:** `/faq`, `/regulamin`, `/polityka-prywatnosci`  
**Kroki:**
1. Użytkownik otwiera stronę FAQ (`/faq`).
2. Przegląda najczęstsze pytania i odpowiedzi.
3. Opcjonalnie przechodzi do regulaminu (`/regulamin`) i polityki prywatności (`/polityka-prywatnosci`).

---

### SC-G-03 — Sprawdzenie obsługiwanych miejscowości
**Aktor:** Potencjalny klient z poza Rabki  
**Ścieżka:** `/obslugiwane-miejscowosci`  
**Kroki:**
1. Użytkownik wchodzi na stronę obsługiwanych miejscowości.
2. Sprawdza, czy jego miasto jest obsługiwane (kurierowo lub osobiście).
3. Decyduje o sposobie dostarczenia sprzętu.

---

### SC-G-04 — Zapoznanie się z blogiem
**Aktor:** Dowolny odwiedzający  
**Ścieżka:** `/blog`, `/blog/[slug]`  
**Kroki:**
1. Użytkownik otwiera listę wpisów na blogu.
2. Klika wybrany artykuł.
3. Czyta treść wpisu (porady, aktualności, opisy napraw).

---

### SC-G-05 — Kontakt z serwisem
**Aktor:** Dowolny odwiedzający  
**Ścieżka:** `/kontakt`  
**Kroki:**
1. Użytkownik przechodzi na stronę kontaktu.
2. Zapoznaje się z adresem, godzinami otwarcia, numerem telefonu i e-mailem.
3. Opcjonalnie korzysta z formularza kontaktowego lub dzwoni bezpośrednio.

---

### SC-G-06 — Zgłoszenie naprawy (formularz 5-krokowy)
**Aktor:** Klient oddający sprzęt do naprawy  
**Ścieżka:** `/zgloszenie`  
**Kroki:**
1. Użytkownik klika „Zgłoś naprawę" i przechodzi na stronę formularza.
2. **Krok 1 — Dane kontaktowe:** wpisuje imię, nazwisko, e-mail, telefon, opcjonalnie adres.
3. **Krok 2 — Opis urządzenia:** wybiera kategorię urządzenia (telefon/tablet/laptop/drukarka/konsola/smartwatch), markę, model; opisuje problem, kondycję sprzętu (czy się uruchamia, uszkodzenia wizualne), opcjonalnie podaje numer seryjny.
4. **Krok 3 — Metoda dostawy i odbioru:** wybiera formę dostarczenia (osobiste, kurier, paczkomat) i odbioru naprawionego sprzętu; podaje adresy/numery przesyłek jeśli wymagane.
5. **Krok 4 — Akcesoria i opcje:** zaznacza, czy jest zainteresowany folią Hammer Glass, zgłasza potrzebę kopii zapasowej danych, opcjonalnie opisuje potrzeby dotyczące akcesoriów.
6. **Krok 5 — Potwierdzenie:** przegląda podsumowanie, akceptuje regulamin i politykę prywatności, wysyła formularz.
7. System tworzy zgłoszenie ze statusem **NOWE**, generuje numer RMA (format `PROKOM/RMA/N/RRRR`) i wyświetla modal z potwierdzeniem.
8. Klient otrzymuje e-mail z numerem zgłoszenia.

---

### SC-G-07 — Śledzenie statusu naprawy bez konta
**Aktor:** Klient, który nie ma konta lub nie chce się logować  
**Ścieżka:** `/track`  
**Kroki:**
1. Klient wchodzi na stronę śledzenia naprawy.
2. Podaje numer RMA lub e-mail + numer telefonu.
3. System wyświetla publiczny status naprawy wraz z historią zmian (oś czasu).
4. Klient widzi aktualny etap (np. „W naprawie", „Gotowe do odbioru").

---

### SC-G-08 — Zgłoszenie reklamacji / naprawy gwarancyjnej
**Aktor:** Klient, który wcześniej korzystał z serwisu  
**Ścieżka:** `/claim-repair`  
**Kroki:**
1. Klient wchodzi na stronę zgłaszania reklamacji.
2. Podaje numer poprzedniej naprawy i dane kontaktowe.
3. System wysyła kod potwierdzający do klienta (`POST /api/v1/repairs/request-claim-code/`).
4. Klient wprowadza kod i opisuje problem (reklamacja tworzy powiązane zgłoszenie typu `complaint`).
5. Klient otrzymuje potwierdzenie przyjęcia reklamacji.

---

### SC-G-09 — Rejestracja konta klienta
**Aktor:** Klient chcący śledzić naprawy przez panel  
**Ścieżka:** `/client/rejestracja`  
**Kroki:**
1. Klient wypełnia formularz rejestracji: e-mail, hasło, imię, nazwisko, telefon.
2. System wysyła kod OTP na podany e-mail.
3. Klient przechodzi do `/client/verify-email` i wprowadza kod.
4. Po weryfikacji konto zostaje aktywowane — klient trafia do dashboardu.

---

### SC-G-10 — Logowanie do panelu klienta
**Aktor:** Zarejestrowany klient  
**Ścieżka:** `/client/login`  
**Kroki:**
1. Klient podaje e-mail i hasło.
2. Po pomyślnym logowaniu zostaje przekierowany do `/client/dashboard`.
3. Przy 5 błędnych próbach konto jest blokowane na 15 minut.

---

### SC-G-11 — Resetowanie hasła klienta
**Aktor:** Klient, który zapomniał hasła  
**Ścieżka:** `/client/forgot-password`, `/client/reset-password`  
**Kroki:**
1. Klient podaje adres e-mail na stronie odzyskiwania hasła.
2. System wysyła link/token resetujący.
3. Klient otwiera link i ustawia nowe hasło na stronie `/client/reset-password`.

---

### SC-G-12 — Przeglądanie akcesoriów i folii ochronnych
**Aktor:** Klient zainteresowany zakupem  
**Ścieżka:** `/akcesoria`, `/hammer-glass`  
**Kroki:**
1. Użytkownik przegląda dostępne akcesoria (etui, szkła, ładowarki itd.).
2. Opcjonalnie przechodzi na stronę Hammer Glass, by zapoznać się z ofertą folii hydrodynamicznych.
3. Kontaktuje się z serwisem w celu zakupu lub zamówienia.

---

## 2. SCENARIUSZE KLIENTA ZALOGOWANEGO

### SC-K-01 — Przeglądanie wszystkich swoich napraw
**Aktor:** Zalogowany klient  
**Ścieżka:** `/client/naprawy`  
**Kroki:**
1. Klient loguje się i przechodzi do panelu.
2. Otwiera zakładkę „Moje naprawy".
3. Widzi listę wszystkich zgłoszeń z aktualnym statusem i datami.
4. Filtruje naprawy po statusie (w toku, zakończone, odbiór itd.).

---

### SC-K-02 — Sprawdzenie szczegółów konkretnej naprawy
**Aktor:** Zalogowany klient  
**Ścieżka:** `/client/naprawy/[id]`  
**Kroki:**
1. Klient klika w wybraną naprawę na liście.
2. Widzi: opis urządzenia i problemu, aktualny status, oś czasu historii statusów.
3. Przegląda historię komunikacji z serwisem (wiadomości, odpowiedzi na pytania).
4. Widzi szacowany koszt naprawy (jeśli wycena została przesłana).
5. Widzi koszt końcowy (po zakończeniu naprawy).

---

### SC-K-03 — Akceptacja wyceny naprawy
**Aktor:** Zalogowany klient, który otrzymał wycenę  
**Ścieżka:** `/client/naprawy/[id]`  
**Kroki:**
1. Klient otrzymuje powiadomienie o przesłanej wycenie (e-mail lub w panelu).
2. Otwiera stronę naprawy.
3. Zapoznaje się z wyceną (zakres prac, koszt, czas realizacji).
4. Klika „Akceptuj wycenę" lub „Odrzuć wycenę".
5. System zmienia status naprawy odpowiednio na `QUOTE_ACCEPTED` lub inicjuje proces zamknięcia.

---

### SC-K-04 — Edycja profilu klienta
**Aktor:** Zalogowany klient  
**Ścieżka:** `/client/profil`  
**Kroki:**
1. Klient otwiera stronę profilu.
2. Aktualizuje dane osobowe: imię, nazwisko, telefon, adresy.
3. Zmienia hasło (podaje stare hasło i dwukrotnie nowe).
4. Zapisuje zmiany.

---

### SC-K-05 — Odbiór powiadomień w panelu
**Aktor:** Zalogowany klient  
**Ścieżka:** Panel klienta  
**Kroki:**
1. Klient widzi badge z liczbą nieprzeczytanych powiadomień.
2. Otwiera listę powiadomień.
3. Czyta informacje o zmianie statusu, gotowości do odbioru, wycenach itd.
4. Oznacza powiadomienia jako przeczytane.

---

### SC-K-06 — Wylogowanie z panelu klienta
**Aktor:** Zalogowany klient  
**Kroki:**
1. Klient klika przycisk wylogowania.
2. System unieważnia token sesji (`POST /api/v1/accounts/logout/`).
3. Klient zostaje przekierowany na stronę logowania.

---

## 3. SCENARIUSZE PRACOWNIKA (STAFF)

### SC-P-01 — Logowanie do panelu pracownika
**Aktor:** Pracownik/technik  
**Ścieżka:** `/panel/login`  
**Kroki:**
1. Pracownik otwiera panel (`/panel/login`).
2. Podaje e-mail służbowy i hasło.
3. System weryfikuje rolę (`staff` lub `admin`) i przekierowuje do dashboardu.
4. Administrator zostaje automatycznie przekierowany do `/admin-panel/dashboard`.

---

### SC-P-02 — Przegląd dashboardu i kolejki pracy
**Aktor:** Zalogowany pracownik  
**Ścieżka:** `/panel/dashboard`  
**Kroki:**
1. Pracownik loguje się i widzi dashboard.
2. Sprawdza KPI: liczba aktywnych napraw, oczekujące diagnostyki, czekające na części, ukończone dziś.
3. Przegląda feed ostatnich aktywności i przypomnienia o zadaniach.
4. Sprawdza statystyki własnej wydajności.

---

### SC-P-03 — Przyjęcie nowego zgłoszenia (intake)
**Aktor:** Pracownik recepcji / technik  
**Ścieżka:** `/panel/intake`, `/panel/zgloszenia`  
**Kroki:**
1. Pracownik wchodzi na listę nowych zgłoszeń lub do modułu intake.
2. Wybiera zgłoszenie ze statusem `NOWE`.
3. Weryfikuje dane klienta i urządzenia.
4. Fizycznie przyjmuje urządzenie — wypełnia protokół przyjęcia (stan wizualny, kompletność, akcesoria).
5. Generuje/drukuje protokół przyjęcia z kodem QR/kreskowym.
6. Zmienia status zgłoszenia na `ACCEPTED`.
7. Przypisuje naprawę do konkretnego technika lub pozostawia w puli.

---

### SC-P-04 — Przeprowadzenie diagnostyki
**Aktor:** Technik  
**Ścieżka:** `/panel/repairs/[id]`  
**Kroki:**
1. Technik otwiera przypisaną naprawę.
2. Zmienia status na `IN_DIAGNOSTICS`.
3. Dodaje notatki wewnętrzne o stanie urządzenia.
4. Po zakończeniu diagnostyki zmienia status na `DIAGNOSTICS_DONE`.
5. Przygotowuje wycenę naprawy (koszt, zakres, czas).

---

### SC-P-05 — Wysłanie wyceny do klienta
**Aktor:** Technik / pracownik  
**Ścieżka:** `/panel/repairs/[id]`  
**Kroki:**
1. Pracownik wprowadza szacowany koszt naprawy.
2. Zmienia status na `QUOTE_PENDING`, następnie wysyła wycenę (`QUOTE_SENT`).
3. System wysyła e-mail do klienta z wycenami.
4. Pracownik czeka na akceptację lub odrzucenie przez klienta.

---

### SC-P-06 — Zarządzanie statusem naprawy
**Aktor:** Technik  
**Ścieżka:** `/panel/repairs/[id]` → modal zmiany statusu  
**Kroki:**
1. Technik klika przycisk zmiany statusu w widoku naprawy.
2. Otwiera się modal zmiany statusu (`StatusChangeModal`).
3. Wybiera nowy status ze ścieżki workflow:
   - `IN_REPAIR` → `TESTING` → `REPAIR_DONE` → `READY_FOR_PICKUP`
   - lub specjalne: `WAITING_FOR_PARTS`, `UNREPAIRABLE`, `CANCELLED`
4. Opcjonalnie dodaje notatkę do zmiany statusu.
5. Zapisuje — status zostaje zaktualizowany, klient otrzymuje powiadomienie.

---

### SC-P-07 — Dodawanie notatek wewnętrznych i publicznych
**Aktor:** Technik  
**Ścieżka:** `/panel/repairs/[id]` → modal notatek  
**Kroki:**
1. Pracownik klika „Dodaj notatkę".
2. Wybiera typ notatki: wewnętrzna (widoczna tylko dla personelu) lub publiczna (widoczna dla klienta).
3. Wpisuje treść.
4. Zapisuje — notatka zostaje przypisana do naprawy z datą i autorem.

---

### SC-P-08 — Przypisanie naprawy do technika
**Aktor:** Pracownik z uprawnieniem do przypisywania  
**Ścieżka:** `/panel/repairs/[id]` → modal przypisania  
**Kroki:**
1. Pracownik otwiera modal przypisania (`AssignModal`).
2. Widzi listę dostępnych techników z informacją o ich aktualnym obciążeniu i specjalizacji.
3. Wybiera technika i potwierdza.
4. Technik otrzymuje powiadomienie o nowym przypisaniu.

---

### SC-P-09 — Obsługa napraw nieprzypisanych
**Aktor:** Technik  
**Ścieżka:** `/panel/nieprzypisane`  
**Kroki:**
1. Technik otwiera listę nieprzypisanych napraw.
2. Wybiera naprawę pasującą do jego specjalizacji.
3. Przypisuje ją do siebie lub zgłasza kierownikowi.

---

### SC-P-10 — Zarządzanie danymi klientów
**Aktor:** Pracownik  
**Ścieżka:** `/panel/klienci`, `/panel/klienci/[id]`  
**Kroki:**
1. Pracownik wyszukuje klienta po nazwisku, e-mailu lub telefonie.
2. Otwiera kartę klienta.
3. Przegląda historię wszystkich napraw klienta.
4. Sprawdza dane kontaktowe i segmentację (NOWY, POWRACAJĄCY, REGULARNY, VIP, BIZNESOWY).
5. Opcjonalnie edytuje dane klienta (`/panel/klienci/[id]/edit`).
6. Dodaje wewnętrzne notatki o kliencie.

---

### SC-P-11 — Obsługa odbiorów urządzeń
**Aktor:** Pracownik recepcji  
**Ścieżka:** `/panel/odbiory`  
**Kroki:**
1. Pracownik otwiera listę napraw gotowych do odbioru.
2. Wyszukuje naprawę po numerze RMA lub danych klienta.
3. Potwierdza odbiór — weryfikuje tożsamość klienta.
4. Rejestruje odbiór — zmienia status na `PICKED_UP`.
5. Opcjonalnie rejestruje płatność (jeśli jeszcze niepłacone).

---

### SC-P-12 — Obsługa wysyłki kurierskiej
**Aktor:** Pracownik  
**Ścieżka:** `/panel/repairs/[id]`  
**Kroki:**
1. Pracownik potwierdza naprawę gotową do wysyłki.
2. Generuje/wprowadza numer listu przewozowego.
3. Zmienia status na `SHIPPED`.
4. Klient otrzymuje powiadomienie z numerem śledzenia.
5. Po dostarczeniu status zmienia się na `DELIVERED`.

---

### SC-P-13 — Komunikacja z klientem
**Aktor:** Pracownik  
**Ścieżka:** `/panel/komunikacja`, `/panel/repairs/[id]`  
**Kroki:**
1. Pracownik przegląda historię komunikacji z klientem.
2. Wysyła wiadomość/odpowiedź na pytanie klienta przez panel.
3. System wysyła e-mail do klienta i loguje komunikację w bazie.
4. Opcjonalnie używa szablonów wiadomości (np. „Naprawa gotowa", „Wycena").

---

### SC-P-14 — Zarządzanie częściami i dostawcami
**Aktor:** Pracownik  
**Ścieżka:** `/panel/czesci-hurtownie`, `/panel/hurtownie`  
**Kroki:**
1. Pracownik wyszukuje potrzebną część w bazie.
2. Sprawdza dostępność u dostawców i ceny.
3. Oznacza naprawę jako `WAITING_FOR_PARTS`.
4. Po otrzymaniu części aktualizuje naprawę i zmienia status na `IN_REPAIR`.

---

### SC-P-15 — Zarządzanie zadaniami (to-do)
**Aktor:** Pracownik  
**Ścieżka:** `/panel/zadania`  
**Kroki:**
1. Pracownik przegląda listę swoich zadań i terminów.
2. Tworzy nowe zadanie (manualne lub powiązane z naprawą).
3. Ustawia termin wykonania i priorytet.
4. Oznacza zadania jako ukończone.

---

### SC-P-16 — Obsługa kalendarza i dostępności
**Aktor:** Pracownik  
**Ścieżka:** `/panel/kalendarz`, `/panel/dostepnosc`  
**Kroki:**
1. Pracownik otwiera swój kalendarz.
2. Przegląda zaplanowane naprawy i terminy realizacji.
3. Ustawia swoją dostępność (dni i godziny pracy).
4. Zgłasza nieobecność lub urlop.

---

### SC-P-17 — Przeglądanie powiadomień
**Aktor:** Pracownik  
**Ścieżka:** `/panel/powiadomienia`  
**Kroki:**
1. Pracownik widzi badge z liczbą nowych powiadomień.
2. Otwiera listę powiadomień (przypisanie naprawy, wiadomość od klienta, zmiana statusu, przyjście części).
3. Klika w powiadomienie, by przejść do powiązanej naprawy.
4. Oznacza powiadomienia jako przeczytane / archiwizuje.

---

### SC-P-18 — Przeglądanie własnych statystyk
**Aktor:** Pracownik  
**Ścieżka:** `/panel/statystyki`  
**Kroki:**
1. Pracownik otwiera sekcję statystyk.
2. Widzi swoje KPI: liczba ukończonych napraw, średni czas naprawy, koszty, trendy.
3. Filtruje dane po okresie (tydzień, miesiąc, rok).

---

### SC-P-19 — Wyszukiwanie globalne
**Aktor:** Pracownik  
**Ścieżka:** `/panel/wyszukiwanie`  
**Kroki:**
1. Pracownik otwiera wyszukiwarkę.
2. Wpisuje frazę (numer RMA, imię klienta, model urządzenia).
3. System zwraca dopasowania z napraw, klientów, urządzeń.
4. Pracownik klika w wynik, by przejść do szczegółów.

---

### SC-P-20 — Obsługa reklamacji i gwarancji
**Aktor:** Pracownik  
**Ścieżka:** `/panel/reklamacje`  
**Kroki:**
1. Pracownik otwiera listę reklamacji/zgłoszeń gwarancyjnych.
2. Sprawdza, czy naprawa mieści się w okresie gwarancji.
3. Przyjmuje lub odrzuca reklamację.
4. Tworzy naprawę powiązaną (typ `complaint`) i przypisuje technika.

---

### SC-P-21 — Przeglądanie archiwum napraw
**Aktor:** Pracownik  
**Ścieżka:** `/panel/historia`  
**Kroki:**
1. Pracownik otwiera archiwum zakończonych napraw.
2. Wyszukuje naprawę po dacie, kliencie lub numerze RMA.
3. Przegląda historię statusów i notatki archiwalne.

---

### SC-P-22 — Edycja własnego profilu
**Aktor:** Pracownik  
**Ścieżka:** `/panel/profil`  
**Kroki:**
1. Pracownik otwiera stronę profilu.
2. Aktualizuje dane kontaktowe.
3. Zmienia hasło.
4. Zapisuje zmiany.

---

## 4. SCENARIUSZE ADMINISTRATORA (ADMIN)

> Administrator ma dostęp do **wszystkich scenariuszy pracownika** oraz dodatkowo do poniższych.

### SC-A-01 — Logowanie do panelu admina
**Aktor:** Administrator  
**Ścieżka:** `/panel/login` → auto-redirect do `/admin-panel/dashboard`  
**Kroki:**
1. Admin loguje się przez ten sam formularz co pracownik.
2. System rozpoznaje rolę `admin` i przekierowuje do `/admin-panel/dashboard`.

---

### SC-A-02 — Przegląd globalnego dashboardu
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/dashboard`  
**Kroki:**
1. Admin widzi pełne KPI systemu: wszystkie aktywne naprawy, statusy, obciążenie zespołu.
2. Widzi statystyki przychodów, czasu realizacji, liczby klientów.
3. Przegląda alerty systemowe i powiadomienia wymagające uwagi.

---

### SC-A-03 — Zarządzanie zespołem pracowników
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/team`  
**Kroki:**
1. Admin otwiera stronę zarządzania zespołem.
2. Widzi listę wszystkich pracowników z ich: statusem (aktywny/nieaktywny), specjalizacją, liczbą aktywnych napraw.
3. **Tworzenie konta pracownika:** wypełnia dane (imię, e-mail, rola, specjalizacja, kolor w kalendarzu, uprawnienie do napraw kurierskich).
4. **Edycja pracownika:** zmienia specjalizację, dostępność, uprawnienia.
5. **Dezaktywacja konta:** pracownik traci dostęp do panelu (`POST /api/v1/accounts/staff/<id>/deactivate/`).
6. **Aktywacja konta:** przywrócenie dostępu (`POST /api/v1/accounts/staff/<id>/activate/`).
7. **Reset hasła:** wymuszony reset hasła pracownika (`POST /api/v1/accounts/staff/<id>/reset-password/`).
8. Sprawdza historię logowań pracownika (`GET /api/v1/accounts/staff/<id>/login-activity/`).

---

### SC-A-04 — Analiza obciążenia pracowników
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/workload`  
**Kroki:**
1. Admin otwiera widok obciążenia zespołu.
2. Widzi liczby aktywnych napraw przypisanych do każdego technika.
3. Identyfikuje przeciążonych i niedociążonych pracowników.
4. Ręcznie przepisuje naprawy między technikami dla wyrównania obciążenia (bulk assign: `AdminAssignRepairsModal`).

---

### SC-A-05 — Masowe przypisywanie napraw
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/repairs` lub `/admin-panel/unassigned`  
**Kroki:**
1. Admin zaznacza wiele napraw z listy nieprzypisanych.
2. Otwiera modal masowego przypisania.
3. Wybiera technika i potwierdza.
4. Wszystkie zaznaczone naprawy zostają przypisane jednocześnie.

---

### SC-A-06 — Przeglądanie statystyk systemowych
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/stats`  
**Kroki:**
1. Admin otwiera moduł statystyk.
2. Filtruje po zakresie dat, pracowniku, kategorii urządzeń.
3. Analizuje: wskaźnik ukończenia napraw, średni czas realizacji, przychody, koszty części, satysfakcję klientów.
4. Porównuje wyniki poszczególnych pracowników.
5. Eksportuje dane (jeśli funkcja dostępna).

---

### SC-A-07 — Konfiguracja systemu
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/config`  
**Kroki:**
1. Admin otwiera panel konfiguracyjny.
2. Konfiguruje ustawienia e-mail (SMTP, szablony wiadomości).
3. Konfiguruje SMS (dostawca, szablony).
4. Zarządza szablonami statusów napraw i komunikatów do klientów.
5. Ustawia cennik usług (orientacyjne stawki, progi cenowe).
6. Konfiguruje godziny otwarcia i dni wolne.

---

### SC-A-08 — Zarządzanie bazą klientów (pełne uprawnienia)
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/clients`, `/admin-panel/clients/[id]`  
**Kroki:**
1. Admin przegląda pełną bazę klientów.
2. Widzi pełne dane: segmentację (NOWY, POWRACAJĄCY, REGULARNY, VIP, BIZNESOWY), łączne wydatki, liczbę napraw.
3. Nadaje/odbiera status VIP.
4. Dodaje klienta na czarną listę (`is_blacklisted`).
5. Usuwa klienta (soft delete, dane zostają w systemie).
6. Edytuje wszystkie dane klienta, w tym dane firmowe (jeśli klient biznesowy).

---

### SC-A-09 — Pełne zarządzanie wszystkimi naprawami
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/repairs`  
**Kroki:**
1. Admin widzi wszystkie naprawy w systemie (bez ograniczeń przypisania).
2. Filtruje po: pracowniku, statusie, priorytecie, źródle zgłoszenia, dacie, typie urządzenia.
3. Może zmienić status, przypisanie, priorytet dowolnej naprawy.
4. Może anulować lub zamknąć dowolną naprawę.
5. Ustawia priorytet: NISKI, NORMALNY, WYSOKI, PILNY, SAME_DAY.

---

### SC-A-10 — Zarządzanie globalnym kalendarzem i dostępnością
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/calendar`, `/admin-panel/availability`  
**Kroki:**
1. Admin otwiera master calendar z widokiem całego zespołu.
2. Widzi zaplanowane naprawy i dostępność wszystkich techników.
3. Akceptuje lub odrzuca wnioski o nieobecność pracowników.
4. Konfiguruje globalne godziny otwarcia i harmonogram pracy.
5. Blokuje wybrane dni (święta, przerwy techniczne).

---

### SC-A-11 — Zarządzanie zamówieniami i inwentarzem
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/orders`, `/admin-panel/parts`, `/admin-panel/hurtownie`  
**Kroki:**
1. Admin przegląda zamówienia na części i akcesoria.
2. Zarządza bazą dostawców (dodaje, edytuje, usuwa: `SupplierFormModal`).
3. Przegląda stan magazynowy części.
4. Generuje zamówienia do hurtowni.

---

### SC-A-12 — Zarządzanie reklamacjami (pełne uprawnienia)
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/claims`  
**Kroki:**
1. Admin przegląda wszystkie zgłoszone reklamacje.
2. Sprawdza historię naprawy bazowej i terminy gwarancji.
3. Akceptuje reklamację i tworzy naprawę gwarancyjną lub ją odrzuca (z uzasadnieniem).
4. Przypisuje naprawę gwarancyjną do odpowiedniego technika.
5. Śledzi postęp reklamacji do zamknięcia.

---

### SC-A-13 — Przeglądanie globalnej komunikacji
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/comm`  
**Kroki:**
1. Admin przegląda historię wszystkich wiadomości wysłanych i odebranych w systemie.
2. Monitoruje komunikację pracownicy–klienci.
3. Sprawdza logi e-mailowe i SMS.

---

### SC-A-14 — Zarządzanie powiadomieniami administracyjnymi
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/notif`  
**Kroki:**
1. Admin odbiera powiadomienia systemowe: błędy, alerty o przekroczonych terminach, nowe zgłoszenia wymagające uwagi.
2. Przegląda szczegóły powiadomień (`/admin-panel/notif/[id]`).
3. Oznacza jako przeczytane lub archiwizuje.

---

### SC-A-15 — Przeglądanie globalnego archiwum
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/archive`  
**Kroki:**
1. Admin otwiera archiwum wszystkich zakończonych napraw.
2. Przeszukuje po dowolnym kryterium (klient, pracownik, data, model urządzenia, koszt).
3. Pobiera dane historyczne do analiz.

---

### SC-A-16 — Globalne wyszukiwanie
**Aktor:** Administrator  
**Ścieżka:** `/admin-panel/search`  
**Kroki:**
1. Admin korzysta z globalnej wyszukiwarki systemu.
2. Wyszukuje naprawy, klientów, pracowników, urządzenia jednocześnie.
3. Stosuje zaawansowane filtry.

---

## PODSUMOWANIE RÓL I DOSTĘPÓW

| Obszar | Gość | Klient | Pracownik | Admin |
|--------|------|--------|-----------|-------|
| Przeglądanie oferty / bloga | ✅ | ✅ | ✅ | ✅ |
| Zgłoszenie naprawy (formularz) | ✅ | ✅ | — | — |
| Śledzenie statusu (bez konta) | ✅ | ✅ | — | — |
| Zgłoszenie reklamacji | ✅ | ✅ | — | — |
| Panel klienta (własne naprawy) | — | ✅ | — | — |
| Akceptacja wyceny | — | ✅ | — | — |
| Panel pracownika | — | — | ✅ | ✅ |
| Intake / przyjęcie sprzętu | — | — | ✅ | ✅ |
| Zmiana statusów napraw | — | — | ✅ | ✅ |
| Zarządzanie klientami (edycja) | — | — | ✅ | ✅ |
| Zarządzanie częściami | — | — | ✅ | ✅ |
| Zarządzanie zespołem | — | — | — | ✅ |
| Analiza obciążenia | — | — | — | ✅ |
| Konfiguracja systemu | — | — | — | ✅ |
| Statystyki globalne | — | — | — | ✅ |
| Zarządzanie dostępnością (cały zespół) | — | — | — | ✅ |
| Dezaktywacja kont pracowników | — | — | — | ✅ |
| VIP / czarna lista klientów | — | — | — | ✅ |

---

*Dokument wygenerowany automatycznie na podstawie analizy kodu źródłowego aplikacji PRO-KOM Serwis.*  
*Data: 2026-04-25*
