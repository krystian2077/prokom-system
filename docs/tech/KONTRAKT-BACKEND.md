# Kontrakt frontendu publicznego z backendem (stan kodu: commit ffdcc5f, 04.10.2026; zweryfikowany z kodem i lokalnym backendem w T0, 14.11.2026)

**Ten plik wygrywa z wizualizacją.** Jeśli prototyp pokazuje pole, wartość albo zachowanie, którego backend nie obsługuje, robimy to, co obsługuje backend, i zgłaszamy różnicę w opisie PR. Backendu nie zmieniamy.
Weryfikacja przed TD3: sesja porównuje ten plik z kodem (`backend/apps/repairs/serializers/public_submit.py`, `backend/apps/repairs/views/track_views.py`, `backend/apps/repairs/services/public_tracking.py`, `backend/apps/communications/views/inquiry_views.py`, `backend/apps/common/enums.py`). Różnica = zatrzymaj się i opisz, nie zgaduj.

Bazowy adres: `NEXT_PUBLIC_API_URL` + `/api/v1` (`frontend/lib/api.ts` → `API_V1`). Ta sama domena co strona: Nginx kieruje `/api/` do Django.

## 1. Zgłoszenie naprawy — `POST /api/v1/repairs/submit/`
Limit: **15 zgłoszeń na godzinę z jednego adresu** (`throttle_scope = public_submit`). Odpowiedź 429 → komunikat „Zbyt wiele zgłoszeń z tego urządzenia. Zadzwoń: …” (telefon z `prokom.ts`).

### 1.1 Żądanie
```jsonc
{
  "client": {
    "first_name": "…",        // wymagane, ≤ 100
    "last_name": "…",         // wymagane, ≤ 100
    "email": "…",             // wymagane, poprawny e-mail
    "phone": "…",             // wymagane, ≤ 20; validate_polish_phone: po usunięciu spacji, „-”, „+” i prefiksu 48 musi zostać dokładnie 9 cyfr
    "preferred_contact": "email", // email | phone | sms | panel; domyślnie email. Formularz oferuje: telefon, SMS, e-mail
    "street": "", "city": "", "postal_code": "", "country": "Polska" // opcjonalne
  },
  "device": {
    "category": "phone",      // wymagane: phone | tablet | smartwatch | laptop | desktop | printer | console | data_recovery | other
    "brand_name": "",         // WYMAGANE dla phone, tablet, smartwatch (albo brand_id)
    "model_name": "",         // WYMAGANE ZAWSZE, dla każdej kategorii (albo device_model_id) — walidacja na poziomie całego zgłoszenia
    "serial_number": "", "imei": "", // opcjonalne (imei ≤ 20)
    "problem_description": "…",      // wymagane
    "device_turns_on": true,          // true | false | null („nie wiem”)
    "visual_condition_description": "" // opcjonalne, ≤ 2000
  },
  "delivery_method": "in_person",  // in_person | courier  (parcel_locker istnieje w backendzie, ale go NIE oferujemy — decyzja 14.11)
  "return_method": "in_person",    // in_person | courier  (jw.)
  "delivery_street": "", "delivery_house_number": "", "delivery_city": "", "delivery_postal_code": "", "delivery_country": "Polska",
                                    // ulica i miasto WYMAGANE, gdy delivery_method ≠ in_person
  "hammer_glass_interest": "ask_later", // yes | no | ask_later | free_with_quote | null
  "accessory_interest": [],         // lista UUID AccessoryProduct — nie oferujemy (sklep usunięty) → zawsze pusta albo pomiń
  "accessory_choose_for_me": false, // nie oferujemy → false
  "accessory_wishlist": "",         // nie oferujemy → ""
  "requires_data_backup": false,
  "additional_notes": ""            // ≤ 2000, tu trafia punkt przyjęcia (§2)
}
```
Pola `brand_id` i `device_model_id` (UUID) istnieją. Nowy formularz ich nie używa, wpisuje tekst.

### 1.2 Odpowiedź 201 (tylko 201)
`{ "repair_number": "PROKOM/RMA/4/2026", "message": "…", "tracking_url": "/track?ref=PROKOM/RMA/4/2026" }` (fixture `submit-201-*`).
- Numer ma format `PROKOM/RMA/<n>/<rok>` i zawiera **ukośniki**: w adresie `/track?ref=` koduj go `encodeURIComponent`. Backend zwraca `tracking_url` niezakodowany.
- Zalogowany klient dostaje `tracking_url: "/client/naprawy"` i krótszy `message` (bez zdania o e-mailu).
- Zgłoszenie gościa wysyła klientowi e-mail z linkiem do śledzenia i przypisania (claim token ważny 7 dni).

