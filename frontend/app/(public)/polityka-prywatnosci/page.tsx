export const metadata = {
  title: "Polityka prywatności | PRO-KOM Serwis",
  description:
    "Polityka prywatności i przetwarzania danych osobowych PRO-KOM Serwis – informacje o administratorze, celach przetwarzania, prawach użytkownika (RODO).",
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

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">
        Polityka prywatności
      </h1>
      <p className="mt-2 text-sm text-prokom-gray">
        Wersja obowiązująca od: <strong>25 kwietnia 2026 r.</strong>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-prokom-gray">
        Niniejsza Polityka prywatności opisuje, w jaki sposób PRO-KOM Serwis
        zbiera, przetwarza i chroni dane osobowe Użytkowników korzystających z
        serwisu internetowego dostępnego pod adresem{" "}
        <strong>pro-kom.eu</strong> oraz usług świadczonych przez firmę.
        Dokument sporządzono zgodnie z Rozporządzeniem Parlamentu Europejskiego
        i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) oraz polską
        ustawą o ochronie danych osobowych.
      </p>

      {/* 1 */}
      <Section title="§ 1. Administrator danych osobowych">
        <p>
          Administratorem Twoich danych osobowych jest przedsiębiorstwo działające
          pod firmą <strong>PRO-KOM Serwis</strong>, z siedzibą pod adresem:
        </p>
        <p className="rounded-lg bg-gray-50 p-4 font-medium text-prokom-black">
          ul. Orkana 16B, 34-700 Rabka-Zdrój
          <br />
          woj. małopolskie, Polska
          <br />
          tel.: <a href="tel:883200151" className="text-primary hover:underline">883 200 151</a>
          <br />
          e-mail:{" "}
          <a href="mailto:sklep@pro-kom.eu" className="text-primary hover:underline">
            sklep@pro-kom.eu
          </a>
        </p>
        <p>
          We wszelkich sprawach dotyczących ochrony danych osobowych możesz
          kontaktować się z nami za pośrednictwem powyższego adresu e-mail lub
          pisemnie na adres siedziby.
        </p>
      </Section>

      {/* 2 */}
      <Section title="§ 2. Jakie dane zbieramy i w jaki sposób">
        <p>
          W zależności od sposobu korzystania z serwisu przetwarzamy następujące
          kategorie danych:
        </p>
        <p className="font-semibold text-prokom-black">
          a) Dane podawane przez Ciebie dobrowolnie:
        </p>
        <ul className="space-y-1">
          <Li>imię i nazwisko</Li>
          <Li>adres e-mail</Li>
          <Li>numer telefonu</Li>
          <Li>adres zamieszkania / dostawy (ulica, miasto, kod pocztowy)</Li>
          <Li>
            dane firmowe (nazwa firmy, NIP, osoba kontaktowa) – wyłącznie w
            przypadku klientów biznesowych
          </Li>
          <Li>
            informacje o urządzeniu oddanym do naprawy: kategoria, marka, model,
            opis usterki, numer IMEI, numer seryjny
          </Li>
          <Li>hasło (przechowywane wyłącznie w formie zaszyfrowanej)</Li>
        </ul>
        <p className="font-semibold text-prokom-black">
          b) Dane zbierane automatycznie:
        </p>
        <ul className="space-y-1">
          <Li>adres IP urządzenia</Li>
          <Li>
            informacje o przeglądarce i systemie operacyjnym (User-Agent)
          </Li>
          <Li>data i godzina logowania, adres odwiedzanej strony</Li>
          <Li>pliki cookies (patrz § 8)</Li>
        </ul>
        <p className="font-semibold text-prokom-black">
          c) Dane z usług zewnętrznych:
        </p>
        <ul className="space-y-1">
          <Li>
            Jeśli logujesz się przez Google OAuth – imię, nazwisko i adres
            e-mail z konta Google
          </Li>
        </ul>
      </Section>

      {/* 3 */}
      <Section title="§ 3. Cele i podstawy prawne przetwarzania danych">
        <p>
          Przetwarzamy Twoje dane osobowe wyłącznie wtedy, gdy istnieje ku temu
          właściwa podstawa prawna:
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-prokom-black">
                  Cel przetwarzania
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-prokom-black">
                  Podstawa prawna (RODO)
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Realizacja usługi naprawy sprzętu elektronicznego",
                  "Art. 6 ust. 1 lit. b – niezbędność do wykonania umowy",
                ],
                [
                  "Obsługa konta klienta w serwisie",
                  "Art. 6 ust. 1 lit. b – wykonanie umowy o świadczenie usług drogą elektroniczną",
                ],
                [
                  "Sprzedaż akcesoriów (sklep)",
                  "Art. 6 ust. 1 lit. b – wykonanie umowy sprzedaży",
                ],
                [
                  "Wystawianie dokumentów sprzedaży (rachunki, faktury)",
                  "Art. 6 ust. 1 lit. c – obowiązek prawny (przepisy podatkowe)",
                ],
                [
                  "Dochodzenie i obrona roszczeń",
                  "Art. 6 ust. 1 lit. f – prawnie uzasadniony interes administratora",
                ],
                [
                  "Marketing bezpośredni własnych usług (newsletter, SMS) – tylko za zgodą",
                  "Art. 6 ust. 1 lit. a – zgoda",
                ],
                [
                  "Bezpieczeństwo systemu – logi logowań, analiza IP",
                  "Art. 6 ust. 1 lit. f – prawnie uzasadniony interes administratora",
                ],
                [
                  "Weryfikacja adresu e-mail",
                  "Art. 6 ust. 1 lit. b – wykonanie umowy / środki przedumowne",
                ],
              ].map(([cel, podstawa]) => (
                <tr key={cel} className="even:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2">{cel}</td>
                  <td className="border border-gray-200 px-3 py-2">
                    {podstawa}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4 */}
      <Section title="§ 4. Okres przechowywania danych">
        <p>
          Przechowujemy dane osobowe przez okres niezbędny do realizacji celów,
          dla których zostały zebrane:
        </p>
        <ul className="space-y-1">
          <Li>
            <strong>Dane konta klienta:</strong> przez czas trwania konta; po
            jego usunięciu – do 3 lat (przedawnienie roszczeń), chyba że przepisy
            nakazują dłuższy okres.
          </Li>
          <Li>
            <strong>Dane zlecenia naprawy:</strong> przez 5 lat od zakończenia
            naprawy (gwarancja + dokumentacja podatkowa).
          </Li>
          <Li>
            <strong>Dokumenty księgowe (faktury, rachunki):</strong> 5 lat od
            końca roku podatkowego, w którym wystawiono dokument.
          </Li>
          <Li>
            <strong>Logi bezpieczeństwa (IP, logowania):</strong> do 12 miesięcy.
          </Li>
          <Li>
            <strong>Dane marketingowe (za zgodą):</strong> do czasu cofnięcia
            zgody.
          </Li>
        </ul>
      </Section>

      {/* 5 */}
      <Section title="§ 5. Odbiorcy danych">
        <p>
          Twoje dane możemy przekazywać wyłącznie zaufanym podmiotom, które
          zapewniają odpowiedni poziom ochrony danych:
        </p>
        <ul className="space-y-1">
          <Li>
            <strong>Dostawcy infrastruktury IT:</strong> Render (hosting
            serwera i bazy danych) – świadczący usługi na podstawie umowy
            powierzenia danych.
          </Li>
          <Li>
            <strong>Google LLC:</strong> w przypadku logowania przez Google
            OAuth (dane przetwarzane zgodnie z polityką prywatności Google).
          </Li>
          <Li>
            <strong>Firmy kurierskie / spedycyjne:</strong> w zakresie niezbędnym
            do odbioru lub dostarczenia urządzenia.
          </Li>
          <Li>
            <strong>Biuro rachunkowe / księgowe:</strong> w zakresie dokumentacji
            finansowej.
          </Li>
          <Li>
            <strong>Organy publiczne:</strong> jeśli obowiązek przekazania
            wynika z przepisów prawa (np. organy podatkowe, sądy).
          </Li>
        </ul>
        <p>
          Nie sprzedajemy ani nie udostępniamy danych osobowych podmiotom
          trzecim w celach marketingowych bez Twojej wyraźnej zgody.
        </p>
      </Section>

      {/* 6 */}
      <Section title="§ 6. Twoje prawa">
        <p>
          Na podstawie RODO przysługują Ci następujące prawa w odniesieniu do
          swoich danych osobowych:
        </p>
        <ul className="space-y-1.5">
          <Li>
            <strong>Prawo dostępu</strong> – możesz zażądać kopii swoich
            danych, które przetwarzamy (art. 15 RODO).
          </Li>
          <Li>
            <strong>Prawo sprostowania</strong> – możesz żądać poprawienia
            nieprawidłowych lub uzupełnienia niekompletnych danych (art. 16
            RODO).
          </Li>
          <Li>
            <strong>Prawo do usunięcia</strong> („prawo do bycia zapomnianym")
            – możesz żądać usunięcia danych, gdy nie są już niezbędne do celów,
            dla których zostały zebrane (art. 17 RODO).
          </Li>
          <Li>
            <strong>Prawo do ograniczenia przetwarzania</strong> – możesz
            żądać wstrzymania przetwarzania w określonych przypadkach (art. 18
            RODO).
          </Li>
          <Li>
            <strong>Prawo do przenoszenia danych</strong> – możesz otrzymać
            swoje dane w ustrukturyzowanym, powszechnie używanym formacie (art.
            20 RODO).
          </Li>
          <Li>
            <strong>Prawo sprzeciwu</strong> – możesz sprzeciwić się
            przetwarzaniu opartemu na prawnie uzasadnionym interesie administratora
            (art. 21 RODO).
          </Li>
          <Li>
            <strong>Prawo cofnięcia zgody</strong> – jeśli przetwarzanie odbywa
            się na podstawie zgody, możesz ją cofnąć w dowolnym momencie bez
            wpływu na zgodność z prawem przetwarzania przed cofnięciem.
          </Li>
        </ul>
        <p>
          Aby skorzystać z powyższych praw, skontaktuj się z nami pod adresem{" "}
          <a href="mailto:sklep@pro-kom.eu" className="text-primary hover:underline">
            sklep@pro-kom.eu
          </a>
          . Odpowiemy bez zbędnej zwłoki, nie później niż w ciągu 30 dni.
        </p>
        <p>
          Masz również prawo wniesienia skargi do organu nadzorczego –{" "}
          <strong>Prezesa Urzędu Ochrony Danych Osobowych</strong> (PUODO), ul.
          Stawki 2, 00-193 Warszawa, <a href="https://uodo.gov.pl" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">uodo.gov.pl</a>.
        </p>
      </Section>

      {/* 7 */}
      <Section title="§ 7. Bezpieczeństwo danych">
        <p>
          Stosujemy odpowiednie środki techniczne i organizacyjne w celu
          ochrony Twoich danych osobowych przed nieuprawnionym dostępem,
          utratą lub zniszczeniem:
        </p>
        <ul className="space-y-1">
          <Li>szyfrowanie połączeń (protokół HTTPS / TLS)</Li>
          <Li>
            przechowywanie haseł wyłącznie w postaci zaszyfrowanej
            (jednokierunkowe hashowanie)
          </Li>
          <Li>
            weryfikacja adresu e-mail przy rejestracji (kod OTP ważny 15 min)
          </Li>
          <Li>
            rejestrowanie zdarzeń logowania wraz z adresem IP w celu wykrywania
            nieautoryzowanego dostępu
          </Li>
          <Li>
            ograniczony dostęp do danych – tylko upoważniony personel
          </Li>
          <Li>
            regularne kopie zapasowe bazy danych
          </Li>
        </ul>
      </Section>

      {/* 8 */}
      <Section title="§ 8. Pliki cookies">
        <p>
          Serwis pro-kom.eu używa plików cookies (ciasteczek) – małych plików
          tekstowych zapisywanych na Twoim urządzeniu.
        </p>
        <p className="font-semibold text-prokom-black">
          Rodzaje używanych cookies:
        </p>
        <ul className="space-y-1">
          <Li>
            <strong>Niezbędne (sesyjne):</strong> utrzymanie sesji
            zalogowanego użytkownika, token autoryzacyjny – wymagane do
            działania serwisu.
          </Li>
          <Li>
            <strong>Funkcjonalne:</strong> zapamiętywanie preferencji
            użytkownika (np. motyw, język).
          </Li>
          <Li>
            <strong>Analityczne:</strong> statystyki odwiedzin w celu
            doskonalenia serwisu – zbierane wyłącznie po wyrażeniu zgody.
          </Li>
        </ul>
        <p>
          Możesz zablokować lub usunąć pliki cookies w ustawieniach
          przeglądarki. Wyłączenie cookies niezbędnych może uniemożliwić
          korzystanie z niektórych funkcji serwisu (np. logowanie).
        </p>
      </Section>

      {/* 9 */}
      <Section title="§ 9. Przekazywanie danych poza EOG">
        <p>
          Co do zasady nie przekazujemy Twoich danych poza Europejski Obszar
          Gospodarczy (EOG). W przypadku korzystania z usług Google (Google
          OAuth, Google Maps) dane mogą być przetwarzane przez Google LLC z
          siedzibą w USA. Google stosuje mechanizmy zapewniające odpowiedni
          poziom ochrony danych zgodny z wymogami RODO (w tym standardowe
          klauzule umowne zatwierdzane przez Komisję Europejską).
        </p>
      </Section>

      {/* 10 */}
      <Section title="§ 10. Dane dzieci">
        <p>
          Serwis nie jest skierowany do osób poniżej 16. roku życia. Nie
          zbieramy świadomie danych osobowych dzieci. Jeśli uważasz, że dane
          dziecka poniżej 16 lat zostały nam przekazane bez zgody rodzica lub
          opiekuna prawnego, prosimy o niezwłoczny kontakt na adres{" "}
          <a href="mailto:sklep@pro-kom.eu" className="text-primary hover:underline">
            sklep@pro-kom.eu
          </a>
          , a dane zostaną usunięte.
        </p>
      </Section>

      {/* 11 */}
      <Section title="§ 11. Zmiany Polityki prywatności">
        <p>
          Zastrzegamy sobie prawo do zmiany niniejszej Polityki prywatności w
          każdym czasie. O istotnych zmianach poinformujemy Cię przez e-mail
          (jeśli posiadamy Twój adres) lub przez stosowny komunikat w serwisie.
          Aktualną wersję Polityki zawsze znajdziesz pod adresem{" "}
          <strong>pro-kom.eu/polityka-prywatnosci</strong>.
        </p>
      </Section>

      <div className="mt-12 border-t border-gray-100 pt-6 text-xs text-gray-400">
        Data ostatniej aktualizacji: 25 kwietnia 2026 r.
      </div>
    </div>
  );
}
