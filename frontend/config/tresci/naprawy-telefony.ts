import type { RepairExtra } from "@/lib/tech/content-types";

/** Extended texts (2026-11), to be accepted by Krystian. */
export const phoneRepairExtra: Record<string, RepairExtra> = {
  "wymiana-ekranu-iphone": {
    przyczyny: [
      { t: "Upadek na narożnik", s: "Róg ramki przyjmuje całą energię uderzenia. Szkło pęka od narożnika nawet po upadku z wysokości stołu na kafelki." },
      { t: "Nacisk w kieszeni lub torbie", s: "Siadanie z telefonem w tylnej kieszeni albo ciężkie rzeczy w plecaku wyginają moduł. Szyba bywa wtedy cała, a pod nią pojawiają się linie lub czarne plamy." },
      { t: "Spuchnięta bateria", s: "Rozdęte ogniwo napiera od środka na wyświetlacz i odkleja go od ramki. Ekran odstający na całej długości to sygnał, żeby sprawdzić baterię, zanim zniszczy panel." },
      { t: "Wilgoć pod pęknięciem", s: "Przez szczelinę w szybie wchodzi para i pot. Z czasem pojawiają się smugi, a dotyk zaczyna reagować sam." },
      { t: "Słabo wykonana wcześniejsza naprawa", s: "Źle dopasowany moduł albo niedociśnięta uszczelka sprawiają, że ekran szybciej odstaje i pęka przy mniejszym uderzeniu." },
    ],
    czesci: [
      "Do większości iPhone’ów dostępne są wyświetlacze oryginalne i zamienniki różnej klasy. W modelach z ekranem OLED najtańsze zamienniki to często panele LCD: są grubsze, mają szarą czerń zamiast głębokiej, niższą jasność w słońcu i zużywają więcej energii. Zamienniki OLED wypadają lepiej, ale odcień bieli i kąty widzenia mogą odbiegać od fabrycznych. Przed naprawą pokazujemy, co jest dostępne do Twojego modelu, a wybór należy do Ciebie.",
      "W nowszych iPhone’ach system zapamiętuje, jakie części zamontował producent. Po wymianie wyświetlacza w ustawieniach (Ogólne → To urządzenie) może pojawić się wpis o nieznanej części w historii części i serwisu. Telefon działa normalnie, a wpis jest informacją, nie blokadą. W części modeli True Tone wymaga przeniesienia danych ze starego ekranu i powiemy wcześniej, czy w Twoim przypadku to możliwe.",
    ],
    przygotowanie: [
      "Jeśli obraz jeszcze działa, podłącz telefon do komputera, któremu wcześniej zaufałeś, albo włącz kopię w iCloud przez Wi-Fi, zanim ekran zgaśnie na dobre.",
      "Zapisz, co poza obrazem przestało działać po upadku: aparat przedni, Face ID, głośnik rozmów, czujnik zbliżeniowy.",
      "Gdy z szyby odpadają odłamki, oklej ją przezroczystą taśmą i przewieź telefon w woreczku.",
      "Jeśli ekran sam klika, wyłącz telefon do czasu wizyty, żeby przypadkiem nie zadzwonił ani nie wysłał wiadomości.",
    ],
    poNaprawie: [
      "Przy odbiorze przesuń palcem po całym ekranie, także w rogach, i odblokuj telefon twarzą. Usterkę najłatwiej wyjaśnić od razu, przy nas.",
      "W ustawieniach może pojawić się informacja o wymienionym wyświetlaczu. To nie usterka i nie wpływa na działanie telefonu.",
      "Przez pierwsze godziny klej uszczelki dochodzi do pełnej wytrzymałości. Nie zostawiaj telefonu w nagrzanym miejscu i trzymaj go z dala od wody.",
      "Nowy ekran warto od razu zabezpieczyć. W salonie wytniemy na ploterze folię ochronną dopasowaną do Twojego modelu.",
    ],
    porady: [
      { t: "Etui z rantem", s: "Krawędź etui wystająca ponad szybę przyjmuje uderzenie przy upadku ekranem w dół. Cienkie etui bez rantu chroni głównie przed rysami." },
      { t: "Szkło lub folia na ekran", s: "Pęka zamiast wyświetlacza i wymienia się je w chwilę. Popękane albo odklejone szkło zmień, bo pod nim zbiera się brud i wilgoć." },
      { t: "Nie siadaj z telefonem w kieszeni", s: "Nacisk ciała wygina panel OLED. Linie po takim zgięciu często pojawiają się bez żadnego pęknięcia szyby." },
      { t: "Nie dociskaj odstającego ekranu", s: "Szpara między ekranem a ramką to zwykle spuchnięte ogniwo. Dociskanie może przebić baterię albo uszkodzić wyświetlacz." },
    ],
    faq: [
      {
        q: "Czy iPhone po wymianie ekranu nadal będzie odporny na wodę?",
        a: "Zakładamy nową uszczelkę, ale po otwarciu obudowy nie da się sprawdzić szczelności tak jak w fabryce. Traktuj telefon ostrożnie przy wodzie, nie pływaj z nim i nie bierz go pod prysznic.",
      },
      {
        q: "Czy True Tone zadziała na nowym ekranie?",
        a: "True Tone korzysta z danych kalibracji zapisanych w wyświetlaczu. W wielu modelach da się je przenieść ze starego modułu, jeśli jego elektronika jest sprawna. Gdy to niemożliwe, funkcja może zniknąć z ustawień. Powiemy o tym przed naprawą.",
      },
      {
        q: "Bateria też jest słaba. Czy wymienić ją przy okazji?",
        a: "Telefon i tak będzie otwarty, więc to dobry moment. Zaznacz to w zgłoszeniu, a sprawdzimy kondycję ogniwa i ujmiemy baterię w wycenie.",
      },
    ],
  },

  "wymiana-ekranu-samsung": {
    przyczyny: [
      { t: "Uderzenie w zakrzywioną krawędź", s: "W modelach z serii S szkło schodzi na boki, więc upadek na bok trafia prosto w szybę. Płaskie ekrany z serii A lepiej znoszą uderzenie w ramkę." },
      { t: "Ucisk punktowy", s: "AMOLED źle znosi nacisk w jednym miejscu. Telefon przyciśnięty w plecaku do kluczy albo wygięty w kieszeni dostaje kolorowej kreski, choć szyba jest cała." },
      { t: "Linia bez upadku", s: "Zdarza się, że pionowa kreska pojawia się w starszym egzemplarzu bez żadnego uderzenia. Przyczyną jest uszkodzenie połączenia panelu, nawet jeśli zauważysz ją tuż po aktualizacji." },
      { t: "Wypalenie ekranu", s: "Elementy wyświetlane latami w tym samym miejscu, jak pasek nawigacji czy klawiatura, zostawiają na AMOLED trwały cień. To zużycie panelu, a usuwa je tylko wymiana." },
    ],
    czesci: [
      "Do Galaxy dostępne są ekrany oryginalne Samsunga, często w komplecie z ramką, oraz zamienniki. Najtańsze zamienniki do modeli z AMOLED to panele LCD lub TFT. Są grubsze, mają słabszą czerń i niższą jasność, a czytnik linii papilarnych pod ekranem zwykle na nich nie działa, bo LCD nie przepuszcza światła jak AMOLED.",
      "Zamienniki OLED są bliżej oryginału, ale mogą różnić się odcieniem bieli, jasnością i równomiernością podświetlenia przy niskiej jasności. Przy wycenie usłyszysz, które warianty są dostępne do Twojego modelu i co każdy z nich oznacza dla obrazu oraz czytnika palca.",
    ],
    przygotowanie: [
      "Odczytaj numer modelu w Ustawienia → Informacje o telefonie (np. SM-A…, SM-S…) i wpisz go w zgłoszeniu. Sama nazwa „A54” czy „S21” nie wystarcza, żeby dobrać ekran.",
      "Jeśli obraz jest czarny, ale telefon dzwoni, spróbuj zrobić kopię przez Smart Switch na komputerze albo do chmury Samsung lub Google, jeśli masz ją skonfigurowaną.",
      "Przy składanym Galaxy zapisz, czego dotyczy usterka: ekranu wewnętrznego, zewnętrznego czy zawiasu.",
    ],
    poNaprawie: [
      "Odcisk palca dodasz od nowa w ustawieniach biometrii. Zrób to już na docelowej folii, bo czytnik uczy się przez warstwę, która leży na ekranie.",
      "Na zakrzywionym ekranie sztywne szkło hartowane odstaje na brzegach i wywołuje fałszywe dotknięcia. Lepiej sprawdza się elastyczna folia, którą wytniemy na ploterze w salonie.",
      "Nowy panel może wydawać się bardziej nasycony niż stary, zużyty ekran. Tryb kolorów zmienisz w ustawieniach wyświetlacza (Żywe lub Naturalne).",
      "W kolejnych dniach zwróć uwagę, czy ramka przylega równo. Szparę albo nierówny dotyk przy krawędzi zgłoś w ramach gwarancji.",
    ],
    porady: [
      { t: "Etui wyższe niż szkło na bokach", s: "Przy zakrzywionym ekranie wybierz etui, które obejmuje boki ponad linią szyby. Model otwarty z boków nie chroni krawędzi, które pękają najczęściej." },
      { t: "Mniej statycznych elementów", s: "Tryb ciemny, krótki czas wygaszania i gesty zamiast stałego paska nawigacji spowalniają wypalanie AMOLED." },
      { t: "Pierwsza kreska to sygnał do kopii", s: "Pojedyncza linia rzadko zostaje sama. Zrób kopię danych od razu, bo kolejnym etapem bywa czarny ekran i brak dostępu do telefonu." },
      { t: "Składane modele z dala od piasku", s: "Drobiny w zawiasie Z Flip i Z Fold potrafią przebić warstwę ekranu wewnętrznego. Nie zdejmuj fabrycznej folii z ekranu wewnętrznego." },
    ],
    faq: [
      {
        q: "Czy czytnik palca zadziała po wymianie ekranu?",
        a: "Na ekranie AMOLED zwykle działa jak wcześniej, po ponownym dodaniu odcisku. Przy zamienniku LCD czytnik pod ekranem może nie działać wcale. Dlatego przed naprawą mówimy, jak wybrana część wpłynie na tę funkcję.",
      },
      {
        q: "Czy wymiana ekranu usunie wypalone ślady?",
        a: "Tak. Wypalenie siedzi w samym panelu, więc nowy wyświetlacz go nie ma. Żeby nie wróciło szybko, ogranicz stałe elementy na ekranie i nie trzymaj jasności na maksimum bez potrzeby.",
      },
      {
        q: "Ekran przyjdzie z baterią. Czy to znaczy, że dostanę nowe ogniwo?",
        a: "W niektórych modelach oryginalny ekran dostarczany jest razem z ramką i wklejoną baterią. Wtedy po naprawie masz też nowe ogniwo. Przy wycenie powiemy, czy dotyczy to Twojego modelu.",
      },
    ],
  },

  "wymiana-baterii-w-telefonie": {
    przyczyny: [
      { t: "Kolejne cykle ładowania", s: "Ogniwo traci część pojemności z każdym pełnym cyklem. Po kilkuset cyklach spadek jest wyraźny bez względu na markę telefonu." },
      { t: "Praca w wysokiej temperaturze", s: "Ciepło przyspiesza reakcje uboczne w ogniwie. Telefon, który często pracuje gorący, na przykład jako nawigacja w uchwycie na szybie w słońcu, zużywa baterię szybciej." },
      { t: "Skrajne poziomy naładowania", s: "Ogniwo męczy się, gdy długo leży na pełnym naładowaniu albo zostaje całkiem rozładowane na tygodnie. Środek skali jest dla niego najmniej obciążający." },
      { t: "Mróz", s: "Zimno zwiększa opór wewnętrzny baterii. Zużyte ogniwo nie utrzymuje wtedy napięcia i telefon gaśnie, choć pokazuje kilkadziesiąt procent." },
      { t: "Gaz w ogniwie", s: "Stara, przegrzewana albo uderzona bateria wydziela gaz, który rozdyma jej foliową obudowę. Tak powstaje spuchnięte ogniwo." },
    ],
    czesci: [
      "W iPhonie bateria spoza Apple albo niesparowana z telefonem narzędziem producenta wywołuje w ustawieniach informację, że nie można zweryfikować oryginalności baterii lub że to nieznana część. Zależnie od modelu i wersji iOS kondycja baterii może wtedy nie być pokazywana albo pojawi się z dopiskiem. Telefon ładuje się i działa normalnie, zmienia się tylko to, co widzisz w ustawieniach.",
      "W Androidzie takie komunikaty pojawiają się rzadko, za to baterie różnią się realną pojemnością i jakością ogniw. Zamiennik opisany jako mocniejszy niż fabryczny to powód do ostrożności, a nie zaleta. Mówimy, jakie baterie są dostępne do Twojego modelu i czym się różnią, a Ty decydujesz, którą montujemy.",
    ],
    przygotowanie: [
      "Zapisz obecną kondycję baterii, a jeśli telefon ją pokazuje, także liczbę cykli. Porównasz je po wymianie.",
      "Zanotuj, kiedy telefon się wyłącza: przy jakim procencie, na zimnie, przy włączaniu aparatu. To pomaga odróżnić zużyte ogniwo od usterki płyty.",
      "Jeśli kłopot dotyczy raczej ładowania niż czasu pracy, przynieś ładowarkę i kabel, których używasz na co dzień.",
    ],
    poNaprawie: [
      "Przez kilka pierwszych cykli wskazanie procentów może się wahać. Naładuj telefon do pełna, używaj normalnie do niskiego poziomu i znów naładuj, żeby system nauczył się nowego ogniwa.",
      "Czas pracy oceniaj po kilku dniach. Zaraz po naprawie telefon często synchronizuje dane i aktualizuje aplikacje, więc zużywa więcej energii niż zwykle.",
      "Obudowa jest zamknięta na nowym kleju. Przez pierwsze godziny nie naciskaj mocno ekranu ani tylnej klapki i nie kładź telefonu na kaloryferze.",
      "Przy odbiorze sprawdź, czy ekran i tył przylegają równo do ramki, bez szczelin.",
    ],
    porady: [
      { t: "Unikaj skrajności", s: "Nie musisz pilnować procentów co do jednego. Wystarczy, że telefon nie leży całymi dniami na 100% i nie gaśnie regularnie z wyczerpania." },
      { t: "Zdejmij grube etui przy ładowaniu", s: "Pod etui ciepło z ładowania nie ma ujścia, zwłaszcza przy ładowarce indukcyjnej. Jeśli telefon robi się gorący, ładuj go bez etui." },
      { t: "Zapasowy telefon w szufladzie", s: "Przed odłożeniem naładuj go mniej więcej do połowy i co jakiś czas doładuj. Całkiem rozładowane ogniwo może się już nie obudzić albo spuchnąć." },
      { t: "Ładowarki od znanych producentów", s: "Ładowarka bez certyfikatów potrafi podawać nierówne napięcie i grzać telefon. Nie musi być markowa, ale powinna mieć znane pochodzenie." },
      { t: "Uchwyt samochodowy poza słońcem", s: "Nawigacja, ładowanie i słońce przez szybę to dla baterii najgorsze połączenie. Przenieś uchwyt na kratkę nawiewu albo w cień." },
    ],
    faq: [
      {
        q: "Czy wymiana baterii usuwa dane z telefonu?",
        a: "Nie. Bateria nie przechowuje danych, a pamięć telefonu zostaje nietknięta. Kopia przed naprawą to dobra praktyka, ale nie wymóg tej naprawy.",
      },
      {
        q: "Telefon wyłącza się przy 30%. Czy to na pewno bateria?",
        a: "Najczęściej tak, ale podobnie zachowuje się telefon z usterką układu zasilania albo z błędem oprogramowania. Dlatego najpierw mierzymy ogniwo, a wymianę proponujemy dopiero, gdy pomiar to potwierdzi.",
      },
      {
        q: "Czy warto wymieniać baterię w starszym telefonie?",
        a: "Jeśli telefon dostaje jeszcze aktualizacje i poza baterią działa dobrze, wymiana zwykle się opłaca. Gdy system nie jest już wspierany albo telefon ma inne poważne usterki, powiemy wprost, czy naprawa ma sens.",
      },
    ],
  },

  "naprawa-gniazda-ladowania": {
    przyczyny: [
      { t: "Ubity brud na dnie portu", s: "Telefon noszony w kieszeni spodni zbiera włókna z materiału. Warstwa rośnie powoli, więc przez długi czas wygląda to na „zmęczony kabel”." },
      { t: "Ładowanie pod kątem", s: "Używanie telefonu z wygiętym kablem, na przykład w łóżku, rozgina sprężyste styki. W USB-C cierpi też cienki środkowy języczek gniazda." },
      { t: "Korozja styków", s: "Pot, deszcz i wilgoć z łazienki zostawiają na stykach ciemny lub zielonkawy nalot. Taki port przewodzi gorzej i potrafi wywoływać alarm wilgoci." },
      { t: "Uszkodzone wtyczki", s: "Wygięta końcówka kabla albo odstający metal na wtyku rysuje styki w gnieździe przy każdym podłączeniu." },
      { t: "Układ ładowania na płycie", s: "Rzadziej winne jest samo gniazdo, a układ ładowania na płycie głównej. Objawy są podobne, dlatego diagnozę zaczynamy od pomiarów." },
    ],
    czesci: [
      "W wielu telefonach z Androidem gniazdo siedzi na osobnej płytce lub taśmie razem z dolnym mikrofonem i wymienia się cały ten element. Dostępne są płytki oryginalne i zamienniki. Zamiennik może nie obsługiwać szybkiego ładowania w pełnej mocy albo przesyłu danych z najwyższą prędkością, więc przed wymianą mówimy, czym różnią się części do Twojego modelu.",
      "W iPhonie port Lightning lub USB-C jest na taśmie razem z mikrofonami i często wymaga rozebrania telefonu od strony ekranu. Gdy gniazdo jest przylutowane bezpośrednio do płyty głównej, o tym, czy wymiana jest możliwa, decyduje diagnoza. Najpierw zawsze sprawdzamy, czy nie wystarczy czyszczenie.",
    ],
    przygotowanie: [
      "Wypróbuj kilka kabli i ładowarek, w tym zestaw, który na pewno działa z innym telefonem. Przynieś kabel, przy którym problem widać najlepiej.",
      "Poświeć latarką do gniazda. Jeśli na dnie widać szary filc albo zielony nalot, napisz o tym w zgłoszeniu.",
      "Jeśli telefon jest rozładowany, a masz ładowarkę indukcyjną, naładuj go nią przed wizytą. Łatwiej wtedy od razu sprawdzić pozostałe funkcje.",
      "Zanotuj, czy problem dotyczy też połączenia z komputerem albo słuchawek podłączanych do portu.",
    ],
    poNaprawie: [
      "Po czyszczeniu wtyczka wchodzi głębiej i wyraźnie „klika”. Jeśli dalej się chwieje, sprawdź też sam kabel, bo jego końcówka mogła się wyrobić.",
      "Podłącz swoją ładowarkę i zobacz, czy telefon pokazuje szybkie ładowanie, jeśli Twój model je obsługuje.",
      "Nagraj krótką notatkę głosową i zadzwoń do kogoś. Dolny mikrofon często siedzi na tej samej taśmie co port.",
      "Komunikat o wilgoci nie powinien wracać na suchym telefonie. Jeśli wróci, zgłoś to, bo korozja może sięgać dalej niż samo gniazdo.",
    ],
    porady: [
      { t: "Gniazdem do góry w kieszeni", s: "Brud z dna kieszeni rzadziej wpada wtedy do portu. To prosty nawyk, który wyraźnie wydłuża życie gniazda." },
      { t: "Wyjmuj wtyczkę prosto", s: "Ciągnij za wtyk, a nie za przewód, i nie wyrywaj go pod kątem. Boczna siła wyrabia styki szybciej niż setki zwykłych podłączeń." },
      { t: "Kabel z zapasem długości", s: "Gdy korzystasz z telefonu podczas ładowania, użyj dłuższego przewodu. Napięty kabel stale dźwiga gniazdo." },
      { t: "Zatyczka w pylistym otoczeniu", s: "Na plażę, budowę albo do warsztatu warto mieć silikonową zatyczkę portu lub etui z klapką na gniazdo." },
      { t: "Ładowanie bezprzewodowe na noc", s: "Jeśli telefon je obsługuje, ładuj go indukcyjnie w domu. Port pracuje wtedy rzadziej i mniej się zużywa." },
    ],
    faq: [
      {
        q: "Czy naprawa gniazda kasuje dane z telefonu?",
        a: "Nie. Czyszczenie ani wymiana portu nie dotykają pamięci telefonu. Jeśli telefon jeszcze się ładuje, zrób kopię przed wizytą, bo przy całkiem martwym gnieździe trudniej o nią potem.",
      },
      {
        q: "Ładowanie działa, a słuchawki na USB-C nie. Czy to gniazdo?",
        a: "Możliwe. Ładowanie korzysta z innych styków niż dźwięk i dane, więc zabrudzenie lub uszkodzenie części styków daje właśnie taki objaw. Zanim zajrzymy do portu, sprawdź słuchawki i przejściówkę na innym telefonie.",
      },
      {
        q: "Czy częste czyszczenie nie zniszczy gniazda?",
        a: "Ostrożne czyszczenie właściwymi narzędziami nie zużywa styków. Szkodzą raczej metalowe szpilki, ostre przedmioty i sprężone powietrze, które wbija brud głębiej.",
      },
    ],
  },

  "telefon-po-zalaniu": {
    przyczyny: [
      { t: "Para i skraplanie", s: "Łazienka podczas kąpieli, sauna albo wejście z mrozu do ciepłego wnętrza wpuszczają parę przez głośniki i mikrofony. Woda skrapla się w środku, choć telefon nigdy nie był zanurzony." },
      { t: "Osłabione uszczelnienie", s: "Po upadku, pęknięciu szyby albo wcześniejszym otwarciu obudowy klej trzyma słabiej. Do takiego telefonu wodę potrafi wpuścić zwykły deszcz." },
      { t: "Słony pot przy sporcie", s: "Telefon w opasce na ramię albo w kieszeni kurtki chłonie pot. Sól działa na płytę podobnie jak morska woda." },
      { t: "Ładowanie mokrego telefonu", s: "Prąd płynący przez wilgotne gniazdo wywołuje elektrolizę. Styki portu i ścieżki obok niego korodują wtedy wyjątkowo szybko." },
    ],
    czesci: [
      "Po zalaniu naprawa rzadko zaczyna się od zamawiania części. Najpierw jest czyszczenie i diagnoza płyty, bo dopiero po usunięciu nalotu widać, co naprawdę przestało działać. Bywa, że telefon po samym czyszczeniu wraca do sprawności. Bywa też, że trzeba wymienić ekran z zaciekami, głośnik, mikrofon, gniazdo albo baterię.",
      "Wymiana podzespołów ma sens, gdy płyta główna działa. Jeśli uszkodzenie jest na płycie, po diagnozie powiemy, czy naprawa na niej jest możliwa, czy rozsądniej skupić się na danych. Baterię z korozją na złączu albo oznakami puchnięcia proponujemy wymienić w pierwszej kolejności, bo uszkodzone ogniwo po zalaniu jest ryzykowne.",
    ],
    przygotowanie: [
      "Zapisz, w czym telefon się zamoczył (woda, kawa z cukrem, morze, basen) i mniej więcej kiedy. To wpływa na sposób czyszczenia.",
      "Powiedz, czy telefon był włączony w chwili zalania i czy próbowałeś go potem ładować. To wskazuje, gdzie szukać zwarć.",
      "Przewieź telefon owinięty suchym ręcznikiem papierowym, nie w ryżu. Skrobia i drobiny ryżu wchodzą do gniazd i głośników.",
      "Sprawdź, czy pamiętasz hasło do Apple ID lub konta Google. Jeśli płyty nie da się uruchomić, kopia w chmurze bywa jedyną drogą do danych.",
    ],
    poNaprawie: [
      "Obserwuj telefon przez kolejne tygodnie. Nagłe grzanie, restarty albo ładowanie z przerwami mogą świadczyć o korozji, której nie dało się całkiem zatrzymać. Zgłoś to od razu.",
      "Zrób pełną kopię danych zaraz po odbiorze, nawet jeśli wszystko działa.",
      "Nie wystawiaj telefonu na wodę, nawet jeśli miał klasę IP. Obudowę zamykamy na nowym kleju, ale jej szczelności nie potwierdzamy.",
      "Sprawdź w domu aparaty pod światło, głośność rozmów i czujnik zbliżeniowy. Drobne ślady osadu potrafią ujawnić się dopiero przy codziennym używaniu.",
    ],
    porady: [
      { t: "Telefon zostaje za drzwiami łazienki", s: "Para z prysznica i sauny wchodzi w szczeliny głośników bez żadnego chlapnięcia. Najbezpieczniej zostawić telefon poza łazienką." },
      { t: "Woreczek wodoszczelny nad wodą", s: "Na kajak, plażę czy basen weź tani woreczek z zamknięciem strunowym. Kosztuje ułamek naprawy i pozwala robić zdjęcia." },
      { t: "Pęknięta szyba to otwarta droga dla wody", s: "Po pęknięciu ekranu albo tyłu telefon traci szczelność. Do czasu naprawy chroń go przed deszczem i wilgocią." },
      { t: "Automatyczna kopia zdjęć i kontaktów", s: "Zalanie to usterka, przy której dane giną najczęściej i bez ostrzeżenia. Włącz kopię w chmurze, zanim będzie potrzebna." },
    ],
    faq: [
      {
        q: "Czy zalanie widać w środku telefonu?",
        a: "Tak. Telefony mają wskaźniki wilgoci, czyli małe naklejki, które po kontakcie z wodą zmieniają kolor na czerwony lub różowy. Widać też korozję na złączach i płycie, dlatego zalania nie da się ukryć przy reklamacji u producenta.",
      },
      {
        q: "Pod ekranem są plamy. Czy wystarczy wymiana wyświetlacza?",
        a: "Plamy mogą być zaciekiem w samym ekranie, ale często idą w parze z korozją płyty. Nowy wyświetlacz montujemy dopiero po czyszczeniu i sprawdzeniu, czy reszta telefonu działa, żeby nie wymieniać części na próżno.",
      },
      {
        q: "Czy zalany telefon może być niebezpieczny?",
        a: "Tak, jeśli ucierpiała bateria. Gdy telefon mocno się grzeje, puchnie albo czuć od niego chemiczny zapach, nie ładuj go, odłóż na niepalną powierzchnię z dala od łatwopalnych rzeczy i zgłoś to przed przyjazdem.",
      },
    ],
  },

  "wymiana-tylnej-szybki-iphone": {
    przyczyny: [
      { t: "Uderzenie w wyspę aparatu", s: "Moduł aparatu wystaje ponad plecy telefonu, więc przy upadku tyłem w dół przyjmuje cios jako pierwszy. Pęknięcie rusza wtedy od obiektywów." },
      { t: "Wygięta rama", s: "Rama skrzywiona po upadku na róg albo od noszenia w tylnej kieszeni napręża szkło. Szybka potrafi pęknąć po czasie, bez kolejnego upadku." },
      { t: "Piasek pod etui", s: "Drobiny między etui a telefonem punktowo obciążają szkło. Przy mocniejszym nacisku w torbie pojawia się pęknięcie." },
      { t: "Wcześniejsza nierówna naprawa", s: "Szybka wklejona na zbyt grubej warstwie kleju albo na krzywej ramie nie leży równo i pęka od zwykłego nacisku w kieszeni." },
    ],
    czesci: [
      "Tylna szybka nie ma własnej elektroniki, więc jej wymiana zwykle nie wywołuje w iOS komunikatu o nieznanej części. Różnice między częściami dotyczą wykończenia. Matowe szkło modeli Pro i barwione szkło nowszych modeli wymaga zamiennika o tej samej fakturze. Tańsze szybki bywają cieńsze, mają inny odcień albo inaczej położone logo.",
      "Osłony obiektywów to osobne szkiełka. Lepsze mają powłokę ograniczającą odblaski, słabsze dają więcej flar przy zdjęciach nocnych pod latarnią. Jeśli rama jest wygięta lub pęknięta, sama szybka może nie leżeć równo. Wtedy powiemy, jakie są możliwości dla Twojego modelu, zanim cokolwiek zamówimy.",
    ],
    przygotowanie: [
      "Odczytaj dokładny model w Ustawienia → Ogólne → To urządzenie i podaj kolor obudowy. Szybki do wersji Pro, Pro Max i Plus różnią się wymiarami i otworami na aparaty.",
      "Zrób próbne zdjęcia każdym obiektywem, także wieczorem pod latarnią. Mgła lub odblaski oznaczają, że szkiełko aparatu też trzeba wymienić.",
      "Przyłóż telefon do ładowarki indukcyjnej lub MagSafe i zapisz w zgłoszeniu, czy ładowanie działa.",
    ],
    poNaprawie: [
      "Połóż telefon na ładowarce MagSafe lub indukcyjnej i sprawdź, czy ładowanie startuje od razu, a akcesoria magnetyczne trzymają się pewnie.",
      "Zrób zdjęcie pod światło i w ciemności, żeby upewnić się, że na osłonach aparatu nie ma smug ani odblasków.",
      "Załóż etui od razu. Nowe szkło nie jest twardsze od poprzedniego, a kolejne upadki zdarzają się zwykle w tych samych sytuacjach.",
      "Jeśli chcesz zabezpieczyć także plecy, w salonie wytniemy na ploterze folię ochronną pod Twój model.",
    ],
    porady: [
      { t: "Rant wokół aparatu", s: "Wybierz etui, którego krawędź przy aparacie wystaje wyżej niż obiektywy. Telefon położony na stole opiera się wtedy na etui, a nie na szkle." },
      { t: "Cienkie nakładki na obiektywy", s: "Chronią szkiełka aparatu przed uderzeniem. Grube albo słabej jakości nakładki pogarszają zdjęcia, więc wybieraj cienkie i przezroczyste." },
      { t: "Wytrzep etui od czasu do czasu", s: "Zdejmij etui i usuń piasek oraz kurz spod spodu. To one punktowo obciążają szkło i rysują je." },
      { t: "Nie zwlekaj z pękniętą osłoną aparatu", s: "Odłamek może porysować soczewkę albo wpaść do modułu. Wtedy sama wymiana szkiełka już nie wystarczy." },
    ],
    faq: [
      {
        q: "Czy Apple Pay i płatności zbliżeniowe zadziałają po wymianie?",
        a: "Antena NFC zostaje w telefonie pod szybą. Po naprawie sprawdzamy, czy telefon odczytuje karty i terminale zbliżeniowe, a jeśli coś jest nie tak, wyjaśniamy przyczynę przed oddaniem.",
      },
      {
        q: "Mam starszego iPhone’a z metalowymi pleckami. Czy to ta naprawa?",
        a: "Nie. iPhone 7 i starsze mają tył z aluminium, który się wgniata, a nie pęka. Zgłoś taki telefon z opisem uszkodzenia, a po oględzinach powiemy, co da się zrobić z obudową.",
      },
    ],
  },
};
