# PRO-KOM SERWIS — PEŁNY AUDYT POKRYCIA BACKEND → FRONTEND

## Cel dokumentu

Ten dokument sprawdza, czy funkcjonalności backendowe systemu PRO-KOM mają swoje odpowiedniki na frontendzie.

Audyt ma wykryć:
- luki funkcjonalne,
- moduły nieodwzorowane na frontendzie,
- moduły odwzorowane częściowo,
- rzeczy wymagające dopracowania UX,
- rzeczy wymagające dodatkowych ekranów lub akcji.

Statusy użyte w audycie:
- **OK** — pokrycie frontendowe jest uwzględnione
- **CZĘŚCIOWO** — funkcja istnieje koncepcyjnie, ale wymaga doprecyzowania / dodatkowych ekranów
- **BRAK** — brak wyraźnego odwzorowania na frontendzie
- **DO DOPRACOWANIA** — jest na froncie, ale wymaga pełniejszego rozpisania

---

# 1. Warstwy frontendu objęte audytem

## Frontend publiczny
- strona główna
- podstrony usług
- Hammer Glass
- Akcesoria GSM
- formularz zgłoszenia
- blog / FAQ / kontakt / regulamin

## Panel klienta
- naprawy
- wyceny
- wiadomości
- historia
- konto / RODO

## Panel staff
- dashboard
- naprawy
- szczegóły napraw
- zadania
- powiadomienia
- dostępność
- global search
- odbiory
- kalendarz

## Panel admina
- dashboard
- zespół
- statystyki
- reklamacje / gwarancje
- zamówienia admina
- części / hurtownie
- konfiguracje zespołu
- pełna analityka

---

# 2. AUDYT MODUŁÓW

## 2.1 Accounts / zespół / role / logowanie

### 1. Logowanie użytkowników
- Backend: pełne wsparcie
- Frontend: ekran logowania dla klienta i osobno panelowego logowania staff/admin
- Status: **OK**

### 2. Konto klienta
- Frontend: profil klienta, historia napraw, zgody, RODO
- Status: **OK**

### 3. Konto pracownika / admina
- Frontend: avatar, profil bazowy, dostęp do panelu
- Status: **CZĘŚCIOWO**
- Brakujące / do dopracowania:
  - osobny ekran „Mój profil” dla staff/admin
  - zmiana podstawowych danych profilu
  - zmiana hasła użytkownika z poziomu własnego konta

### 4. Zarządzanie pracownikami przez admina
- Frontend: sekcja zespołu, lista pracowników, szczegóły pracownika
- Status: **OK**

### 5. Reset hasła pracownika przez admina
- Frontend: wspomniane koncepcyjnie
- Status: **CZĘŚCIOWO**
- Do dopracowania:
  - osobny modal / formularz resetu
  - wymuszenie zmiany hasła po pierwszym logowaniu
  - potwierdzenie akcji

### 6. Blokowanie / dezaktywacja konta
- Frontend: koncepcyjnie jest w zarządzaniu zespołem
- Status: **CZĘŚCIOWO**
- Do dopracowania:
  - status aktywne / zablokowane w tabeli pracowników
  - ekran potwierdzenia
  - historia zmian

### 7. Uprawnienia i role
- Frontend: opisane ogólnie
- Status: **CZĘŚCIOWO**
- Brakujące:
  - dokładny ekran uprawnień / roli
  - granularne uprawnienia, jeśli będą wdrażane
  - czytelny podgląd „co ten użytkownik może”

### 8. Aktywność logowania
- Frontend: wspomniana przy adminie
- Status: **CZĘŚCIOWO**
- Brakujące:
  - tabela login activity
  - filtry po dacie i użytkowniku
  - widok ostatniego logowania na liście pracowników

---

## 2.2 Klienci / firmy / karta klienta premium

### 1. Lista klientów
- Frontend: wspomniana w panelu staff/admin pośrednio przez global search i karty klienta
- Status: **CZĘŚCIOWO**
- Brakujące:
  - osobny ekran listy klientów
  - filtry: indywidualny / biznesowy / klient wraca / premium

### 2. Karta klienta premium
- Frontend: uwzględniona
- Status: **OK**

### 3. Obsługa firm
- Frontend: firma jako typ klienta
- Status: **CZĘŚCIOWO**
- Do dopracowania:
  - osobny layout karty firmy
  - sekcja urządzeń firmowych
  - sekcja historii firmowych zgłoszeń

