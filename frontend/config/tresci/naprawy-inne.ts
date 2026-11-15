import type { RepairExtra } from "@/lib/tech/content-types";

/** Extended texts (2026-11), to be accepted by Krystian. */
export const otherRepairExtra: Record<string, RepairExtra> = {
  "wymiana-ekranu-w-tablecie": {
    przyczyny: [
      {
        t: "Upadek na róg",
        s: "Tablet spada zwykle krawędzią w dół. Cała energia trafia w jeden punkt szkła, stąd pajęczyna rozchodząca się od narożnika.",
      },
      {
        t: "Nacisk w torbie lub plecaku",
        s: "Tablet wciśnięty między książki, laptopa i ładowarkę ugina się przy każdym ściśnięciu plecaka. Cienka obudowa nie chroni panelu przed punktowym naciskiem.",
      },
      {
        t: "Siadanie i stawanie na tablecie",
        s: "Zostawiony na kanapie albo na podłodze tablet łatwo przygnieść. Wtedy często pęka nie tylko szkło, ale też wyświetlacz pod nim.",
      },
      {
        t: "Spuchnięta bateria",
        s: "Rozdęte ogniwo wypycha ekran od środka. Szkło odkleja się od ramki, a przy dalszym puchnięciu może pęknąć bez żadnego upadku.",
      },
    ],
    czesci: [
      "Do popularnych tabletów dostępne są zwykle dwa rodzaje części: szybki z digitizerem i całe moduły wyświetlacza. Zamienniki różnią się od fabrycznych jasnością, odwzorowaniem kolorów i czułością dotyku przy krawędziach. W tabletach z rysikiem ważne jest, czy dana część obsługuje rysik i nacisk.",
      "Mówimy, jakie części są dostępne do Twojego modelu i czym się różnią, a wybór zostawiamy Tobie. Do mniej znanych marek oferta bywa ograniczona, dlatego model ustalamy po numerze z obudowy albo z ustawień, a nie po samej nazwie.",
    ],
    przygotowanie: [
      "Odczytaj model z ustawień lub z napisu na tylnej obudowie i wpisz go w zgłoszeniu.",
      "Jeśli z pękniętego ekranu sypie się szkło, zaklej go przezroczystą taśmą przed zapakowaniem.",
      "Weź rysik, jeśli tablet go używa, żeby sprawdzić go po wymianie.",
      "Przy iPadzie wyłącz funkcję „Znajdź mój iPad” albo przygotuj dane do Apple ID.",
    ],
    poNaprawie: [
      "Nowy klej twardnieje stopniowo, dlatego przez pierwszą dobę nie dociskaj mocno krawędzi ekranu.",
      "Ustawienia jasności i kalibracja automatycznej jasności mogą wymagać chwili, zanim tablet dopasuje się do nowego panelu.",
      "Jeśli zauważysz martwy pas dotyku albo odstającą ramkę, zgłoś to w ramach gwarancji na usługę.",
      "Szkło hartowane i nowe etui najlepiej założyć od razu po odbiorze.",
    ],
    porady: [
      {
        t: "Etui z klapką zamykaną na magnes",
        s: "Klapka chroni ekran w torbie przed kluczami i ładowarką. Wybierz model, który obejmuje też narożniki obudowy.",
      },
      {
        t: "Stała półka na tablet",
        s: "Odkładaj tablet zawsze w jedno miejsce, z dala od krawędzi stołu i siedzisk. To prosty nawyk, który eliminuje większość przygnieceń.",
      },
      {
        t: "Uwaga na wybrzuszenie obudowy",
        s: "Jeśli ekran zaczyna odstawać albo tablet nie leży płasko na stole, przestań go ładować i zgłoś go do diagnozy. Bateria mogła spuchnąć.",
      },
      {
        t: "Ładowanie poza łóżkiem",
        s: "Tablet ładowany pod kołdrą nagrzewa się, a w nocy łatwo go zrzucić lub przygnieść. Ładuj go na twardej, płaskiej powierzchni.",
      },
    ],
    faq: [
      {
        q: "Czy mogę korzystać z tabletu z pękniętą szybką, zanim go oddam?",
        a: "Jeśli obraz i dotyk działają, przez krótki czas tak. Zaklej pęknięcie przezroczystą taśmą, żeby odłamki nie raniły palców, i nie dociskaj ekranu w miejscu pęknięcia, bo możesz uszkodzić wyświetlacz pod szkłem.",
      },
      {
        q: "Po upadku ekran jest cały, ale obraz zniknął. Co się stało?",
        a: "Przy uderzeniu mogła odpiąć się lub uszkodzić taśma wyświetlacza albo pękł sam panel pod nienaruszonym szkłem. Zdarza się też uszkodzenie podświetlenia. Rozstrzyga to diagnoza po otwarciu obudowy.",
      },
      {
        q: "Czy po wymianie ekranu Touch ID lub przycisk Home będzie działał?",
        a: "W iPadach z przyciskiem Home przenosimy go ze starego ekranu, bo jest sparowany z płytą. Przy pękniętym lub uszkodzonym przycisku jego funkcja odcisku palca może nie wrócić. Sprawdzamy to przed naprawą i mówimy o tym przy wycenie.",
      },
    ],
  },

  "naprawa-smartwatcha": {
    przyczyny: [
      {
        t: "Uderzenie o twardą krawędź",
        s: "Szkło zegarka wystaje ponad kopertę. Wystarczy jedno uderzenie o futrynę, metalową poręcz albo kierownicę roweru, żeby pękło w rogu.",
      },
      {
        t: "Starzenie się małej baterii",
        s: "Zegarek ładowany codziennie przechodzi setki cykli w krótkim czasie. Ogniwo traci pojemność i z czasem może zacząć puchnąć.",
      },
      {
        t: "Woda, pot i środki chemiczne",
        s: "Chlor z basenu, sól morska, kremy i perfumy osłabiają klej uszczelniający. Pot osadza się też na stykach ładowania i powoduje ich korozję.",
      },
      {
        t: "Ładowanie zamienną ładowarką",
        s: "Tania ładowarka magnetyczna może ładować nierówno i grzać zegarek. Bateria zużywa się wtedy szybciej, a styki się przypalają.",
      },
    ],
    czesci: [
      "Dostępność części do smartwatchy zależy mocno od modelu i rozmiaru koperty. Do popularnych Apple Watchy i zegarków Samsung zwykle są moduły ekranu i baterie, choć nie zawsze w kilku wariantach. Do mniej znanych marek części bywa trudno zdobyć albo nie ma ich wcale.",
      "Zamienne moduły wyświetlacza mogą różnić się jasnością i kolorami od fabrycznych. W Apple Watchu po wymianie części system może pokazać komunikat o nieznanym elemencie. Zanim zamówimy część, mówimy, co jest dostępne do Twojego zegarka i jakie są różnice, a wybór należy do Ciebie.",
    ],
    przygotowanie: [
      "Sprawdź model i rozmiar koperty w aplikacji na telefonie (na przykład 41 mm czy 45 mm) i podaj je w zgłoszeniu.",
      "Jeśli bateria puchnie i ekran się unosi, nie ładuj zegarka przed wizytą i przewoź go w pudełku, bez nacisku na szkło.",
      "Zapisz, czy zegarek miał kontakt z wodą tuż przed usterką.",
    ],
    poNaprawie: [
      "Pierwsze ładowanie po wymianie baterii zrób do pełna i nie przerywaj go, żeby zegarek poprawnie odczytał stan ogniwa.",
      "Przez pierwsze dni klej dochodzi do pełnej twardości. Unikaj w tym czasie uderzeń i dociskania ekranu.",
      "Sprawdź pomiar tętna, powiadomienia i synchronizację z telefonem. Jeśli coś działa inaczej niż przed naprawą, daj znać.",
      "Kontakt z wodą ogranicz do mycia rąk i deszczu, nawet jeśli zegarek fabrycznie był przeznaczony do pływania.",
    ],
    porady: [
      {
        t: "Ładuj z oryginalną lub certyfikowaną ładowarką",
        s: "Stabilne ładowanie oszczędza baterię i styki na spodzie koperty. Ładowarka nie powinna parzyć ani zegarka, ani ręki.",
      },
      {
        t: "Przecieraj spód zegarka",
        s: "Raz na kilka dni przetrzyj czujniki i styki miękką, lekko wilgotną ściereczką. Pot i krem zostawiają osad, który utrudnia ładowanie i pomiar tętna.",
      },
      {
        t: "Zdejmuj zegarek przed sauną i gorącą kąpielą",
        s: "Wysoka temperatura i para wodna osłabiają klej i szkodzą baterii. To samo dotyczy pozostawienia zegarka w nagrzanym samochodzie.",
      },
      {
        t: "Ustaw rozsądnie ekran i powiadomienia",
        s: "Zawsze włączony ekran i pomiar wszystkiego naraz szybciej drenują baterię. Mniej cykli ładowania to wolniejsze zużycie ogniwa.",
      },
    ],
    faq: [
      {
        q: "Czy opłaca się wymieniać baterię w starszym zegarku?",
        a: "Zależy to od modelu i tego, czy zegarek dostaje jeszcze aktualizacje. Jeśli poza baterią wszystko działa, a części są dostępne, wymiana zwykle przywraca normalny czas pracy. Przy wycenie powiemy, czy w Twoim przypadku ma to sens.",
      },
      {
        q: "Zegarek pokazuje tylko logo i się restartuje. Co to może być?",
        a: "Częstą przyczyną jest bateria, która pod obciążeniem nie trzyma napięcia. Bywa też, że to błąd oprogramowania. Najpierw sprawdzamy, czy pomaga ponowne parowanie lub przywrócenie systemu, a dopiero potem otwieramy kopertę.",
      },
      {
        q: "Czy mogę oddać sam zegarek bez telefonu?",
        a: "Tak. Do testów po naprawie przydaje się jednak dostęp do sparowanego telefonu albo przynajmniej odblokowany zegarek. Opisz w zgłoszeniu, z jakim telefonem współpracuje.",
      },
    ],
  },

  "laptop-sie-przegrzewa": {
    przyczyny: [
      {
        t: "Zablokowane wloty powietrza",
        s: "Wiele laptopów pobiera powietrze od spodu. Na kocu, poduszce czy kolanach wloty są zasłonięte i wentylator kręci się na pełnych obrotach bez efektu.",
      },
      {
        t: "Filc z kurzu na radiatorze",
        s: "Kurz zbiera się na wąskich żeberkach przy wylocie, czyli w miejscu, którego nie widać z zewnątrz. Odkurzenie kratki go nie usuwa.",
      },
      {
        t: "Zużyty wentylator",
        s: "Łożysko z czasem traci smar, wirnik zwalnia i zaczyna terkotać. Taki wentylator przepycha mniej powietrza niż nowy.",
      },
      {
        t: "Wyschnięta pasta i spękane termopady",
        s: "Materiał termoprzewodzący po latach twardnieje i kruszy się. Między układem a radiatorem robi się szczelina, która izoluje ciepło zamiast je odprowadzać.",
      },
      {
        t: "Programy działające w tle",
        s: "Czasem winne jest oprogramowanie: zawieszony proces, indeksowanie albo złośliwy program obciąża procesor bez przerwy. Sprawdzamy to przed rozkręceniem obudowy.",
      },
    ],
    czesci: [
      "Przy czyszczeniu najczęściej wymienia się pastę termoprzewodzącą i, gdy są zniszczone, termopady. Termopady mają różną grubość zależną od modelu i dobiera się je tak, żeby radiator dolegał równo do wszystkich układów. Za gruby termopad może odsunąć radiator od procesora.",
      "Wentylatory do popularnych laptopów są dostępne w wersjach fabrycznych i zamiennych. Zamienniki bywają głośniejsze albo mają inną charakterystykę obrotów. Jeśli wentylator wymaga wymiany, mówimy, co jest dostępne do Twojego modelu, i czekamy na Twoją decyzję.",
    ],
    przygotowanie: [
      "Zanotuj, przy jakich czynnościach laptop się grzeje i czy kiedyś sam się wyłączył.",
      "Jeśli masz program pokazujący temperatury, zrób zrzut ekranu z wynikami pod obciążeniem.",
      "Zamknij laptopa w torbie dopiero po ostygnięciu i nie przewoź go włączonego.",
    ],
    poNaprawie: [
      "Wentylator powinien pracować wyraźnie ciszej przy zwykłych zadaniach, a pod obciążeniem włączać się później.",
      "Nowa pasta osiąga pełną skuteczność po kilku cyklach nagrzania i ostygnięcia, więc temperatury mogą jeszcze lekko spaść.",
      "Jeśli laptop wcześniej zwalniał, w grach i programach graficznych zauważysz stabilniejszą wydajność.",
      "Zachowaj wyniki pomiarów, które dostajesz od nas. Przydadzą się do porównania przy kolejnym czyszczeniu.",
    ],
    porady: [
      {
        t: "Twarde podłoże zamiast koca",
        s: "Na łóżku podłóż pod laptopa tacę, deskę albo podstawkę. Wloty od spodu muszą mieć dostęp do powietrza.",
      },
      {
        t: "Nie odkurzaj wentylatora odkurzaczem",
        s: "Silny ciąg rozkręca wirnik ponad normalne obroty, co szkodzi łożysku i elektronice. Plastikowa końcówka może też naelektryzować i porysować kratkę.",
      },
      {
        t: "Ustaw profil zasilania",
        s: "Do pracy biurowej wystarczy tryb zrównoważony. Tryb maksymalnej wydajności podnosi temperaturę także wtedy, gdy nie jest potrzebny.",
      },
      {
        t: "Obserwuj dźwięk wentylatora",
        s: "Gdy laptop zaczyna szumieć przy zadaniach, które wcześniej wykonywał cicho, to dobry moment na czyszczenie, zanim pojawią się wyłączenia.",
      },
      {
        t: "Nie zostawiaj laptopa w nagrzanym aucie",
        s: "Wysoka temperatura w samochodzie szkodzi baterii i może sprawić, że laptop po uruchomieniu od razu wejdzie w zabezpieczenie termiczne.",
      },
    ],
    faq: [
      {
        q: "Jaka temperatura procesora jest normalna?",
        a: "Zależy to od modelu. Cienkie laptopy pod obciążeniem pracują przy wyższych temperaturach niż grube modele do gier. Niepokojące są wyłączenia, gwałtowne spadki wydajności i wysoka temperatura już przy pustym pulpicie. Wyniki porównujemy z tym, czego można się spodziewać po Twoim modelu.",
      },
      {
        q: "Czy przegrzewanie mogło coś trwale uszkodzić?",
        a: "Zabezpieczenia termiczne zwykle chronią procesor przed spaleniem. Długotrwała wysoka temperatura przyspiesza jednak zużycie baterii i może z czasem uszkodzić układ graficzny lub połączenia na płycie. Po czyszczeniu sprawdzamy, czy laptop pracuje stabilnie.",
      },
      {
        q: "Wentylator w ogóle się nie kręci. Czy to wymaga wymiany?",
        a: "Nie zawsze. Wirnik może być zablokowany kłębkiem kurzu albo włosów, a czasem odpięła się wtyczka. Jeśli po czyszczeniu silnik nadal nie rusza, proponujemy wymianę wentylatora. Nie używaj laptopa do wymagających zadań, dopóki go nie sprawdzimy.",
      },
    ],
  },

  "wymiana-matrycy-w-laptopie": {
    przyczyny: [
      {
        t: "Przedmiot na klawiaturze przy zamykaniu",
        s: "Długopis, słuchawki albo spinacz zostawiony na klawiaturze wbija się w panel przy zamknięciu klapy. Na ekranie zostaje wtedy punktowe pęknięcie lub wylew.",
      },
      {
        t: "Podnoszenie laptopa za róg ekranu",
        s: "Chwytanie otwartego laptopa za narożnik klapy wygina matrycę i obciąża jeden zawias. Z czasem pęka panel albo mocowanie zawiasu w obudowie.",
      },
      {
        t: "Upadek lub ucisk w torbie",
        s: "Torba odłożona na ziemię z impetem albo przygnieciona innym bagażem przenosi siłę prosto na cienką klapę.",
      },
      {
        t: "Przetarta taśma sygnałowa",
        s: "Taśma przechodzi przez zawias i przy każdym otwarciu się wygina. Po latach przecierają się w niej przewody, co daje migotanie i paski, choć sam panel jest sprawny.",
      },
    ],
    czesci: [
      "Matryce różnią się typem panelu (IPS, TN, OLED), rozdzielczością, częstotliwością odświeżania, jasnością, powłoką matową lub błyszczącą oraz złączem, najczęściej eDP o określonej liczbie pinów. Nawet w jednym modelu laptopa producent montował kilka różnych paneli. Dlatego dobieramy część po oznaczeniu na tylnej stronie obecnej matrycy.",
      "Panele pochodzą od kilku producentów i potrafią się różnić odwzorowaniem kolorów i kątami widzenia, nawet przy tych samych parametrach. Mówimy, jakie części są dostępne do Twojego modelu i czym się różnią. Jeśli zależy Ci na wierności kolorów, na przykład do grafiki, powiedz o tym przy zgłoszeniu.",
    ],
    przygotowanie: [
      "Jeśli ekran jest pęknięty, nie zamykaj i nie otwieraj klapy częściej, niż musisz, i nie dociskaj miejsca pęknięcia.",
      "Sprawdź, czy obraz pojawia się na zewnętrznym monitorze lub telewizorze, i napisz o tym w zgłoszeniu.",
      "Przewoź laptopa zamkniętego, w twardym pokrowcu, bez ładowarki ułożonej na klapie.",
    ],
    poNaprawie: [
      "Nowa matryca może mieć nieco inny odcień bieli lub jasność niż poprzednia. To wynika z różnic między panelami, a nie z wady.",
      "Jeśli zmieniła się rozdzielczość lub odświeżanie, sprawdź ustawienia ekranu w systemie i skalowanie tekstu.",
      "Przez pierwsze dni zwróć uwagę na migotanie przy otwieraniu klapy. Gdyby się pojawiło, zgłoś to, bo może dotyczyć taśmy.",
    ],
    porady: [
      {
        t: "Przenoś laptopa zamkniętego",
        s: "Gdy musisz przenieść otwarty laptop, trzymaj go za dolną część obudowy obiema rękami, nigdy za klapę.",
      },
      {
        t: "Sprawdzaj klawiaturę przed zamknięciem",
        s: "Krótkie spojrzenie na klawiaturę przed zamknięciem klapy eliminuje najczęstszą przyczynę pękniętych matryc.",
      },
      {
        t: "Otwieraj klapę od środka",
        s: "Unoś ekran środkiem górnej krawędzi, a nie jednym rogiem. Oba zawiasy pracują wtedy równo.",
      },
      {
        t: "Reaguj na trzeszczący zawias",
        s: "Opór, trzaski albo szpara przy zawiasie to sygnał, że mocowanie zaczyna puszczać. Naprawa zawiasu na tym etapie chroni matrycę przed pęknięciem.",
      },
    ],
    faq: [
      {
        q: "Czy zwykła ściereczka i płyn do szyb wystarczą do czyszczenia nowej matrycy?",
        a: "Płyn do szyb często zawiera alkohol lub amoniak, które mogą uszkodzić powłokę matrycy. Używaj suchej ściereczki z mikrofibry, a przy większych zabrudzeniach lekko zwilżonej wodą. Nie dociskaj ekranu podczas przecierania.",
      },
      {
        q: "Obraz miga tylko przy pewnym kącie otwarcia klapy. Czy trzeba wymieniać matrycę?",
        a: "Najczęściej nie. Taki objaw zwykle wskazuje na taśmę w zawiasie albo jej złącze. Sprawdzamy to przed zamówieniem matrycy, bo wymiana taśmy jest prostszą naprawą.",
      },
      {
        q: "Czy kamera internetowa i mikrofon zostaną po wymianie?",
        a: "Kamera i mikrofony są zwykle zamontowane w ramce nad matrycą, a nie w samym panelu, więc zostają na miejscu. Po wymianie sprawdzamy, czy działają poprawnie.",
      },
    ],
  },

  "wymiana-dysku-na-ssd": {
    przyczyny: [
      {
        t: "Mechaniczne ograniczenia HDD",
        s: "Głowica dysku talerzowego musi przeskakiwać między fragmentami plików. Przy wielu małych plikach, z których składa się system, to główne źródło spowolnienia.",
      },
      {
        t: "Starzenie się dysku",
        s: "Z wiekiem pojawiają się uszkodzone sektory. Dysk ponawia odczyty, komputer zacina się na kilka sekund, a odczyty SMART pokazują rosnące błędy.",
      },
      {
        t: "Rosnące wymagania systemu i programów",
        s: "Aktualizacje Windows, przeglądarki i programy antywirusowe stale czytają i zapisują dane w tle. Dysk, który kiedyś wystarczał, dziś jest wąskim gardłem.",
      },
      {
        t: "Prawie pełny dysk",
        s: "Gdy brakuje wolnego miejsca, system nie ma gdzie zapisywać plików tymczasowych i aktualizacji. Spowolnienie jest wtedy odczuwalne niezależnie od typu dysku.",
      },
    ],
    czesci: [
      "Dyski SSD różnią się złączem i protokołem. SATA w formacie 2,5 cala pasuje do większości starszych komputerów. M.2 to mała karta montowana bezpośrednio na płycie, ale gniazdo M.2 może obsługiwać SATA, NVMe albo oba. Dlatego najpierw sprawdzamy, co obsługuje Twoja płyta główna, a dopiero potem dobieramy dysk.",
      "Między dyskami tej samej pojemności są też różnice w trwałości i w tym, jak szybko pracują przy dużych kopiowaniach. Proponujemy pojemność dopasowaną do tego, ile danych masz dziś, z zapasem na aktualizacje. Mówimy, jakie modele są dostępne i czym się różnią, a wybór należy do Ciebie.",
    ],
    przygotowanie: [
      "Zrób kopię ważnych plików na zewnętrzny dysk lub do chmury. Przy dysku, który stuka lub się zawiesza, kopia jest szczególnie ważna.",
      "Spisz programy, z których korzystasz, i przygotuj klucze licencyjne, jeśli wybierasz czystą instalację systemu.",
      "Zapisz hasła do poczty i przeglądarki albo upewnij się, że są zsynchronizowane z kontem.",
      "Zdecyduj, czy stary dysk ma zostać w komputerze, czy chcesz go odebrać.",
    ],
    poNaprawie: [
      "Pierwsze uruchomienia mogą trwać nieco dłużej, bo system kończy aktualizacje i indeksowanie plików. Potem start wyraźnie przyspiesza.",
      "Nie defragmentuj SSD. System sam rozpoznaje dysk półprzewodnikowy i stosuje dla niego odpowiednią optymalizację.",
      "Jeśli stary dysk został jako drugi, przenieś na niego duże archiwa i zdjęcia, a na SSD zostaw system i programy.",
      "Przy czystej instalacji sprawdź, czy wszystkie potrzebne pliki zostały przeniesione, zanim wyczyścisz stary dysk.",
    ],
    porady: [
      {
        t: "Zostaw wolne miejsce na SSD",
        s: "Dysk zapełniony pod korek zwalnia i szybciej się zużywa. Utrzymuj część pojemności wolną.",
      },
      {
        t: "Kopia zapasowa mimo nowego dysku",
        s: "SSD jest odporniejszy na wstrząsy, ale też może się zepsuć, często bez ostrzeżenia. Regularna kopia na zewnętrzny nośnik lub do chmury chroni przed utratą plików.",
      },
      {
        t: "Ogranicz programy startujące z systemem",
        s: "Nawet na szybkim dysku kilkanaście aplikacji uruchamianych przy starcie wydłuża czas do pełnej gotowości komputera.",
      },
      {
        t: "Aktualizuj system i sterowniki",
        s: "Aktualizacje poprawiają obsługę dysków i bezpieczeństwo. Instaluj je regularnie, zamiast odkładać na później.",
      },
    ],
    faq: [
      {
        q: "Czy SSD wytrzyma tyle co stary dysk?",
        a: "Przy domowym i biurowym używaniu współczesne dyski SSD zwykle pracują latami. Producenci podają ich trwałość jako ilość danych, którą można zapisać. Zwykły użytkownik rzadko się do niej zbliża.",
      },
      {
        q: "Czy mogę mieć w komputerze jednocześnie SSD i stary dysk?",
        a: "Tak, jeśli płyta ma wolne złącze, a zasilacz odpowiednią wtyczkę. SSD pracuje jako dysk systemowy, a HDD jako magazyn plików. W laptopach zwykle jest miejsce tylko na jeden dysk 2,5 cala, ale część modeli ma dodatkowe gniazdo M.2.",
      },
      {
        q: "Czy dane ze starego dysku po wymianie są bezpieczne?",
        a: "Stary dysk zostaje nienaruszony, dopóki nie zdecydujesz inaczej. Możesz go zostawić w komputerze albo zabrać ze sobą. Jeśli chcesz go oddać dalej, najpierw trzeba trwale usunąć z niego dane.",
      },
    ],
  },

  "czyszczenie-konsoli-ps5-ps4": {
    przyczyny: [
      {
        t: "Konsola w zamkniętej szafce RTV",
        s: "Ciepłe powietrze z wylotu nie ma ujścia i wraca do wlotów. Konsola chłodzi się własnym, coraz cieplejszym powietrzem.",
      },
      {
        t: "Sierść i kurz z podłogi",
        s: "Konsola stojąca nisko zasysa włosy zwierząt i kłaczki z dywanu. Tworzą one zbitą warstwę na łopatkach wentylatora i żebrach radiatora.",
      },
      {
        t: "Dym papierosowy i tłusty kurz",
        s: "Dym i opary z kuchni osadzają lepki nalot, do którego kurz przywiera szybciej. Takiego nalotu nie usunie samo przedmuchanie.",
      },
      {
        t: "Wyschnięty materiał termoprzewodzący",
        s: "W starszych konsolach pasta na procesorze twardnieje po latach. Ciepło gorzej przechodzi do radiatora, więc wentylator musi kręcić się szybciej.",
      },
    ],
    czesci: [
      "W PS4 między procesorem a radiatorem jest pasta termoprzewodząca, którą przy czyszczeniu zwykle wymienia się na nową. W PS5 producent zastosował inny materiał, a jego ewentualna wymiana wymaga ostrożności i nie zawsze jest potrzebna. Decyzję podejmujemy po otwarciu konsoli i ocenie stanu, a przed wymianą mówimy, co proponujemy i dlaczego.",
      "Gdy wentylator ma luz na łożysku albo głośno terkocze, samo czyszczenie nie przywróci ciszy. Wentylatory do konsol są dostępne w wersjach fabrycznych i zamiennych, które mogą różnić się głośnością. Mówimy, jakie części są dostępne do Twojego modelu i czym się różnią, a wybór należy do Ciebie.",
    ],
    przygotowanie: [
      "Sprawdź model konsoli na naklejce z tyłu lub od spodu (na przykład CUH-1216 albo CFI-1016) i podaj go w zgłoszeniu.",
      "Włącz synchronizację zapisów gier z chmurą, jeśli masz taką możliwość na swoim koncie.",
      "Przewoź konsolę w pozycji poziomej, najlepiej w oryginalnym pudełku lub owiniętą w miękki materiał.",
    ],
    poNaprawie: [
      "Wentylator powinien pracować ciszej w menu i w mniej wymagających grach. W najbardziej wymagających tytułach szum przy pełnym obciążeniu jest normalny.",
      "Ustaw konsolę tak, żeby wylot z tyłu nie był skierowany na ścianę z bliska ani zasłonięty kablami.",
      "Jeśli konsola wcześniej wyłączała się z powodu temperatury, sprawdź ją w grze, przy której to się działo, i daj znać, gdyby problem wrócił.",
    ],
    porady: [
      {
        t: "Przestrzeń wokół konsoli",
        s: "Konsola potrzebuje swobodnego dopływu i odpływu powietrza. Wysuń ją z głębokiej półki albo zdejmij tylną ściankę szafki.",
      },
      {
        t: "Konsola wyżej nad podłogą",
        s: "Już kilkanaście centymetrów nad podłogą trafia do niej wyraźnie mniej kurzu i sierści niż przy samym dywanie.",
      },
      {
        t: "Komory na kurz w PS5",
        s: "W PS5 po zdjęciu bocznych paneli widać dwa otwory na kurz. Gdy konsola jest odłączona od prądu, możesz je delikatnie odkurzyć. Wentylatora nie rozkręcaj strumieniem powietrza.",
      },
      {
        t: "Uwaga na tryb spoczynku w szafce",
        s: "W trybie spoczynku konsola może pobierać aktualizacje i ładować pady, więc nadal się grzeje. Zamknięta szafka nie daje jej wtedy odpocząć.",
      },
    ],
    faq: [
      {
        q: "Konsola po czyszczeniu dalej szumi w niektórych grach. Czy coś jest nie tak?",
        a: "Nie musi. Najbardziej wymagające gry obciążają procesor i grafikę, a wentylator przyspiesza zgodnie z temperaturą. Po czyszczeniu szum powinien jednak pojawiać się później i być mniej dokuczliwy niż przed nim.",
      },
      {
        q: "Czy pionowe ustawienie konsoli szkodzi chłodzeniu?",
        a: "Obie konsole są przewidziane do pracy w pionie i w poziomie. W pionie używaj podstawki od producenta, żeby konsola stała stabilnie i nie zasłaniała wlotów. Ważniejsze od pozycji jest wolne miejsce wokół obudowy.",
      },
    ],
  },
};
