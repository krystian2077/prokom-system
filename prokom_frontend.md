# PRO-KOM SERWIS — PEŁNE PODSUMOWANIE FRONTENDU APLIKACJI

## 1. Cel frontendu

Frontend systemu PRO-KOM ma obsługiwać dwa główne światy:
1. **część publiczną / klienta**
2. **część wewnętrzną / staff / admin**

Ma być:
- nowoczesny,
- szybki,
- bardzo czytelny,
- premium,
- intuicyjny,
- spójny wizualnie,
- łatwy do rozwijania,
- podzielony na logiczne moduły.

Frontend ma nie tylko „ładnie wyglądać”, ale realnie:
- zwiększać konwersję na zgłoszenia,
- budować zaufanie,
- przyspieszać pracę zespołu,
- porządkować informacje,
- wspierać sprzedaż akcesoriów i Hammer Glass,
- dawać adminowi szybki dostęp do danych i narzędzi.

---

# 2. Stack technologiczny frontendu

## Główny stack
- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**

## Dodatkowe założenia
- App Router
- komponenty modułowe
- czytelny podział na feature folders
- SSR tam, gdzie daje wartość
- client components tylko tam, gdzie faktycznie są potrzebne
- centralna warstwa API client
- wspólny system layoutów
- spójny design system

---

# 3. Główne założenia UX/UI

Frontend ma być:

## Dla klienta:
- prosty,
- elegancki,
- zrozumiały,
- czytelny na telefonie,
- budzący zaufanie,
- nowoczesny,
- bez chaosu.

## Dla staff/admina:
- szybki,
- bardzo praktyczny,
- uporządkowany,
- oparty o dashboardy,
- z szybkim dostępem do akcji,
- z mocnym systemem wyszukiwania,
- z małą liczbą kliknięć.

---

# 4. Styl wizualny aplikacji

## Kolory
### Tło główne
- `#ffffff`

### Tekst główny
- `#111111`

### Akcent główny
- czerwony: `#d60000`

### Akcent pomocniczy
- grafit / ciemnoszary: `#333333`

### Kolory statusowe
- sukces / zakończone / zielony health: zieleń
- ostrzeżenia / czeka / ważne: pomarańcz
- błąd / pilne / krytyczne: czerwony
- informacyjne / gwarancja / neutralne: niebieski / szary

## Charakter wizualny
- minimalistyczny
- premium
- techniczny
- nowoczesny
- czytelny
- bez przesadnych ozdobników

## Karty i sekcje
- jasne tło
- subtelny border
- miękkie cienie
- lekko zaokrąglone rogi
- premium gradienty tylko tam, gdzie mają sens:
  - Hammer Glass
  - hero
  - wyróżnione sekcje

---

# 5. Architektura frontendu

## Proponowana struktura
```text
frontend/
├── app/
│   ├── (public)/
│   ├── (client)/
│   ├── (staff)/
│   ├── (admin)/
│   └── api/
├── components/
├── features/
├── lib/
├── hooks/
├── services/
├── types/
├── public/
├── styles/
└── utils/
```

## Podział logiczny
### `(public)`
- strona główna
- podstrony usług
- Hammer Glass
- Akcesoria GSM
- formularz zgłoszenia
- blog
- kontakt
- FAQ
- regulamin / polityka prywatności

### `(client)`
- panel klienta
- status napraw
- wiadomości
- wyceny
- historia
- konto klienta

### `(staff)`
- dashboard pracownika
- lista napraw
- szczegóły napraw
- zadania
- powiadomienia
- dostępność
- global search
- kalendarz
- panel odbiorów

### `(admin)`
- dashboard admina
- zespół
- statystyki
- reklamacje / gwarancje
- zamówienia admina
- katalog części
- hurtownie
- produkty
- dostępność zespołu
- wszystkie zadania
- zarządzanie pracownikami

---

# 6. Layouty frontendu

## Layout publiczny
Ma zawierać:
- topbar / navbar
- logo
- menu
- CTA do zgłoszenia naprawy
- CTA do kontaktu
- footer
- SEO-friendly structure

## Layout klienta
- prosty topbar
- nawigacja klienta
- czytelny panel boczny lub zakładki
- breadcrumb
- statusy i wiadomości na pierwszym planie

## Layout staff/admin
- sidebar
- topbar
- global search
- dzwonek powiadomień
- szybkie akcje
- avatar użytkownika
- status dostępności zespołu / użytkownika

