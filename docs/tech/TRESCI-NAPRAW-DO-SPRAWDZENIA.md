# Treści stron napraw i urządzeń — zdania do sprawdzenia (Krystian / serwis)

Rozbudowa treści z 15.11.2026 (gałąź `content/tech-strony-napraw`): teksty w `frontend/config/tresci/*.ts`. Poniżej zdania o praktyce serwisu, które nie wynikają wprost z potwierdzonych faktów (SPEC §8, `claims`). Każde jest napisane ostrożnie, ale zanim treść trafi na produkcję, odhacz je albo wskaż do usunięcia/zmiany. Ceny, czasy, długość gwarancji i miasta nie występują w tekstach (pilnują tego testy).

## Hub /uslugi (`config/tresci/uslugi.ts`)

1. FAQ „Czy naprawiacie sprzęt firmowy?”: „Jeśli potrzebujesz faktury, podaj dane firmy w zgłoszeniu.” — czy wystawiacie faktury i czy dane firmy wpisuje się w zgłoszeniu.
2. Jak oddać sprzęt: „do środka włóż kartkę z numerem zgłoszenia” — czy tak opisujecie paczkę (porównaj z `/naprawa-kurierem`).
3. FAQ „oddać w jednym salonie, odebrać w drugim”: „przygotujemy sprzęt do odbioru w wybranym salonie”.
4. Gwarancja: „Szczegóły i zakres gwarancji dostajesz razem z naprawionym sprzętem… zgłoś to w salonie albo telefonicznie, a sprawdzimy sprzęt ponownie.”

## Naprawy telefonów (`config/tresci/naprawy-telefony.ts`)


1. iPhone ekran, części i FAQ: „W części modeli True Tone wymaga przeniesienia danych ze starego ekranu i powiemy wcześniej, czy w Twoim przypadku to możliwe” oraz FAQ o True Tone („W wielu modelach da się je przenieść ze starego modułu”). Czy serwis przenosi dane True Tone (programator)?
2. iPhone ekran, po naprawie: „Przez pierwsze godziny klej uszczelki dochodzi do pełnej wytrzymałości” (to samo przy baterii: „Przez pierwsze godziny nie naciskaj mocno…”). Czy tak doradzacie klientom?
3. iPhone ekran, Samsung, tylna szybka, po naprawie: „W salonie wytniemy na ploterze folię ochronną…”. Przy tylnej szybce: czy ploter Hammer Glass tnie też folie na tył telefonu?
4. iPhone ekran, po naprawie: „Przy odbiorze przesuń palcem po całym ekranie… Usterkę najłatwiej wyjaśnić od razu, przy nas.” Czy klient testuje telefon przy ladzie?
5. Samsung, części: „ekrany oryginalne Samsunga, często w komplecie z ramką”. Czy serwis ma dostęp do oryginalnych ekranów Samsunga (service pack)?
6. Samsung, FAQ: „W niektórych modelach oryginalny ekran dostarczany jest razem z ramką i wklejoną baterią”. Ogólnie prawda dla części modeli serii A. Czy chcemy to pisać?
7. Samsung, po naprawie: „Szparę albo nierówny dotyk przy krawędzi zgłoś w ramach gwarancji.” Czy gwarancja to obejmuje?
8. Bateria, części: zdanie o komunikacie iOS i o tym, że kondycja „może nie być pokazywana albo pojawi się z dopiskiem”. Zachowanie zależy od wersji iOS. Sprawdź, czy zgadza się z tym, co widzicie u klientów.
9. Bateria, FAQ: „najpierw mierzymy ogniwo, a wymianę proponujemy dopiero, gdy pomiar to potwierdzi”. Czy tak wygląda procedura?
10. Gniazdo, części: „Zamiennik może nie obsługiwać szybkiego ładowania w pełnej mocy albo przesyłu danych z najwyższą prędkością”. Czy serwis montuje zamienniki płytek ładowania?
11. Zalanie, części: „po diagnozie powiemy, czy naprawa na niej [płycie] jest możliwa” oraz „Baterię z korozją na złączu albo oznakami puchnięcia proponujemy wymienić w pierwszej kolejności”. Czy serwis naprawia płyty i czy tak doradza przy baterii?
12. Zalanie, po naprawie: „Obudowę zamykamy na nowym kleju, ale jej szczelności nie potwierdzamy.” Czy po zalaniu zawsze zamykacie na nowym kleju?
13. Tylna szybka, części: „powiemy, jakie są możliwości dla Twojego modelu” przy wygiętej ramie (np. wymiana obudowy), a w FAQ o iPhonie 7: „powiemy, co da się zrobić z obudową”. Czy serwis wymienia obudowy?
14. Tylna szybka, FAQ: „Po naprawie sprawdzamy, czy telefon odczytuje karty i terminale zbliżeniowe”. Czy w procedurze jest test NFC?