### 4. Klient wraca
- Frontend: jest w global search i intake flow
- Status: **OK**

### 5. Segmentacja klientów
- Frontend: logicznie przewidziana, ale nie ma osobnego widoku zarządzania segmentami
- Status: **CZĘŚCIOWO**
- Brakujące:
  - badge segmentów na kartach
  - filtry po segmentach
  - admin view dla segmentacji klientów

### 6. Historia urządzeń klienta
- Frontend: jest na karcie klienta
- Status: **OK**

### 7. Historia wiadomości / zakupów / Hammer Glass / akcesoriów
- Frontend: przewidziane w karcie klienta premium
- Status: **CZĘŚCIOWO**
- Do dopracowania:
  - wyraźne sekcje per typ historii
  - filtry zakresu czasu

---

## 2.3 Devices / urządzenia / modele

### 1. Kategorie urządzeń
- Frontend: obsługiwane w formularzu i intake flow
- Status: **OK**

### 2. Standardowe modele urządzeń
- Frontend: obsługiwane
- Status: **OK**

### 3. „Inne urządzenie”
- Frontend: wspomniane w logice
- Status: **CZĘŚCIOWO**
- Brakujące:
  - dokładny ekran / sekcja ręcznego wpisu
  - jasne pola: nazwa urządzenia / typ / marka / model / serial

### 4. Karta urządzenia
- Frontend: wspomniana w global search i historii urządzeń
- Status: **CZĘŚCIOWO**
- Brakujące:
  - osobny widok szczegółów urządzenia
  - historia wszystkich napraw danego urządzenia
  - szybka akcja „dodaj naprawę dla tego urządzenia”

---

## 2.4 Repairs / rdzeń napraw

### 1. Lista napraw
- Frontend: staff/admin/client
- Status: **OK**

### 2. Szczegóły naprawy
- Frontend: bardzo dobrze rozpisane
- Status: **OK**

### 3. Statusy publiczne
- Frontend: przewidziane
- Status: **OK**

### 4. Statusy wewnętrzne
- Frontend: przewidziane
- Status: **OK**

### 5. Contact status
- Frontend: częściowo widoczny przez „wymaga reakcji”
- Status: **CZĘŚCIOWO**
- Brakujące:
  - osobny widget / sekcja statusu kontaktowego
  - licznik „czeka na klienta od X dni” wszędzie gdzie potrzebne

### 6. Payment status
- Frontend: wspomniany pośrednio, ale nie rozpisany szczegółowo w UI
- Status: **CZĘŚCIOWO**
- Brakujące:
  - widoczność opłacone / zaliczka / nieopłacone w szczegółach naprawy
  - badge na liście napraw

### 7. Assignment history
- Frontend: nie opisano osobnej sekcji historii przypisań
- Status: **BRAK**
- Potrzebne:
  - sekcja historii przypisań w szczegółach naprawy

### 8. Status history
- Frontend: timeline częściowo to pokrywa
- Status: **OK**

### 9. Health score zgłoszenia
- Frontend: pojawia się w dashboardach, ale nie ma pełnego opisu widoku
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - widoczny wskaźnik w szczegółach naprawy
  - tooltip z wyjaśnieniem wyniku

### 10. SLA / opóźnienia
- Frontend: częściowo przez alerty i require reaction
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - badge SLA
  - informacja ile przekroczono
  - filtry „po SLA”

### 11. Kolejka pracy
- Frontend: dashboard staff częściowo to pokrywa
- Status: **OK**

### 12. Timeline naprawy
- Frontend: jest
- Status: **OK**

### 13. Ostatnie działania na naprawie
- Frontend: nie rozpisane jako osobna sekcja
- Status: **BRAK**
- Potrzebne:
  - mały panel „ostatnie działania”

### 14. Widok urządzeń nieodebranych
- Frontend: panel odbiorów pokrywa
- Status: **OK**

### 15. Szybkie przyjęcie
- Frontend: wspomniane logicznie, ale bez osobnego ekranu
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - dedykowany uproszczony flow szybkiego przyjęcia
  - skrócony wydruk A4

### 16. Umawianie napraw / same day
- Frontend: uwzględnione w kalendarzu
- Status: **OK**

### 17. Wysyłki / kurier / paczkomat
- Frontend: formularz publiczny uwzględnia, panel staff częściowo
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - widok szczegółów wysyłki w naprawie
  - dane paczkomatu / kuriera klienta
  - stan paczki i zdjęcia paczki

