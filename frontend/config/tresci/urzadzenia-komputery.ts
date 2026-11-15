import type { DeviceExtra } from "@/lib/tech/content-types";

/** Extended texts (2026-11), to be accepted by Krystian. Keys = device page slug. */
export const computerDeviceExtra: Record<string, DeviceExtra> = {
  "serwis-laptopow": {
    intro: [
      "Laptopy psują się głównie od codziennego noszenia i pracy na kolanach. Gniazdo zasilania luzuje się od szarpania kablem, zawiasy pękają, gdy klapę otwiera się za róg, a kurz zatyka radiator szybciej, niż się wydaje. Bateria po setkach cykli ładowania traci pojemność, a czasem puchnie i podnosi touchpad.",
      "Pracę zaczynamy od diagnozy, po której wiesz, co jest uszkodzone i ile kosztuje usunięcie usterki. Możesz naprawić wszystko, tylko najpilniejszą rzecz albo zrezygnować i odebrać laptopa. Sprzęt zostawisz w jednym z dwóch salonów bez umawiania się, a z dalszej okolicy wyślesz go kurierem i zapłacisz przelewem dopiero po akceptacji kwoty.",
    ],
    symptoms: [
      {
        t: "Gniazdo lub układ ładowania",
        signs: [
          "Dioda ładowania gaśnie, gdy poruszysz wtyczką",
          "Ładuje tylko przy jednym ułożeniu kabla",
          "System pokazuje „podłączono, nie ładuje”",
          "Wtyczka siedzi luźno i sama wypada",
        ],
        meaning: "Winne bywa wyrobione gniazdo, uszkodzony zasilacz albo bateria, która przestała przyjmować ładunek — rozróżniamy to pomiarem.",
        fault: "Nie ładuje",
      },
      {
        t: "Zużyta lub spuchnięta bateria",
        signs: [
          "Laptop gaśnie przy kilkunastu procentach naładowania",
          "Touchpad przestał się klikać albo jest wypchnięty",
          "Spód obudowy się wybrzusza",
          "Bez zasilacza laptop wytrzymuje bardzo krótko",
        ],
        meaning: "Spuchniętej baterii nie ładuj i nie używaj, bo rozprężające się ogniwo niszczy touchpad, klawiaturę i płytę.",
        fault: "Bateria",
      },
      {
        t: "Matryca, taśma lub zawias",
        signs: [
          "Czarna plama rozlewa się od jednego punktu",
          "Obraz drga albo ma zakłócenia przy ruchu klapy",
          "Jasność nie reaguje na klawisze funkcyjne",
          "Po podłączeniu telewizora przez HDMI obraz jest czysty",
        ],
        meaning: "Sprawdzamy, czy trzeba wymienić panel, czy wystarczy taśma albo naprawa zawiasu.",
        fault: "Matryca",
      },
      {
        t: "Klawiatura",
        signs: [
          "Nie działa kilka klawiszy w jednym rzędzie",
          "Litera powtarza się sama",
          "Klawisze kleją się po rozlaniu napoju",
          "Podświetlenie świeci tylko na fragmencie",
        ],
        meaning: "W wielu laptopach klawiatura jest zgrzana z górną częścią obudowy i wymienia się cały ten element — powiemy, jak jest w Twoim modelu.",
        fault: "Klawiatura",
      },
      {
        t: "Laptop nie startuje",
        signs: [
          "Po naciśnięciu przycisku nic się nie dzieje",
          "Dioda zasilania świeci, a ekran zostaje czarny",
          "Wentylator rusza na chwilę i staje",
          "Dioda miga albo laptop pika w powtarzalnym rytmie",
        ],
        meaning: "Przyczyną może być zasilacz, pamięć RAM, BIOS albo płyta główna, a kody diod i piknięć pomagają zawęzić poszukiwania.",
        fault: "Nie włącza się",
      },
      {
        t: "Spowolnienie i zawieszanie",
        signs: [
          "Kilka kart w przeglądarce blokuje cały system",
          "Kursor zamiera co jakiś czas",
          "Aktualizacje kończą się błędem albo się cofają",
        ],
        meaning: "Zwykle to stary dysk talerzowy, za mało pamięci albo przegrzewanie, a po diagnozie wskażemy, co da największą różnicę.",
        fault: "Działa wolno",
      },
    ],
    kinds: [
      { n: "Lenovo", s: "IdeaPad, ThinkPad, Legion, Yoga: zawiasy i gniazda zasilania, matryce, klawiatury, chłodzenie w modelach do gier." },
      { n: "HP", s: "Pavilion, ProBook, EliteBook, Victus i Omen: bateria, matryca, gniazdo ładowania, przegrzewanie." },
      { n: "Dell", s: "Inspiron, Latitude, Vostro, XPS: zasilanie, dysk, klawiatura, zawiasy klapy." },
      { n: "ASUS", s: "VivoBook, ZenBook, TUF i ROG: matryca, chłodzenie, gniazdo, bateria." },
      { n: "Acer", s: "Aspire, Swift, Nitro, Predator: ekran, klawiatura, dysk SSD, wentylatory." },
      { n: "Apple", s: "MacBook Air i Pro: diagnoza, bateria, czyszczenie. Dysk i pamięć w nowszych modelach są wlutowane w płytę." },
    ],
    intake:
      "Przynieś laptopa z oryginalnym zasilaczem — bez niego trudno sprawdzić ładowanie i ocenić, czy winny jest kabel, czy gniazdo. Wyjmij płyty z napędu, pendrive’y i kartę z czytnika. Jeśli chcesz, żebyśmy po naprawie sprawdzili też system, podaj hasło do konta albo załóż na ten czas osobne konto bez swoich danych. Do wysyłki kurierem owiń laptopa folią bąbelkową, włóż go do sztywnego kartonu i wypełnij wolne miejsce, żeby nic się nie przesuwało. Zasilacz zapakuj obok, nigdy na klapie ekranu.",
    warranty:
      "Gwarancja obejmuje wykonaną usługę i wymienione części — np. nową matrycę, klawiaturę, baterię czy gniazdo zasilania. Jeśli ta sama usterka wróci w wymienionym elemencie, zgłoś się z numerem naprawy. Gwarancja zwykle nie obejmuje uszkodzeń mechanicznych powstałych po odbiorze, zalania, prób naprawy przez inne osoby ani podzespołów, których nie wymienialiśmy.",
    faq: [
      {
        q: "Czy mogę używać laptopa ze spuchniętą baterią?",
        a: "Nie. Odłącz zasilacz, nie ładuj laptopa i nie dociskaj obudowy. Spuchnięte ogniwo może pęknąć i się zapalić, a nawet bez tego niszczy touchpad i płytę. Przynieś laptopa jak najszybciej i powiedz o baterii przy przyjęciu.",
      },
      {
        q: "Laptop gaśnie, gdy go przesunę albo poruszę kablem. Co to jest?",
        a: "To typowy objaw luźnego gniazda zasilania, przetartego kabla zasilacza albo złego styku baterii. Nie zaginaj kabla i nie owijaj go ciasno wokół zasilacza. W serwisie sprawdzimy, który element przerywa zasilanie.",
      },
      {
        q: "Wypadł mi klawisz. Czy trzeba wymieniać całą klawiaturę?",
        a: "Nie zawsze. Jeśli nie pękły zatrzaski ani mechanizm pod klawiszem, często da się go założyć z powrotem. Gdy elementy są połamane, a pojedynczego klawisza do Twojego modelu nie ma, zostaje wymiana klawiatury. Zachowaj klawisz i drobne części, które odpadły.",
      },
      {
        q: "Czy da się dołożyć pamięci RAM do mojego laptopa?",
        a: "To zależy od modelu. W części laptopów pamięć siedzi w gniazdach i można ją dołożyć lub wymienić, w wielu cienkich modelach jest wlutowana w płytę. Sprawdzimy to po numerze modelu i powiemy, ile pamięci obsłuży płyta.",
      },
    ],
  },

  "serwis-komputerow": {
    intro: [
      "W komputerach stacjonarnych najczęściej zawodzą elementy, które pracują najciężej: zasilacz, dysk i chłodzenie. Słaby zasilacz po latach przestaje dawać stabilne napięcie, co kończy się restartami pod obciążeniem albo brakiem startu. Kurz w obudowie podnosi temperatury procesora i karty graficznej, a stary dysk talerzowy spowalnia system, zanim zacznie zgłaszać błędy.",
      "Diagnozę prowadzimy tak, żeby wskazać konkretny uszkodzony podzespół, a nie wymieniać części na próbę. Potem dostajesz wycenę z listą części i wybierasz, co wymieniamy teraz, a co może poczekać. Komputer przyniesiesz do jednego z dwóch salonów albo nadasz kurierem — w obu przypadkach praca rusza dopiero po Twojej zgodzie.",
    ],
    symptoms: [
      {
        t: "Komputer nie reaguje na przycisk",
        signs: [
          "Nie świeci żadna dioda na płycie ani obudowie",
          "Wentylatory kręcą się przez moment i stają",
          "Komputer startuje dopiero po kilku próbach",
          "Od zasilacza czuć zapach spalenizny",
        ],
        meaning: "Najczęściej to zasilacz, przycisk w obudowie albo płyta główna — sprawdzamy je po kolei, zaczynając od zasilania.",
        fault: "Nie włącza się",
      },
      {
        t: "Brak obrazu, choć komputer pracuje",
        signs: [
          "Wentylatory szumią, a monitor pokazuje „brak sygnału”",
          "Płyta wydaje serię piknięć",
          "Na płycie świeci dioda VGA albo DRAM",
          "Obraz wraca po wyjęciu karty graficznej",
        ],
        meaning: "Zwykle winna jest pamięć RAM, karta graficzna albo zły kabel lub wejście w monitorze.",
        fault: "Brak obrazu",
      },
      {
        t: "Hałas i wysokie temperatury",
        signs: [
          "Wentylatory wchodzą na wysokie obroty przy prostych zadaniach",
          "Gry zaczynają się przycinać po dłuższym graniu",
          "Komputer resetuje się w trakcie gry",
          "Słychać terkotanie łożyska wentylatora",
        ],
        meaning: "Przyczyną jest kurz, zaschnięta pasta, zużyty wentylator albo słaby przepływ powietrza w obudowie.",
        fault: "Głośno pracuje, grzeje się",
      },
      {
        t: "Kłopoty z systemem",
        signs: [
          "Niebieski ekran z kodem błędu",
          "Przeglądarka sama otwiera reklamy i obce strony",
          "Windows przy każdym starcie uruchamia naprawę",
          "Programy zamykają się bez komunikatu",
        ],
        meaning: "Zaczynamy od sprawdzenia pamięci i dysku, bo uszkodzony podzespół daje objawy podobne do zepsutego systemu.",
        fault: "System i wirusy",
      },
      {
        t: "Dysk zgłasza błędy",
        signs: [
          "System widzi dysk tylko od czasu do czasu",
          "Pliki otwierają się z błędami albo znikają foldery",
          "Program diagnostyczny pokazuje ostrzeżenie SMART",
          "Z obudowy dochodzi cykliczne klikanie",
        ],
        meaning: "Najpierw zabezpieczamy dane, a dopiero potem wymieniamy dysk albo naprawiamy system.",
        fault: "Dysk i dane",
      },
      {
        t: "Porty USB i gniazda audio",
        signs: [
          "Przednie porty nie działają, a tylne tak",
          "Pendrive rozłącza się przy dotknięciu",
          "Słuchawki trzeszczą albo grają jednym kanałem",
          "System zgłasza przeciążenie portu USB",
        ],
        meaning: "Często winne są przewody panelu przedniego albo sterowniki, rzadziej kontroler na płycie głównej.",
        fault: "Porty USB i audio",
      },
    ],
    intake:
      "Zwykle wystarczy sama jednostka, bez monitora, klawiatury i myszy. Monitor przynieś tylko wtedy, gdy kłopot dotyczy obrazu i podejrzewasz właśnie jego. Przy rozbudowie zapisz, do czego komputer ma służyć — do jakich gier, programów czy pracy biurowej. Do wysyłki kurierem owiń obudowę folią bąbelkową i włóż ją do kartonu z grubą warstwą wypełnienia z każdej strony. Ciężka karta graficzna i duże chłodzenie procesora mogą się urwać przy wstrząsie, więc wypełnij przestrzeń wokół nich w obudowie albo wyjmij kartę i zapakuj ją osobno, jeśli wiesz, jak to zrobić.",
    warranty:
      "Gwarancją objęte są czynności, które wykonaliśmy, i części, które zamontowaliśmy, np. zasilacz, dysk, pamięć czy wentylator. Po instalacji systemu gwarancja dotyczy jego poprawnego działania przy odbiorze, ale nie późniejszych infekcji, zmian ustawień ani programów dodanych samodzielnie. Nie obejmuje też podzespołów, których nie ruszaliśmy, ani skutków przepięć i zalania.",
    faq: [
      {
        q: "Komputer sam się restartuje przy grach. Co to może być?",
        a: "Najczęściej przegrzewanie albo zasilacz, który nie daje rady przy pełnym obciążeniu karty graficznej. Czasem winna jest niestabilna pamięć RAM. Sprawdzamy temperatury i zasilanie pod obciążeniem, żeby wskazać przyczynę.",
      },
      {
        q: "Czy dobierzecie części do rozbudowy?",
        a: "Tak. Sprawdzamy płytę główną, zasilacz i obudowę, a potem proponujemy części, które do nich pasują. Mówimy też, kiedy dołożenie jednego elementu nic nie da, bo hamuje go inny podzespół.",
      },
      {
        q: "Po burzy komputer się nie włącza. Czy da się go uratować?",
        a: "Przepięcie często niszczy tylko zasilacz, a reszta podzespołów przeżywa. Bywa jednak, że ucierpiała też płyta główna albo karta sieciowa. Nie włączaj komputera wiele razy z rzędu — po diagnozie powiemy, które elementy trzeba wymienić.",
      },
      {
        q: "Jak odróżnić awarię systemu od awarii sprzętu?",
        a: "Jeśli błędy pojawiają się także poza Windowsem — w BIOS-ie albo przy starcie z pendrive’a instalacyjnego — problem leży zwykle w sprzęcie. Gdy poza systemem wszystko działa, winny jest raczej system albo sterowniki.",
      },
    ],
  },

  "serwis-drukarek": {
    intro: [
      "W drukarkach atramentowych najczęściej zasycha głowica, zwłaszcza gdy drukujesz rzadko albo tusz skończył się w trakcie wydruku. W laserowych zużywają się bęben, rolki pobierające i utrwalacz, przez co wydruki są blade, brudne albo papier się marszczy. Urządzenia wielofunkcyjne mają do tego skaner i moduł Wi-Fi, który po zmianie routera potrafi zgubić połączenie.",
      "Po przyjęciu ustalamy, czy usterka wynika z wkładów, mechaniki, czy elektroniki, i podajemy koszt naprawy. Przy tańszych modelach porównujemy go uczciwie z wartością urządzenia, a decyzja należy do Ciebie. Drukarkę oddasz w jednym z dwóch salonów albo wyślesz kurierem, a odebrać możesz ją także w drugim salonie.",
    ],
    symptoms: [
      {
        t: "Zaschnięta lub uszkodzona głowica",
        signs: [
          "Na teście dysz brakuje całych linii jednego koloru",
          "Kolory są przekłamane, np. zielony zamiast niebieskiego",
          "Czarny tekst wychodzi szary lub poszarpany",
          "Czyszczenie z menu zużywa tusz i nic nie zmienia",
        ],
        meaning: "Sprawdzamy, czy głowicę da się udrożnić, czy jest uszkodzona elektrycznie — od tego zależy, czy naprawa ma sens.",
        fault: "Tusz i głowica",
      },
      {
        t: "Smugi i paski z drukarki laserowej",
        signs: [
          "Pionowy pas w tym samym miejscu każdej kartki",
          "Kropki lub plamy powtarzające się w równych odstępach",
          "Toner ściera się palcem z wydruku",
          "Szare tło na całej stronie",
        ],
        meaning: "Powtarzalny wzór wskazuje na bęben lub utrwalacz, a ścierający się toner na grzałkę utrwalacza.",
        fault: "Paski na wydruku",
      },
      {
        t: "Kłopoty z podawaniem papieru",
        signs: [
          "Drukarka pobiera kilka kartek naraz",
          "Kartka wchodzi krzywo i się gniecie",
          "Komunikat o zacięciu, choć w środku nic nie ma",
          "Rolki się ślizgają i nie pobierają papieru",
        ],
        meaning: "Zwykle to zużyte lub zabrudzone rolki pobierające, czasem czujnik papieru albo ciało obce w torze papieru.",
        fault: "Zacina papier",
      },
      {
        t: "Drukarka nie widzi sieci",
        signs: [
          "Po zmianie routera drukarka zniknęła z komputera",
          "Drukuje przez kabel USB, ale nie przez sieć",
          "Telefon nie znajduje drukarki",
          "Dioda Wi-Fi miga bez końca",
        ],
        meaning: "Najczęściej to konfiguracja i sterowniki, rzadziej uszkodzony moduł sieciowy.",
        fault: "Brak Wi-Fi",
      },
      {
        t: "Kod błędu na panelu",
        signs: [
          "Na ekranie pojawia się kod z literą i cyframi",
          "Komunikat o zapełnionym pochłaniaczu tuszu",
          "Wózek uderza o bok obudowy i drukarka się wyłącza",
          "Wszystkie diody migają jednocześnie",
        ],
        meaning: "Kod wskazuje obszar usterki, dlatego zapisz go albo sfotografuj panel przed oddaniem drukarki.",
        fault: "Błąd na panelu",
      },
      {
        t: "Skaner",
        signs: [
          "Na skanie biegnie pionowa linia przez całą stronę",
          "Lampa skanera się nie zapala",
          "Podajnik dokumentów wciąga kilka stron naraz",
          "Komputer nie widzi skanera, choć drukowanie działa",
        ],
        meaning: "Odróżniamy usterkę modułu skanującego od problemu ze sterownikiem lub oprogramowaniem.",
        fault: "Skaner",
      },
    ],
    kinds: [
      { n: "Atramentowe z wkładami", s: "HP DeskJet, Canon PIXMA i podobne, w których głowica jest częścią wkładu: zaschnięte dysze, styki wkładów, podawanie papieru." },
      { n: "Atramentowe z pojemnikami na tusz", s: "Epson EcoTank, Canon MegaTank, HP Smart Tank: głowica wbudowana w drukarkę, czyszczenie, błędy pochłaniacza tuszu." },
      { n: "Laserowe monochromatyczne", s: "HP LaserJet, Brother HL i DCP, Canon i-SENSYS: rolki, bęben, utrwalacz, zacinanie papieru." },
      { n: "Laserowe kolorowe", s: "Bębny i pas transferowy, przesunięte kolory, smugi w jednym kolorze." },
      { n: "Wielofunkcyjne", s: "Skaner płaski i podajnik dokumentów, kopiowanie, łączność Wi-Fi i sieć." },
    ],
    intake:
      "Przynieś drukarkę z zasilaczem lub kablem zasilającym, a wkłady zostaw w środku. Kabel USB się przyda, jeśli problem dotyczy połączenia z komputerem. Przed wysyłką kurierem zabezpiecz drukarkę według instrukcji producenta. W wielu modelach głowica musi wrócić do pozycji spoczynkowej, więc wyłącz drukarkę przyciskiem i dopiero potem wyjmij wtyczkę. W drukarkach z pojemnikami na tusz zamknij korki zbiorników lub ustaw blokadę transportową, a tackę i klapę skanera przyklej taśmą malarską. Owiń drukarkę folią, włóż do kartonu z wypełnieniem i opisz karton, żeby jechał w pozycji poziomej.",
    warranty:
      "Gwarancja dotyczy naprawy, którą wykonaliśmy, i części, które wymieniliśmy — np. rolek, utrwalacza czy płyty zasilającej. Nie obejmuje zużycia tuszy i tonerów, które ubywa z każdym wydrukiem. Nie dotyczy też ponownego zaschnięcia głowicy po długiej przerwie w drukowaniu ani uszkodzeń spowodowanych wkładami złej jakości.",
    faq: [
      {
        q: "Drukarka zgłasza zapełniony pochłaniacz tuszu. Co to znaczy?",
        a: "Tusz zużyty przy czyszczeniu głowicy trafia do gąbki w obudowie. Gdy licznik dojdzie do limitu, drukarka blokuje drukowanie, żeby tusz nie wyciekł. Trzeba wymienić pochłaniacz i wyzerować licznik — sprawdzimy, czy w Twoim modelu jest to możliwe.",
      },
      {
        q: "Czy zamienniki tuszu psują drukarkę?",
        a: "Dobre zamienniki działają poprawnie w wielu drukarkach. Kłopoty sprawiają głównie bardzo tanie wkłady o złej gęstości tuszu i źle dopasowanych chipach. Gdy drukarka zaczyna smużyć po zmianie wkładów, spróbuj najpierw oryginalnego albo innego zgodnego wkładu.",
      },
      {
        q: "Jak drukować, żeby głowica nie zasychała?",
        a: "Drukuj regularnie, choćby jedną kolorową stronę w tygodniu. Wyłączaj drukarkę przyciskiem, a nie listwą, żeby głowica się zaparkowała i zakryła. Nie zostawiaj pustego wkładu w drukarce na dłużej.",
      },
      {
        q: "Drukarka przez Wi-Fi drukuje z przerwami. Dlaczego?",
        a: "Często to słaby sygnał w miejscu, gdzie stoi drukarka, albo zablokowana kolejka wydruków w systemie. Przestaw drukarkę bliżej routera, wyczyść kolejkę i zainstaluj aktualny sterownik ze strony producenta. Jeśli to nie pomaga, sprawdzimy moduł sieciowy.",
      },
    ],
  },

  "odzyskiwanie-danych": {
    intro: [
      "Dane giną najczęściej z trzech powodów: mechanicznego uszkodzenia dysku talerzowego po upadku lub ze starości, awarii elektroniki, np. kontrolera w dysku SSD czy pendrivie, oraz pomyłki, czyli skasowania lub sformatowania nośnika. Każdy przypadek wymaga innego postępowania. To, co pomaga przy skasowanych plikach, przy fizycznie uszkodzonym dysku może zniszczyć resztę danych.",
      "Po wstępnej diagnozie mówimy, jakie są szanse i ile kosztuje odzysk. Ty decydujesz, czy go zlecasz, i wskazujesz, które pliki są najważniejsze. Nośnik przyniesiesz do jednego z dwóch salonów albo wyślesz kurierem — wtedy płacisz przelewem po akceptacji kwoty.",
    ],
    symptoms: [
      {
        t: "Mechanicznie uszkodzony dysk HDD",
        signs: [
          "Rytmiczne stukanie lub klikanie po podłączeniu",
          "Dysk buczy, ale talerze się nie rozkręcają",
          "Po upadku dysk przestał być widoczny",
          "Odczyt zwalnia i co chwilę staje",
        ],
        meaning: "Każde kolejne uruchomienie może pogłębić uszkodzenie powierzchni, dlatego taki dysk odłącz od razu.",
        fault: "Z dysku HDD lub SSD",
      },
      {
        t: "Awaria dysku SSD",
        signs: [
          "Dysk znika z BIOS-u albo ma dziwną nazwę i zerową pojemność",
          "System nagle przestał się uruchamiać",
          "Dysk przeszedł w tryb tylko do odczytu",
        ],
        meaning: "W SSD wiele zależy od kontrolera i sposobu zapisu danych, więc szanse oceniamy dopiero po diagnozie.",
        fault: "Z dysku HDD lub SSD",
      },
      {
        t: "Pendrive lub karta pamięci",
        signs: [
          "System prosi o sformatowanie nośnika",
          "Karta pokazuje zerową lub zaniżoną pojemność",
          "Aparat zgłasza błąd karty",
          "Wtyczka pendrive’a jest złamana albo się rusza",
        ],
        meaning: "Nie formatuj takiego nośnika, bo format nadpisuje strukturę plików i utrudnia odzysk.",
        fault: "Z pendrive’a lub karty",
      },
      {
        t: "Skasowane lub sformatowane dane",
        signs: [
          "Pliki zniknęły także z kosza",
          "Po reinstalacji systemu zniknęła partycja z danymi",
          "Dysk został sformatowany przez pomyłkę",
        ],
        meaning: "Szansa jest największa, gdy od tamtej chwili na nośniku nic nie zapisywano.",
        fault: "Usunięte pliki",
      },
      {
        t: "Telefon, który się nie włącza",
        signs: [
          "Telefon nie reaguje po upadku lub zalaniu",
          "Pętla restartów na logo producenta",
          "Rozbity ekran nie pozwala odblokować telefonu",
        ],
        meaning: "Pamięć telefonów jest zwykle szyfrowana, dlatego najpierw trzeba przywrócić działanie samego telefonu, a dane zgrać po odblokowaniu Twoim kodem.",
        fault: "Z telefonu",
      },
      {
        t: "Nośnik po zalaniu",
        signs: [
          "Dysk zewnętrzny wpadł do wody",
          "Zalany napojem laptop nie startuje",
          "Na złączach widać biały lub zielony nalot",
        ],
        meaning: "Nie susz nośnika na kaloryferze i nie podłączaj go, bo korozja postępuje, a zwarcie może uszkodzić elektronikę.",
        fault: "Sprzęt po zalaniu",
      },
    ],
    intake:
      "Przynieś sam nośnik albo całe urządzenie, jeśli dysku nie da się łatwo wyjąć — np. laptop z pamięcią wlutowaną w płytę albo telefon. Do telefonu przygotuj kod odblokowania, bo bez niego zaszyfrowanej pamięci zwykle nie da się odczytać. Spisz krótko, co jest najważniejsze, gdzie leżały pliki i co działo się przed awarią. Jeśli masz własny nośnik na odzyskane dane, przynieś go — powinien mieć więcej miejsca niż dane do odzysku. Do wysyłki kurierem włóż dysk do woreczka antystatycznego, owiń go grubo folią bąbelkową i zapakuj w karton tak, żeby się nie przesuwał, bo dyski talerzowe źle znoszą wstrząsy.",
    warranty:
      "Odzysk danych to nie zwykła naprawa, więc gwarancja w typowej formie nie ma tu zastosowania. Uszkodzony nośnik po odzysku nie wraca do sprawności i nie nadaje się do dalszego przechowywania danych. Przy odbiorze możesz sprawdzić z nami, czy najważniejsze pliki się otwierają. Szczegóły dotyczące nośnika docelowego ustalamy przy wycenie.",
    faq: [
      {
        q: "Czy odzyskacie dane z zaszyfrowanego dysku?",
        a: "Tylko jeśli znasz hasło albo masz klucz odzyskiwania, np. do BitLockera zapisany na koncie Microsoft. Bez nich zaszyfrowanych danych nie da się odczytać, niezależnie od stanu dysku. W zgłoszeniu napisz, czy nośnik był szyfrowany.",
      },
      {
        q: "Czy mogę odzyskać skasowane pliki samodzielnie programem?",
        a: "Przy skasowanych plikach na sprawnym nośniku czasem tak, pod warunkiem że program instalujesz na innym dysku, a odzyskane pliki zapisujesz na jeszcze inny nośnik. Przy dysku, który stuka, znika albo działa bardzo wolno, programy tylko pogarszają sprawę.",
      },
      {
        q: "Usunąłem pliki z dysku SSD. Czy jest szansa?",
        a: "Mniejsza niż przy dysku talerzowym. SSD z włączoną funkcją TRIM czyści usunięte bloki w tle, często wkrótce po skasowaniu. Wyłącz komputer od razu i nie używaj go do czasu diagnozy.",
      },
      {
        q: "Dlaczego odzyskane pliki mogą nie mieć nazw?",
        a: "Gdy struktura folderów jest zniszczona, czasem da się odczytać same pliki po ich zawartości, ale bez oryginalnych nazw i katalogów. Zdjęcia czy dokumenty są wtedy zwykle całe, tylko trzeba je samemu posegregować. Przy wycenie powiemy, czy tak może być w Twoim przypadku.",
      },
    ],
  },
};