## Sidebar staff/admin
Sekcje powinny być logicznie pogrupowane:
- dashboard
- naprawy
- klienci
- zadania
- kalendarz
- odbiory
- reklamacje / gwarancje
- wiadomości / komunikacja
- dostępność
- dla admina dodatkowo:
  - zespół
  - statystyki
  - zamówienia
  - części / hurtownie
  - konfiguracja

---

# 7. Frontend publiczny — pełna mapa

## 7.1 Homepage
### Sekcje:
1. Hero
2. Najważniejsze usługi
3. Dlaczego PRO-KOM
4. Hammer Glass
5. Akcesoria GSM
6. Opinie klientów
7. FAQ
8. Kontakt / CTA

### Hero
- hasło: **Najlepsi w okolicy**
- krótki opis
- CTA:
  - Zgłoś naprawę
  - Zadzwoń
  - WhatsApp
- wizual premium

### Sekcja usług
Kafle:
- serwis telefonów
- serwis tabletów
- serwis smartwatchy
- serwis laptopów
- serwis komputerów
- serwis drukarek
- serwis konsol
- odzyskiwanie danych

### Sekcja Hammer Glass
- porównanie folii
- CTA do osobnej podstrony
- „Montaż od ręki w serwisie”
- „Dobierz folię do swojego urządzenia”

### Sekcja Akcesoria GSM
- ładowarki
- ładowarki GaN
- kable
- powerbanki
- etui
- uchwyty
- słuchawki
- szkła / folie
- stacje ładowania

### FAQ
Pytania:
- jak długo trwa naprawa
- czy najpierw jest diagnoza
- czy mogę wysłać urządzenie
- czy dostanę wycenę
- czy mogę śledzić status

---

## 7.2 Podstrony usług
Każda podstrona:
- hero z konkretną usługą
- opis
- typowe usterki
- jak wygląda proces
- CTA do zgłoszenia
- FAQ lokalne
- sekcja SEO

Podstrony:
- `/serwis-telefonow`
- `/serwis-tabletow`
- `/serwis-smartwatchy`
- `/serwis-laptopow`
- `/serwis-komputerow`
- `/serwis-drukarek`
- `/serwis-konsol`
- `/odzyskiwanie-danych`

---

## 7.3 Podstrona Hammer Glass
Musi być premium.

### Sekcje:
- hero
- czym Hammer Glass jest lepsze od zwykłego szkła
- typy folii
- karta każdej folii
- tabela porównawcza
- rekomendacje
- FAQ
- CTA formularza

### Produkty Hammer
- Active Shield
- Active Shield Matt
- Cristal Shield
- Matt Finish
- Privacy Matt Finish
- Prime Protector
- Watch Armour
- Tablet Armour
- Cristal UV
- Cristal UV Matt

### Ceny
„ceny od”

### CTA
- dobierz folię do urządzenia
- montaż od ręki w serwisie

---

## 7.4 Podstrona Akcesoria GSM
### Sekcje:
- hero
- akcesoria dostępne od ręki
- główne marki
- kategorie produktów
- najczęściej kupowane przy naprawie
- CTA do kontaktu / wizyty

### Kategorie:
- ładowarki
- ładowarki GaN
- kable
- powerbanki
- etui
- szkła i folie
- uchwyty
- słuchawki
- przejściówki
- stacje ładowania

---

## 7.5 Formularz zgłoszenia online
To jeden z najważniejszych ekranów publicznych.

### Kluczowe cechy UX
- progres kroków
- dynamiczne pola zależne od kategorii
- podpowiedzi
- walidacja
- czytelny mobile UX
- upselle nienachalne, ale inteligentne

### Kroki formularza
1. typ klienta
2. dane klienta
3. urządzenie
4. opis problemu
5. dostarczenie / zwrot
6. Hammer Glass / akcesoria
7. podsumowanie
8. wysłanie

### Typ klienta
- osoba prywatna
- firma

### Dynamiczne pola dla firmy
- nazwa firmy
- NIP
- osoba kontaktowa

### Urządzenie
- kategoria
- marka
- model
- system
- opis problemu
- czy urządzenie się uruchamia
- zdjęcia

### Dostarczenie
- stacjonarnie
- kurier
- paczkomat