Ekran sukcesu: numer zgłoszenia (kopiuj), link „Sprawdź status” (`/track?ref=<repair_number>`), 3 kroki „co dalej” z prototypu.

### 1.3 Błędy (sprawdzone na żywo, fixtures `submit-400-*`)
Wszystkie wartości to **listy** komunikatów. Kształty:

| Przypadek | Odpowiedź 400 |
|---|---|
| brak pól wymaganych | `{ "client": { "first_name": ["To pole jest wymagane."], … }, "device": { "category": […], "problem_description": […] } }` |
| zły telefon / e-mail | `{ "client": { "phone": ["Nieprawidłowy numer telefonu. Użyj formatu: 123456789 lub +48 123 456 789"] } }`, `{ "client": { "email": ["Podaj poprawny adres e-mail."] } }` |
| brak marki (phone/tablet/smartwatch) | `{ "device": { "brand_name": ["Dla telefonu/tabletu/smartwatcha podaj markę urządzenia."] } }` — **zagnieżdżone pod `device`** |
| brak modelu (phone/tablet/smartwatch) | `{ "device": { "model_name": ["Dla telefonu/tabletu/smartwatcha podaj nazwę modelu lub wybierz z listy."] } }` |
| brak modelu (inne kategorie) | `{ "device": ["Podaj nazwę modelu urządzenia lub wybierz model z listy."] }` — **lista bez nazwy pola**, przypnij do pola modelu |
| kurier bez ulicy lub miasta | `{ "delivery": ["Przy wysyłce kurierem/paczkomatem podaj adres dostawy (ulica i miasto)."] }` |
| zła wartość wyboru | `{ "device": { "category": ["\"drone\" nie jest poprawnym wyborem."] } }`, `{ "hammer_glass_interest": […] }` |
| wyjątek w serwisie zapisu | `{ "detail": "<tekst wyjątku>" }` |

Komunikat przy `delivery` wspomina paczkomat, którego nie oferujemy. W TD3 zdecydujemy, czy pokazujemy go dosłownie, czy podmieniamy tylko ten jeden tekst we froncie.

**Brak brokera (Redis) = żądanie wisi.** Po zapisie backend wywołuje `.delay()` Celery w `on_commit`. Bez Redisa odpowiedź nie przychodzi wcale, choć zgłoszenie jest już w bazie. Front potrzebuje timeoutu (np. 30 s) z komunikatem „Nie mamy potwierdzenia. Zadzwoń: …” i nie może automatycznie ponawiać wysyłki, bo powstałby duplikat.

Mapuj klucze na pola formularza i przewijaj do pierwszego błędu. Komunikaty backendu pokazuj dosłownie (są po polsku). Kształtów nie zgaduj: test kontraktu ma fixtures dla każdego z tych błędów.

### 1.4 Wejście z kreatora (tylko frontend)
`/zgloszenie?category=<kod>&usterka=<tekst>&punkt=rabka|zakopane&dostawa=punkt|kurier`
- `category` czyta dzisiejszy formularz i zostaje.
- `usterka` wypełnia `problem_description` (do edycji).
- `punkt` wypełnia wybór punktu (§2), `dostawa=kurier` ustawia `delivery_method = courier`.
- Nieznana wartość parametru = ignoruj (bez błędu).

### 1.5 Zalogowany klient
Jeśli w sesji jest token klienta (`frontend/lib/auth-storage.ts`), formularz wypełnia dane z `GET /api/v1/clients/me/` tak jak dziś. Logiki logowania nie zmieniamy.