## Pozostałe naprawy (`config/tresci/naprawy-inne.ts`)


1. Tablet, FAQ: „W iPadach z przyciskiem Home przenosimy go ze starego ekranu, bo jest sparowany z płytą.” — czy serwis to robi.
2. Tablet, przygotowanie: „Przy iPadzie wyłącz funkcję „Znajdź mój iPad” albo przygotuj dane do Apple ID.” — czy wymagacie tego przy przyjęciu.
3. Tablet, poNaprawie: „Nowy klej twardnieje stopniowo, dlatego przez pierwszą dobę nie dociskaj mocno krawędzi ekranu.” — czy taka zalecenie przekazujecie (doba = czas, nie dotyczy naprawy, ale sprawdź).
4. Smartwatch, FAQ: „Najpierw sprawdzamy, czy pomaga ponowne parowanie lub przywrócenie systemu, a dopiero potem otwieramy kopertę.” — kolejność diagnozy.
5. Smartwatch, FAQ: „Tak. Do testów po naprawie przydaje się jednak dostęp do sparowanego telefonu…” — czy przyjmujecie sam zegarek bez telefonu.
6. Smartwatch, poNaprawie: „Pierwsze ładowanie po wymianie baterii zrób do pełna i nie przerywaj go…” — czy to Wasze zalecenie.
7. Laptop przegrzewa się, przyczyny: „Czasem winne jest oprogramowanie… Sprawdzamy to przed rozkręceniem obudowy.” — czy sprawdzacie procesy w systemie.
8. Laptop przegrzewa się, poNaprawie: „Zachowaj wyniki pomiarów, które dostajesz od nas.” — czy wyniki są przekazywane na piśmie (istniejący przebieg mówi tylko o informacji, o ile spadły temperatury).
9. Laptop przegrzewa się, FAQ: „Jeśli po czyszczeniu silnik nadal nie rusza, proponujemy wymianę wentylatora.” oraz „Po czyszczeniu sprawdzamy, czy laptop pracuje stabilnie.”
10. Matryca, FAQ: „Sprawdzamy to przed zamówieniem matrycy, bo wymiana taśmy jest prostszą naprawą.” — czy wymieniacie taśmy matrycy.
11. Matryca, FAQ: „Po wymianie sprawdzamy, czy [kamera i mikrofony] działają poprawnie.”
12. SSD, części: „Proponujemy pojemność dopasowaną do tego, ile danych masz dziś, z zapasem na aktualizacje.”
13. SSD, FAQ: „Jeśli chcesz go oddać dalej, najpierw trzeba trwale usunąć z niego dane.” — celowo bez obietnicy, że serwis to robi; dopisać, jeśli robicie.
14. Konsola, części: „W PS5 producent zastosował inny materiał, a jego ewentualna wymiana wymaga ostrożności i nie zawsze jest potrzebna. Decyzję podejmujemy po otwarciu konsoli…” — czy serwis w ogóle ingeruje w materiał termoprzewodzący PS5.
15. Konsola, przygotowanie: przykładowe oznaczenia modeli „CUH-1216 albo CFI-1016” — do weryfikacji, czy chcesz przykłady (CUH-1216 = PS4, CFI-1016 = PS5 z napędem, wersja EU).
16. Konsola, porady: „W PS5 po zdjęciu bocznych paneli widać dwa otwory na kurz… możesz je delikatnie odkurzyć.” — zgodne z instrukcją Sony, ale sprawdź, czy chcesz zachęcać klienta do zdejmowania paneli.

## Strony urządzeń: telefony, tablety, smartwatche, konsole (`config/tresci/urzadzenia-mobilne.ts`)


#### Telefony
1. `kinds`: czy przyjmujecie Samsung Galaxy M, Motorola moto e, realme C, OPPO (A, Reno), Honor i Google Pixel? Pixel opisany ostrożnie: „dostępność części sprawdzamy dla modelu”.
2. intake: „Wyjmij kartę SIM i kartę pamięci, chyba że problem dotyczy właśnie ich.” Czy tak wolicie przyjmować telefony?
3. intake i FAQ: „Przygotuj dane do konta Apple ID lub Google na wypadek, gdyby były potrzebne do testów po naprawie, ale nie wylogowuj się na zapas.” oraz FAQ „Czy muszę wyłączyć funkcję Znajdź mój iPhone?”: „To nie jest warunek przyjęcia telefonu… Jeśli będzie potrzebne, powiemy Ci o tym”. Czy tak wygląda praktyka serwisu?
4. FAQ: „Czy naprawicie telefon, który był już otwierany w innym serwisie?”: „Przyjmiemy go do diagnozy.”
5. warranty: wyłączenia z gwarancji („nowe uszkodzenia, takie jak ponownie zbity wyświetlacz, wygięta ramka czy zalanie po naprawie, ani podzespołów, których nie dotykaliśmy”) i „zgłoś to, a sprawdzimy telefon”. Czy to zgodne z Waszym regulaminem gwarancji?

