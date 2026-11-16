/**
 * Repair pages /naprawy/[slug] (docs/tech/SPEC.md §12.4).
 *
 * A page is built and listed (sitemap, links) only when `published && verified`.
 * On staging (NEXT_PUBLIC_TECH_DRAFT=1) unverified pages render in a draft frame.
 *
 * Status 15.11.2026: list chosen by Krystian (phones, tablets, smartwatches, laptops,
 * computers, consoles — no printers, no data recovery). Texts written in TD5b PR 2 and
 * accepted by Krystian on 15.11.2026, so every page is `verified: true`.
 * The service has NOT confirmed time, warranty or on-site repair, so `czas`, `gwarancja`
 * and `naMiejscu` stay null (sentences hidden) and the texts promise none of them.
 * Cities never appear in the texts — the "Gdzie oddać" block renders points from prokom.ts.
 */
import type { RepairExtra } from "@/lib/tech/content-types";
import type { CategoryCode } from "@/lib/tech/wizard-data";
import { otherRepairExtra } from "./tresci/naprawy-inne";
import { phoneRepairExtra } from "./tresci/naprawy-telefony";

export type RepairFaq = { q: string; a: string };

export type RepairPageData = {
  slug: string;
  /**
   * SEO title before " — <cities> | PRO-KOM Tech". Max 20 chars, so the full title with
   * "Rabka-Zdrój i Zakopane" stays ≤ 60 (tests/tech/naprawy.test.ts).
   */
  title: string;
  h1: string;
  /** Backend category (KONTRAKT §1.1). */
  device: CategoryCode;
  /** Fault text from wizard-data for the device (prefills /zgloszenie). */
  usterka: string;
  /** 120–155 chars, without the city part. */
  description: string;
  /** First paragraph = hero lead (2–3 sentences), the rest goes to "Objawy". */
  intro: string[];
  objawy: string[];
  przebieg: string[];
  /** Confirmed by the service, or null (section hidden). */
  czas: string | null;
  gwarancja: string | null;
  /** Repair done on site in the point (Rabka) — null = unknown, sentence hidden. */
  naMiejscu: boolean | null;
  faq: RepairFaq[];
  powiazane: string[];
  published: boolean;
  verified: boolean;
} & Omit<RepairExtra, "faq">;

type Content = Omit<RepairPageData, "czas" | "gwarancja" | "naMiejscu" | "published" | "verified" | Exclude<keyof RepairExtra, "faq">>;

/** Extended texts (2026-11, config/tresci): causes, parts, prep, after, tips, more FAQ. */
const EXTRA: Record<string, RepairExtra> = { ...phoneRepairExtra, ...otherRepairExtra };
const EMPTY: RepairExtra = { przyczyny: [], czesci: [], przygotowanie: [], poNaprawie: [], porady: [], faq: [] };

/** Accepted text (15.11.2026); time / warranty / on-site not confirmed by the service. */
function accepted(c: Content): RepairPageData {
  const x = EXTRA[c.slug] ?? EMPTY;
  return { ...c, ...x, faq: [...c.faq, ...x.faq], czas: null, gwarancja: null, naMiejscu: null, published: true, verified: true };
}