## 2. Dwa punkty — ograniczenie backendu
Backend **nie ma pojęcia punktu ani oddziału**: brak pola w modelu i w serializerze, a blok `service` w śledzeniu zwraca jeden adres.
- **Wariant A (obowiązuje):** wybór „Rabka-Zdrój / Zakopane” (tylko punkty z `published: true`) → `delivery_method = in_person` i na początku `additional_notes` linia `Punkt przyjęcia: Zakopane` (albo `Rabka-Zdrój`), potem pusta linia i uwagi klienta. Pracownik widzi to w zgłoszeniu.
- **Odbiór w innym punkcie (decyzja szefa 14.11.2026: można oddać w jednym punkcie i odebrać w drugim):** formularz pyta o punkt odbioru tylko przy `return_method = in_person` i dwóch opublikowanych punktach (domyślnie = punkt przyjęcia). Gdy jest inny, druga linia `additional_notes` to `Punkt odbioru: Rabka-Zdrój` (albo `Zakopane`), dalej pusta linia i uwagi klienta. Backend dalej nie zna punktów (wariant B), więc to tylko informacja dla pracownika; limit `additional_notes` 2000 znaków liczy się razem z tymi liniami.
- Skutki A, które akceptujemy: brak filtra po punkcie w panelu, a status naprawy pokazuje adres z backendu (Rabka) także dla zgłoszeń z Zakopanego. Frontend nie ma skąd wiedzieć, który to punkt, więc nie zgadujemy.
- **Wariant B (później, poza tą przebudową):** pole `service_point` w backendzie. Osobna decyzja Krystiana i szefa.

## 3. Status naprawy — `GET /api/v1/repairs/track/?ref=<numer>&phone_last4=<4 cyfry>`
Limit: **60 na godzinę** (`public_track`). Backend sam obcina telefon do 4 ostatnich cyfr. Brak `ref` albo niepełne 4 cyfry → 400 `{"detail": "Podaj numer zgłoszenia (ref) i ostatnie 4 cyfry numeru telefonu."}`. Nieznany numer **i** zły telefon → ta sama odpowiedź 404 `{"detail": "Nie znaleziono zgłoszenia lub nieprawidłowe dane."}` (backend nie zdradza, czy numer istnieje). Fixtures `track-*`.
- `/track?ref=…` wypełnia numer z adresu (zostaje jak dziś).
- Oś etapów (z `services/public_tracking.py`): **Przyjęte → Diagnoza → Wycena → Naprawa → Gotowe do odbioru**. Etapy przychodzą też w odpowiedzi (`stages: [{key, label}]`, klucze `received, diagnostics, quote, repair, done`), więc oś rysuj z `stages`. Pola `stage_index`, `is_interrupted` (statusy `cancelled`, `unrepairable`, `abandoned` **oraz `quote_rejected`** z etykietą „Anulowane”) i `is_finished` (`picked_up`, `delivered`, `shipped`). Przerwanie = oś zatrzymana na etapie, na czerwono, z etykietą statusu.
- Etykiety statusu dla klienta (z backendu, pokazuj dosłownie): Zgłoszenie przyjęte, W Diagnostyce, Diagnoza Ukończona, Wycena Wysłana, Oczekiwanie na Części, W naprawie, Naprawa Zakończona, Gotowe Do Odbioru, Wysłane, Odebrane, Anulowane, Naprawa Nieopłacalna, Porzucone przez klienta (oraz „Status nieznany” dla nieznanego kodu). Kilka kodów ma wspólną etykietę; historia przychodzi już zdeduplikowana po etykiecie.
- Pola odpowiedzi (fixture `track-200-received`): `repair_number`, `status` (etykieta), `status_code` (kod), `stage_index`, `stages[]`, `is_interrupted`, `is_finished`, `device{name,brand,category}`, `problem_description`, daty `created_at`, `accepted_at`, `estimated_completion_date`, `ready_for_pickup_at`, `picked_up_at`, `completed_at` (ISO 8601 z przesunięciem, UTC, albo `null`), `estimated_duration` (tekst albo `null`), `delivery_method`, `return_method`, `cost`, `history[{status, status_code, at}]`, `service{name,address,phone,email,hours,website}`.
- `device.category`, `delivery_method` i `return_method` to **etykiety po polsku** („Telefon”, „Osobiście w serwisie”, „Odbiór osobisty”), a nie kody.
- `cost` = `null` do wysłania wyceny. Potem `{estimated, final, currency: "PLN"}` z kwotami jako tekst (`"150.00"`) albo `null`.
- Puste pola = wiersz się nie pokazuje (żadnych „—” ani „brak”). Koszt tylko, gdy backend go zwraca.
- Blok „Twój serwis” pokazuje dane z `service` w odpowiedzi, a nie z `prokom.ts`.