### Zwrot
- odbiór osobisty
- kurier
- paczkomat

### Upselle w formularzu
Dopasowane do kategorii:
- telefon
- tablet
- smartwatch
- laptop
- komputer
- drukarka

### Hammer Glass
- tak
- nie
- zapytaj po wycenie
- gratis przy akceptacji

### Podpowiedzi akcesoriów
Dla telefonów:
- kabel
- ładowarka
- powerbank
- etui
- uchwyt
- stacja ładowania

---

# 8. Frontend panelu klienta

## 8.1 Cel
Klient ma mieć prosty, czytelny i profesjonalny panel.

## 8.2 Główne widoki
- dashboard klienta
- lista napraw
- szczegóły naprawy
- wiadomości
- wyceny
- profil
- zgody / RODO

## 8.3 Dashboard klienta
Kafelki:
- aktywne naprawy
- gotowe do odbioru
- oczekujące na decyzję
- reklamacje / gwarancje
- ostatnie wiadomości

## 8.4 Lista napraw
Kolumny / karty:
- numer naprawy
- urządzenie
- status
- data przyjęcia
- szacowany termin
- badge reklamacja / gwarancja
- CTA do szczegółów

## 8.5 Szczegóły naprawy
Sekcje:
- nagłówek naprawy
- status publiczny
- timeline
- wycena
- szacowany czas realizacji
- szacowana data odbioru
- wiadomości
- zdjęcia
- dane urządzenia
- decyzje klienta
- ankieta satysfakcji po zakończeniu

## 8.6 Wiadomości
Klient widzi:
- wiadomości z serwisu
- może odpowiedzieć
- wiadomości mają statusy
- czytelny chat / thread view

## 8.7 Wyceny
Klient może:
- zobaczyć wycenę
- zaakceptować
- odrzucić
- zobaczyć przewidywany termin

## 8.8 Profil klienta
- dane podstawowe
- historia napraw
- urządzenia
- zgody
- wniosek o eksport danych
- wniosek o usunięcie danych

---

# 9. Frontend panelu staff

## 9.1 Cel
To ma być centrum codziennej pracy pracownika.

## 9.2 Dashboard staff
Sekcje:
- moje nowe zgłoszenia
- moje pilne
- dziś do kontaktu
- moje w toku
- moje zaległe
- gotowe do odbioru
- moje zadania
- wymaga reakcji
- mój kalendarz
- zespół dziś
- powiadomienia

## 9.3 Widok „Wymaga reakcji”
Jedna z najważniejszych sekcji.
Pokazuje:
- nowa wiadomość od klienta
- brak wyceny
- zaakceptowana wycena bez zamówienia części
- szybkie przyjęcie nieuzupełnione
- reklamacja bez decyzji
- gwarancja bez decyzji
- zadania pilne
- nieodebrane urządzenia
- komentarz w zadaniu

## 9.4 Lista napraw
Tabela / karty z:
- numer naprawy
- klient
- urządzenie
- przypisany pracownik
- status publiczny
- status wewnętrzny
- priorytet
- badge:
  - reklamacja
  - gwarancja
  - pilne
  - same day
  - wysyłkowe
  - Hammer Glass
  - klient wraca
  - firma
- licznik „czeka na klienta od X dni”

## 9.5 Szczegóły naprawy
Najważniejszy ekran staffu.

### Sekcje
- nagłówek
- szybkie akcje
- dane klienta
- dane urządzenia
- statusy
- komunikacja
- notatki wewnętrzne
- komunikacja zespołowa
- SMS
- wyceny
- części
- robocizna
- zdjęcia
- timeline
- dokumenty
- reklamacje / gwarancje powiązane
- powiązane zamówienia

### Szybkie akcje
- zmień status
- wyślij wycenę
- dodaj część
- dodaj robociznę
- dodaj zdjęcie
- wydrukuj dokument
- wydrukuj etykietę
- wyślij SMS
- wyślij wiadomość
- oznacz część jako dotarła
- oznacz naprawę jako gotową
- wydaj urządzenie
- dodaj zadanie
- dodaj notatkę

## 9.6 Zadania
Pracownik widzi tylko swoje zadania:
- wszystkie
- na dziś
- pilne
- zaległe
- zakończone

Po wejściu w zadanie:
- tytuł
- opis
- kto dodał
- termin
- komentarze
- historia
- powiązania

