export const metadata = {
  title: "Regulamin | PRO-KOM Serwis",
  description:
    "Regulamin świadczenia usług serwisowych i sprzedaży akcesoriów przez PRO-KOM Serwis w Rabce-Zdroju.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-prokom-black">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-prokom-gray">
        {children}
      </div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="ml-4 list-disc">{children}</li>;
}

function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="ml-4 list-decimal space-y-1.5">{children}</ol>;
}

export default function RegulaminPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">
        Regulamin świadczenia usług
      </h1>
      <p className="mt-2 text-sm text-prokom-gray">
        Wersja obowiązująca od: <strong>25 kwietnia 2026 r.</strong>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-prokom-gray">
        Niniejszy Regulamin określa zasady korzystania z serwisu internetowego
        dostępnego pod adresem <strong>pro-kom.eu</strong> oraz warunki
        świadczenia usług serwisowych i sprzedaży akcesoriów przez PRO-KOM
        Serwis. Przed skorzystaniem z usług prosimy o uważne zapoznanie się z
        poniższymi postanowieniami.
      </p>

      {/* § 1 */}
      <Section title="§ 1. Definicje">
        <p>Użyte w Regulaminie pojęcia oznaczają:</p>
        <ul className="space-y-1.5">
          <Li>
            <strong>Usługodawca / Serwis</strong> – PRO-KOM Serwis, ul. Orkana
            16B, 34-700 Rabka-Zdrój; tel.{" "}
            <a href="tel:883200151" className="text-primary hover:underline">
              883 200 151
            </a>
            ; e-mail:{" "}
            <a
              href="mailto:sklep@pro-kom.eu"
              className="text-primary hover:underline"
            >
              sklep@pro-kom.eu
            </a>
            .
          </Li>
          <Li>
            <strong>Klient</strong> – osoba fizyczna, osoba prawna lub jednostka
            organizacyjna korzystająca z usług Usługodawcy.
          </Li>
          <Li>
            <strong>Konsument</strong> – Klient będący osobą fizyczną
            korzystającą z usług w celach niezwiązanych bezpośrednio z
            działalnością gospodarczą lub zawodową.
          </Li>
          <Li>
            <strong>Serwis internetowy</strong> – strona dostępna pod adresem
            pro-kom.eu wraz ze wszystkimi podstronami.
          </Li>
          <Li>
            <strong>Zlecenie naprawy</strong> – umowa o świadczenie usługi
            serwisowej zawarta między Klientem a Usługodawcą.
          </Li>
          <Li>
            <strong>Formularz zlecenia</strong> – elektroniczny formularz
            dostępny na stronie pro-kom.eu/zgloszenie służący do zgłoszenia
            urządzenia do naprawy.
          </Li>
          <Li>
            <strong>Konto Klienta</strong> – indywidualne konto zakładane w
            serwisie internetowym, umożliwiające śledzenie zleceń i historii
            napraw.
          </Li>
          <Li>
            <strong>RMA</strong> – numer identyfikacyjny zlecenia naprawy w
            formacie PROKOM/RMA/{"{numer}"}/{"{rok}"}.
          </Li>
        </ul>
      </Section>

      {/* § 2 */}
      <Section title="§ 2. Postanowienia ogólne">
        <Ol>
          <li>
            Regulamin określa prawa i obowiązki Klientów oraz Usługodawcy w
            zakresie świadczenia usług serwisowych i sprzedaży akcesoriów.
          </li>
          <li>
            Korzystanie z serwisu internetowego i składanie zleceń jest
            równoznaczne z akceptacją niniejszego Regulaminu.
          </li>
          <li>
            Usługodawca świadczy usługi zgodnie z obowiązującymi przepisami
            prawa, w szczególności Kodeksem cywilnym, ustawą o prawach
            konsumenta oraz przepisami o świadczeniu usług drogą elektroniczną.
          </li>
          <li>
            Wszelkie informacje handlowe prezentowane w serwisie internetowym
            stanowią zaproszenie do zawarcia umowy w rozumieniu art. 71 KC, a
            nie ofertę w rozumieniu art. 66 KC.
          </li>
        </Ol>
      </Section>

      {/* § 3 */}
      <Section title="§ 3. Zakres świadczonych usług">
        <p>PRO-KOM Serwis świadczy następujące usługi:</p>
        <ul className="space-y-1">
          <Li>naprawa telefonów komórkowych i smartfonów</Li>
          <Li>naprawa laptopów i notebooków</Li>
          <Li>naprawa tabletów</Li>
          <Li>naprawa drukarek</Li>
          <Li>naprawa konsol do gier</Li>
          <Li>naprawa smartwatchy i urządzeń ubieralnych</Li>
          <Li>naprawa komputerów stacjonarnych</Li>
          <Li>odzyskiwanie danych z nośników</Li>
          <Li>sprzedaż akcesoriów GSM i elektronicznych</Li>
          <Li>
            sprzedaż produktów Hammer Glass (szkła hartowane, folie ochronne)
          </Li>
        </ul>
        <p>
          Usługodawca zastrzega sobie prawo do odmowy przyjęcia zlecenia bez
          podania przyczyny, w szczególności w przypadku urządzeń, których
          naprawa przekracza możliwości techniczne serwisu lub jest ekonomicznie
          nieuzasadniona.
        </p>
      </Section>

      {/* § 4 */}
      <Section title="§ 4. Przyjęcie urządzenia do naprawy – tryb stacjonarny">
        <Ol>
          <li>
            Klient może oddać urządzenie do naprawy osobiście w siedzibie
            serwisu lub za pośrednictwem formularza zlecenia online.
          </li>
          <li>
            Przy przyjęciu urządzenia Usługodawca wystawia dokument przyjęcia
            zawierający: opis urządzenia, widoczne uszkodzenia, zgłoszoną
            usterkę i numer RMA.
          </li>
          <li>
            Klient zobowiązany jest do:
            <ul className="mt-1 space-y-1">
              <Li>podania danych kontaktowych niezbędnych do realizacji usługi</Li>
              <Li>
                wykonania kopii zapasowej danych przed oddaniem urządzenia –
                Usługodawca nie ponosi odpowiedzialności za utratę danych
              </Li>
              <Li>
                usunięcia kont i blokad (np. blokada FRP, iCloud) lub
                przekazania danych logowania niezbędnych do diagnozy
              </Li>
              <Li>
                poinformowania o wszelkich okolicznościach mogących mieć wpływ
                na naprawę (zalanie, wcześniejsze naprawy)
              </Li>
            </ul>
          </li>
          <li>
            Wartościowe akcesoria (etui, szkła, ładowarki) zaleca się zabrać
            przed oddaniem urządzenia. Usługodawca nie odpowiada za ich
            ewentualną utratę, chyba że zostały uwzględnione w protokole
            przyjęcia.
          </li>
        </Ol>
      </Section>

      {/* § 5 */}
      <Section title="§ 5. Zgłoszenie naprawy przez internet">
        <Ol>
          <li>
            Klient może zgłosić urządzenie do naprawy za pomocą formularza
            zlecenia dostępnego pod adresem pro-kom.eu/zgloszenie.
          </li>
          <li>
            Formularz obejmuje: dane kontaktowe Klienta, informacje o
            urządzeniu (kategoria, marka, model, opis usterki, opcjonalnie numer
            IMEI / seryjny) oraz wybór metody dostarczenia urządzenia.
          </li>
          <li>
            Po przesłaniu formularza Klient otrzymuje na wskazany adres e-mail
            potwierdzenie przyjęcia zgłoszenia wraz z numerem RMA.
          </li>
          <li>
            Zlecenie uważa się za złożone z chwilą fizycznego dostarczenia
            urządzenia do serwisu. Formularz online jest jedynie wstępnym
            zgłoszeniem i nie wiąże stron.
          </li>
          <li>
            W przypadku wysyłki urządzenia kurierskiej Klient pakuje urządzenie
            we własnym zakresie. Usługodawca nie odpowiada za szkody powstałe
            wskutek nieprawidłowego zapakowania.
          </li>
        </Ol>
      </Section>

      {/* § 6 */}
      <Section title="§ 6. Wycena i realizacja naprawy">
        <Ol>
          <li>
            Po przyjęciu urządzenia Usługodawca przeprowadza bezpłatną diagnozę
            i przedstawia Klientowi wycenę naprawy.
          </li>
          <li>
            Wycena podawana jest Klientowi telefonicznie, e-mailem lub przez
            panel Klienta. Klient ma prawo do jej akceptacji lub odmowy.
          </li>
          <li>
            Brak odpowiedzi Klienta na wycenę przez 7 dni roboczych traktowany
            jest jako rezygnacja z naprawy. Urządzenie zostaje wydane po
            uiszczeniu opłaty diagnostycznej (jeśli obowiązuje).
          </li>
          <li>
            Usługodawca dołoży wszelkich starań, by naprawa została wykonana w
            terminie wskazanym przy wycenie. Termin może ulec zmianie w
            przypadku niedostępności części – Klient zostanie niezwłocznie
            poinformowany.
          </li>
          <li>
            Ostateczna cena naprawy może różnić się od wyceny wstępnej, jeśli w
            trakcie naprawy ujawnią się dodatkowe uszkodzenia. W takim
            przypadku Usługodawca informuje Klienta i uzyskuje jego zgodę przed
            kontynuowaniem prac.
          </li>
        </Ol>
      </Section>

      {/* § 7 */}
      <Section title="§ 7. Ceny i płatności">
        <Ol>
          <li>
            Ceny usług serwisowych podawane są w złotych polskich (PLN) i
            zawierają podatek VAT, o ile nie zaznaczono inaczej.
          </li>
          <li>
            Akceptowane formy płatności:
            <ul className="mt-1 space-y-1">
              <Li>gotówka (przy odbiorze w siedzibie serwisu)</Li>
              <Li>przelew bankowy na rachunek wskazany w wycenie</Li>
              <Li>płatność kartą (terminal w siedzibie serwisu)</Li>
            </ul>
          </li>
          <li>
            Urządzenie wydawane jest Klientowi po uregulowaniu należności w
            całości.
          </li>
          <li>
            Na życzenie Klienta wystawiamy fakturę VAT. Prosimy o zgłoszenie
            potrzeby wystawienia faktury przed zapłatą.
          </li>
        </Ol>
      </Section>

      {/* § 8 */}
      <Section title="§ 8. Odbiór urządzenia po naprawie">
        <Ol>
          <li>
            O gotowości urządzenia do odbioru Klient informowany jest
            telefonicznie lub e-mailem.
          </li>
          <li>
            Klient zobowiązany jest odebrać urządzenie w terminie 30 dni
            kalendarzowych od daty powiadomienia.
          </li>
          <li>
            Po bezskutecznym upływie 30 dni Usługodawca może naliczyć opłatę
            za przechowanie w wysokości 5 zł brutto za każdy rozpoczęty dzień
            przechowywania, po uprzednim pisemnym (e-mailowym) poinformowaniu
            Klienta.
          </li>
          <li>
            Po upływie 90 dni od daty powiadomienia, w przypadku braku odbioru
            i nieuregulowania należności, Usługodawca ma prawo postąpić z
            urządzeniem zgodnie z przepisami o nieodebranych rzeczach.
          </li>
          <li>
            W przypadku wysyłki zwrotnej koszty wysyłki ponosi Klient.
          </li>
        </Ol>
      </Section>

      {/* § 9 */}
      <Section title="§ 9. Gwarancja na usługi serwisowe">
        <Ol>
          <li>
            Na wykonane usługi serwisowe Usługodawca udziela gwarancji na okres
            <strong> 3 miesięcy</strong> od dnia wydania urządzenia, chyba że
            w wycenie lub protokole naprawy wskazano inny termin.
          </li>
          <li>
            Gwarancja obejmuje wyłącznie zakres wykonanej naprawy (wymieniony
            podzespół lub naprawiony element).
          </li>
          <li>
            Gwarancja nie obejmuje:
            <ul className="mt-1 space-y-1">
              <Li>uszkodzeń mechanicznych, zalania lub zwarcia powstałych po naprawie</Li>
              <Li>
                uszkodzeń wynikłych z nieprawidłowego użytkowania urządzenia po
                naprawie
              </Li>
              <Li>
                ingerencji w urządzenie przez osoby trzecie po wykonaniu naprawy
              </Li>
              <Li>naturalnego zużycia podzespołów</Li>
            </ul>
          </li>
          <li>
            Reklamacje gwarancyjne należy zgłaszać na adres e-mail{" "}
            <a
              href="mailto:sklep@pro-kom.eu"
              className="text-primary hover:underline"
            >
              sklep@pro-kom.eu
            </a>{" "}
            lub osobiście w siedzibie serwisu.
          </li>
        </Ol>
      </Section>

      {/* § 10 */}
      <Section title="§ 10. Reklamacje">
        <Ol>
          <li>
            Klient ma prawo złożyć reklamację dotyczącą wykonanej usługi lub
            zakupionego towaru w terminie wynikającym z przepisów prawa (rękojmia
            – do 2 lat od wydania towaru/zakończenia usługi).
          </li>
          <li>
            Reklamację można złożyć:
            <ul className="mt-1 space-y-1">
              <Li>
                elektronicznie na adres{" "}
                <a
                  href="mailto:sklep@pro-kom.eu"
                  className="text-primary hover:underline"
                >
                  sklep@pro-kom.eu
                </a>
              </Li>
              <Li>za pomocą formularza reklamacyjnego dostępnego pod adresem pro-kom.eu/claim-repair</Li>
              <Li>osobiście w siedzibie serwisu</Li>
              <Li>pisemnie na adres: ul. Orkana 16B, 34-700 Rabka-Zdrój</Li>
            </ul>
          </li>
          <li>
            Reklamacja powinna zawierać: imię i nazwisko, dane kontaktowe, opis
            problemu, numer RMA (jeśli dotyczy naprawy) lub numer zamówienia
            (jeśli dotyczy towaru), oraz oczekiwany sposób rozpatrzenia.
          </li>
          <li>
            Usługodawca rozpatruje reklamację w terminie 14 dni od jej
            otrzymania i informuje Klienta o wyniku drogą e-mailową lub
            pisemnie.
          </li>
          <li>
            Konsument może skorzystać z pozasądowych metod rozwiązywania
            sporów, w szczególności z platformy ODR Komisji Europejskiej
            dostępnej pod adresem{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </li>
        </Ol>
      </Section>

      {/* § 11 */}
      <Section title="§ 11. Sprzedaż akcesoriów i produktów">
        <Ol>
          <li>
            Serwis oferuje sprzedaż akcesoriów GSM, elektronicznych oraz
            produktów z linii Hammer Glass (szkła hartowane, folie ochronne).
          </li>
          <li>
            Zamówienie złożone za pośrednictwem serwisu internetowego uważa się
            za przyjęte do realizacji po potwierdzeniu przez Usługodawcę drogą
            e-mailową.
          </li>
          <li>
            Usługodawca zastrzega sobie prawo do odmowy realizacji zamówienia w
            przypadku braku towaru w magazynie. Klient zostanie niezwłocznie
            poinformowany, a ewentualna płatność w całości zwrócona.
          </li>
          <li>
            Konsumentowi przysługuje prawo odstąpienia od umowy sprzedaży
            zawartej na odległość (przez internet) w terminie{" "}
            <strong>14 dni</strong> bez podania przyczyny, zgodnie z ustawą o
            prawach konsumenta z dnia 30 maja 2014 r.
          </li>
          <li>
            Prawo odstąpienia nie przysługuje w przypadku towarów
            wyprodukowanych na specjalne zamówienie lub wyraźnie
            spersonalizowanych, a także towarów zapieczętowanych, których po
            otwarciu nie można zwrócić ze względu na ochronę zdrowia lub
            higienę, jeśli zostały otwarte po dostarczeniu.
          </li>
          <li>
            Aby skorzystać z prawa odstąpienia, Klient powinien poinformować
            Usługodawcę (e-mail, pisemnie) i odesłać towar w terminie 14 dni
            od złożenia oświadczenia. Koszty zwrotu ponosi Klient.
          </li>
        </Ol>
      </Section>

      {/* § 12 */}
      <Section title="§ 12. Konto Klienta">
        <Ol>
          <li>
            Klient może zarejestrować bezpłatne Konto w serwisie internetowym,
            umożliwiające śledzenie historii napraw, zarządzanie danymi i
            szybkie zgłaszanie zleceń.
          </li>
          <li>
            Konto zakładane jest po podaniu: imienia, nazwiska, adresu e-mail,
            numeru telefonu i hasła. Rejestracja możliwa jest również przez
            konto Google (OAuth).
          </li>
          <li>
            Klient zobowiązany jest do zachowania w poufności danych logowania
            i niezwłocznego poinformowania Usługodawcy o nieautoryzowanym
            dostępie do konta.
          </li>
          <li>
            Usługodawca może zablokować lub usunąć konto Klienta w przypadku
            naruszenia Regulaminu lub podania nieprawdziwych danych.
          </li>
          <li>
            Klient może w każdym czasie usunąć swoje konto, wysyłając stosowną
            prośbę na adres{" "}
            <a
              href="mailto:sklep@pro-kom.eu"
              className="text-primary hover:underline"
            >
              sklep@pro-kom.eu
            </a>
            . Usunięcie konta nie wpływa na przechowywanie danych wymaganych
            przez przepisy prawa (np. dokumentacja napraw, dane podatkowe).
          </li>
        </Ol>
      </Section>

      {/* § 13 */}
      <Section title="§ 13. Odpowiedzialność Usługodawcy">
        <Ol>
          <li>
            Usługodawca ponosi odpowiedzialność za szkody wyrządzone Klientowi
            w związku z nienależytym wykonaniem usługi na zasadach ogólnych
            Kodeksu cywilnego.
          </li>
          <li>
            Usługodawca nie ponosi odpowiedzialności za:
            <ul className="mt-1 space-y-1">
              <Li>
                utratę danych przechowywanych na urządzeniu – Klient
                zobowiązany jest do wykonania kopii zapasowej przed oddaniem
                sprzętu
              </Li>
              <Li>
                uszkodzenia ujawnione w trakcie naprawy, wynikające z
                wcześniejszych awarii lub ingerencji w urządzenie przez osoby
                trzecie
              </Li>
              <Li>
                wadliwe działanie urządzenia wynikające z oprogramowania lub
                ustawień Klienta, niezwiązane z zakresem naprawy
              </Li>
              <Li>
                szkody powstałe wskutek działania siły wyższej
              </Li>
            </ul>
          </li>
          <li>
            Odpowiedzialność Usługodawcy wobec Klientów niebędących
            Konsumentami ograniczona jest do wartości urządzenia przyjętego do
            naprawy, jednak nie więcej niż do wartości zlecenia.
          </li>
        </Ol>
      </Section>

      {/* § 14 */}
      <Section title="§ 14. Ochrona danych osobowych">
        <p>
          Zasady przetwarzania danych osobowych przez Usługodawcę określa
          Polityka prywatności dostępna pod adresem{" "}
          <a
            href="/polityka-prywatnosci"
            className="text-primary hover:underline"
          >
            pro-kom.eu/polityka-prywatnosci
          </a>
          . Składając zlecenie lub rejestrując Konto, Klient potwierdza, że
          zapoznał się z Polityką prywatności i akceptuje jej warunki.
        </p>
      </Section>

      {/* § 15 */}
      <Section title="§ 15. Postanowienia końcowe">
        <Ol>
          <li>
            Regulamin wchodzi w życie z dniem 25 kwietnia 2026 r. i obowiązuje
            do czasu jego zmiany lub odwołania.
          </li>
          <li>
            Usługodawca zastrzega sobie prawo do zmiany Regulaminu. Zmiany
            wchodzą w życie po upływie 14 dni od ich opublikowania w serwisie
            internetowym. Klientów posiadających Konto Usługodawca informuje o
            zmianach drogą e-mailową.
          </li>
          <li>
            W sprawach nieuregulowanych niniejszym Regulaminem stosuje się
            przepisy powszechnie obowiązującego prawa polskiego, w szczególności
            Kodeksu cywilnego, ustawy o prawach konsumenta oraz ustawy o
            świadczeniu usług drogą elektroniczną.
          </li>
          <li>
            Spory wynikłe z realizacji Regulaminu strony będą starały się
            rozwiązać polubownie. W razie braku porozumienia spory podlegają
            rozstrzygnięciu przez sąd powszechny właściwy dla siedziby
            Usługodawcy, z zastrzeżeniem bezwzględnie obowiązujących przepisów
            dotyczących właściwości sądu w sprawach z udziałem Konsumentów.
          </li>
          <li>
            Aktualny Regulamin dostępny jest zawsze pod adresem{" "}
            <strong>pro-kom.eu/regulamin</strong> oraz w siedzibie Usługodawcy.
          </li>
        </Ol>
      </Section>

      <div className="mt-12 border-t border-gray-100 pt-6 text-xs text-gray-400">
        Data ostatniej aktualizacji: 25 kwietnia 2026 r.
      </div>
    </div>
  );
}
