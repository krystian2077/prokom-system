# Katalog Apple i Samsung (PRO-KOM Tech) — dane

Runda 18.11 v2 (`docs/zadania/runda-1811-tech-marki.md`), sesja T-R2a. Sprzedaż jako **katalog z listą zapytania**: bez cen, bez koszyka i płatności (decyzja 18.11 zmienia decyzję z 14.11).

## Gdzie są dane
- `frontend/content/katalog/apple.json`, `samsung.json` — modele (kolory, wersje, 10–14 parametrów, zawartość opakowania, „W skrócie”, 3 akapity opisu, FAQ, „Pasuje do”, tagi doboru, zdjęcia ze źródłem, źródła z datą).
- `rodziny.json` (działy salonów + „dla kogo”), `akcesoria.json` („Pasuje do”), `dobor.json` („Dobierz w 3 pytaniach”).
- Typy i reguły: `frontend/lib/tech/catalog/` (`types.ts`, `validate.ts` — bez biblioteki schematów, `index.ts`, `silhouette.ts`). Test: `catalog.test.ts`.
- Zdjęcia: `frontend/public/tech/katalog/<model>/<kolor>.webp` (720 px, WebP). **Zgoda Krystiana 18.11.2026 na zdjęcia od producentów**; każde zdjęcie ma w danych adres źródła, datę i zgodę. Gdy zdjęcia brak — sylwetka SVG w kolorze wariantu.

## Skąd fakty (stan 18.11.2026)
apple.com/pl i samsung.com/pl (strony danych technicznych i sklepu), czytane spokojnie (≥ 2 s między stronami). Parametry to fakty producenta; zdania (opisy, FAQ, „dla kogo”) są nasze. Słowa „autoryzowany/certyfikowany” i ceny blokuje test.

## Aktualizacja (np. premiera)
1. Zebrać fakty do `frontend/tmp/r1/specs-*.json` i teksty do `copy-*.json` (format jak w skrypcie).
2. Dopisać model do tabeli redakcyjnej w `frontend/scripts/tech/katalog-zloz.mjs` (rodzina, kolejność, „Nowość”, „Pasuje do”).
3. `node scripts/tech/katalog-zloz.mjs <katalog-tmp> --download`, potem `npm run test`.

## Zakres (48 modeli)
- **Apple (29):** iPhone 18 Pro, 18 Pro Max, Duo, Air, 17, 17e, 16; iPad Pro 11″/13″ (M5), iPad Air 11″/13″ (M4), iPad (A16), iPad mini (A20 Pro); MacBook Neo, MacBook Air 13″/15″ (M5), MacBook Pro 14″/16″, MacBook Pro PROLED XDR; iMac 24″, Mac mini, Mac Studio; Apple Watch Series 12, Ultra 4, SE 3; AirPods 5, AirPods 5 z etui bezprzewodowym, AirPods Pro 3, AirPods Max 2.
- **Samsung (19):** Galaxy S26, S26+, S26 Ultra, S26 FE; Z Fold8 Ultra, Z Fold8, Z Flip8; A17 (LTE), A27 5G, A37 5G, A57 5G; Tab S12 Ultra, Tab S12+; Buds4 Pro, Buds4; Watch9, Watch Ultra2, Watch8 Classic, Watch8.
- Spoza listy z §0 dodane, bo producent je sprzedaje w Polsce (rekomendacja, zgoda Krystiana „akceptuj swoje rekomendacje”): iPhone Duo, Air, 17e, 16, MacBook Neo, MacBook Pro PROLED XDR, Galaxy Z.

## Nie ma w danych (nie potwierdzone u producenta 18.11)
iPhone 18 (zwykły), iPhone 17 Pro/Pro Max (zastąpione przez 18 Pro), Galaxy A17 5G (jest tylko LTE), Galaxy Tab S12 (bez „+”), Tab FE/A, Galaxy Buds FE.

## Do sprawdzenia / TODO(krystian)
- Strony A17, A27, A37, A57 i S26 FE pokazywały 18.11 „Produkt niedostępny” — modele są w ofercie, możliwy chwilowy brak.
- Brakujące u producenta wartości (pominięte, nie zgadywane): moc ładowania S26/S26+, nazwy procesorów A17/A37/A57, waga i bateria Buds4 Pro; zawartość opakowania A17, A27, Watch8.
- AirPods 5 / 5 z etui / Pro 3: producent nie nazywa koloru — w danych „Biały”.
- MacBook Pro 14″/16″: wersje to najniższe konfiguracje każdego czipu (producent podaje zakresy).
- Zdjęcia iPhone 18 Pro Max = zdjęcia 18 Pro (brak osobnych u producenta); kolor zdjęć dopasowany po nazwie pliku — warto przejrzeć karty w przeglądarce.
- Usługa „Przeniesienie danych” w `akcesoria.json` — do potwierdzenia (dziś nie pokazujemy jej treści).