## 4. Formularz kontaktowy — `POST /api/v1/communications/inquiry/`
Limit: **20 na godzinę** (`public_inquiry`). Bez uwierzytelnienia.
- Pola: `first_name`, `last_name`, `phone`, `email`, `interest`, `message`. Wszystkie to tekst bez walidacji formatu w backendzie, więc telefon i e-mail sprawdza front. `authentication_classes = []`: token klienta jest ignorowany.
- **Wymagane przez backend: `email` i `message`.** Telefon jest opcjonalny. Makieta Kontaktu pokazuje „Telefon *” i e-mail opcjonalny, ale **kontrakt wygrywa**: e-mail wymagany, telefon zalecany (podpowiedź „żebyśmy mogli oddzwonić”).
- `interest` = temat i punkt w jednym tekście, np. `Pytanie o naprawę · punkt: Zakopane` (tematy z wzorca: Pytanie o naprawę, Folia Hammer Glass, Reklamacja, Inna sprawa).
- Odpowiedź 200 `{ "detail": "Wiadomosc zostala wyslana." }` → ekran sukcesu z wzorca. 400 `{ "detail": "Pola e-mail i pytanie sa wymagane." }` (bez polskich znaków, więc pokazuj własny tekst). 500 `{ "detail": "Nie udalo sie wyslac…" }` → „Nie udało się wysłać. Zadzwoń: …”. Fixtures `inquiry-*`.
- Dziś jedyny działający formularz tego endpointu jest na `/oferta` (`OfertaContent.tsx`), a `/kontakt` ma tylko mailto. `/oferta` dostaje 301 dopiero po wdrożeniu `InquiryForm` (TD4).
- **Znane ograniczenie backendu (nie poprawiamy tutaj):** mail wysyła się z `fail_silently=True`, więc 200 wraca także wtedy, gdy SMTP zawiedzie, a temat maila brzmi „Nowe zapytanie z oferty”. Do listy zmian backendu na później (`docs/tech/WYJATKI.md` → „Backlog backendu”).

## 5. Pozostałe endpointy używane przez stronę publiczną (bez zmian w logice)
- `POST /api/v1/repairs/claim/`, `request-claim-code/`, `confirm-claim-by-code/` — strona `/claim-repair` (przypisanie naprawy do konta). Zmieniamy tylko wygląd. **Uwaga (T0):** `send_sms` w backendzie to atrapa (zwraca sukces, nic nie wysyła), więc ścieżka „kod SMS” (`request-claim-code/` → `confirm-claim-by-code/`) dziś nie dostarcza kodu. Działa przypisanie linkiem z e-maila (`claim/` z tokenem). W nowej skórce link z e-maila jest ścieżką główną, a SMS pokazujemy dopiero po podłączeniu SMSAPI.
- `GET /api/v1/clients/me/`, `GET /api/v1/repairs/my-summary/` — dane zalogowanego klienta (np. skrót w powłoce, jeśli jest dziś). Bez zmian.
- Logowanie Google (`@react-oauth/google`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) — bez zmian.

## 6. Test kontraktu (obowiązkowy od TD3)
- `frontend/lib/tech/contract.ts`: typy żądań i odpowiedzi z §1–§4 + funkcje budujące żądanie z danych formularza (`buildSubmitPayload`, `buildInquiryPayload`).
- `tests/tech/contract.test.ts`: budowa żądania dla każdej kategorii, kurier z adresem i bez, punkt Zakopane w `additional_notes`, brak `parcel_locker` w ofercie, `accessory_*` puste, wymagane pola. Mapowanie każdego błędu z §1.3 na pole formularza.
- e2e na lokalnym backendzie (Docker, baza testowa): wysłanie zgłoszenia → `repair_number` → `/track` z tym numerem i 4 cyframi pokazuje „Przyjęte”. Bez lokalnego backendu e2e z przechwyconymi odpowiedziami (fixtures z prawdziwych odpowiedzi, zapisane w T0 w `tests/tech/fixtures/` jako `{request, response:{status, body}}`).

## 7. Różnice wykryte w T0 (14.11.2026)
Poprawione powyżej: kształty błędów 400 (marka i model zagnieżdżone pod `device`, model dla innych kategorii jako lista bez nazwy pola, wartości zawsze jako listy, `detail` przy wyjątku), tylko 201, `tracking_url` dla zalogowanego, ukośniki w numerze, zawieszenie bez Redisa, 404 przy złych danych w `track`, dodatkowe pola `status_code`, `stages`, `history[].status_code`, `quote_rejected` jako przerwanie, etykiety zamiast kodów w `device.category`, `delivery_method` i `return_method`, kwoty jako tekst, `authentication_classes = []` i dokładne komunikaty w `inquiry`.