---

## 2.5 Communications / wiadomości / SMS / notatki

### 1. Wiadomości do klienta
- Frontend: są
- Status: **OK**

### 2. Komunikacja zespołowa przy naprawie
- Frontend: jest
- Status: **OK**

### 3. Notatki wewnętrzne
- Frontend: są
- Status: **OK**

### 4. Szablony wiadomości
- Frontend: koncepcyjnie są
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - pełny ekran/modał wyboru szablonów
  - preview
  - edycja
  - wybór kanału

### 5. Historia wysłanych wiadomości
- Frontend: częściowo w wątkach
- Status: **OK**

### 6. Historia SMS
- Frontend: wspomniana, ale brak szczegółowego opisu UI
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - osobna zakładka SMS w naprawie
  - status dostarczenia
  - błędy wysyłki

### 7. Powiadomienia systemowe staffu
- Frontend: dzwonek i lista są
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - pełna strona „powiadomienia”
  - filtry po typach
  - mark as read all
  - powiadomienia z zadań, reklamacji, dostępności, części

---

## 2.6 Pricing / wyceny / robocizna

### 1. Wycena naprawy
- Frontend: jest
- Status: **OK**

### 2. Wersje wyceny
- Frontend: nie rozpisane jako osobna historia wersji
- Status: **BRAK**
- Potrzebne:
  - lista wersji wyceny
  - podgląd różnic
  - kto i kiedy zmienił

### 3. Decyzja klienta do wyceny
- Frontend: jest w panelu klienta
- Status: **OK**

### 4. ETA / szacowany czas realizacji
- Frontend: jest
- Status: **OK**

### 5. Zaliczka
- Frontend: częściowo wspomniana
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - formularz zaliczki
  - widoczność kwoty zaliczki
  - powiązanie z payment status

### 6. Robocizna
- Frontend: wspomniana
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - osobna sekcja listy robocizny
  - dodawanie / edycja pozycji
  - podsumowanie kosztów

---

## 2.7 Inventory / części / hurtownie

### 1. Dodawanie części do naprawy
- Frontend: jest opisane
- Status: **OK**

### 2. Autocomplete części
- Frontend: opisane koncepcyjnie
- Status: **OK**

### 3. Status części: zamówiona / dotarła / użyta / niewykorzystana
- Frontend: nie rozpisane dokładnie w UI
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - badge statusu części
  - szybka zmiana statusu

### 4. Kolejka części do zamówienia
- Frontend: wspomniana w adminie
- Status: **OK**

### 5. Katalog części
- Frontend: jest
- Status: **OK**

### 6. Karta szczegółów części
- Frontend: nie rozpisana dokładnie w pliku frontendu
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - szczegóły części
  - ostatnia hurtownia
  - ostatnia cena
  - średnia cena
  - historia użycia
  - powiązane naprawy

### 7. Hurtownie
- Frontend: przewidziane
- Status: **OK**

### 8. Karta hurtowni
- Frontend: nie rozpisana szczegółowo
- Status: **BRAK**
- Potrzebne:
  - szczegóły hurtowni
  - historia zakupów
  - najczęściej używane części

---

## 2.8 Hammer Glass / akcesoria / upselle

### 1. Sekcja publiczna Hammer Glass
- Frontend: jest
- Status: **OK**

### 2. Dobór folii Hammer Glass
- Frontend: jest
- Status: **OK**

### 3. Integracja Hammer Glass z formularzem i naprawą
- Frontend: jest
- Status: **OK**

### 4. Statystyki Hammer Glass dla admina
- Frontend: wspomniane
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - osobny widget / dashboard
  - wykresy i tabele

### 5. Sekcja akcesoriów GSM na stronie
- Frontend: jest
- Status: **OK**

### 6. Inteligentne upselle w formularzu i staff panelu
- Frontend: są opisane
- Status: **OK**

### 7. Statystyki akcesoriów
- Frontend: wspomniane, ale nie rozpisane szczegółowo
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - osobne wykresy / tabele admina

---

## 2.9 Complaints / warranties

### 1. Lista reklamacji
- Frontend: jest
- Status: **OK**

### 2. Lista gwarancji
- Frontend: jest
- Status: **OK**

### 3. Badge reklamacja / gwarancja
- Frontend: jest
- Status: **OK**