## 9.7 Powiadomienia
W topbarze dzwonek:
- nowe zadanie
- komentarz do zadania
- nowa wiadomość klienta
- przypisana naprawa
- reklamacja / gwarancja
- część dotarła

## 9.8 Dostępność zespołu
Sekcja informacyjna:
- kto jest dziś dostępny
- kto ma wyjazd
- kto jest na wolnym
- kto ma montaż
- kto jest niedostępny czasowo

## 9.9 Kalendarz
Widok:
- terminy napraw
- same day repairs
- dostępność zespołu
- zadania z terminem

## 9.10 Panel odbiorów
Sekcje:
- gotowe do odbioru
- dziś do wydania
- nieodebrane 3 dni
- nieodebrane 7 dni
- wysyłki zwrotne do przygotowania
- wydane dziś

## 9.11 Global search
Jeden z najmocniejszych elementów.

### W top barze
Szukaj:
- klienta
- firmy
- naprawy
- urządzenia
- telefonu
- e-maila
- NIP
- IMEI
- numeru seryjnego
- numeru naprawy

### Wyniki grupowane
- klienci
- firmy
- naprawy
- urządzenia

### Przy nowej naprawie
Najpierw obowiązkowe wyszukiwanie klienta / firmy, bez duplikatów.

---

# 10. Frontend panelu admina

## 10.1 Cel
Admin ma mieć pełną kontrolę nad systemem i zespołem.

## 10.2 Dashboard admina
Kafelki:
- nowe zgłoszenia
- w toku
- gotowe do odbioru
- nieodebrane
- przychód
- zysk
- reklamacje
- gwarancje
- sprzedaż Hammer Glass
- sprzedaż akcesoriów
- health score zespołu
- aktywne zadania

### Sekcje dashboardu
- dostępność zespołu dziś
- alerty
- wymaga reakcji
- wykresy
- tabele
- top pracownicy
- zadania zespołu
- reklamacje / gwarancje
- backup i RODO

## 10.3 Wykresy i statystyki
- naprawy w czasie
- przychód i zysk
- statusy napraw
- skuteczność wycen
- średni czas napraw
- reklamacje i gwarancje
- sprzedaż Hammer Glass
- sprzedaż akcesoriów
- porównanie pracowników
- skuteczność komunikacji
- liczba wiadomości do klientów
- niezamknięte sprawy
- health score pracowników

## 10.4 Zarządzanie zespołem
Sekcja:
- lista pracowników
- szczegóły pracownika
- statystyki pracownika
- aktywność logowania
- role i uprawnienia
- reset hasła
- blokowanie konta
- dodawanie nowego pracownika

## 10.5 Reklamacje / gwarancje
Osobne widoki:
- wszystkie reklamacje
- wszystkie gwarancje
- bez decyzji
- w toku
- zakończone

## 10.6 Zamówienia admina
To osobny premium moduł.

### Zakładki
- zamówienia klientów
- braki na sklep
- do zamówienia dziś
- zamówione
- w drodze
- dotarły
- gotowe do odbioru
- zrealizowane
- produkty
- kategorie
- hurtownie
- statystyki

### Dashboard zamówień
- nowe zamówienia klientów
- do zamówienia dziś
- produkty z napraw
- braki na sklepie
- produkty nieodebrane
- produkty niepowiadomione

### Funkcje
- szybkie dodawanie zamówień
- szybkie dodawanie braków na sklep
- historia ceny produktu
- grupowanie po hurtowniach
- marża
- katalog produktów
- EAN opcjonalny
- powiązanie z klientem i naprawą

## 10.7 Części i hurtownie
Osobne widoki:
- katalog części
- szczegóły części
- historia cen
- historia użycia
- ostatnia hurtownia
- hurtownie
- kolejka części do zamówienia

## 10.8 Zadania
Admin widzi:
- wszystkie zadania
- moje
- zespołu
- pilne
- zaległe
- zakończone

## 10.9 Dostępność
Admin widzi:
- dostępność całego zespołu
- może edytować każdego
- może filtrować po dniach

---

# 11. Design system komponentów

## Wspólne komponenty
- Button
- Input
- Select
- Textarea
- Badge
- Card
- Modal
- Drawer
- Tabs
- Tooltip
- Dropdown
- Table
- DataGrid
- EmptyState
- Alert
- Toast
- Timeline
- KPI Tile
- StatusChip
- SearchDropdown
- QuickActionBar