export const repairPages: RepairPageData[] = [
  accepted({
    slug: "wymiana-ekranu-iphone",
    title: "Serwis ekranu iPhone",
    h1: "Wymiana ekranu iPhone",
    device: "phone",
    usterka: "Pęknięty ekran",
    description: "Pęknięta szyba, zielone linie albo martwy dotyk w iPhonie? Sprawdzamy, co jest uszkodzone, wyceniamy i wymieniamy cały wyświetlacz z dotykiem.",
    intro: [
      "Pęknięty albo czarny ekran w iPhonie to najczęstsza usterka, z jaką przychodzą do nas klienci. Najpierw sprawdzamy telefon, potem dostajesz wycenę, a dopiero po Twojej zgodzie wymieniamy wyświetlacz.",
      "W iPhonie szyba, panel dotykowy i wyświetlacz tworzą jeden sklejony moduł. Nawet drobne pęknięcie w rogu oznacza więc wymianę całości, bo samej szybki nie da się porządnie odkleić od panelu OLED lub LCD. Rysa, która dziś nie przeszkadza, z czasem się rozchodzi, a odpryski szkła potrafią skaleczyć palec.",
      "Zwlekanie bywa droższe, niż się wydaje. Przez szczelinę w szybie dostaje się wilgoć i kurz, a ekran, który zaczyna sam „klikać”, potrafi otworzyć aplikacje i wysłać wiadomość bez Twojej wiedzy. Jeśli telefon nadal działa, przed wizytą zrób kopię w iCloud albo na komputerze.",
    ],
    objawy: [
      "Pajęczyna pęknięć na szybie lub odprysk w rogu",
      "Zielone, różowe albo białe pionowe linie",
      "Czarne plamy, które powiększają się z dnia na dzień",
      "Dotyk nie reaguje w części ekranu albo działa sam",
      "Obraz miga lub telefon dzwoni, a ekran zostaje czarny",
      "Wyświetlacz odstaje od ramki i widać szparę",
    ],
    przebieg: [
      "Oglądamy iPhone’a i sprawdzamy, czy uszkodzony jest tylko ekran, czy także aparat przedni, Face ID albo ramka po upadku.",
      "Mówimy, jakie części są dostępne do Twojego modelu i czym się różnią, oraz podajemy wycenę. Bez Twojej zgody nic nie rozkręcamy.",
      "Otwieramy obudowę, odłączamy baterię i przekładamy ze starego modułu elementy, które zostają w telefonie, na przykład głośnik rozmów i czujniki.",
      "Montujemy nowy wyświetlacz na świeżej uszczelce i sprawdzamy dotyk w całym polu, jasność, True Tone, Face ID lub Touch ID oraz czujnik zbliżeniowy.",
      "Czyścimy telefon i oddajemy go z informacją, co zostało wymienione. Status naprawy możesz śledzić online.",
    ],
    faq: [
      {
        q: "Czy po wymianie ekranu iOS pokaże komunikat o nieznanej części?",
        a: "Może się tak zdarzyć. W nowszych modelach iOS sprawdza numer seryjny wyświetlacza i przy części spoza autoryzowanej sieci wyświetla informację w ustawieniach. Telefon działa normalnie, a przed naprawą mówimy, czego się spodziewać przy wybranej części.",
      },
      {
        q: "Czy stracę zdjęcia i wiadomości?",
        a: "Wymiana wyświetlacza nie kasuje pamięci. Mimo to zawsze radzimy zrobić kopię zapasową przed oddaniem telefonu, bo przy mocno zbitym urządzeniu mogą wyjść inne usterki.",
      },
      {
        q: "Czy Face ID będzie działać po naprawie?",
        a: "Face ID siedzi w górnej części obudowy, a nie w samym ekranie, więc przy starannej wymianie zostaje na miejscu. Jeśli po upadku przestało działać już wcześniej, powiemy o tym przy oględzinach.",
      },
      {
        q: "Co jeśli ekran jest cały, ale obraz zniknął?",
        a: "Czarny ekran bez pęknięć to nie zawsze wina wyświetlacza. Czasem winna jest taśma, złącze albo płyta główna. Dlatego zaczynamy od diagnozy i dopiero ona pokazuje, czy wymiana ekranu w ogóle pomoże.",
      },
    ],
    powiazane: ["wymiana-ekranu-samsung", "wymiana-tylnej-szybki-iphone", "wymiana-baterii-w-telefonie"],
  }),

  accepted({
    slug: "wymiana-ekranu-samsung",
    title: "Ekran Samsung Galaxy",
    h1: "Wymiana ekranu Samsung",
    device: "phone",
    usterka: "Pęknięty ekran",
    description: "Zbity ekran, zielona linia albo czarny obraz w Samsungu Galaxy? Diagnozujemy, wyceniamy przed pracą i wymieniamy wyświetlacz AMOLED razem z dotykiem.",
    intro: [
      "Samsungi z serii A, S i Z mają ekrany AMOLED, które po upadku często pękają albo tracą obraz. Przyjmujemy telefon, sprawdzamy wyświetlacz i dotyk, podajemy wycenę i wymieniamy ekran dopiero po Twojej akceptacji.",
      "Ekran AMOLED potrafi działać mimo zbitej szyby, ale w środku materiał jest uszkodzony. Typowy scenariusz: najpierw jedna zielona lub fioletowa kreska, po kilku dniach plama, która rozlewa się na pół wyświetlacza. W wielu modelach Galaxy ekran sprzedawany jest razem z ramką, a czasem także z baterią, dlatego przed wyceną sprawdzamy dokładnie Twój model.",
      "Zakrzywione krawędzie w modelach z serii S i składane Z Flip czy Z Fold wymagają więcej ostrożności niż płaskie ekrany z serii A. W każdym przypadku czytnik linii papilarnych pod ekranem trzeba po naprawie skonfigurować na nowo.",
    ],
    objawy: [
      "Zielona, żółta lub fioletowa linia przez cały ekran",
      "Rozlewająca się czarna lub kolorowa plama",
      "Obraz jest, ale dotyk nie działa albo działa z opóźnieniem",
      "Telefon wibruje i dzwoni, ale ekran pozostaje ciemny",
      "Szyba pęknięta na zakrzywionej krawędzi",
      "Czytnik palca pod ekranem przestał rozpoznawać odcisk",
    ],
    przebieg: [
      "Ustalamy dokładny model po numerze z ustawień albo z etykiety, bo Galaxy o podobnej nazwie mają różne ekrany.",
      "Sprawdzamy, czy uszkodzenie dotyczy samego panelu, czy także ramki, tylnej klapki lub gniazda. Na tej podstawie dostajesz wycenę.",
      "Po akceptacji odklejamy tylną szybę lub ekran, zależnie od budowy modelu, i przenosimy podzespoły do nowej ramki.",
      "Testujemy nowy ekran: kolory na białym i czarnym tle, dotyk w narożnikach, czujnik zbliżeniowy, aparat przedni i czytnik palca.",
      "Zamykamy obudowę na nowym kleju i pomagamy ponownie dodać odcisk palca w ustawieniach telefonu.",
    ],
    faq: [
      {
        q: "Czy zielona linia na Samsungu zniknie sama?",
        a: "Nie. Linia na AMOLED oznacza uszkodzenie warstwy wyświetlacza lub jego połączenia. Aktualizacje oprogramowania jej nie usuwają, a z czasem zwykle pojawiają się kolejne.",
      },
      {
        q: "Dlaczego ekran w moim Galaxy wymienia się razem z ramką?",
        a: "W wielu modelach producent przykleja panel do ramki tak mocno, że oddzielenie go grozi pęknięciem nowego ekranu. Moduł z ramką daje pewniejsze spasowanie i szczelniejsze zamknięcie.",
      },
      {
        q: "Czy naprawiacie składane Samsungi Z Flip i Z Fold?",
        a: "Przyjmujemy je do diagnozy. Ekran wewnętrzny w składanym telefonie to delikatna konstrukcja z zawiasem, więc o możliwościach naprawy i dostępności części mówimy po oględzinach konkretnego egzemplarza.",
      },
      {
        q: "Czy muszę zostawić hasło do telefonu?",
        a: "Nie musisz. Jeśli zechcesz, żebyśmy sprawdzili wszystkie funkcje po naprawie, możesz podać kod, ale równie dobrze przetestujesz telefon sam przy odbiorze.",
      },
      {
        q: "Ekran działa, ale po upadku ma tylko rysę na szkle. Czy wymieniać?",
        a: "Jeśli obraz i dotyk są w porządku, a rysa nie przechodzi przez całą szerokość, można poczekać i zabezpieczyć ekran szkłem ochronnym. Warto jednak obserwować krawędzie: gdy pojawi się linia albo plama, wyświetlacz zaczyna się psuć od środka i lepiej nie odkładać naprawy.",
      },
    ],
    powiazane: ["wymiana-baterii-w-telefonie", "naprawa-gniazda-ladowania"],
  }),

  accepted({
    slug: "wymiana-baterii-w-telefonie",
    title: "Bateria w telefonie",
    h1: "Wymiana baterii w telefonie",
    device: "phone",
    usterka: "Bateria",
    description: "Telefon trzyma pół dnia, wyłącza się przy 20% albo bateria spuchła? Sprawdzamy ogniwo, wyceniamy wymianę i montujemy nową baterię w smartfonie.",
    intro: [
      "Każde ogniwo litowo-jonowe z czasem traci pojemność. Kiedy telefon zaczyna padać w połowie dnia albo gaśnie na mrozie, zwykle wystarczy nowa bateria, a nie nowy smartfon.",
      "Bateria zużywa się z każdym cyklem ładowania. Po dwóch, trzech latach intensywnego używania typowy telefon ma już wyraźnie mniej energii niż na początku. Spadek nie jest liniowy: przez długi czas wszystko wydaje się w porządku, a potem telefon nagle wyłącza się przy kilkunastu procentach albo restartuje przy włączaniu aparatu.",
      "Osobna sprawa to bateria spuchnięta. Rozdęte ogniwo wypycha ekran lub tylną klapkę i jest realnym zagrożeniem pożarowym. Taki telefon odłóż, nie ładuj go i przynieś do serwisu jak najszybciej. Nie próbuj dociskać klapki ani przebijać baterii.",
    ],
    objawy: [
      "Kondycja baterii w ustawieniach poniżej 80%",
      "Nagłe wyłączenia przy 10–30% naładowania",
      "Telefon grzeje się podczas zwykłego przeglądania",
      "Ekran lub tylna klapka odstaje od ramki",
      "Ładowanie do pełna trwa bardzo długo albo procenty skaczą",
      "Na zimnie telefon gaśnie po kilku minutach",
    ],
    przebieg: [
      "Sprawdzamy stan ogniwa w systemie lub testerem i wykluczamy inne przyczyny, na przykład uszkodzone gniazdo albo aplikację, która drenuje energię.",
      "Podajemy wycenę i wyjaśniamy różnice między dostępnymi bateriami do Twojego modelu.",
      "Ostrożnie otwieramy telefon, odklejamy stare ogniwo specjalnymi narzędziami i usuwamy resztki kleju, żeby nie uszkodzić taśm pod spodem.",
      "Wklejamy nową baterię, zamykamy obudowę na świeżej uszczelce i sprawdzamy ładowanie oraz pracę pod obciążeniem.",
      "Zużyte ogniwo przekazujemy do utylizacji, a Ty odbierasz telefon gotowy do pracy.",
    ],
    faq: [
      {
        q: "Jak sprawdzić, czy to już czas na nową baterię?",
        a: "W iPhonie znajdziesz to w Ustawienia → Bateria → Kondycja baterii. W Androidzie zależnie od producenta w ustawieniach baterii lub w aplikacji serwisowej. Poniżej mniej więcej 80% pojemności różnicę zwykle czuć na co dzień.",
      },
      {
        q: "Czy nowa bateria przyspieszy mój telefon?",
        a: "Często tak. Systemy ograniczają wydajność procesora, gdy ogniwo nie daje rady przy szczytowym poborze prądu. Po wymianie ograniczenie znika i telefon znów działa płynnie.",
      },
      {
        q: "Telefon jest wodoszczelny — czy po wymianie nadal będzie?",
        a: "Zakładamy nową uszczelkę, ale fabrycznej szczelności po otwarciu obudowy nie da się w pełni potwierdzić bez specjalistycznego sprzętu. Radzimy więc nie zanurzać telefonu po żadnej naprawie.",
      },
      {
        q: "Co zrobić ze spuchniętą baterią przed przyjazdem?",
        a: "Wyłącz telefon, nie podłączaj ładowarki i przewoź go w twardym pudełku, z dala od ciepła. Nie przyciskaj odstającego ekranu. Zgłoś naprawę, żebyśmy wiedzieli, z czym przyjedziesz.",
      },
      {
        q: "Jak dbać o nową baterię, żeby dłużej wytrzymała?",
        a: "Unikaj zostawiania telefonu w nagrzanym samochodzie i na słońcu, nie graj intensywnie podczas ładowania i nie rozładowuj go regularnie do zera. Wiele telefonów ma opcję ograniczenia ładowania do 80% albo ładowania adaptacyjnego w nocy. Włącz ją, jeśli Twój model to oferuje.",
      },
    ],
    powiazane: ["naprawa-gniazda-ladowania", "wymiana-ekranu-iphone"],
  }),

  accepted({
    slug: "naprawa-gniazda-ladowania",
    title: "Gniazdo ładowania",
    h1: "Naprawa gniazda ładowania",
    device: "phone",
    usterka: "Nie ładuje",
    description: "Kabel się chwieje, telefon ładuje tylko pod kątem albo wcale? Czyścimy i diagnozujemy gniazdo USB-C lub Lightning, a gdy trzeba, wymieniamy port.",
    intro: [
      "Telefon, który ładuje się tylko wtedy, gdy przytrzymasz kabel pod odpowiednim kątem, prawie zawsze ma problem z gniazdem. Zaczynamy od sprawdzenia, czy wystarczy czyszczenie, i tylko gdy to nie pomaga, proponujemy wymianę portu.",
      "W gnieździe USB-C albo Lightning zbiera się kłaczki z kieszeni, piasek i kurz. Każde wsunięcie wtyczki ubija je głębiej, aż kabel przestaje wchodzić do końca. Zdarza się też odwrotna sytuacja: styki są wyrwane, wygięte albo zaśniedziałe po kontakcie z wilgocią i wtedy czyszczenie już nie wystarczy.",
      "Budowa telefonów się różni. W jednych modelach gniazdo siedzi na osobnej taśmie lub płytce i wymienia się je w całości, w innych jest przylutowane do płyty głównej. Od tego zależy zakres pracy, dlatego wycenę podajemy dopiero po otwarciu klapki i obejrzeniu portu pod mikroskopem.",
    ],
    objawy: [
      "Wtyczka wchodzi płycej niż kiedyś i luźno się trzyma",
      "Ładowanie przerywa się przy każdym poruszeniu kablem",
      "Telefon nie ładuje się żadną ładowarką ani kablem",
      "Komunikat o wilgoci w porcie, mimo że telefon jest suchy",
      "Komputer nie widzi telefonu po podłączeniu kablem",
      "Działa tylko ładowanie bezprzewodowe",
    ],
    przebieg: [
      "Sprawdzamy telefon na kilku sprawdzonych kablach i miernikiem prądu, żeby odróżnić uszkodzone gniazdo od zużytej baterii czy wadliwej ładowarki.",
      "Oglądamy port w powiększeniu i usuwamy zanieczyszczenia narzędziami, które nie rysują styków. Jeśli to wystarczy, na tym kończymy.",
      "Gdy styki są uszkodzone, podajemy wycenę wymiany gniazda lub taśmy z portem dla Twojego modelu.",
      "Po akceptacji rozbieramy telefon, wymieniamy port i sprawdzamy mikrofon dolny oraz głośnik, które często siedzą na tej samej taśmie.",
      "Testujemy szybkie ładowanie i przesyłanie danych, a na koniec składamy telefon na nowym kleju.",
    ],
    faq: [
      {
        q: "Czy mogę sam wyczyścić gniazdo wykałaczką?",
        a: "Lepiej nie. Metalowe szpilki zwierają styki, a drewniana wykałaczka potrafi się złamać i zostać w środku. Jeśli już, to delikatnie suchą, miękką szczoteczką przy wyłączonym telefonie. Bezpieczniej oddać go do czyszczenia.",
      },
      {
        q: "Telefon pokazuje, że w porcie jest wilgoć. Co robić?",
        a: "Odłącz kabel i odczekaj, aż port wyschnie, nie przyspieszaj tego suszarką. Jeśli komunikat wraca na suchym telefonie, styki mogą być skorodowane i wtedy warto sprawdzić gniazdo w serwisie.",
      },
      {
        q: "Ładowanie indukcyjne działa, a przewodowe nie. Czy to na pewno gniazdo?",
        a: "To mocna wskazówka, że bateria i układ ładowania są sprawne, a problem leży w porcie lub jego taśmie. Diagnoza i tak to potwierdzi, zanim zaproponujemy wymianę.",
      },
      {
        q: "Czy szybka ładowarka mogła uszkodzić gniazdo?",
        a: "Sama ładowarka z certyfikatem rzadko jest winna. Częściej port psują wyrwania kabla, ładowanie z telefonem w kieszeni, tanie przewody z luźnymi wtykami i wilgoć. Jeśli używasz kabla, który grzeje się przy wtyczce albo ma uszkodzoną izolację, wymień go od razu, nawet po naprawie gniazda.",
      },
    ],
    powiazane: ["wymiana-baterii-w-telefonie", "telefon-po-zalaniu"],
  }),

  accepted({
    slug: "telefon-po-zalaniu",
    title: "Telefon po zalaniu",
    h1: "Telefon po zalaniu",
    device: "phone",
    usterka: "Po zalaniu",
    description: "Telefon wpadł do wody albo zalała go kawa? Wyłącz go i nie ładuj. Rozbieramy, czyścimy płytę z korozji i sprawdzamy, co da się uratować i za ile.",
    intro: [
      "Woda w telefonie działa powoli: urządzenie potrafi po zalaniu działać jeszcze kilka dni, a w tym czasie korozja zjada ścieżki na płycie. Im szybciej trafi do serwisu, tym większa szansa na uratowanie telefonu i danych.",
      "Najważniejsze są pierwsze minuty. Wyłącz telefon, wyjmij kartę SIM i etui, nie podłączaj ładowarki i nie sprawdzaj co chwilę, czy działa. Prąd płynący przez mokrą płytę przyspiesza korozję i potrafi spalić układy, które same w sobie wodę by przeżyły.",
      "Ryż, suszarka i kaloryfer to popularne domowe sposoby, ale żaden z nich nie usuwa osadu z płyty. Ryż wyciąga wilgoć tylko z powierzchni, a gorące powietrze może rozkleić ekran i baterię. Słodkie napoje, morska woda i woda z basenu zostawiają po wyschnięciu przewodzący nalot, który trzeba zmyć w serwisie.",
    ],
    objawy: [
      "Telefon nie włącza się po kontakcie z wodą lub napojem",
      "Pod ekranem widać plamy, smugi albo parę",
      "Głośnik brzmi cicho i charczy, mikrofon nie działa",
      "Telefon sam się restartuje albo grzeje bez powodu",
      "Aparat robi mgliste zdjęcia od środka",
      "Ładowanie działa tylko czasami",
    ],
    przebieg: [
      "Po przyjęciu nie włączamy telefonu. Od razu go rozbieramy i odłączamy baterię, żeby przerwać przepływ prądu.",
      "Oglądamy płytę główną pod mikroskopem i szukamy śladów korozji, nalotu oraz zwarć.",
      "Czyścimy płytę i złącza preparatami do elektroniki, a następnie dokładnie ją suszymy.",
      "Po złożeniu sprawdzamy kolejno ekran, dotyk, ładowanie, aparaty, głośniki, łączność i czujniki. Lista działających i niedziałających elementów jest podstawą wyceny dalszej naprawy.",
      "Jeśli zależy Ci głównie na zdjęciach i kontaktach, ustalamy z Tobą, czy najpierw próbujemy odzyskać dane, czy od razu naprawiamy telefon.",
    ],
    faq: [
      {
        q: "Czy telefon po zalaniu na pewno da się naprawić?",
        a: "Tego nie wie nikt przed rozebraniem. Zależy to od rodzaju płynu, czasu, jaki minął, i tego, czy telefon był włączony. Po czyszczeniu powiemy uczciwie, co działa, co wymaga wymiany i czy naprawa ma sens.",
      },
      {
        q: "Mój telefon jest wodoszczelny, dlaczego się zalał?",
        a: "Odporność na wodę słabnie z wiekiem uszczelek, po upadkach i wcześniejszych naprawach. Normy IP badane są też w czystej wodzie, a nie w morzu, basenie czy saunie. Producenci zwykle nie traktują zalania jako wady objętej gwarancją.",
      },
      {
        q: "Telefon po wyschnięciu działa. Czy muszę go oddawać?",
        a: "Warto przynajmniej go sprawdzić. Korozja rozwija się tygodniami i usterka potrafi pojawić się dopiero po miesiącu, często wtedy, gdy uszkodzenie jest już rozległe.",
      },
      {
        q: "Czy odzyskacie zdjęcia, jeśli telefon się nie włączy?",
        a: "Często da się uruchomić płytę na tyle, żeby skopiować dane, ale nie zawsze. Pamięć w nowoczesnych telefonach jest szyfrowana i przypisana do płyty, więc wyjęcie samej kości nic nie da. Dlatego tak ważna jest regularna kopia w chmurze.",
      },
    ],
    powiazane: ["naprawa-gniazda-ladowania", "wymiana-baterii-w-telefonie"],
  }),

  accepted({
    slug: "wymiana-tylnej-szybki-iphone",
    title: "Tylna szybka iPhone",
    h1: "Wymiana tylnej szybki iPhone",
    device: "phone",
    usterka: "Przyciski i obudowa",
    description: "Pęknięte szklane plecki iPhone’a kaleczą palce i puszczają kurz? Wymieniamy tylną szybkę, a gdy trzeba także szkiełko aparatu. Wycena przed naprawą.",
    intro: [
      "Od iPhone’a 8 tył telefonu jest ze szkła, żeby działało ładowanie bezprzewodowe. Pęknięte plecki to nie tylko kwestia wyglądu: ostre krawędzie ranią palce, a przez szczeliny do środka dostaje się wilgoć i pył.",
      "Szklany tył pęka zwykle przy upadku na płasko, nawet w etui. Pęknięcia rozchodzą się od narożnika i obejmują z czasem całą powierzchnię, a odpadające kawałki odsłaniają cewkę ładowania i taśmy. Często przy okazji pęka też osłona obiektywów aparatu, przez co zdjęcia robią się zamglone albo pojawiają się na nich odblaski.",
      "Sposób naprawy zależy od modelu. W części nowszych iPhone’ów tylną szybę zdejmuje się jak osobny element, w starszych jest na stałe połączona z ramą i trzeba ją precyzyjnie usunąć bez naruszania podzespołów. Dlatego przed wyceną zawsze pytamy o dokładny model i oglądamy obudowę.",
    ],
    objawy: [
      "Siatka pęknięć na szklanym tyle telefonu",
      "Odpadające kawałki szkła przy aparacie lub narożniku",
      "Ładowanie bezprzewodowe przerywa się albo nie działa",
      "Rozmyte zdjęcia przez pęknięte szkiełko obiektywu",
      "Wygięta rama, przez którą szybka się unosi",
    ],
    przebieg: [
      "Sprawdzamy, czy pękła tylko szybka, czy także rama, osłona aparatu albo cewka ładowania bezprzewodowego.",
      "Podajemy wycenę dla Twojego modelu i mówimy, jaki zakres prac jest możliwy.",
      "Zdejmujemy uszkodzone szkło, zabezpieczając baterię i taśmy przed odpryskami, i oczyszczamy ramę z resztek kleju.",
      "Wklejamy nową tylną szybkę, a jeśli trzeba, także osłonę obiektywów, dbając o równe spasowanie z ramą.",
      "Sprawdzamy ładowanie bezprzewodowe, MagSafe, aparaty i lampę błyskową, a potem oddajemy czysty telefon.",
    ],
    faq: [
      {
        q: "Czy z pękniętym tyłem mogę normalnie używać iPhone’a?",
        a: "Telefon zwykle działa, ale szkło dalej się kruszy, a szczeliny wpuszczają do środka wodę i kurz. Do czasu naprawy nałóż etui albo przezroczystą taśmę, żeby nie skaleczyć palców.",
      },
      {
        q: "Czy pęknięte szkiełko aparatu też wymieniacie?",
        a: "Tak, osłonę obiektywów można wymienić osobno albo razem z tylną szybą. Jeśli uszkodzony jest sam moduł aparatu, sprawdzimy to przy oględzinach.",
      },
      {
        q: "Czy MagSafe będzie działać po wymianie?",
        a: "Magnesy i cewka zostają w telefonie, a nowa szybka jest do nich dopasowana. Po naprawie sprawdzamy ładowanie bezprzewodowe i trzymanie akcesoriów magnetycznych.",
      },
      {
        q: "Kolor nowej szybki będzie taki sam?",
        a: "Zamawiamy szybkę w kolorze Twojego modelu. Przy rzadszych wersjach kolorystycznych odcień może się minimalnie różnić od oryginału i powiemy o tym przed naprawą.",
      },
      {
        q: "Czy pęknięty tył wpływa na wodoszczelność iPhone’a?",
        a: "Tak. Szczelność obudowy zapewnia całe szkło razem z klejem, więc każda szczelina otwiera drogę wodzie i parze. Po wymianie szybki zakładamy nowy klej, ale fabrycznej odporności na zanurzenie nie da się w serwisie w pełni potwierdzić. Dlatego po naprawie traktuj telefon jak urządzenie, które nie lubi wody, i nie zabieraj go do basenu ani pod prysznic.",
      },
    ],
    powiazane: ["wymiana-ekranu-iphone", "wymiana-baterii-w-telefonie"],
  }),

  accepted({
    slug: "wymiana-ekranu-w-tablecie",
    title: "Ekran w tablecie",
    h1: "Wymiana szybki i ekranu w tablecie",
    device: "tablet",
    usterka: "Pęknięty ekran",
    description: "Pęknięta szybka, martwe pola dotyku albo brak obrazu w tablecie? Sprawdzamy iPada lub tablet z Androidem i wymieniamy dotyk albo cały wyświetlacz.",
    intro: [
      "Tablet ma dużą taflę szkła i cienką obudowę, więc upadek z kanapy czy stołu często kończy się pęknięciem. Ustalamy, czy wystarczy wymiana samej szybki z dotykiem, czy uszkodzony jest także wyświetlacz pod nią.",
      "W tabletach spotyka się dwie budowy. W starszych iPadach i wielu tańszych tabletach z Androidem szybka z digitizerem jest osobną warstwą nad wyświetlaczem, więc często wymienia się tylko ją. W nowszych modelach, w tym w iPadach Air i Pro, szkło jest zlaminowane z panelem i trzeba wymienić cały moduł.",
      "Pęknięty tablet warto naprawić szybko, zwłaszcza jeśli używają go dzieci. Szkło odpryskuje, a pęknięcia w rogu przechodzą z czasem na cały ekran. Częsty objaw to także „duchy” dotyku: tablet sam przewija strony albo otwiera aplikacje, bo uszkodzony digitizer wysyła fałszywe sygnały.",
    ],
    objawy: [
      "Pęknięta szybka, ale obraz pod nią jest czysty",
      "Dotyk nie działa w pasie lub w rogu ekranu",
      "Tablet sam klika i przewija bez dotykania",
      "Plamy, paski albo brak podświetlenia",
      "Szkło odstaje od obudowy, ekran się ugina",
      "Rysik przestał działać w części ekranu",
    ],
    przebieg: [
      "Rozpoznajemy model po numerze z tyłu obudowy i sprawdzamy, czy uszkodzona jest sama szybka z dotykiem, czy także panel pod spodem.",
      "Wycenę dostajesz dla konkretnego wariantu naprawy: szybka z digitizerem albo cały wyświetlacz.",
      "Rozgrzewamy klej, ostrożnie zdejmujemy pękniętą taflę i usuwamy odłamki szkła spod ramki.",
      "Montujemy nowy element na kleju dobranym do obudowy, z dbałością o kamerę przednią i czujniki przy krawędzi.",
      "Testujemy dotyk na całej powierzchni, obsługę rysika, jasność i obrót ekranu, a potem czyścimy tablet.",
    ],
    faq: [
      {
        q: "Skąd mam wiedzieć, czy wystarczy sama szybka?",
        a: "Jeśli obraz jest czysty, bez plam i pasków, a nie działa tylko dotyk albo pękło szkło, często wystarczy wymiana digitizera. W tabletach z ekranem laminowanym wymienia się zawsze całość. Rozstrzyga to diagnoza.",
      },
      {
        q: "Czy dane z tabletu zostaną?",
        a: "Wymiana ekranu nie dotyka pamięci, więc zdjęcia i aplikacje zostają. Przed oddaniem tabletu i tak zrób kopię, jeśli to możliwe.",
      },
      {
        q: "Czy naprawiacie tablety dla dzieci i mniej znane marki?",
        a: "Przyjmujemy różne tablety, także tańsze modele. O możliwości naprawy decyduje dostępność części do danego modelu, którą sprawdzamy przy wycenie.",
      },
      {
        q: "Tablet ma też słabą baterię. Czy da się to zrobić za jednym razem?",
        a: "Tak, przy otwartym tablecie łatwo przy okazji sprawdzić i wymienić baterię. Powiedz o tym przy zgłoszeniu, a ujmiemy to w wycenie.",
      },
      {
        q: "Jak zabezpieczyć tablet po naprawie?",
        a: "Najlepiej sprawdza się etui z podniesionymi krawędziami, które przy upadku przyjmuje uderzenie zamiast szkła, oraz szkło hartowane na ekran. W przypadku tabletu dla dziecka wybierz grubsze, gumowane etui z rączką. Dobrze dopasowane etui to mniejszy wydatek niż kolejna wymiana szybki.",
      },
    ],
    powiazane: ["naprawa-smartwatcha", "wymiana-baterii-w-telefonie"],
  }),

  accepted({
    slug: "naprawa-smartwatcha",
    title: "Naprawa smartwatcha",
    h1: "Wymiana szkła i baterii w smartwatchu",
    device: "smartwatch",
    usterka: "Pęknięte szkło",
    description: "Pęknięte szkło w zegarku, bateria na kilka godzin albo spuchnięta koperta? Diagnozujemy Apple Watcha, Galaxy Watcha i inne smartwatche przed naprawą.",
    intro: [
      "Smartwatch nosimy na ręce przez cały dzień, więc obija się o futryny, poręcze i kamienie na szlaku. Najczęściej pęka szkło albo bateria przestaje wytrzymywać do wieczora. Zegarek najpierw diagnozujemy, a o naprawie decydujesz po wycenie.",
      "Ekran w smartwatchu jest malutki, ale zbudowany podobnie jak w telefonie: szkło, dotyk i wyświetlacz tworzą jeden moduł przyklejony do koperty. W Apple Watchu i wielu zegarkach z Wear OS pęknięte szkło oznacza wymianę całego modułu. Klej utrzymuje też odporność na zachlapanie, więc po otwarciu trzeba go starannie odtworzyć.",
      "Bateria w zegarku jest kilkanaście razy mniejsza niż w telefonie i przy codziennym ładowaniu zużywa się szybko. Spuchnięta bateria podnosi ekran od spodu i to bywa pierwszy widoczny sygnał. Jeśli zegarek „otwiera się” sam, przestań go ładować i nie noś go na ręce.",
    ],
    objawy: [
      "Pęknięte lub mocno porysowane szkło koperty",
      "Ekran odchodzi od koperty z jednej strony",
      "Bateria nie wytrzymuje dnia przy zwykłym używaniu",
      "Zegarek nie reaguje na dotyk lub koronkę",
      "Brak ładowania na stacji lub ładowarce magnetycznej",
      "Zaparowanie pod szkłem po basenie lub prysznicu",
    ],
    przebieg: [
      "Sprawdzamy model i wersję zegarka, bo rozmiary koperty i warianty z LTE mają różne części.",
      "Oceniamy szkło, ekran, baterię i czujniki na spodzie, a potem podajemy wycenę wybranej naprawy.",
      "Podgrzewamy i otwieramy kopertę, odłączamy baterię i usuwamy stary klej z krawędzi.",
      "Wymieniamy uszkodzony element, a całość zamykamy na nowej taśmie klejącej dopasowanej kształtem do koperty.",
      "Sprawdzamy dotyk, koronkę, pulsometr, ładowanie i łączność z telefonem.",
    ],
    faq: [
      {
        q: "Czy zegarek będzie wodoszczelny po naprawie?",
        a: "Zamykamy go na nowym kleju, ale fabrycznej klasy wodoszczelności po otwarciu nie da się potwierdzić w warunkach serwisu. Po naprawie nie pływaj w zegarku i nie bierz go pod prysznic.",
      },
      {
        q: "Czy muszę rozparować zegarek z telefonem?",
        a: "Przy Apple Watchu wyłącz blokadę aktywacji przez aplikację Watch albo podaj ją przy odbiorze do testów. W innych markach zwykle nie trzeba nic robić, ale warto mieć zsynchronizowane dane treningowe.",
      },
      {
        q: "Opaska jest cała, a zegarek przestał się ładować. Co może być winne?",
        a: "Najczęściej zabrudzone styki na spodzie, uszkodzona ładowarka albo zużyta bateria. Zaczynamy od prostych rzeczy, a otwieramy kopertę tylko wtedy, gdy to konieczne.",
      },
      {
        q: "Czy wymieniacie samo szkło w zegarku bez ekranu?",
        a: "W większości smartwatchy szkło jest zespolone z wyświetlaczem i nie da się go rozdzielić bez ryzyka uszkodzenia panelu. W niektórych zegarkach sportowych szkło jest osobne. Przy oględzinach powiemy, jaka budowa jest w Twoim modelu.",
      },
      {
        q: "Jak chronić zegarek przed kolejnym pęknięciem?",
        a: "Pomaga cienka nakładka z hartowanego szkła albo etui obejmujące kopertę. Na wycieczki w góry i na siłownię warto przełożyć zegarek na wewnętrzną stronę nadgarstka, gdzie rzadziej uderza o skały, sztangę czy poręcze.",
      },
    ],
    powiazane: ["wymiana-ekranu-w-tablecie", "wymiana-baterii-w-telefonie"],
  }),

  accepted({
    slug: "laptop-sie-przegrzewa",
    title: "Laptop się grzeje",
    h1: "Laptop się przegrzewa",
    device: "laptop",
    usterka: "Przegrzewa się",
    description: "Wentylator wyje, obudowa parzy, a laptop zwalnia lub sam się wyłącza? Czyścimy układ chłodzenia z kurzu, wymieniamy pastę i testujemy pod obciążeniem.",
    intro: [
      "Laptop, który hałasuje jak suszarka i parzy w kolana, najczęściej ma zapchany układ chłodzenia. Kurz i zaschnięta pasta termoprzewodząca sprawiają, że procesor zwalnia, a w skrajnych przypadkach komputer wyłącza się w połowie pracy.",
      "Wentylator wciąga powietrze razem z kurzem, sierścią i okruchami. Po roku czy dwóch na żebrach radiatora tworzy się filcowa warstwa, przez którą ciepłe powietrze nie ma ujścia. Do tego pasta między procesorem a radiatorem z czasem wysycha i przestaje oddawać ciepło. Efekt to wysoka temperatura nawet przy przeglądaniu stron.",
      "Przegrzewanie to nie tylko hałas. Wysoka temperatura skraca życie baterii, układu graficznego i płyty głównej. Jeśli laptop wyłącza się przy grach, montażu wideo albo wideorozmowach, a po chwili znów działa, to klasyczny objaw zabezpieczenia termicznego.",
    ],
    objawy: [
      "Wentylator pracuje głośno nawet przy pustym pulpicie",
      "Obudowa nad klawiaturą lub od spodu jest gorąca",
      "Laptop zwalnia po kilku minutach pracy",
      "Nagłe wyłączenia przy grach lub renderowaniu",
      "Z kratki wylotowej leci słabe, gorące powietrze",
      "Słychać terkotanie lub ocieranie wentylatora",
    ],
    przebieg: [
      "Mierzymy temperatury procesora i grafiki w spoczynku i pod obciążeniem, żeby mieć punkt odniesienia przed czyszczeniem.",
      "Rozbieramy laptopa, zdejmujemy układ chłodzenia i usuwamy kurz z radiatora, wentylatora i kratek.",
      "Usuwamy starą pastę, nakładamy nową i sprawdzamy termopady na pamięciach i sekcji zasilania.",
      "Jeśli wentylator ma luz lub terkocze, proponujemy jego wymianę, zanim cokolwiek zamówimy.",
      "Po złożeniu powtarzamy test obciążeniowy i porównujemy wyniki. Dostajesz informację, o ile spadły temperatury.",
    ],
    faq: [
      {
        q: "Czy mogę przedmuchać laptopa sprężonym powietrzem?",
        a: "Przedmuchanie kratki usuwa tylko część kurzu, a reszta często zbija się głębiej na radiatorze. Kręcący się od strumienia powietrza wentylator może też generować prąd i uszkodzić układ. Pełne czyszczenie wymaga rozebrania obudowy.",
      },
      {
        q: "Jak często czyścić laptopa?",
        a: "Zależy to od otoczenia. W domu ze zwierzętami albo przy pracy na łóżku i kocu kurz zbiera się znacznie szybciej. Dobrym sygnałem jest głośniejszy niż zwykle wentylator.",
      },
      {
        q: "Podstawka chłodząca wystarczy?",
        a: "Podstawka pomaga, gdy laptop stoi na płaskiej powierzchni z dobrym przepływem powietrza, ale nie usunie kurzu z radiatora ani wyschniętej pasty. Traktuj ją jako dodatek, nie zamiennik czyszczenia.",
      },
      {
        q: "Czy po czyszczeniu laptop będzie szybszy?",
        a: "Jeśli wcześniej zwalniał przez temperaturę, to tak, bo procesor może znów pracować z pełną mocą. Gdy powodem jest wolny dysk albo mało pamięci, warto pomyśleć też o wymianie dysku na SSD.",
      },
      {
        q: "Laptop grzeje się tylko przy ładowaniu. Czy to też kurz?",
        a: "Niekoniecznie. Ładowanie samo w sobie podnosi temperaturę, ale wyraźnie gorąca okolica gniazda lub spodu przy baterii może oznaczać zużyte lub puchnące ogniwo albo problem z układem zasilania. W takim przypadku poza czyszczeniem sprawdzamy też baterię i ładowarkę.",
      },
    ],
    powiazane: ["wymiana-matrycy-w-laptopie", "wymiana-dysku-na-ssd"],
  }),

  accepted({
    slug: "wymiana-matrycy-w-laptopie",
    title: "Matryca w laptopie",
    h1: "Wymiana matrycy w laptopie",
    device: "laptop",
    usterka: "Matryca",
    description: "Pęknięta matryca, paski, migotanie albo ciemny obraz w laptopie? Ustalamy, czy winny jest ekran, taśma czy zawias, i dobieramy matrycę do modelu.",
    intro: [
      "Matryca w laptopie pęka najczęściej przy zamykaniu klapy na długopisie, słuchawkach albo myszce, a także przy upadku torby. Zanim wymienimy ekran, sprawdzamy, czy problem nie leży w taśmie lub zawiasach, bo podobne objawy mają różne przyczyny.",
      "Nie każdy kłopot z obrazem oznacza zepsutą matrycę. Obraz, który miga przy otwieraniu klapy, zwykle wskazuje na przetartą taśmę sygnałową w zawiasie. Bardzo ciemny ekran, na którym w świetle latarki widać pulpit, to często uszkodzone podświetlenie. Dopiero pęknięcia, wylewy i stałe pionowe paski jednoznacznie świadczą o uszkodzeniu panelu.",
      "Laptopy tego samego producenta mają matryce o różnych złączach, rozdzielczościach, częstotliwościach odświeżania i grubościach. Dlatego dobieramy część po numerze z tyłu panelu, a nie tylko po nazwie modelu. W cienkich ultrabookach ekran bywa sklejony z klapą i wtedy wymienia się większy element.",
    ],
    objawy: [
      "Pęknięcie lub kolorowy wylew na ekranie",
      "Pionowe albo poziome paski w jednym miejscu",
      "Migotanie zależne od kąta otwarcia klapy",
      "Bardzo ciemny obraz widoczny tylko pod światło",
      "Na monitorze zewnętrznym obraz jest poprawny",
      "Klapa trzeszczy, a zawias stawia opór",
    ],
    przebieg: [
      "Podłączamy laptopa do zewnętrznego monitora, żeby wykluczyć kartę graficzną i płytę główną.",
      "Sprawdzamy taśmę, złącze i zawiasy, a następnie odczytujemy numer matrycy.",
      "Podajemy wycenę z dopasowaną matrycą i, jeśli trzeba, z naprawą zawiasu lub wymianą taśmy.",
      "Po akceptacji zdejmujemy ramkę, wymieniamy panel i sprawdzamy, czy klapa domyka się równo.",
      "Testujemy obraz na jednolitych kolorach, jasność, kamerę internetową oraz działanie przy otwieraniu i zamykaniu klapy.",
    ],
    faq: [
      {
        q: "Czy z pękniętą matrycą mogę pracować na monitorze?",
        a: "Tak, laptop podłączony do monitora działa normalnie. Uważaj tylko, żeby nie zamykać i nie otwierać klapy zbyt często, bo pęknięcie może uszkodzić podświetlenie albo kamerę.",
      },
      {
        q: "Czy mogę zmienić matrycę na lepszą, na przykład z wyższym odświeżaniem?",
        a: "Czasem tak, jeśli laptop ma takie samo złącze i obsługuje dany panel. Sprawdzamy to po numerze płyty i obecnej matrycy. Powiemy wprost, czy zamiana ma sens w Twoim modelu.",
      },
      {
        q: "Dlaczego ekran w moim laptopie z dotykiem jest trudniejszy w naprawie?",
        a: "W laptopach z ekranem dotykowym i konwertowalnych szkło dotyku jest zwykle sklejone z panelem. Wymienia się wtedy cały moduł, a jego dostępność różni się między modelami.",
      },
      {
        q: "Na ekranie pojawił się jeden jasny lub czarny punkt. Czy to już naprawa?",
        a: "Pojedynczy martwy lub zawieszony piksel to zwykle wada samego panelu i nie rozrasta się. Jeśli Ci nie przeszkadza, można z nim pracować. Inaczej jest z plamą, która powiększa się po każdym otwarciu klapy: to znak uszkodzenia mechanicznego i wtedy wymiana jest kwestią czasu.",
      },
      {
        q: "Czy przy wymianie matrycy warto zrobić coś jeszcze?",
        a: "Skoro laptop jest rozebrany, dobrze jest od razu sprawdzić zawiasy i ich mocowania, bo pęknięte gniazda zawiasów potrafią uszkodzić nową matrycę. Na prośbę możemy też przy okazji wyczyścić układ chłodzenia.",
      },
    ],
    powiazane: ["laptop-sie-przegrzewa", "wymiana-dysku-na-ssd"],
  }),

  accepted({
    slug: "wymiana-dysku-na-ssd",
    title: "Wymiana dysku na SSD",
    h1: "Wymiana dysku na SSD w komputerze",
    device: "desktop",
    usterka: "Działa wolno",
    description: "Komputer startuje kilka minut, a programy otwierają się w nieskończoność? Montujemy dysk SSD, przenosimy system i dane albo instalujemy system od nowa.",
    intro: [
      "Starszy komputer z dyskiem talerzowym potrafi uruchamiać się kilka minut, a przeglądarka i dokumenty otwierają się z opóźnieniem. Wymiana dysku na SSD to zwykle najskuteczniejszy sposób, żeby taki sprzęt znów działał żwawo.",
      "Dysk HDD ma wirujące talerze i ruchomą głowicę, która musi fizycznie dotrzeć do każdego kawałka pliku. SSD czyta dane z pamięci flash bez ruchomych części, więc system, programy i aktualizacje ładują się dużo szybciej. Przy okazji komputer pracuje ciszej i jest mniej wrażliwy na wstrząsy.",
      "Do komputerów stacjonarnych dobieramy SSD pod dostępne złącza: SATA w starszych płytach albo M.2 w nowszych, w tym NVMe, gdy płyta go obsługuje. Stary dysk może zostać w obudowie jako drugi, na zdjęcia i archiwum. Ta sama naprawa sprawdza się też w laptopach z dyskiem talerzowym.",
    ],
    objawy: [
      "Start systemu trwa kilka minut",
      "Dioda dysku świeci bez przerwy, a komputer się zacina",
      "Menedżer zadań pokazuje dysk zajęty w 100%",
      "Z obudowy słychać stukanie lub terkotanie dysku",
      "Aktualizacje systemu trwają godzinami",
      "Kopiowanie plików co chwilę się zatrzymuje",
    ],
    przebieg: [
      "Sprawdzamy stan obecnego dysku i jego odczyty SMART, a także pamięć RAM i dostępne złącza na płycie głównej.",
      "Proponujemy pojemność i typ SSD oraz jedną z dwóch dróg: przeniesienie obecnego systemu z danymi albo czystą instalację systemu. Dostajesz wycenę.",
      "Montujemy SSD w obudowie, a w razie potrzeby dokładamy ramkę lub kabel zasilania.",
      "Klonujemy dysk albo instalujemy system i przenosimy wskazane pliki, a potem ustawiamy SSD jako dysk startowy.",
      "Sprawdzamy start systemu, aktualizacje i sterowniki. Stary dysk zostaje w komputerze jako dodatkowy albo oddajemy go Tobie.",
    ],
    faq: [
      {
        q: "Lepiej sklonować system czy zainstalować go od nowa?",
        a: "Klonowanie zachowuje wszystkie programy i ustawienia, ale przenosi też bałagan z lat używania. Czysta instalacja daje najszybszy efekt, tylko trzeba potem zainstalować programy. Doradzimy po obejrzeniu komputera.",
      },
      {
        q: "Czy stary komputer w ogóle skorzysta na SSD?",
        a: "W zdecydowanej większości tak, bo to dysk jest najwolniejszym elementem starszych zestawów. Jeśli przy okazji zobaczymy, że wąskim gardłem jest za mało pamięci RAM, powiemy o tym przy wycenie.",
      },
      {
        q: "Co jeśli stary dysk już stuka?",
        a: "Stukanie oznacza, że dysk może wkrótce przestać działać. Najpierw kopiujemy z niego dane na nowy SSD, a dopiero potem zajmujemy się resztą. Uszkodzonego dysku nie zostawiamy jako miejsca na ważne pliki.",
      },
      {
        q: "Czy licencja Windows przejdzie na nowy dysk?",
        a: "Licencja cyfrowa jest zwykle powiązana z płytą główną komputera, więc po wymianie samego dysku system aktywuje się ponownie. Przy nietypowych licencjach sprawdzimy to z Tobą przed instalacją.",
      },
      {
        q: "Czy do komputera stacjonarnego mogę dołożyć SSD zamiast wymieniać dysk?",
        a: "Tak, to częsty wybór. SSD staje się dyskiem systemowym, a dotychczasowy HDD zostaje na zdjęcia i archiwum. Wymaga to wolnego złącza i miejsca w obudowie, co sprawdzamy przy diagnozie.",
      },
    ],
    powiazane: ["laptop-sie-przegrzewa", "czyszczenie-konsoli-ps5-ps4"],
  }),

  accepted({
    slug: "czyszczenie-konsoli-ps5-ps4",
    title: "Czyszczenie konsoli",
    h1: "Czyszczenie konsoli PS5 i PS4",
    device: "console",
    usterka: "Głośna, przegrzewa się",
    description: "PlayStation szumi jak odkurzacz, grzeje się albo wyłącza w trakcie gry? Rozbieramy konsolę, czyścimy wentylator i radiator, sprawdzamy chłodzenie.",
    intro: [
      "Konsola stoi zwykle pod telewizorem, blisko podłogi, i przez lata zasysa kurz oraz sierść. Kiedy PS4 albo PS5 zaczyna głośno szumieć lub wyłącza się w trakcie gry, najczęściej pomaga dokładne czyszczenie układu chłodzenia.",
      "PS4, zwłaszcza w wersji Fat i Pro, słynie z wentylatora, który z czasem brzmi jak startujący samolot. Za hałas odpowiada zbity kurz w radiatorze i wyschnięta pasta na procesorze. PS5 ma większy wentylator i komory na kurz, ale przy ciasnej szafce RTV i zwierzętach w domu też potrafi się zapchać.",
      "W obu konsolach wnętrze jest ciasno upakowane, a w PS5 producent użył między procesorem a radiatorem innego materiału termoprzewodzącego niż w PS4. Dlatego zakres pracy ustalamy po otwarciu obudowy: czasem wystarczy usunąć kurz z wentylatora i radiatora, czasem trzeba wymienić pastę i termopady.",
    ],
    objawy: [
      "Wentylator wyje już w menu konsoli",
      "Konsola wyłącza się z komunikatem o temperaturze",
      "Gorące powietrze z tyłu i ciepła obudowa",
      "Gry zacinają się po dłuższej sesji",
      "Słychać grzechotanie lub ocieranie w środku",
      "Przy kratkach widać szary kurz i sierść",
    ],
    przebieg: [
      "Uruchamiamy konsolę, słuchamy wentylatora i sprawdzamy, jak zachowuje się w trakcie wymagającej gry.",
      "Mówimy, jaki zakres czyszczenia proponujemy dla Twojego modelu, i podajemy wycenę.",
      "Rozbieramy obudowę, wyjmujemy wentylator i usuwamy kurz z radiatora, kanałów powietrza i zasilacza.",
      "W PS4 wymieniamy zaschniętą pastę na procesorze, w obu konsolach sprawdzamy termopady i stan wentylatora.",
      "Składamy konsolę, testujemy ją w grze i przekazujemy wskazówki, jak ustawić ją w szafce, żeby się nie dusiła.",
    ],
    faq: [
      {
        q: "Konsola jest na gwarancji producenta. Czy czyszczenie ją unieważni?",
        a: "Otwarcie obudowy może wpłynąć na gwarancję producenta. Jeśli konsola jest nowa i ma usterkę, najpierw zgłoś ją do producenta lub sprzedawcy. Czyszczenie najczęściej ma sens w konsolach po kilku latach używania.",
      },
      {
        q: "Czy pady też czyścicie i naprawiacie?",
        a: "Pady przyjmujemy osobno, na przykład z dryfem gałki albo problemem z ładowaniem. Zgłoś je razem z konsolą, a w wycenie ujmiemy oba urządzenia.",
      },
      {
        q: "Jak ustawić konsolę, żeby rzadziej się zapychała?",
        a: "Zostaw kilka centymetrów wolnego miejsca z tyłu i po bokach, nie zamykaj jej w szafce bez wentylacji i nie stawiaj bezpośrednio na dywanie. Kratki wlotowe odkurzaj z zewnątrz, gdy konsola jest wyłączona.",
      },
      {
        q: "Czy stracę zapisy gier i konto?",
        a: "Czyszczenie nie dotyka dysku konsoli, więc gry i zapisy zostają. Mimo to warto mieć włączoną synchronizację zapisów w chmurze.",
      },
      {
        q: "Konsola przestała czytać płyty. Czy czyszczenie pomoże?",
        a: "Czasem tak, bo kurz osiada też na soczewce napędu. Częściej jednak problem leży w samym napędzie lub jego mechanizmie. Opisz to w zgłoszeniu, a przy okazji czyszczenia sprawdzimy także napęd i powiemy, co da się zrobić.",
      },
    ],
    powiazane: ["laptop-sie-przegrzewa", "wymiana-dysku-na-ssd"],
  }),
];