### 4. Powiązanie z naprawą źródłową
- Frontend: wspomniane
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - wyraźna sekcja „naprawa źródłowa”
  - sekcja „powiązane reklamacje / gwarancje” w naprawie standardowej

### 5. Decyzje reklamacyjne / gwarancyjne
- Frontend: nie rozpisane szczegółowo
- Status: **BRAK**
- Potrzebne:
  - formularz decyzji
  - status uznana / odrzucona
  - koszt po stronie firmy

---

## 2.10 Tasks

### 1. Lista zadań pracownika
- Frontend: jest
- Status: **OK**

### 2. Lista wszystkich zadań dla admina
- Frontend: jest
- Status: **OK**

### 3. Szczegóły zadania
- Frontend: są
- Status: **OK**

### 4. Komentarze w zadaniu
- Frontend: są
- Status: **OK**

### 5. Historia zmian zadania
- Frontend: wspomniana, ale nie rozpisana
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - mały activity log w zadaniu

### 6. Powiązania z naprawą / klientem / zamówieniem
- Frontend: wspomniane
- Status: **OK**

---

## 2.11 Employee availability

### 1. Dodawanie własnej dostępności
- Frontend: logicznie jest
- Status: **OK**

### 2. Edycja własnej dostępności
- Frontend: koncepcyjnie jest
- Status: **OK**

### 3. Admin edytuje wszystkich
- Frontend: jest
- Status: **OK**

### 4. Widok dostępności zespołu
- Frontend: jest
- Status: **OK**

### 5. Osobna lista / panel dostępności
- Frontend: częściowo
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - dedykowany ekran tabelaryczny dostępności

---

## 2.12 Search

### 1. Global search w top barze
- Frontend: jest
- Status: **OK**

### 2. Wyniki grupowane
- Frontend: są
- Status: **OK**

### 3. Intake search przy nowej naprawie
- Frontend: jest
- Status: **OK**

### 4. Advanced search
- Frontend: nie został szczegółowo rozpisany jako osobny ekran
- Status: **BRAK**
- Potrzebne:
  - dedykowany ekran advanced search
  - filtry
  - zapis ostatnich wyszukiwań

### 5. Szybkie akcje w wynikach
- Frontend: opisane
- Status: **OK**

---

## 2.13 Orders admina / zaopatrzenie

### 1. Dashboard zamówień
- Frontend: jest
- Status: **OK**

### 2. Zamówienia klientów
- Frontend: są
- Status: **OK**

### 3. Braki na sklep
- Frontend: są
- Status: **OK**

### 4. Szybkie dodawanie braków
- Frontend: opisane koncepcyjnie
- Status: **OK**

### 5. Lista „Do zamówienia dziś”
- Frontend: jest
- Status: **OK**

### 6. Grupowanie po hurtowniach
- Frontend: wspomniane, ale nie rozpisane na widoku
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - osobny grouped view

### 7. Historia cen produktów
- Frontend: wspomniana
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - karta produktu zamówień
  - wykres / lista historii cen

### 8. Marża
- Frontend: logicznie jest
- Status: **OK**

### 9. Produkty z napraw
- Frontend: jest
- Status: **OK**

### 10. Katalog produktów zamówień
- Frontend: jest
- Status: **OK**

### 11. Karta produktu zamówień
- Frontend: nie rozpisana w pełni
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - szczegóły produktu
  - historia cen
  - ostatnia hurtownia
  - powiązane zamówienia

---

## 2.14 Documents / PDF / QR / etykiety

### 1. Dokument przyjęcia
- Frontend: szybka akcja wydruku
- Status: **OK**

### 2. Dokument wydania
- Frontend: szybka akcja wydruku
- Status: **OK**

### 3. Etykiety QR
- Frontend: szybka akcja wydruku
- Status: **OK**

### 4. Historia dokumentów
- Frontend: wspomniana
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - lista wygenerowanych dokumentów przy naprawie

---

## 2.15 Photos / before-after

### 1. Zdjęcia przed / w trakcie / po / paczka
- Frontend: są
- Status: **OK**

### 2. Widoczność dla klienta
- Frontend: wspomniana
- Status: **OK**

### 3. Galeria filtrowana typami
- Frontend: wspomniana
- Status: **OK**

---

## 2.16 Surveys / satisfaction

### 1. Ankieta satysfakcji
- Frontend: wspomniana w panelu klienta
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - osobny ekran / modal ankiety
  - przekierowanie do Google przy 4–5

---

## 2.17 RODO / compliance / backup / audit