#### Tablety
6. `kinds`: Galaxy Tab FE, Lenovo Yoga Tab, Huawei MatePad T, „Inne marki: tablety dla dzieci i mniej znane marki” (to ostatnie zgodne z FAQ w naprawy.ts).
7. FAQ: „Czy naprawiacie tablety szkolne i firmowe?”: „Tak.” Do tego rada, żeby zapytać administratora (MDM).
8. objaw „Bateria”: „wybrzuszony tablet traktujemy jako pilny”. Czy serwis faktycznie tak ustala kolejność?
9. objaw „Nie ładuje”: „Mierzymy prąd ładowania i oglądamy port”. Czy serwis używa miernika prądu przy tabletach?
10. intake: „Rysik i etui z klawiaturą przynieś wtedy, gdy usterka ich dotyczy”.
11. warranty: wyłączenia („kolejne pęknięcie po upadku, uszkodzenia od nacisku na ekran w plecaku, zalanie po odbiorze”).

#### Smartwatche
12. `kinds`: Apple Watch Ultra, Galaxy Watch Active, Huawei Band, Xiaomi Smart Band i Redmi Watch, „Garmin i Amazfit: diagnoza i ładowanie; wymianę ekranu lub baterii sprawdzamy dla modelu”. Czy przyjmujecie Garmina i Amazfit?
13. FAQ: „Czy naprawiacie opaski sportowe, na przykład Mi Band?”: „Przyjmujemy je do diagnozy.”
14. FAQ: „Zgubiłem ładowarkę… Czy mogę przyjść bez niej?”: „Możesz, ale sprawdzenie ładowania będzie trudniejsze.” Czy serwis ma własne stacje do testów?
15. intake: „Przynieś zegarek razem z jego ładowarką”. To prośba, a nie wymóg. Czy tak ma zostać?
16. objaw „Woda w zegarku”: „Szukamy korozji na płytce i stykach baterii”, co oznacza otwieranie koperty po zalaniu.
17. warranty: wyłączenia („kolejne pęknięcia po uderzeniu, zalanie po naprawie, także podczas pływania”).

#### Konsole
18. `kinds`: PS5 Slim, PS4 Slim, Xbox Series X i S (zasilanie, HDMI, napęd, kontrolery), Switch Lite i OLED (ekran). Czy wymieniacie ekran w Switchu?
19. FAQ: „Gniazdo HDMI wyrwało się z kablem. Czy da się wymienić sam port?”: „W większości konsol gniazdo HDMI siedzi na płycie głównej i wymienia się sam port.” Chodzi o lutowanie portu na płycie: czy serwis to robi? Jeśli nie, pytanie trzeba usunąć.
20. FAQ: „Czy naprawiacie Joy-Cony?”: „przyjmujemy Joy-Cony z dryfem gałki i z niedziałającymi przyciskami”. Czy przyciski też?
21. FAQ „Błąd systemu”: „sprawdzimy dysk i oprogramowanie, a przed reinstalacją powiemy, co stanie się z danymi”.
22. intake: „Przy usterce konsoli dołóż kabel zasilający, a pady i kabel HDMI tylko wtedy, gdy podejrzewasz, że to one są winne.” oraz „Switcha oddaj… z ładowarką, gdy konsola nie ładuje.”
23. warranty: „Jeśli po naprawie ta sama usterka wróci, zgłoś ją w ramach gwarancji.” oraz wyłączenia („ponowne wyrwanie gniazda przez szarpnięcie kabla, zalanie, upadek po odbiorze”).

#### Wszystkie strony
24. Instrukcje w „Sprawdź sam”: wymuszony restart iPhone’a, iPada i Apple Watcha, tryb awaryjny PlayStation (drugi sygnał), Xbox (przytrzymanie przez około 10 sekund), kalibracja gałek w Switchu, tryb awaryjny Androida. Napisałem je według dokumentacji producentów. Warto rzucić okiem, czy taki poziom szczegółu Wam pasuje.

## Strony urządzeń: laptopy, komputery, drukarki, odzysk danych (`config/tresci/urzadzenia-komputery.ts`)


