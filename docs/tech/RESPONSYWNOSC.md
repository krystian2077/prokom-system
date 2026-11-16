# PRO-KOM Tech — urządzenia: telefon jak aplikacja, tablet, laptop, PC

Wymaganie Krystiana (14.11.2026): na telefonie strona ma działać i wyglądać jak nowoczesna, dopracowana aplikacja, a na tablecie, laptopie i PC ma być tak samo dopracowana. To nie jest „zmniejszony desktop”. Każdy zakres ma swój układ. Ten plik jest częścią Definition of Done każdej sesji z UI.

## 1. Zakresy i szerokości testowe
| Zakres | Szerokości testowe | Punkty przełamania (CSS) |
|---|---|---|
| Telefon | 360 · 390 · 414 · 430 | `< 768` |
| Tablet | 768 · 820 · 1024 (pion i poziom) | `768–1179` |
| Laptop | 1280 · 1366 · 1440 | `1180–1679` |
| PC / duże ekrany | 1680 · 1920 · 2560 | `≥ 1680` |
Szyna boczna sekcji: tylko `≥ 1424` (od tej szerokości mieści się w marginesie obok treści; przegląd wizualny 15.11) i tylko na stronach z co najmniej 3 sekcjami `data-rail`. Kontener treści: max 1280 px (do 1360 przy `≥ 1680`), tła sekcji na pełną szerokość.

## 2. Telefon jak aplikacja (wzorzec: `docs/design/tech/zrzuty/telefon-6-ekranow.webp`)
- **Kapsuła u góry:** znak PRO-KOM TECH, przycisk „Zgłoś” i szukaj. Chowa się przy przewijaniu w dół i wraca przy przewijaniu w górę. `position: sticky` z `env(safe-area-inset-top)`.
- **Dolny pasek kart (zawsze widoczny):** Start · Naprawy · **Zgłoś** (środek, okrągły, wyróżniony `--acc`) · Punkty · Menu. Aktywna karta zaznaczona. Wysokość ≥ 64 px + `env(safe-area-inset-bottom)`. Treść ma dolny margines o wysokości paska, więc pasek niczego nie zasłania.
- **Arkusze od dołu** zamiast nowych stron i rozwijanych menu: Menu (pozycje, karta z telefonem i statusem otwarcia, linie PRO-KOM, motyw Jasny / Ciemny / Auto), wybór punktu, mega menu Naprawy, filtr miejscowości. Uchwyt do przeciągnięcia, zamykanie gestem w dół, przyciskiem i Esc, blokada przewijania tła, pułapka fokusu.
- **Kreator „Co się zepsuło?”:** krok po kroku na pełnym ekranie (urządzenie → usterka na zdjęciu albo z listy → punkt / kurier → podsumowanie). Pasek postępu u góry, „Dalej” przyklejony na dole w zasięgu kciuka. Zdjęcie urządzenia z punktami do dotknięcia (cel ≥ 44 px).
- **Formularz zgłoszenia:** jeden krok na ekran (5 kroków), przyklejone „Dalej” / „Wyślij”, właściwe klawiatury (`inputmode="tel"`, `type="email"`, `autocomplete`), klawiatura nie zasłania aktywnego pola (`scrollIntoView` z marginesem), błędy przy polach.
- **Listy:** naprawy, marki, miejscowości i karty punktów przewijane poziomo ze snapem (`scroll-snap-type: x mandatory`), margines 16 px i widoczny fragment następnej karty. Tabele (np. naprawy na stronie lokalnej) jako karty.
- **Status naprawy:** oś pionowa, duże etykiety, przycisk „Zadzwoń do serwisu” przyklejony na dole.
- **Telefon do serwisu** na każdej stronie w maksymalnie 2 dotknięciach (Menu → karta telefonu), na stronach punktów i statusu od razu.
- **Cele dotykowe:** przyciski ≥ 44 × 44 px, odstęp ≥ 8 px. Zero przewijania w bok przy 360 px (test).
- **Ruch:** przejścia arkuszy 200–280 ms, `transform`/`opacity`, wyłączane przy `prefers-reduced-motion`.

## 3. Tablet
- Siatki 2-kolumnowe (karty, kategorie, punkty). Hero: tekst nad zdjęciami albo obok, gdy szerokość ≥ 1024.
- Kreator: zdjęcie urządzenia obok wyborów (≥ 820), pod nimi przy pionie 768.
- Nawigacja: w pionie dolny pasek jak na telefonie, w poziomie (≥ 1024) pełna kapsuła z menu. Bez szyny bocznej.
- Formularz zgłoszenia: kroki jako karta na środku (max 720 px), podsumowanie pod spodem.

## 4. Laptop i PC
- Układ z zrzutów 1440 (`docs/design/tech/zrzuty/1440-*.webp`). Przy 1280 i 1366 te same proporcje, mniejsze odstępy (`clamp()`), bez łamania nagłówków w dziwnych miejscach.
- Poniżej 1424 bez szyny bocznej. Kapsuła z pełnym menu i mega menu (Naprawy, Punkty serwisowe) z mostkiem pod kursor i opóźnieniem zamykania 200–300 ms.
- ≥ 1680: treść w kontenerze, hero z maksymalną wysokością (nie rozciąga się na cały ekran 2560), obrazy z `srcset` w wysokiej rozdzielczości.

## 5. Wspólne dla wszystkich
- Typografia płynna przez `clamp()`. H1 hero: 40 px na telefonie, 68 px na 1440 (wzorzec).
- Tryb jasny i ciemny według systemu z przełącznikiem (SPEC §3). Oba motywy sprawdzane na każdej szerokości.
- Obrazy AVIF/WebP z wymiarami, bez skakania układu. Lighthouse telefon ≥ 90 we wszystkich kategoriach, LCP < 2,5 s, CLS < 0,1, axe bez błędów krytycznych.
- Dostępność: kolejność fokusu zgodna z wyglądem, widoczny fokus, etykiety pól, `aria-current` w menu i na pasku kart, kontrast ≥ 4,5:1.

## 6. Narzędzia (powstają w TD1, używane w każdej sesji)
- `scripts/tech/zrzuty.mjs [origin] [--widths=360,390,768,1024,1440,1920] [--themes=light,dark] [--pages=…]` — Playwright, przewijanie jak użytkownik (bez wymuszania widoczności), pełne zrzuty → `tmp/zrzuty/index.html` (miniatury).
- `scripts/tech/porownaj.mjs` — zrzut 1440 strony obok wzorca z `docs/design/tech/zrzuty/` (sekcja po sekcji, suwak przed/po).
- `tests/tech/responsywnosc.spec.ts` — na każdej szerokości z §1: brak poziomego przewijania, dolny pasek nie zasłania ostatniego przycisku, cele dotykowe ≥ 44 px (telefon), elementy z `data-reveal` mają opacity 1 po przewinięciu.