### 1. Zgody klienta
- Frontend: częściowo w profilu klienta
- Status: **OK**

### 2. Wniosek o eksport danych
- Frontend: jest w panelu klienta
- Status: **OK**

### 3. Wniosek o usunięcie danych
- Frontend: jest
- Status: **OK**

### 4. Panel admina RODO
- Frontend: wspomniany, ale nie rozpisany szczegółowo
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - lista wniosków
  - statusy
  - obsługa żądania
  - log realizacji

### 5. Backup log
- Frontend: wspomniany ogólnie
- Status: **BRAK**
- Potrzebne:
  - ekran backupów
  - data, status, typ backupu

### 6. Audit log
- Frontend: nie rozpisany jako osobny ekran
- Status: **BRAK**
- Potrzebne:
  - widok logów operacji dla admina
  - filtry po użytkowniku / obiekcie / dacie

---

## 2.18 Analytics / KPI / wykresy

### 1. Dashboard admina
- Frontend: jest
- Status: **OK**

### 2. Dashboard staff quality metrics
- Frontend: częściowo
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - osobny blok jakości pracy
  - reklamacyjność
  - średni czas odpowiedzi
  - liczba wiadomości do klientów
  - liczba niezamkniętych spraw

### 3. Health score pracownika
- Frontend: wspomniany
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - sposób prezentacji
  - szczegóły co wpływa na wynik

### 4. KPI Hammer / akcesoria / SMS / zamówienia
- Frontend: ogólnie są
- Status: **CZĘŚCIOWO**
- Potrzebne:
  - konkretne karty i wykresy per moduł

---

# 3. PODSUMOWANIE LUK

## Najważniejsze rzeczy, które są jeszcze niepełne lub brakują na frontendzie

### BRAK / wymagają dodania jako osobne widoki
1. historia przypisań napraw
2. ostatnie działania na naprawie
3. historia wersji wyceny
4. karta hurtowni
5. decyzje reklamacyjne / gwarancyjne
6. advanced search screen
7. backup log admina
8. audit log admina

### CZĘŚCIOWO / wymagają dopracowania
1. profil staff/admin
2. reset hasła pracownika
3. granularne role / permissions UI
4. aktywność logowania
5. lista klientów / filtracja klientów
6. karta firmy
7. karta urządzenia
8. payment status na frontendzie
9. health score zgłoszenia
10. SLA i opóźnienia w bardziej czytelnym UI
11. szybkie przyjęcie — osobny flow
12. szczegóły wysyłki
13. zakładka SMS
14. pełny wybór szablonów wiadomości
15. zaliczki
16. robocizna jako pełny panel
17. karta części
18. statystyki Hammer Glass / akcesoriów / SMS
19. sekcja naprawa źródłowa dla reklamacji/gwarancji
20. historia zmian zadania
21. osobna lista dostępności
22. grouped view zamówień po hurtowniach
23. karta produktu zamówień
24. ankieta satysfakcji jako pełny ekran
25. panel admina RODO z pełną obsługą
26. dashboard quality metrics staffu

---

# 4. WNIOSEK KOŃCOWY

## Czy wszystkie funkcjonalności backendu są odwzorowane na frontendzie?
**Nie, jeszcze nie w 100%.**

## Czy większość kluczowych funkcji ma już frontendową mapę?
**Tak.**

## Czy można już bezpiecznie budować frontend?
**Tak, ale z tym audytem jako checklistą braków.**

Największe luki są nie w rdzeniu systemu, tylko w modułach:
- compliance,
- audit,
- backup,
- advanced search,
- wersjonowanie wycen,
- karty szczegółów niektórych obiektów,
- pełne analityki admina i quality metrics staffu.

---

# 5. REKOMENDOWANY NASTĘPNY KROK

Na podstawie tego audytu najrozsądniej zrobić teraz:

## ETAP A — domknięcie specyfikacji frontendu
Dopisać brakujące ekrany:
- advanced search
- audit log
- backup log
- historia wersji wyceny
- karta hurtowni
- karta części
- karta produktu zamówień
- panel RODO admina

## ETAP B — matryca ekran → endpoint API
Dla każdego widoku rozpisać:
- endpointy GET
- endpointy POST/PATCH/DELETE
- role
- stany pustych danych
- szybkie akcje

## ETAP C — priorytety implementacji
Podzielić frontend na:
- MVP
- V1 operacyjne
- V2 premium admin / analityka
