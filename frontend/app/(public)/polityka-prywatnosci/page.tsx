import { company, line, telHref } from "@/config/prokom";
import { LegalDoc, Li, Section } from "@/components/tech/legal/LegalDoc";
import { pageMetadata } from "@/lib/tech/seo";

// Legal text from TD5 PR 2; facts updated on 15.11.2026 (Krystian's decision): domain and name from
// config/prokom.ts, no shop, Umami statistics, neutral hosting wording. Everything else word for word.
// TODO(krystian): after the VPS move on 29.11 name the hosting provider: webh.pl (Polska).
export const metadata = pageMetadata({
  title: "Polityka prywatności i pliki cookies",
  description: "Polityka prywatności PRO-KOM Tech: administrator danych, cele i podstawy przetwarzania, odbiorcy danych, Twoje prawa (RODO) i pliki cookies.",
  path: "/polityka-prywatnosci",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc title="Polityka prywatności" path="/polityka-prywatnosci" version="15 listopada 2026 r.">
      <p>
        Niniejsza Polityka prywatności opisuje, w jaki sposób {company.name}
        zbiera, przetwarza i chroni dane osobowe Użytkowników korzystających z
        serwisu internetowego {line.name} dostępnego pod adresem{" "}
        <strong>{line.domain}</strong> oraz usług świadczonych przez firmę.
        Dokument sporządzono zgodnie z Rozporządzeniem Parlamentu Europejskiego
        i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) oraz polską
        ustawą o ochronie danych osobowych.
      </p>

      {/* 1 */}
      <Section title="§ 1. Administrator danych osobowych">
        <p>
          Administratorem Twoich danych osobowych jest przedsiębiorstwo działające
          pod firmą <strong>{company.name}</strong> (NIP {company.nip}), z siedzibą pod adresem:
        </p>
        <p className="t-legal-doc__box">
          {company.hq.street}, {company.hq.postal} {company.hq.city}
          <br />
          woj. małopolskie, Polska
          <br />
          tel.: <a data-t-inline="" href={telHref(line.phone)}>{line.phoneDisplay}</a>
          <br />
          e-mail:{" "}
          <a data-t-inline="" href={`mailto:${line.email}`}>
            {line.email}
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
        <p>
          a) Dane podawane przez Ciebie dobrowolnie:
        </p>
        <ul>
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
        <p>
          b) Dane zbierane automatycznie:
        </p>
        <ul>
          <Li>adres IP urządzenia</Li>
          <Li>
            informacje o przeglądarce i systemie operacyjnym (User-Agent)
          </Li>
          <Li>data i godzina logowania, adres odwiedzanej strony</Li>
          <Li>pliki cookies (patrz § 8)</Li>
        </ul>
        <p>
          c) Dane z usług zewnętrznych:
        </p>
        <ul>
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
        <div>
          <table>
            <thead>
              <tr>
                <th>
                  Cel przetwarzania
                </th>
                <th>
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
                <tr key={cel}>
                  <td>{cel}</td>
                  <td>
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
        <ul>
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
        <ul>
          <Li>
            <strong>Dostawcy infrastruktury IT:</strong> zewnętrzny dostawca
            usług hostingowych z siedzibą w Unii Europejskiej / Europejskim
            Obszarze Gospodarczym (hosting serwera i bazy danych) – świadczący
            usługi na podstawie umowy powierzenia danych.
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
        <ul>
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
            <strong>Prawo do usunięcia</strong> („prawo do bycia zapomnianym”)
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
          <a data-t-inline="" href={`mailto:${line.email}`}>
            {line.email}
          </a>
          . Odpowiemy bez zbędnej zwłoki, nie później niż w ciągu 30 dni.
        </p>
        <p>
          Masz również prawo wniesienia skargi do organu nadzorczego –{" "}
          <strong>Prezesa Urzędu Ochrony Danych Osobowych</strong> (PUODO), ul.
          Stawki 2, 00-193 Warszawa, <a data-t-inline="" href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer">uodo.gov.pl</a>.
        </p>
      </Section>

      {/* 7 */}
      <Section title="§ 7. Bezpieczeństwo danych">
        <p>
          Stosujemy odpowiednie środki techniczne i organizacyjne w celu
          ochrony Twoich danych osobowych przed nieuprawnionym dostępem,
          utratą lub zniszczeniem:
        </p>
        <ul>
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
      <Section title="§ 8. Pliki cookies" id="cookies">
        <p>
          Serwis {line.domain} używa plików cookies (ciasteczek) – małych plików
          tekstowych zapisywanych na Twoim urządzeniu.
        </p>
        <p>
          Rodzaje używanych cookies:
        </p>
        <ul>
          <Li>
            <strong>Niezbędne (sesyjne):</strong> utrzymanie sesji
            zalogowanego użytkownika, token autoryzacyjny – wymagane do
            działania serwisu.
          </Li>
          <Li>
            <strong>Funkcjonalne:</strong> zapamiętywanie preferencji
            użytkownika (np. motyw, język).
          </Li>
        </ul>
        <p>
          <strong>Statystyki odwiedzin:</strong> korzystamy z narzędzia Umami,
          które nie używa plików cookies i nie zapisuje niczego na Twoim
          urządzeniu. Zbiera wyłącznie zagregowane, anonimowe dane o
          odwiedzinach (np. odwiedzane strony, rodzaj przeglądarki). Dane są
          przechowywane na serwerze PRO-KOM i nie trafiają do podmiotów
          trzecich.
        </p>
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
          <a data-t-inline="" href={`mailto:${line.email}`}>
            {line.email}
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
          <strong>{line.domain}/polityka-prywatnosci</strong>.
        </p>
      </Section>

      <p className="t-legal-doc__updated">Data ostatniej aktualizacji: 15 listopada 2026 r.</p>
    </LegalDoc>
  );
}
