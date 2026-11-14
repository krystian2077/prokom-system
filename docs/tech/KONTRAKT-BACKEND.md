# Kontrakt frontendu publicznego z backendem (stan kodu: commit ffdcc5f, 04.10.2026)

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
    "phone": "…",             // wymagane, ≤ 20, walidacja w backendzie (validate_phone)
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

### 1.2 Odpowiedź 201/200
`{ "repair_number": "…", "message": "…", "tracking_url": "…" /* opcjonalne */ }` → ekran sukcesu: numer zgłoszenia (kopiuj), link „Sprawdź status” (`/track?ref=<repair_number>`), 3 kroki „co dalej” z prototypu.

### 1.3 Błędy
400 z DRF: `{ "client": { "phone": ["…"] } }`, `{ "device": ["Podaj nazwę modelu…"] }`, `{ "brand_name": "…" }`, `{ "delivery": "…" }`. Mapuj klucze na pola formularza i przewijaj do pierwszego błędu. Komunikaty backendu pokazuj dosłownie (są po polsku). Kształtów nie zgaduj: test kontraktu ma fixtures dla każdego z tych błędów.

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
- Skutki A, które akceptujemy: brak filtra po punkcie w panelu, a status naprawy pokazuje adres z backendu (Rabka) także dla zgłoszeń z Zakopanego. Frontend nie ma skąd wiedzieć, który to punkt, więc nie zgadujemy.
- **Wariant B (później, poza tą przebudową):** pole `service_point` w backendzie. Osobna decyzja Krystiana i szefa.

## 3. Status naprawy — `GET /api/v1/repairs/track/?ref=<numer>&phone_last4=<4 cyfry>`
Limit: **60 na godzinę** (`public_track`). Backend sam obcina telefon do 4 ostatnich cyfr. Brak `ref` albo niepełne 4 cyfry → 400 „Podaj numer zgłoszenia (ref) i ostatnie 4 cyfry numeru telefonu.” Złe dane → odpowiedź błędu z backendu (pokaż komunikat, bez zdradzania, czy numer istnieje).
- `/track?ref=…` wypełnia numer z adresu (zostaje jak dziś).
- Oś etapów (z `services/public_tracking.py`): **Przyjęte → Diagnoza → Wycena → Naprawa → Gotowe do odbioru**. Pola `stage_index`, `is_interrupted` (Anulowane, Naprawa Nieopłacalna, Porzucone) i `is_finished`. Przerwanie = oś zatrzymana na etapie, na czerwono, z etykietą statusu.
- Etykiety statusu dla klienta (z backendu, pokazuj dosłownie): Zgłoszenie przyjęte, W Diagnostyce, Diagnoza Ukończona, Wycena Wysłana, Oczekiwanie na Części, W naprawie, Naprawa Zakończona, Gotowe Do Odbioru, Wysłane, Odebrane, Anulowane, Naprawa Nieopłacalna.
- Pola odpowiedzi: `repair_number`, `status`, `device{name,brand,category}`, `problem_description`, daty `created_at`, `accepted_at`, `estimated_completion_date`, `ready_for_pickup_at`, `picked_up_at`, `completed_at`, `estimated_duration`, `delivery_method`, `return_method`, `cost{estimated,final,currency}`, `history[]`, `service{name,address,phone,email,hours,website}`.
- Puste pola = wiersz się nie pokazuje (żadnych „—” ani „brak”). Koszt tylko, gdy backend go zwraca.
- Blok „Twój serwis” pokazuje dane z `service` w odpowiedzi, a nie z `prokom.ts`.

## 4. Formularz kontaktowy — `POST /api/v1/communications/inquiry/`
Limit: **20 na godzinę** (`public_inquiry`). Bez uwierzytelnienia.
- Pola: `first_name`, `last_name`, `phone`, `email`, `interest`, `message`.
- **Wymagane przez backend: `email` i `message`.** Telefon jest opcjonalny. Makieta Kontaktu pokazuje „Telefon *” i e-mail opcjonalny, ale **kontrakt wygrywa**: e-mail wymagany, telefon zalecany (podpowiedź „żebyśmy mogli oddzwonić”).
- `interest` = temat i punkt w jednym tekście, np. `Pytanie o naprawę · punkt: Zakopane` (tematy z wzorca: Pytanie o naprawę, Folia Hammer Glass, Reklamacja, Inna sprawa).
- Odpowiedź 200 `{ "detail": "Wiadomosc zostala wyslana." }` → ekran sukcesu z wzorca. 400 → komunikat. 500 → „Nie udało się wysłać. Zadzwoń: …”.
- **Znane ograniczenie backendu (nie poprawiamy tutaj):** mail wysyła się z `fail_silently=True`, więc 200 wraca także wtedy, gdy SMTP zawiedzie, a temat maila brzmi „Nowe zapytanie z oferty”. Do listy zmian backendu na później (`docs/tech/WYJATKI.md` → „Backlog backendu”).

## 5. Pozostałe endpointy używane przez stronę publiczną (bez zmian w logice)
- `POST /api/v1/repairs/claim/`, `request-claim-code/`, `confirm-claim-by-code/` — strona `/claim-repair` (przypisanie naprawy do konta). Zmieniamy tylko wygląd.
- `GET /api/v1/clients/me/`, `GET /api/v1/repairs/my-summary/` — dane zalogowanego klienta (np. skrót w powłoce, jeśli jest dziś). Bez zmian.
- Logowanie Google (`@react-oauth/google`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) — bez zmian.

## 6. Test kontraktu (obowiązkowy od TD3)
- `frontend/lib/tech/contract.ts`: typy żądań i odpowiedzi z §1–§4 + funkcje budujące żądanie z danych formularza (`buildSubmitPayload`, `buildInquiryPayload`).
- `tests/tech/contract.test.ts`: budowa żądania dla każdej kategorii, kurier z adresem i bez, punkt Zakopane w `additional_notes`, brak `parcel_locker` w ofercie, `accessory_*` puste, wymagane pola. Mapowanie każdego błędu z §1.3 na pole formularza.
- e2e na lokalnym backendzie (Docker, baza testowa): wysłanie zgłoszenia → `repair_number` → `/track` z tym numerem i 4 cyframi pokazuje „Przyjęte”. Bez lokalnego backendu e2e z przechwyconymi odpowiedziami (fixtures z prawdziwych odpowiedzi, zapisane w `tests/tech/fixtures/`).