## Komponenty domenowe
- RepairCard
- RepairStatusBadge
- ClientCard
- ClientSummary
- DeviceCard
- TaskCard
- NotificationItem
- AvailabilityBadge
- OrderCard
- ProductCard
- SupplierCard
- QuotePanel
- PartsPanel
- HammerGlassCard
- UpsellSuggestionCard

---

# 12. Responsywność

## Public
Musi być w pełni mobile-first.

## Panel klienta
Musi być bardzo wygodny na telefonie.

## Staff/admin
Desktop-first, ale:
- tabela musi być responsywna
- sekcje kluczowe muszą działać na laptopie i tablecie
- quick actions muszą być wygodne na mniejszych ekranach

---

# 13. System stanów UI

Frontend musi mieć czytelne:
- loading states
- empty states
- error states
- no results states
- success states

Przykłady:
- brak napraw
- brak wiadomości
- brak reklamacji
- brak wyników wyszukiwania
- brak produktów w katalogu

---

# 14. Frontend komunikacji

## Wiadomości
Wątki konwersacji:
- klient ↔ serwis
- zadanie ↔ komentarze
- komunikacja zespołowa przy naprawie

## Szablony wiadomości
UI dla staff/admin:
- wybór kategorii
- podgląd treści
- edycja
- wybór kanału
- wysyłka

## SMS
- krótsza wersja
- informacja o szczegółach w panelu i mailu

---

# 15. Frontend zdjęć i dokumentacji

## Zdjęcia napraw
Typy:
- przed
- w trakcie
- po
- paczka
- uszkodzenie szczegółowe

## Widok galerii
- grid
- filtrowanie typów
- oznaczenie widoczne dla klienta
- opis zdjęcia

## Dokumenty
- PDF przyjęcia
- wydanie
- etykieta QR
- historia wygenerowanych dokumentów

---

# 16. Frontend onboarding / seed danych
Po pierwszym uruchomieniu frontend powinien dobrze współgrać z:
- kontami startowymi
- kategoriami urządzeń
- markami
- podstawowymi produktami
- podstawowymi hurtowniami
- podstawowymi statusami

---

# 17. Priorytety implementacji frontendu

## Etap 1
- layouty
- design system podstawowy
- strona publiczna
- formularz online

## Etap 2
- panel klienta
- lista napraw
- szczegóły naprawy
- wiadomości
- wyceny

## Etap 3
- dashboard staff
- lista napraw
- szczegóły napraw
- zadania
- powiadomienia
- global search

## Etap 4
- panel admina
- statystyki
- zespół
- dostępność
- reklamacje / gwarancje

## Etap 5
- zamówienia admina
- części / hurtownie
- historia cen
- produkty
- dashboard zamówień

## Etap 6
- dopracowanie UX
- performance
- loading states
- keyboard navigation
- polish premium UI

---

# 18. Najważniejsze zasady dla integracji frontendu

- backend API ma być źródłem danych
- frontend nie powinien duplikować logiki biznesowej
- logika statusów i uprawnień po stronie backendu
- frontend ma być szybki, przewidywalny i modułowy
- wspólny system typów TypeScript
- osobne API clients dla modułów
- reużywalne komponenty
- unikać wielkich plików

---

# 19. Finalna wizja frontendu

Frontend PRO-KOM ma wyglądać jak:
- nowoczesny system klasy premium,
- połączenie profesjonalnej strony usługowej,
- panelu klienta budującego zaufanie,
- panelu staff przyspieszającego pracę,
- panelu admina dającego pełną kontrolę.

Ma być:
- szybki
- czysty
- intuicyjny
- mocno uporządkowany
- wizualnie premium
- przygotowany na rozwój

---

# 20. Podsumowanie końcowe

Frontend PRO-KOM obejmuje 4 główne warstwy:

## Public
- sprzedaż
- SEO
- lead generation
- budowa zaufania

## Client
- status naprawy
- kontakt
- wyceny
- historia
- konto

## Staff
- naprawy
- zadania
- komunikacja
- global search
- kalendarz
- odbiory

## Admin
- dashboardy
- zespół
- statystyki
- reklamacje / gwarancje
- części i hurtownie
- zamówienia admina
- pełna kontrola systemu

To jest kompletna mapa frontendu aplikacji PRO-KOM.
