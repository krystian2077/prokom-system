import type { DeviceExtra } from "@/lib/tech/content-types";

/** Extended texts (2026-11), to be accepted by Krystian. Keys = device page slug. */
export const mobileDeviceExtra: Record<string, DeviceExtra> = {
  "serwis-telefonow": {
    intro: [
      "Telefony trafiają do serwisu najczęściej z trzech powodów: zbity ekran po upadku, bateria, która nie wytrzymuje do wieczora, i gniazdo, w którym kabel przestał się trzymać. Wszystkie trzy wynikają z codziennego noszenia w kieszeni i torbie, a nie z wady fabrycznej. Rzadziej, ale pilniej, przychodzą telefony po kontakcie z wodą.",
      "Przy każdej usterce zaczynamy od sprawdzenia telefonu i ustalenia przyczyny. Potem dostajesz kwotę i opis tego, co trzeba wymienić, a decyzję podejmujesz Ty: zgadzasz się na naprawę albo odbierasz telefon. Możesz go zostawić w jednym z dwóch salonów i odebrać w drugim, a jeśli mieszkasz dalej, wyślij go kurierem. W obu salonach wytniemy też na miejscu folię ochronną Hammer Glass pod Twój model.",
    ],
    symptoms: [
      {
        t: "Uszkodzony wyświetlacz po upadku",
        signs: [
          "Pęknięcia na szybie, nawet jeśli obraz nadal działa",
          "Kolorowe linie albo czarna plama, która rośnie",
          "Dotyk nie reaguje w jednym miejscu albo klika sam",
          "Ekran gaśnie, choć telefon dzwoni i wibruje",
        ],
        meaning: "Sprawdzamy, czy uszkodzony jest sam moduł wyświetlacza, czy także taśma, ramka albo aparat przedni.",
        fault: "Pęknięty ekran",
      },
      {
        t: "Zużyta lub spuchnięta bateria",
        signs: [
          "Procenty spadają skokami w ostatniej ćwiartce",
          "Telefon gaśnie na chłodzie albo przy włączaniu aparatu",
          "Kondycja baterii w ustawieniach wyraźnie spadła",
          "Ekran lub klapka zaczyna odstawać od ramki",
        ],
        meaning: "Sprawdzamy ogniwo i to, czy energii nie zjada aplikacja albo usterka na płycie.",
        fault: "Bateria",
      },
      {
        t: "Problem z ładowaniem",
        signs: [
          "Kabel wchodzi płytko i wypada",
          "Ładuje tylko przy ułożeniu wtyczki pod kątem",
          "Telefon pokazuje ładowanie, ale procenty stoją w miejscu",
          "Komunikat o wolnym ładowaniu mimo szybkiej ładowarki",
        ],
        meaning: "Najpierw oceniamy, czy wystarczy wyczyścić port, czy trzeba wymienić gniazdo albo jego taśmę.",
        fault: "Nie ładuje",
      },
      {
        t: "Cichy dźwięk, rozmówca Cię nie słyszy",
        signs: [
          "Głośnik rozmów brzmi głucho albo trzeszczy",
          "Na nagraniach głosowych słychać szum albo nic",
          "Rozmowy działają tylko na słuchawkach lub na głośnomówiącym",
        ],
        meaning: "Sprawdzamy siatki głośników, mikrofony i taśmy, bo często winny jest brud albo wilgoć, a nie sam podzespół.",
        fault: "Głośnik lub mikrofon",
      },
      {
        t: "Rozmyte zdjęcia albo czarny aparat",
        signs: [
          "Aparat nie łapie ostrości i słychać ciche brzęczenie",
          "Na każdym zdjęciu plama lub mgła w tym samym miejscu",
          "Aplikacja aparatu pokazuje czarny obraz albo się zamyka",
        ],
        meaning: "Oglądamy szkiełko obiektywu, moduł aparatu i jego stabilizację, żeby ustalić, czy wystarczy nowa osłona, czy potrzebny jest cały moduł.",
        fault: "Aparat",
      },
      {
        t: "Telefon nie reaguje",
        signs: [
          "Czarny ekran nawet po dłuższym ładowaniu",
          "Telefon zapętla się na logo producenta",
          "Po podłączeniu do komputera nic się nie dzieje",
        ],
        meaning: "Sprawdzamy pobór prądu, baterię i przycisk zasilania, a przy pętli na logo także stan oprogramowania.",
        fault: "Nie włącza się",
      },
    ],
    selfCheck: [
      {
        t: "Inny kabel i ładowarka",
        s: "Kable psują się częściej niż gniazda. Podłącz telefon innym przewodem do innej ładowarki, najlepiej takiej, która bez problemu ładuje drugi telefon.",
      },
      {
        t: "Wymuszony restart",
        s: "Zawieszony system wygląda jak martwy telefon. W iPhonie naciśnij i puść głośniej, potem ciszej, a następnie przytrzymaj boczny przycisk do pojawienia się logo. W większości Androidów przytrzymaj zasilanie razem z przyciskiem ciszej przez kilkanaście sekund.",
      },
      {
        t: "Stan baterii",
        s: "Odczytaj w ustawieniach, ile procent pierwotnej pojemności zostało ogniwu, i wpisz wynik do zgłoszenia. To od razu podpowiada, czy problem leży w baterii.",
      },
      {
        t: "Gniazdo oglądane latarką",
        s: "Poświeć do portu ładowania. Jeśli widzisz zbite kłaczki, nie dłub w nim szpilką ani spinaczem, bo metal zwiera i wygina styki. Czyszczenie zostaw nam.",
      },
      {
        t: "Tryb awaryjny w Androidzie",
        s: "Gdy telefon sam się restartuje albo zacina, uruchom go w trybie awaryjnym. Jeśli w nim działa poprawnie, winna jest raczej któraś z zainstalowanych aplikacji niż sprzęt.",
      },
      {
        t: "Aktualizacja i wolna pamięć",
        s: "Zainstaluj zaległą aktualizację systemu i zwolnij trochę miejsca. Prawie pełna pamięć spowalnia telefon i potrafi psuć działanie aparatu oraz wiadomości.",
      },
    ],
    worth: {
      yes: [
        "Telefon ma dwa, trzy lata i poza jedną usterką działa dobrze, więc nowy ekran albo bateria wydłużą jego życie.",
        "Usterka dotyczy jednej części, na przykład gniazda, a reszta telefonu jest sprawna.",
        "Zależy Ci na danych i ustawieniach, a przenoszenie wszystkiego na nowy telefon byłoby kłopotliwe.",
        "Masz telefon z wyższej półki, którego zamiana na podobny model byłaby dużo droższa niż naprawa.",
      ],
      no: [
        "Model jest na tyle stary, że brakuje do niego części, a system nie dostaje już aktualizacji.",
        "Po zalaniu nie działa kilka podzespołów naraz i ich wymiana przewyższa wartość telefonu.",
        "Kwota naprawy zbliża się do ceny nowszego telefonu o podobnych możliwościach.",
      ],
      note: "Jeśli po diagnozie uznamy, że naprawa się nie opłaca, powiemy to wprost. Decyzja i tak należy do Ciebie.",
    },
    kinds: [
      { n: "Apple", s: "iPhone: wyświetlacz, bateria, gniazdo, tylna szybka i aparat." },
      { n: "Samsung", s: "Galaxy A, S i M: ekran, bateria, klapka; składane Z po oględzinach." },
      { n: "Xiaomi", s: "Xiaomi, Redmi i POCO: wyświetlacz, bateria, port USB-C." },
      { n: "Motorola", s: "moto g, moto e i edge: ekran, ładowanie, bateria." },
      { n: "realme", s: "Seria liczbowa i C: wyświetlacz, gniazdo, bateria." },
      { n: "OPPO", s: "Seria A i Reno: ekran, bateria, ładowanie." },
      { n: "Huawei i Honor", s: "Wyświetlacz, bateria, obudowa." },
      { n: "Google Pixel", s: "Ekran i bateria; dostępność części sprawdzamy dla modelu." },
    ],
    intake:
      "Przed oddaniem zrób kopię zapasową w chmurze albo na komputerze i zapisz kod blokady, który podasz przy przyjęciu. Wyjmij kartę SIM i kartę pamięci, chyba że problem dotyczy właśnie ich. Przygotuj dane do konta Apple ID lub Google na wypadek, gdyby były potrzebne do testów po naprawie, ale nie wylogowuj się na zapas. Do wysyłki kurierem wyłącz telefon, owiń go folią bąbelkową i włóż do sztywnego pudełka, a wolne miejsce wypełnij, żeby nic nie przesuwało się w środku.",
    warranty:
      "Gwarancja obejmuje pracę, którą wykonaliśmy, i część, którą włożyliśmy do telefonu. Jeśli nowy ekran przestanie reagować na dotyk albo nowa bateria zacznie gwałtownie tracić pojemność bez Twojej winy, zgłoś to, a sprawdzimy telefon. Gwarancja nie obejmuje nowych uszkodzeń, takich jak ponownie zbity wyświetlacz, wygięta ramka czy zalanie po naprawie, ani podzespołów, których nie dotykaliśmy.",
    faq: [
      {
        q: "Czy wymiana baterii skasuje dane?",
        a: "Nie. Bateria nie przechowuje danych, a jej wymiana nie dotyka pamięci telefonu. Kopię i tak zrób, bo to najprostsze zabezpieczenie przed każdą naprawą.",
      },
      {
        q: "Czy muszę wyłączyć funkcję Znajdź mój iPhone?",
        a: "To nie jest warunek przyjęcia telefonu. Przy niektórych naprawach zalogowanie do Apple ID pomaga sprawdzić wszystkie funkcje po wymianie części. Jeśli będzie potrzebne, powiemy Ci o tym, dlatego miej dane do konta pod ręką.",
      },
      {
        q: "Czy naprawicie telefon, który był już otwierany w innym serwisie?",
        a: "Przyjmiemy go do diagnozy. Powiedz przy zgłoszeniu, co było wymieniane, bo wcześniejsze naprawy wpływają na to, co sprawdzamy i jakie części trzeba dobrać.",
      },
      {
        q: "Czy mogę wybrać część do naprawy?",
        a: "Tak. Powiemy, jakie części pasują do Twojego modelu i czym się różnią: jasnością i kolorami ekranu, dostępnością, a w iPhonie także tym, czy iOS pokaże komunikat o nieznanej części. Wybór należy do Ciebie.",
      },
    ],
  },

  "serwis-tabletow": {
    intro: [
      "Tablet spada rzadziej niż telefon, ale gdy już spadnie, duża tafla szkła pęka prawie zawsze. Druga typowa usterka to bateria: tablety leżą tygodniami rozładowane w szufladzie albo całe noce pod ładowarką, a obie skrajności szkodzą ogniwu. Trzecia to port ładowania, który w tabletach dzieci obrywa przy zabawie z kablem wpiętym do ściany.",
      "Najpierw sprawdzamy tablet i ustalamy, co wymaga wymiany: sama szybka z warstwą dotykową, cały wyświetlacz, a może też bateria. Dostajesz konkretny wariant naprawy z kwotą i dopiero wtedy decydujesz. Tablet zostawisz w dowolnym z dwóch salonów albo nadasz kurierem, a postęp naprawy sprawdzisz online.",
    ],
    symptoms: [
      {
        t: "Pęknięta szybka lub martwy dotyk",
        signs: [
          "Siatka pęknięć zaczynająca się od narożnika",
          "Klawiatura ekranowa nie reaguje na część liter",
          "Rysik rysuje z przerwami albo w złym miejscu",
          "Prześwity lub plamy przy krawędziach obrazu",
        ],
        meaning: "Sprawdzamy budowę ekranu w Twoim modelu, bo od niej zależy, czy wymienia się samą szybkę, czy cały moduł.",
        fault: "Pęknięty ekran",
      },
      {
        t: "Bateria, która nie wytrzymuje filmu",
        signs: [
          "Tablet rozładowuje się w trakcie jednego seansu",
          "Wyłącza się przy kilkunastu procentach",
          "Ekran unosi się przy krawędzi albo obudowa się wybrzusza",
          "Ładowanie do pełna trwa wyraźnie dłużej niż kiedyś",
        ],
        meaning: "Sprawdzamy kondycję ogniwa, a wybrzuszony tablet traktujemy jako pilny, bo spuchnięta bateria naciska na ekran.",
        fault: "Bateria",
      },
      {
        t: "Tablet nie chce się ładować",
        signs: [
          "Wtyczka USB-C lub Lightning luźno siedzi w porcie",
          "Ikona ładowania pojawia się i znika",
          "Tablet ładuje się tylko wtedy, gdy jest wyłączony",
        ],
        meaning: "Mierzymy prąd ładowania i oglądamy port, żeby odróżnić zabrudzone gniazdo od zużytej baterii albo słabej ładowarki.",
        fault: "Nie ładuje",
      },
      {
        t: "Czarny ekran po włączeniu",
        signs: [
          "Brak reakcji po dłuższym czasie na ładowarce",
          "Słychać dźwięk powiadomień, ale ekran nie świeci",
          "Tablet zatrzymuje się na logo i restartuje",
        ],
        meaning: "Rozdzielamy usterkę podświetlenia lub wyświetlacza od problemu z zasilaniem i oprogramowaniem.",
        fault: "Nie włącza się",
      },
      {
        t: "Wygięta obudowa i przyciski",
        signs: [
          "Tablet nie leży płasko na stole",
          "Przycisk zasilania lub głośności zapada się albo nie klika",
          "Szczelina między ekranem a ramką",
        ],
        meaning: "Wygięta obudowa naciska na szkło, dlatego sprawdzamy, czy nowy ekran da się w niej bezpiecznie osadzić.",
        fault: "Przyciski i obudowa",
      },
      {
        t: "Dźwięk i rozmowy wideo",
        signs: [
          "Jeden z głośników gra ciszej albo charczy",
          "Na wideorozmowach rozmówca słyszy szum",
          "Dźwięk działa tylko na słuchawkach Bluetooth",
        ],
        meaning: "Sprawdzamy siatki, głośniki, mikrofony i ustawienia aplikacji, zanim zaproponujemy wymianę części.",
        fault: "Głośnik lub mikrofon",
      },
    ],
    selfCheck: [
      {
        t: "Ładowarka o właściwej mocy",
        s: "Tablet potrzebuje więcej prądu niż telefon. Mała ładowarka od starego telefonu może ładować go bardzo wolno albo wcale. Sprawdź zasilacz dołączony do tabletu lub inny o podobnej mocy i inny kabel.",
      },
      {
        t: "Restart wymuszony",
        s: "W iPadzie z przyciskiem Początek przytrzymaj go razem z przyciskiem górnym do pojawienia się logo. W iPadzie bez tego przycisku naciśnij i puść głośniej, potem ciszej, a następnie przytrzymaj przycisk górny. W tabletach z Androidem zwykle pomaga długie przytrzymanie zasilania z przyciskiem ciszej.",
      },
      {
        t: "Etui i klawiatura",
        s: "Magnetyczne etui i klawiatury potrafią usypiać ekran albo blokować przyciski. Zdejmij je i sprawdź, czy problem znika.",
      },
      {
        t: "Rysik",
        s: "Gdy rysik nie działa, naładuj go i sparuj ponownie, a zużytą końcówkę wymień. Jeśli inny rysik też zawodzi w tym samym miejscu ekranu, winny jest raczej dotyk.",
      },
      {
        t: "Pamięć i aktualizacje",
        s: "Rodzinne tablety często mają pamięć zapchaną grami i filmami. Zwolnij miejsce, zainstaluj aktualizację systemu i sprawdź, czy tablet przyspieszył.",
      },
      {
        t: "Kopia zdjęć i dokumentów",
        s: "Jeśli tablet się włącza, skopiuj ważne pliki do chmury albo na komputer, zanim go oddasz.",
      },
    ],
    worth: {
      yes: [
        "Pękła sama szybka z dotykiem, a wyświetlacz pod nią jest sprawny.",
        "Tablet służy do pracy lub nauki, a rysik i klawiatura bez niego leżą bezużyteczne.",
        "Bateria jest jedyną słabą stroną, a tablet nadal płynnie obsługuje aplikacje, z których korzystasz.",
        "Masz iPada lub tablet z wyższej serii, którego odpowiednik byłby wyraźnie droższy od naprawy.",
      ],
      no: [
        "Tani tablet ma pęknięty ekran zespolony z panelem, a cały moduł kosztuje prawie tyle, co nowe urządzenie.",
        "Model nie dostaje już aktualizacji, a aplikacje szkolne lub bankowe przestają na nim działać.",
        "Obudowa jest mocno wygięta i nowy ekran nie miałby na czym stabilnie leżeć.",
      ],
      note: "W tabletach różnica między wariantami naprawy bywa duża, dlatego kwotę podajemy dla konkretnego zakresu. Ty wybierasz, czy naprawiamy, czy odbierasz tablet.",
    },
    kinds: [
      { n: "Apple", s: "iPad, iPad Air, iPad Pro i iPad mini: szybka, wyświetlacz, bateria, port." },
      { n: "Samsung", s: "Galaxy Tab A, S i FE: ekran, bateria, gniazdo USB-C." },
      { n: "Lenovo", s: "Tab M, Tab P i Yoga Tab: wyświetlacz, ładowanie, bateria." },
      { n: "Xiaomi", s: "Xiaomi Pad i Redmi Pad: ekran, port, bateria." },
      { n: "Huawei", s: "MatePad i MatePad T: wyświetlacz, bateria." },
      { n: "Inne marki", s: "Tablety dla dzieci i mniej znane marki: o naprawie decyduje dostępność części." },
    ],
    intake:
      "Zrób kopię danych i zapisz kod blokady albo zaznacz, że oddajesz tablet bez niego. Rysik i etui z klawiaturą przynieś wtedy, gdy usterka ich dotyczy, na przykład rysik działa tylko w części ekranu. Przy iPadzie miej pod ręką dane do Apple ID, a przy tablecie z Androidem do konta Google, na wypadek gdyby były potrzebne do testów. Jeśli z tabletu korzysta dziecko, upewnij się, że znasz kod kontroli rodzicielskiej. Do wysyłki owiń tablet folią bąbelkową od strony ekranu, włóż do sztywnego kartonu z zapasem z każdej strony i wypełnij luki, bo duży ekran łatwo pęka, gdy paczka się zegnie.",
    warranty:
      "Gwarancja dotyczy wymienionej części i wykonanej pracy, czyli nowej szybki, wyświetlacza, baterii albo gniazda. Jeśli po naprawie pojawi się w nich wada, na przykład dotyk przestanie działać w pasie albo nowe ogniwo zacznie puchnąć, zgłoś to, a sprawdzimy tablet. Gwarancja nie obejmuje kolejnego pęknięcia po upadku, uszkodzeń od nacisku na ekran w plecaku ani zalania, do którego doszło po odbiorze.",
    faq: [
      {
        q: "Czy wymienicie samą szybkę w tablecie?",
        a: "W części modeli tak: wymienia się szkło z warstwą dotykową, a wyświetlacz zostaje. Tam, gdzie szkło jest zespolone z panelem, wymiana obejmuje cały moduł. Model rozpoznamy po numerze z obudowy albo z ustawień.",
      },
      {
        q: "Czy spuchnięta bateria w tablecie jest niebezpieczna?",
        a: "Tak, trzeba ją potraktować poważnie. Rozdęte ogniwo wypycha ekran i może się zapalić przy ładowaniu lub przebiciu. Nie ładuj tabletu, nie dociskaj ekranu i przynieś go jak najszybciej.",
      },
      {
        q: "Czy naprawiacie tablety szkolne i firmowe?",
        a: "Tak. Jeśli tablet jest zarządzany przez szkołę lub firmę, przed oddaniem zapytaj administratora, czy możesz przekazać go do serwisu i czy do testów potrzebny będzie kod.",
      },
      {
        q: "Czy mogę wysłać tablet kurierem?",
        a: "Tak. Zgłoś naprawę online i wybierz kuriera. Wysyłkę do serwisu opłacasz Ty, a odesłanie tabletu po naprawie lub po rezygnacji jest po naszej stronie. Za naprawę płacisz przelewem po diagnozie i akceptacji kwoty.",
      },
    ],
  },

  "serwis-smartwatchy": {
    intro: [
      "Smartwatch pracuje w trudniejszych warunkach niż telefon: uderza o klamki i framugi, pod spodem poci się nadgarstek, a na basenie i pod prysznicem dostaje wodę z mydłem i chlorem. Dlatego najczęściej trafiają do nas zegarki z pękniętym szkłem, z baterią, która nie dociąga do wieczora, i takie, które przestały się ładować na stacji. Osobna grupa to zegarki, które po kąpieli zaparowały albo zgasły.",
      "Najpierw sprawdzamy zegarek razem z jego ładowarką i ustalamy, czy usterka siedzi w kopercie, w stacji, czy w oprogramowaniu. Potem mówisz, czy naprawiamy za podaną kwotę, czy odbierasz zegarek. Smartwatch zostawisz w jednym z dwóch salonów albo wyślesz kurierem, dobrze zabezpieczony w małym pudełku.",
    ],
    symptoms: [
      {
        t: "Pęknięte szkło lub ekran",
        signs: [
          "Rysa lub pajęczynka na szkle koperty",
          "Dotyk nie działa przy jednej krawędzi",
          "Ekran miga albo ma ciemne pola",
        ],
        meaning: "Sprawdzamy, czy uszkodzenie sięga wyświetlacza i czy w tym modelu szkło da się wymienić osobno.",
        fault: "Pęknięte szkło",
      },
      {
        t: "Bateria na kilka godzin",
        signs: [
          "Zegarek trzeba ładować dwa razy dziennie",
          "Gaśnie podczas treningu z GPS, choć pokazywał zapas",
          "Ekran unosi się nad kopertą",
        ],
        meaning: "Sprawdzamy kondycję baterii i ustawienia, które ją drenują, a przy uniesionym ekranie podejrzewamy spuchnięte ogniwo.",
        fault: "Bateria",
      },
      {
        t: "Brak ładowania na stacji",
        signs: [
          "Zegarek nie reaguje po położeniu na ładowarce",
          "Ładowanie przerywa się, gdy poruszysz kablem",
          "Styki na spodzie są zaśniedziałe lub pokryte osadem",
        ],
        meaning: "Sprawdzamy zegarek na innej, sprawnej ładowarce, żeby odróżnić usterkę stacji od usterki układu ładowania w kopercie.",
        fault: "Nie ładuje",
      },
      {
        t: "Koronka, przyciski i koperta",
        signs: [
          "Koronka się obraca, ale menu nie reaguje",
          "Przycisk boczny się zaciął albo nie wraca",
          "Pęknięcie lub wgniecenie w kopercie",
        ],
        meaning: "Sprawdzamy, czy przycisk zablokowały brud i pot, czy uszkodzony jest mechanizm albo taśma w środku.",
        fault: "Przyciski i obudowa",
      },
      {
        t: "Woda w zegarku",
        signs: [
          "Para lub kropelki pod szkłem",
          "Głośnik charczy, a mikrofon nie działa",
          "Zegarek sam się restartuje po treningu w wodzie",
        ],
        meaning: "Szukamy korozji na płytce i stykach baterii, zanim woda zdąży narobić większych szkód.",
        fault: "Po zalaniu",
      },
      {
        t: "Nie włącza się albo nie łączy z telefonem",
        signs: [
          "Czarny ekran mimo długiego ładowania",
          "Zegarek zapętla się na logo",
          "Parowanie z telefonem kończy się błędem",
        ],
        meaning: "Rozdzielamy usterkę sprzętową od problemu z oprogramowaniem zegarka lub aplikacją w telefonie.",
        fault: "Nie włącza się",
      },
    ],
    selfCheck: [
      {
        t: "Czyste styki",
        s: "Przetrzyj spód zegarka i ładowarkę suchą, miękką ściereczką. Pot i krem zostawiają na stykach osad, który przerywa ładowanie. Nie używaj metalu ani ostrych narzędzi.",
      },
      {
        t: "Inna ładowarka i zasilacz",
        s: "Kable magnetyczne łatwo łamią się przy wtyczce. Spróbuj innej stacji albo innego zasilacza USB, a przy Apple Watchu sprawdź, czy zegarek leży na środku ładowarki.",
      },
      {
        t: "Wymuszony restart",
        s: "W Apple Watchu przytrzymaj jednocześnie koronkę i przycisk boczny, aż pojawi się logo. W innych zegarkach zwykle wystarczy dłuższe przytrzymanie przycisku zasilania, szczegóły znajdziesz w instrukcji producenta.",
      },
      {
        t: "Ustawienia, które zjadają baterię",
        s: "Wyłącz na próbę ekran zawsze włączony, ciągły pomiar tętna i GPS. Jeśli zegarek od razu wytrzymuje dłużej, problem leży w ustawieniach, a nie w ogniwie.",
      },
      {
        t: "Aktualizacja zegarka i aplikacji",
        s: "Zaktualizuj aplikację towarzyszącą w telefonie i oprogramowanie zegarka. Błędy parowania i synchronizacji często znikają po aktualizacji.",
      },
      {
        t: "Po wodzie nie ładuj",
        s: "Jeśli pod szkłem widać parę, nie kładź zegarka na ładowarce i nie podgrzewaj go. Wytrzyj go z zewnątrz i zgłoś naprawę.",
      },
    ],
    worth: {
      yes: [
        "Zegarek z wyższej serii, na przykład Apple Watch lub Galaxy Watch, ma pęknięte szkło, a reszta działa.",
        "Bateria jest zużyta, ale zegarek dostaje aktualizacje i współpracuje z Twoim telefonem.",
        "Problem dotyczy ładowarki albo zabrudzonych styków, a sam zegarek jest sprawny.",
        "Zależy Ci na zegarku z LTE lub z funkcjami zdrowotnymi, których nie ma prostszy model.",
      ],
      no: [
        "Prosta opaska sportowa, do której nie ma części albo kosztują one tyle, co nowa opaska.",
        "Zegarek po zalaniu ma uszkodzony ekran, baterię i płytkę jednocześnie.",
        "Model nie współpracuje już z aktualnym systemem Twojego telefonu.",
      ],
      note: "Po oględzinach mówimy, czy naprawa ma sens w Twoim modelu. To Ty decydujesz, czy ją robimy.",
    },
    kinds: [
      { n: "Apple Watch", s: "Series, SE i Ultra: szkło, wyświetlacz, bateria." },
      { n: "Samsung", s: "Galaxy Watch i Watch Active: szkło, bateria, ładowanie." },
      { n: "Huawei", s: "Watch GT, Watch Fit i Band: ekran, bateria." },
      { n: "Xiaomi", s: "Mi Band, Smart Band i Redmi Watch: ekran, ładowanie." },
      { n: "Garmin i Amazfit", s: "Diagnoza i ładowanie; wymianę ekranu lub baterii sprawdzamy dla modelu." },
    ],
    intake:
      "Przynieś zegarek razem z jego ładowarką, bo bez niej trudno sprawdzić, czy winna jest stacja, czy koperta. Przed oddaniem zsynchronizuj treningi i dane zdrowotne z telefonem. Przy Apple Watchu miej pod ręką dane do Apple ID, bo mogą być potrzebne przy testach po naprawie. Do wysyłki kurierem włóż zegarek do małego, sztywnego pudełka, owiń go folią bąbelkową, a ładowarkę dołóż w osobnym woreczku, żeby nie porysowała szkła.",
    warranty:
      "Gwarancja obejmuje element, który wymieniliśmy, czyli szkło z wyświetlaczem, baterię albo układ ładowania, oraz samą pracę przy zegarku. Jeśli nowy ekran przestanie reagować albo nowa bateria szybko straci pojemność, zgłoś to. Gwarancja nie obejmuje kolejnych pęknięć po uderzeniu ani zalania po naprawie, także podczas pływania, bo po otwarciu koperty nie możemy potwierdzić jej odporności na wodę.",
    faq: [
      {
        q: "Czy wymiana baterii w zegarku skasuje dane?",
        a: "Nie. Dane są w pamięci zegarka i na koncie w telefonie, a nie w baterii. Po naprawie zegarek może poprosić o ponowne połączenie z telefonem, dlatego zsynchronizuj go przed oddaniem.",
      },
      {
        q: "Czy naprawiacie opaski sportowe, na przykład Mi Band?",
        a: "Przyjmujemy je do diagnozy. W małych opaskach często nie ma osobnych części do wymiany, więc najpierw sprawdzamy dostępność i mówimy, czy naprawa ma sens.",
      },
      {
        q: "Zgubiłem ładowarkę do zegarka. Czy mogę przyjść bez niej?",
        a: "Możesz, ale sprawdzenie ładowania będzie trudniejsze. Przy problemie z ładowaniem ładowarka bardzo pomaga, bo usterka często siedzi właśnie w niej.",
      },
      {
        q: "Zegarek nie łączy się z telefonem. Czy to usterka sprzętu?",
        a: "Nie zawsze. Najpierw zaktualizuj aplikację, wyłącz i włącz Bluetooth oraz zrestartuj oba urządzenia. Jeśli parowanie nadal się nie udaje, sprawdzimy moduł łączności i oprogramowanie zegarka.",
      },
    ],
  },

  "serwis-konsol": {
    intro: [
      "W konsolach najczęściej psują się trzy rzeczy: złącze HDMI, układ chłodzenia i pady. Gniazdo HDMI obrywa, gdy ktoś szarpnie kabel albo przesunie konsolę z podłączonym przewodem. Chłodzenie zapycha się kurzem i sierścią, a gałki w padach zużywają się od codziennego grania, co kończy się dryfem.",
      "Konsolę najpierw uruchamiamy i testujemy, żeby potwierdzić usterkę i znaleźć jej przyczynę. Potem dostajesz kwotę i decydujesz, czy naprawiamy. Konsolę albo sam pad oddasz w jednym z dwóch salonów, a jeśli masz daleko, wyślesz ją kurierem w dobrze zabezpieczonej paczce.",
    ],
    symptoms: [
      {
        t: "Brak obrazu przez HDMI",
        signs: [
          "Konsola się włącza, a telewizor pokazuje brak sygnału",
          "Obraz pojawia się po poruszeniu kablem",
          "Wtyczka HDMI wchodzi krzywo albo luźno",
        ],
        meaning: "Sprawdzamy kabel, port i układ odpowiedzialny za obraz, bo nie każdy brak sygnału oznacza uszkodzone gniazdo.",
        fault: "Brak obrazu (HDMI)",
      },
      {
        t: "Napęd nie czyta płyt",
        signs: [
          "Płyta się kręci, ale gra się nie uruchamia",
          "Konsola wysuwa płytę albo w ogóle jej nie wciąga",
          "Z napędu słychać stukanie lub zgrzyt",
        ],
        meaning: "Sprawdzamy mechanizm i laser napędu, a w PS5 z odłączanym napędem także jego połączenie z konsolą.",
        fault: "Nie czyta płyt",
      },
      {
        t: "Hałas i przegrzewanie",
        signs: [
          "Wentylator rozkręca się na pełne obroty po krótkim graniu",
          "Ostrzeżenie o temperaturze i wyłączenie w trakcie meczu",
          "Spadki płynności w grach, które wcześniej działały równo",
        ],
        meaning: "Oceniamy stan wentylatora, ilość kurzu i pasty, a potem proponujemy zakres czyszczenia.",
        fault: "Głośna, przegrzewa się",
      },
      {
        t: "Konsola się nie uruchamia",
        signs: [
          "Brak diody i reakcji na przycisk zasilania",
          "Dioda mruga, a konsola od razu gaśnie",
          "Wyłącza się kilka sekund po starcie",
        ],
        meaning: "Sprawdzamy kabel i zasilacz, przycisk zasilania i zabezpieczenia na płycie, zanim podamy zakres naprawy.",
        fault: "Nie włącza się",
      },
      {
        t: "Dryf gałki w padzie",
        signs: [
          "Kamera obraca się bez dotykania gałki",
          "Celownik ucieka w jedną stronę",
          "Gałka nie wraca równo do środka",
        ],
        meaning: "Mierzymy odchylenie gałek i oceniamy, czy winny jest zużyty mechanizm analogowy.",
        fault: "Dryf w padzie",
      },
      {
        t: "Pad nie ładuje się",
        signs: [
          "Dioda pada nie świeci po podłączeniu kabla",
          "Pad działa tylko na kablu",
          "Bateria pada wyczerpuje się po krótkiej sesji",
        ],
        meaning: "Sprawdzamy gniazdo USB-C w padzie, baterię i kabel, bo każde z nich daje podobne objawy.",
        fault: "Pad nie ładuje",
      },
    ],
    selfCheck: [
      {
        t: "Inny kabel HDMI i inne wejście",
        s: "Podłącz konsolę innym kablem HDMI do innego wejścia albo do innego telewizora. Sprawdź też, czy w telewizorze wybrane jest właściwe źródło sygnału.",
      },
      {
        t: "Tryb awaryjny PlayStation",
        s: "Przy wyłączonej konsoli przytrzymaj przycisk zasilania, aż usłyszysz drugi sygnał, i podłącz pad kablem. Z menu możesz zmienić rozdzielczość lub odbudować bazę danych, co często pomaga przy błędach i braku obrazu.",
      },
      {
        t: "Pełne wyłączenie",
        s: "Wyłącz konsolę całkowicie, a nie do trybu spoczynku, odłącz zasilanie na minutę i uruchom ją ponownie. W Xboksie przytrzymaj przycisk zasilania przez około 10 sekund.",
      },
      {
        t: "Aktualizacja konsoli i pada",
        s: "Zainstaluj zaległą aktualizację systemu, a pady zaktualizuj z poziomu ustawień konsoli. Część problemów z łącznością i ładowaniem znika po aktualizacji.",
      },
      {
        t: "Kalibracja gałek w Switchu",
        s: "W Nintendo Switch wejdź w ustawienia kontrolerów i uruchom kalibrację gałek. Jeśli dryf zostaje po kalibracji, winny jest zużyty mechanizm.",
      },
      {
        t: "Miejsce wokół konsoli",
        s: "Sprawdź, czy kratki z tyłu i po bokach nie są zarośnięte kurzem i czy konsola nie stoi w zamkniętej szafce. Nie rozkręcaj obudowy sam, jeśli sprzęt ma jeszcze gwarancję producenta.",
      },
    ],
    worth: {
      yes: [
        "Uszkodzone jest samo gniazdo HDMI, a konsola poza tym działa.",
        "Konsola jest głośna lub się grzeje, a czyszczenie zwykle przywraca jej normalną pracę.",
        "Napęd przestał czytać płyty, a masz kolekcję gier na płytach.",
        "Pad poza dryfem jest w dobrym stanie, a zależy Ci na tym konkretnym modelu.",
      ],
      no: [
        "Konsola starszej generacji ma uszkodzoną płytę główną, do której trudno o części.",
        "Po zalaniu nie działa kilka układów naraz.",
        "Tani pad ma kilka usterek jednocześnie: gałkę, przyciski i baterię.",
      ],
      note: "Po diagnozie wiesz, co jest zepsute i ile kosztuje naprawa. Wtedy decydujesz, czy ją robimy.",
    },
    kinds: [
      { n: "PlayStation 5", s: "PS5 i PS5 Slim: HDMI, napęd, czyszczenie, pady DualSense." },
      { n: "PlayStation 4", s: "PS4, Slim i Pro: chłodzenie, HDMI, napęd, pady DualShock 4." },
      { n: "Xbox", s: "Series X, Series S i One: zasilanie, HDMI, napęd, kontrolery." },
      { n: "Nintendo Switch", s: "Switch, Switch Lite i OLED: gniazdo ładowania, ekran, Joy-Cony." },
    ],
    intake:
      "Gdy zgłaszasz tylko pad, konsolę zostaw w domu. Przy usterce konsoli dołóż kabel zasilający, a pady i kabel HDMI tylko wtedy, gdy podejrzewasz, że to one są winne. Włącz kopię zapisów w chmurze i wyjmij płytę z napędu, chyba że to właśnie ona utknęła w środku. Switcha oddaj z Joy-Conami, jeśli usterka ich dotyczy, i z ładowarką, gdy konsola nie ładuje. Do wysyłki najlepiej nadaje się oryginalne pudełko z wypraskami. Jeśli go nie masz, owiń konsolę folią bąbelkową, włóż do kartonu z kilkucentymetrowym zapasem i wypełnij go tak, żeby nic nie przesuwało się przy potrząśnięciu.",
    warranty:
      "Gwarancja obejmuje wymienione elementy, na przykład gniazdo HDMI, napęd, wentylator albo moduł gałki w padzie, oraz wykonaną pracę. Jeśli po naprawie ta sama usterka wróci, zgłoś ją w ramach gwarancji. Nie obejmuje ona ponownego wyrwania gniazda przez szarpnięcie kabla, zalania ani upadku konsoli po odbiorze.",
    faq: [
      {
        q: "Czy naprawiacie Joy-Cony?",
        a: "Tak, przyjmujemy Joy-Cony z dryfem gałki i z niedziałającymi przyciskami. Przynieś same kontrolery, a jeśli problem dotyczy ich ładowania lub łączenia z konsolą, także Switcha.",
      },
      {
        q: "Czy można wysłać konsolę kurierem i jak ją zapakować?",
        a: "Tak. W zgłoszeniu online wybierz wysyłkę kurierem, a adres dostaniesz w potwierdzeniu. Zabezpiecz konsolę tak, żeby nie przesuwała się w kartonie, i nie zostawiaj płyty w napędzie. Odesłanie po naprawie albo po rezygnacji jest po naszej stronie.",
      },
      {
        q: "Konsola pokazuje błąd systemu przy starcie. Co to może być?",
        a: "Często winne są uszkodzone dane systemu albo dysk. Spróbuj trybu awaryjnego i aktualizacji według instrukcji producenta. Jeśli błąd wraca, sprawdzimy dysk i oprogramowanie, a przed reinstalacją powiemy, co stanie się z danymi.",
      },
      {
        q: "Gniazdo HDMI wyrwało się z kablem. Czy da się wymienić sam port?",
        a: "W większości konsol gniazdo HDMI siedzi na płycie głównej i wymienia się sam port. Przed wyceną sprawdzamy, czy przy wyrwaniu nie ucierpiały ścieżki obok i układ obrazu, bo od tego zależy, czy naprawa jest możliwa.",
      },
    ],
  },
};