#### Laptopy
1. intro: „Sprzęt zostawisz w jednym z dwóch salonów bez umawiania się, a z dalszej okolicy wyślesz go kurierem i zapłacisz przelewem dopiero po akceptacji kwoty.” — zgodne z faktami, ale sprawdź sformułowanie.
2. symptoms „Gniazdo lub układ ładowania”: „…rozróżniamy to pomiarem.” — czy serwis tak diagnozuje (miernik/ładowarka testowa).
3. intake: „…podaj hasło do konta albo załóż na ten czas osobne konto bez swoich danych.” — czy serwis prosi o hasło do laptopa / akceptuje konto tymczasowe.
4. warranty: „Jeśli ta sama usterka wróci w wymienionym elemencie, zgłoś się z numerem naprawy.” oraz lista wyłączeń (uszkodzenia po odbiorze, zalanie, ingerencja osób trzecich, niewymieniane podzespoły) — czy zgodne z regulaminem.
5. FAQ „Wypadł mi klawisz”: „…często da się go założyć z powrotem.” — czy serwis zakłada/dobiera pojedyncze klawisze.
6. kinds: dopisane rodziny (Yoga, Victus, Omen, XPS, TUF, Predator) i zdanie o wlutowanym dysku i pamięci w nowszych MacBookach — czy serwis chce je wymieniać z nazwy.

#### Komputery
7. intro: „Diagnozę prowadzimy tak, żeby wskazać konkretny uszkodzony podzespół, a nie wymieniać części na próbę.” — czy to oddaje praktykę (części testowe?).
8. symptoms „Komputer nie reaguje na przycisk”: „…sprawdzamy je po kolei, zaczynając od zasilania.”
9. symptoms „Kłopoty z systemem”: „Zaczynamy od sprawdzenia pamięci i dysku…”
10. warranty: „Po instalacji systemu gwarancja dotyczy jego poprawnego działania przy odbiorze, ale nie późniejszych infekcji, zmian ustawień ani programów dodanych samodzielnie.” — czy tak to ujmuje regulamin.
11. FAQ „Komputer sam się restartuje przy grach”: „Sprawdzamy temperatury i zasilanie pod obciążeniem…”
12. FAQ „Czy dobierzecie części do rozbudowy?”: „Tak. Sprawdzamy płytę główną, zasilacz i obudowę, a potem proponujemy części…” — czy serwis sam dobiera/zamawia części (bez sprzedaży sprzętu jako sklep).

#### Drukarki
13. intro: „Przy tańszych modelach porównujemy go uczciwie z wartością urządzenia…”
14. FAQ „pochłaniacz tuszu”: „Trzeba wymienić pochłaniacz i wyzerować licznik — sprawdzimy, czy w Twoim modelu jest to możliwe.” — czy serwis robi tę usługę. Ten sam temat w kinds („błędy pochłaniacza tuszu”).
15. warranty: wyłączenia (zużycie tuszy i tonerów, ponowne zaschnięcie głowicy po przerwie, wkłady złej jakości) — czy zgodne z regulaminem.
16. FAQ „Wi-Fi drukuje z przerwami”: „Jeśli to nie pomaga, sprawdzimy moduł sieciowy.” — czy serwis diagnozuje moduły sieciowe drukarek.

#### Odzyskiwanie danych
17. warranty (cały akapit, do decyzji): „Odzysk danych to nie zwykła naprawa, więc gwarancja w typowej formie nie ma tu zastosowania. Uszkodzony nośnik po odzysku nie wraca do sprawności i nie nadaje się do dalszego przechowywania danych. Przy odbiorze możesz sprawdzić z nami, czy najważniejsze pliki się otwierają. Szczegóły dotyczące nośnika docelowego ustalamy przy wycenie.” — czy klient może sprawdzić pliki przy odbiorze i jak serwis podchodzi do nośnika docelowego.
18. symptoms „Telefon, który się nie włącza”: „…najpierw trzeba przywrócić działanie samego telefonu, a dane zgrać po odblokowaniu Twoim kodem.” oraz intake: „Do telefonu przygotuj kod odblokowania…” — czy tak wygląda odzysk z telefonów w serwisie.


## Wspólne dla szablonu

- Strony napraw, sekcja „Oryginał czy zamiennik?”, ramka: „Przed naprawą mówimy, jakie części są dostępne do Twojego modelu i czym się różnią. Naprawiamy dopiero po akceptacji wyceny, a wymienione części obejmuje gwarancja.” (sens zaakceptowanych tekstów z 15.11; `claims.ruleParts` nadal `confirmed: false` i nie jest użyty).
- Hero: karta „Status naprawy online” (Przyjęte → Diagnoza → Wycena do akceptacji) — ozdobna, etapy z prawdziwego `/track`.
