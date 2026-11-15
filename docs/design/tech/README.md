# Wzorzec wyglądu PRO-KOM Tech (wizualizacja z 14.11.2026)

Wizualizacja powstała w czacie projektu. Claude Code jej nie widzi, więc wszystko, co z niej potrzebne, jest tutaj.

## Co jest w folderze
| Ścieżka | Co to jest | Jak używać |
|---|---|---|
| `prototyp/index.html` | **Działający prototyp całej strony** (jeden plik HTML + `img/` + `font/`). Wszystkie teksty, kolory, odstępy, układy i zachowania kreatora są w nim dosłownie. | Otwórz w Chrome z dysku (`file://…/index.html`). Podstrony: `#glowna`, `#punkty-serwisowe`, `#serwis-telefonow-zakopane`, `#hammer-glass`, `#zglos-naprawe`, `#status-naprawy`, `#o-firmie`, `#kontakt`, `#telefon-wzorzec`. Przełącznik motywu: księżyc w nagłówku. |
| `zrzuty/1440-<strona>-<jasny\|ciemny>.webp` | Zrzuty pełnych stron 1440 px w obu motywach. | Porównanie „wzorzec obok kodu” sekcja po sekcji (`scripts/tech/porownaj.mjs` z TD1). |
| `zrzuty/telefon-6-ekranow.webp` | Telefon jak aplikacja: Start (jasny i ciemny), Zgłoszenie, Status, Punkty, Menu. | Wzorzec powłoki telefonu (kapsuła, dolny pasek, arkusz Menu). |

## Jak czytać prototyp, żeby przenieść go 1:1
- Szablony stron są w `<script>` w obiekcie `T` (`T.Main.tpl`, `T.Main.css`, `T.Main.cls` itd.). `tpl` to HTML z `{{zmiennymi}}`, `<sc-for>` (pętla) i `<sc-if>` (warunek). `css` to style strony. `cls` to klasa z `renderVals()`, czyli dane i logika (np. kreator: `DV`, `spots`, `probs`).
- Wspólne komponenty: `T.Naglowek`, `T.Stopka`, `T.Logo`, `T.Mapa`. Strony wstawiają je przez `<dc-import name="…">`.
- Tokeny motywu są w zmiennych CSS na `.wrap` i `.wrap.dk` (`--bg --bg2 --card --bd --bd2 --ink --ink2 --acc --onacc --acct --soft --softbd --okbg --ok --capbg --capbd --logo-acc --sh`). W kodzie stają się tokenami `.tech` (SPEC §4).
- Wymiary w prototypie są stałe (układ 1440). W kodzie układ jest płynny według `docs/tech/RESPONSYWNOSC.md`. Prototyp pokazuje **wygląd i treść**, a nie sposób składania na mniejszych ekranach.

## Co jest zaślepką (nie przenosić jako prawdy)
- Przerywane ramki `[ADRES]`, `[GODZINY]`, `[TELEFON]`, `[OCENA]`, `[LICZBA OPINII]` i `[OPIS DOJAZDU…]` to dane, których jeszcze nie ma. W kodzie są polami konfiguracji z flagą `published` (SPEC §5). Na produkcji ramek nie ma: albo jest prawdziwa wartość, albo element się nie renderuje.
- Wymiana wyświetlacza „często ok. 1 h” i liczby (2004, 2 punkty, 9 rodzajów folii, „4 + 1”) to fakty do potwierdzenia przy odbiorze (lista w SPEC §10).
- Zdjęcia urządzeń w `img/` (telefony, tablet, laptop, komputer, drukarka, konsola) i kadry z filmu plotera Hammer Glass są **poglądowe**. Przed produkcją każde zdjęcie musi mieć potwierdzone źródło i prawo do użycia (materiały producenta albo własne zdjęcia), a źródło trzeba zapisać w `frontend/config/media-zrodla.json` (TD2). **15.11.2026:** Krystian potwierdził prawa do wszystkich zdjęć i filmu z listy — wszystkie wpisy mają `confirmed: true`.
- E-mail `kontakt@prokomserwis.pl` na planszach jest docelowy. W kodzie e-mail pochodzi wyłącznie z `prokom.ts`, a do czasu potwierdzenia MX jest tam `sklep@pro-kom.eu` (SPEC §5).
- Ekran telefonu „Start” ma starszy tekst hero. **Desktop wygrywa:** H1 „Serwis telefonów i komputerów”, pod nim „Rabka-Zdrój · Zakopane”.
- Prototyp ma w kreatorze i kafelkach kilka ekranów, które w kodzie łączą się z API. Pola i nazwy są w `docs/tech/KONTRAKT-BACKEND.md` i to on wygrywa przy różnicy.

## Czego wzorzec nie ma (do zrobienia według zasad, nie według zrzutu)
- Plansz tabletu (768–1024) i pełnego telefonu każdej podstrony. Powłoka telefonu jest na `telefon-6-ekranow.webp`, resztę składamy według `RESPONSYWNOSC.md`. Jeśli przed TD2 dojdą plansze mobilne z czatu, trafią tu jako `zrzuty/390-*.webp` i wtedy wygrywają.
- Podstron: usługi, `serwis-laptopow` i pozostałe `serwis-*`, odzyskiwanie danych, FAQ, blog i wpis, strony prawne, 404. Robimy je na szablonach i komponentach z wzorca (TD5).
