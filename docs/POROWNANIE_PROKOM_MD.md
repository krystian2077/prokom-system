# PRO-KOM — Porównanie projektu z wymaganiami z pliku prokom.md

Data: 2025-03-07  
Odniesienie: **prokom.md** (pełne podsumowanie systemu, sekcje ok. 13782–15230 oraz wcześniejsze fragmenty)

---

## Odpowiedzi na kluczowe funkcjonalności (prokom.md)

| Funkcjonalność | W projekcie? | Gdzie / jak |
|----------------|--------------|-------------|
| **Przyjęcie do naprawy stacjonarnie** | ✅ Tak | **Pełne przyjęcie:** `POST /api/v1/repairs/` z `source=in_person` (client, device, problem_description, delivery_method, return_method, …). **Szybkie przyjęcie:** `POST /api/v1/repairs/quick-accept/` — minimalne dane (klient + kategoria urządzenia + opis), naprawa z `is_incomplete=True`, do uzupełnienia później. |
| **Inteligentny system dopierania do sprzedaży** | ✅ Tak | `GET /api/v1/repairs/<id>/recommended-products/` — zwraca akcesoria i Hammer Glass dopasowane do kategorii urządzenia naprawy (`compatible_with_category`). Staff widzi rekomendacje przy konkretnej naprawie. |
| **Szybkie akcje** | ✅ Tak | Zmiana statusu: `POST /repairs/<id>/change-status/`. Notatka: `POST /repairs/<id>/notes/`. Zdjęcie: `POST /repairs/<id>/images/`. Przypisanie: `POST /repairs/<id>/assign/`. Odpowiedź na wycenę (klient): `POST /repairs/<id>/quote-respond/`. Dashboard staff z kubełkami (moje nowe, pilne, do kontaktu, w toku, zaległe, gotowe do odbioru). |
| **Globalne wyszukiwanie napraw** | ✅ Tak | `GET /api/v1/search/?q=<fraza>` — jeden endpoint, wyniki w trzech sekcjach: **repairs** (numer, klient, urządzenie, opis), **clients** (imię, nazwisko, email, telefon, numer klienta), **devices** (model, serial, IMEI, klient). Tylko staff/admin. Min. 2 znaki w `q`. |

Żadna z tych funkcjonalności nie jest pomijana; wszystkie są zaimplementowane w backendzie zgodnie z opisem projektu.

---

## 1. Cel dokumentu

Weryfikacja zgodności aktualnego projektu (backend Django) z wymaganiami opisanymi w **prokom.md**.  
Dokument uzupełnia **POROWNANIE_ERD_Z_PROJEKTEM.md** (porównanie z diagramem ERD).

**Legenda:** ✅ zaimplementowane | ⚠️ częściowo | ❌ brak

---

## 2. Warstwy systemu (prokom.md §2)

| Warstwa | W prokom.md | W projekcie | Uwagi |
|---------|--------------|-------------|--------|
| **A. Strona publiczna** | Strona główna, o firmie, kontakt, FAQ, blog, Hammer Glass, akcesoria, podstrony usług, formularz zgłoszenia, opinie, CTA | ❌ | Brak frontendu; backend ma API do zgłoszeń (`POST /repairs/submit/`), brands, device models. |
| **B. System zgłoszeń** | Online, stacjonarne, telefon, WhatsApp, Facebook, reklamacje, gwarancyjne, standardowe, z umówionym terminem | ✅ | Źródła: `RepairSource`. **Reklamacja:** `parent_repair` + `repair_type=complaint`. `RepairVisitSchedule` = umówiony termin. `is_warranty` = gwarancyjna. |
| **C. Panel klienta** | Zgłoszenia, urządzenia, statusy, wiadomości, wycena, timeline, ankieta, akcesoria | ✅ | API: `/repairs/`, my-summary, timeline, quote-respond, satisfaction survey. Brak frontendu. |
| **D. Panel staff** | Przyjęcia, szybkie przyjęcie, naprawy z terminem, kolejki, remindery, checklisty, wyceny, części, komunikacja, dokumenty, kalendarz, wyszukiwanie, sugestie HG/akcesoria | ✅ | Dashboard, quick-accept, assign, change-status, notes, images, wyceny, checklisty, dokumenty PDF/QR, **smart reminders** (Celery), **widoki specjalne** (requires-action, unclaimed-devices, requires-decision). Rekomendacje: recommended-products (accessories + bundles + HG). Brak frontendu. |
| **E. Panel admina** | Wszystkie naprawy, finanse, zysk, pracownicy, health score, SLA, audit log, statystyki, raporty | ✅ | Admin Django, KPI, **health-overview**, **GET /analytics/staff/<id>/manager-view/** (tylko admin), **snapshots** pracowników, AuditLogEntry. Progi SLA w kodzie (health_score); opcjonalnie model SlaRule w DB. |

---

## 3. Role i konta (§3)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Admin — pełny dostęp | ✅ | User z `role=admin`, IsStaffOrAdmin. |
| Staff — przyjęcia, statusy, komunikacja, wyceny, checklisty, własny dashboard | ✅ | Staff dashboard, przypisanie, timeline. |
| Klient — zgłoszenie jako gość, konto, śledzenie, akceptacja/odrzucenie wyceny, ankieta | ✅ | Public submit, auth, quote-respond, satisfaction survey. |
| Konta admin: krystian, szef; staff: kuba, rafal, pawel | ⚠️ | Zależne od seed/fixtures — model obsługuje role. |

---

## 4. Pracownicy i przypisanie (§4, §5)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Pracownicy: specjalizacje (telefony/tablety→Kuba, laptopy/drukarki→Rafał itd.) | ✅ | `StaffProfile`: specialization (StaffSpecialization), calendar_color, display_name, is_visible_in_rankings. |
| Automatyczne przypisanie według kategorii urządzenia | ✅ | `suggest_assignment(repair)`; używane przy tworzeniu naprawy i quick-accept. `GET /repairs/<id>/suggest-assignment/`. |
| Ręczna zmiana przypisanego serwisanta, przekazanie zgłoszenia | ✅ | `RepairAssignment`, API assign, historia w RepairAssignment. |
| Audit log przy zmianie przypisania | ✅ | AuditLogEntry (ogólny); RepairAssignment trzyma historię. |

---

## 5. Źródła zgłoszeń (§6)

| Źródło w prokom.md | Stan | Uwagi |
|--------------------|------|--------|
| online, stacjonarne, telefoniczne, WhatsApp, Facebook, inne | ✅ | `RepairSource`: online, in_person, phone, email, facebook, whatsapp, other. |

---

## 6. Typy spraw (§7)

| Typ w prokom.md | Stan | Uwagi |
|-----------------|------|--------|
| standardowa | ✅ | Domyślna (brak flag). |
| gwarancyjna | ✅ | `RepairRequest.is_warranty`. |
| reklamacja | ✅ | `RepairRequest.parent_repair` (FK do self), `repair_type` (standard, warranty, complaint, scheduled). |
| naprawa z umówionym terminem | ✅ | `RepairVisitSchedule` (visit_date, visit_time, no_show, confirmed_at). |

---

## 7. Formularz zgłoszenia online (§8)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Kategorie: telefon, tablet, smartwatch, laptop, PC, drukarka, konsola, odzyskiwanie, inny | ✅ | `DeviceCategory` w enum + API device models. |
| Dynamiczne pola wg kategorii (telefon/tablet/smartwatch: model wymagany; laptop, drukarka: opcjonalnie) | ✅ | `PublicSubmitDeviceSerializer`: walidacja dla phone/tablet/smartwatch (model_name lub device_model_id). |
| Pytanie Hammer Glass (tak/nie/zapytaj/gratis) | ✅ | Payload `hammer_glass_interest` (yes/no/ask_later/free_with_quote); zapis w `RepairRequest.hammer_glass_interest`. |
| Sekcja akcesoriów („dobierz do telefonu”, lista produktów) | ✅ | Payload `accessory_interest` (lista product_id), `accessory_choose_for_me`; zapis w `RepairAccessoryInterest` (source=client). |
| Dane kontaktowe + preferowany kontakt + sposób dostawy/zwrotu | ✅ | Client, delivery_method, return_method, preferred_contact (w client/device). |

---

## 8. Dostarczenie i zwrot (§9)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Sposoby: osobiście, kurier, paczkomat | ✅ | `DeliveryMethod`, `ReturnMethod`: in_person, courier, parcel_locker. |
| Adres paczkomatu PRO-KOM (Zakopiańska 10f) | ✅ | `PARCEL_LOCKER_ADDRESS` w settings; `GET /api/v1/config/parcel-locker-address/`. |
| Ręczny proces MVP: staff potwierdza odbiór paczki, zdjęcie, komentarz, kto odebrał, numer zgłoszenia w przesyłce | ✅ | Pola na `RepairRequest`: package_received_at, package_received_by, package_ok, request_number_attached, package_notes, package_photo. `POST /repairs/<id>/mark-package-received/`. |

---

## 9. Przyjęcie stacjonarne (§10)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Szybkie przyjęcie / pełne przyjęcie | ✅ | `POST /repairs/quick-accept/` — minimalne dane, naprawa z `is_incomplete=True`. Pełne: `POST /repairs/` z client, device, source=in_person. |
| Naprawa z umówionym terminem (etapy: przygotowanie, dostawa części, umówienie wizyty, przyjęcie, realizacja) | ✅ | `RepairVisitSchedule`; statusy i flow realizowane przez status naprawy. |

---

## 10. Dokumenty i etykiety (§11, §12, §13)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Dokument przyjęcia A4 (dane firmy, numer, QR, klient, urządzenie, opis, stan, regulamin, zaliczka, podpisy) | ✅ | Endpoint PDF: `/documents/repair/<id>/acceptance-protocol/`. |
| Dokument wydania A4 | ✅ | Endpoint PDF wydania. |
| Skrócony dokument dla naprawy z umówionym terminem | ✅ | `GET /api/v1/documents/repair/<id>/acceptance-protocol-short/` (tylko gdy jest RepairVisitSchedule). |
| Etykieta (QR, numer, data, opis, kategoria) | ✅ | Etykiety/QR w documents. |
| Kod QR na etykietach i dokumentach — skan otwiera zgłoszenie | ✅ | Generowanie QR; skan = link (frontend musi obsłużyć routing). |

---

## 11. Statusy (§14, §15, §16, §17)

| Obszar | W prokom.md | W projekcie | Uwagi |
|--------|--------------|-------------|--------|
| Statusy publiczne klienta | przyjęte, oczekujemy na dostarczenie, urządzenie dotarło, w diagnozie, wycena gotowa, oczekuje na decyzję, w trakcie naprawy, gotowe do odbioru, zakończone, anulowane | ✅ | `RepairStatus` + `get_public_repair_status()` w common.utils. |
| Statusy wewnętrzne staff | nowe, oczekuje na dostarczenie, do diagnozy, diagnoza zakończona, do wyceny, czeka na odpowiedź, zaakceptowane—do zamówienia, czeka na części, do naprawy, testowanie, do wydania, wydane, reklamacja, zamknięte, anulowane | ✅ | `RepairStatus` + `InternalRepairStatus` (uzupełnienie). |
| Status płatności | nieopłacone, zaliczka, opłacone w całości | ✅ | `PaymentStatus` na RepairRequest. |
| Priorytety | niski, standardowy, pilny | ✅ | `RepairPriority`: low, normal, high, urgent, same_day. |

---

## 12. Panel klienta (§18)

| Moduł | Stan | Uwagi |
|-------|------|--------|
| Moje zgłoszenia, urządzenia, profil | ✅ | API: repairs (filtr klienta), devices, clients/me. |
| Szczóły naprawy, wiadomości, wycena, timeline | ✅ | Timeline, messages (CommunicationLog), quote, quote-respond. |
| Ankieta satysfakcji | ✅ | POST submit-satisfaction-survey. |
| Komunikat „Możesz dobrać akcesoria podczas wizyty” | ⚠️ | Logika/frontend — backend nie zwraca dedykowanego komunikatu. |
| Akceptacja/odrzucenie wyceny | ✅ | quote-respond. |

---

## 13. Panel staff (§19)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Dashboard (moje nowe, pilne, dziś do kontaktu, w toku, zaległe, gotowe do odbioru) | ✅ | GET /repairs/dashboard/ z kubełkami. |
| Kolejki: moje sprawy, pilne, zaległe, gotowe do odbioru, nieodebrane, wymaga decyzji | ✅ | `GET /repairs/special-views/requires-action/`, `unclaimed-devices/?days_min=3`, `requires-decision/`. Dashboard z kubełkami. |
| Globalne wyszukiwanie (numer, imię, nazwisko, telefon, email, model, IMEI, seryjny) | ✅ | `GET /api/v1/search/?q=` — repairs, clients, devices (min. 2 znaki). |
| Kalendarz, remindery, etykiety, wydruki | ✅ | CalendarEvent, TimeslotBlock. **Smart reminders** (Celery): reminder_no_quote, reminder_unclaimed, reminder_scheduled_visit, reminder_quick_accept_incomplete. PDF/QR. |
| Checklisty | ✅ | ChecklistTemplate, ChecklistRun, RunItem. |

---

## 14. Panel admina (§20)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| KPI: nowe, w toku, gotowe do odbioru, przychód, zysk, nieodebrane | ✅ | Analytics KPI, summary. |
| Alerty, health score, SLA, zaniedbania | ✅ | `get_repair_health_score(repair)` (green/yellow/red); `GET /analytics/health-overview/`. Progi w kodzie (SLA opcjonalnie w DB). |
| Wykresy, tabele, raporty, statystyki pracowników/źródeł/kategorii/akcesoriów | ✅ | repairs-report, staff-ranking, KPI, summary. |
| Zakładka pracownicy: widok menedżerski, statystyki, health, ostatnie logowanie, lista napraw, ostatnie działania | ✅ | `GET /api/v1/analytics/staff/<user_id>/manager-view/` (tylko admin). Snapshots: `GET .../staff/<id>/snapshots/?from=&to=`. LoginActivity. |

---

## 15. Health score, SLA, remindery (§21, §22)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Health score zgłoszenia (zielony/żółty/czerwony) | ✅ | `repairs/services/health_score.py`; w API naprawy: health_score, health_issues. |
| Progi SLA (np. brak wyceny 24h, gotowe 3 dni) | ✅ | W logice health_score i reminderów (stałe w kodzie); opcjonalnie model SlaRule w DB. |
| Smart reminders (brak wyceny, nieodebrane, umówiona naprawa, szybkie przyjęcie nieuzupełnione) | ✅ | Task `repairs.send_smart_reminders` (Celery beat); ReminderLog; eventy NotificationRule. |
| Widoki: „Co dziś wymaga reakcji”, „Urządzenia nieodebrane”, „Wymaga decyzji” | ✅ | `GET /repairs/special-views/requires-action/`, `unclaimed-devices/`, `requires-decision/`. |

---

## 16. Timeline i audit log (§24, §25)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Timeline dla staff (zmiany statusów, wiadomości, wydruki, skany QR) | ✅ | GET timeline z RepairStatusHistory, notes, CommunicationLog. |
| Uproszczony timeline dla klienta | ✅ | Ten sam endpoint z filtrowaniem treści. |
| Audit log: kto zmienił status, wycenę, koszt, wydruk, część, przypisanie, termin, akcje admina | ✅ | `AuditLogEntry`: repair, actor, action, target_type, target_id, change_payload. |

---

## 17. Komunikacja premium (§26)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Biblioteka szablonów (status, wycena, opóźnienie, kontakt, gotowe do odbioru) | ✅ | `MessageTemplate`, seed_message_templates. |
| E-mail vs panel — pełniejsza vs krótsza wersja; podpis pracownika; numer telefonu | ⚠️ | Szablony mają body; brak wariantów per kanał (MESSAGE_TEMPLATE_VARIANT). Podpisy — treść w szablonie. |
| Scenariusze: wycena wysłana, gotowe do odbioru, remindery | ✅ | `NotificationRule` (event_name); task `send_notification_for_repair_event` wywoływany przy quote_sent, ready_for_pickup i z reminderów. |
| Zapisywanie w historii naprawy i timeline | ✅ | CommunicationLog powiązany z naprawą. |

---

## 18. Ankieta satysfakcji i Google (§27)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Ocena 1–5, czy zadowolony, komentarz | ✅ | `SatisfactionSurvey`: rating, would_recommend, comment. |
| Jeśli 4–5 → prośba o opinię Google; 1–3 → tylko wewnętrzny feedback | ⚠️ | Backend zapisuje ankietę; przekierowanie do Google po stronie frontu. |

---

## 19. Finanse (§28)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Części (nazwa, dostawca, koszt, oryginał/zamiennik, status zamówiona/dostarczona/zamontowana) | ✅ | Part, PartUsage, Supplier; inventory. |
| Robocizna (jedna pozycja, koszt, opis) | ✅ | QuoteItem item_type=labour, LabourType. |
| Wycena końcowa, zysk | ✅ | cost-summary, revenue, profit. |
| Historia wersji wyceny (kto, kiedy, co zmienił) | ✅ | `QuoteVersion`, `QuoteDecision`; `POST .../send/` tworzy snapshot; `GET /pricing/quotes/<id>/versions/`; quote-respond zapisuje decyzję. |

---

## 20. Hammer Glass (§29)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Sekcja na homepage, osobna podstrona SEO (/hammer-glass-rabka-zdroj) | ❌ | Brak frontendu. |
| Produkty, ceny „od”, rodziny (Clear/Matt/Privacy), tabela porównawcza, FAQ, wideo | ⚠️ | Modele HammerGlassProduct, film_type; brak tabeli HAMMER_GLASS_FEATURE. Ceny w modelu. |
| W systemie: pytanie przy zgłoszeniu, rekomendacja typu, zadanie montażu, status oferty | ✅ / ⚠️ | RepairHammerGlassOffer; brak obowiązkowego pytania w public submit. |

---

## 21. Akcesoria GSM (§30)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Sekcja homepage, podstrona /akcesoria-gsm-rabka-zdroj | ❌ | Brak frontendu. |
| Baza produktów (ładowarki, kable, powerbanki, uchwyty, stacje) | ✅ | AccessoryProduct, AccessoryCategory. |
| Pakiety (ochronny, Hammer, ładowania) | ✅ | `AccessoryBundle`, `AccessoryBundleItem`; `GET /api/v1/accessories/bundles/`. W recommended-products zwracane też bundles. |
| Inteligentne rekomendacje (kategoria urządzenia, produkty + pakiety) | ✅ | `GET /api/v1/repairs/<id>/recommended-products/` — accessories, bundles, hammer_glass (compatible_with_category). |
| Zainteresowanie „dobierz do telefonu”, RepairAccessoryInterest | ✅ | RepairAccessoryInterest; sugestie przy naprawie. |

---

## 22. Kalendarz (§31)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Staff: mój kalendarz, moje terminy, opóźnienia, zgłoszenia bez aktualizacji | ✅ | Modele CalendarEvent, TimeslotBlock; API do implementacji w frontie. |
| Admin: pełny kalendarz, filtr po pracowniku, kolory | ✅ | Modele obsługują employee, event_type. |

---

## 23. Checklisty (§32)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Szablony wg kategorii (telefon: diagnoza, wycena, kontakt, część, naprawa, testy, odbiór; laptop: podobnie) | ✅ | ChecklistTemplate (device_category_code), ChecklistTemplateItem, ChecklistRun, ChecklistRunItem. |

---

## 24. Dodatkowe elementy premium (§33)

| Element | Stan | Uwagi |
|---------|------|--------|
| Status „niekompletne zgłoszenie” | ✅ | `RepairRequest.is_incomplete`; quick-accept ustawia is_incomplete=True. |
| Notatki: typ (wewnętrzna/system/kontakt), przypięta | ✅ | `RepairNote.note_type`, `pinned`; API POST notes, GET timeline. |
| „Ostatnie działania” na naprawie | ✅ | Timeline. |
| Widok „Wymaga decyzji” | ✅ | `GET /repairs/special-views/requires-decision/`. |
| Dark mode / light mode | ❌ | Frontend. |
| Backup systemu | ✅ | Task `compliance.run_backup` (database/media/full); BackupLog; beat. |
| Blokada kalendarza | ✅ | CalendarEvent.is_locked; TimeslotBlock. |
| Badge same day | ✅ | RepairPriority.SAME_DAY, is_same_day. |
| Reminder o terminie | ✅ | Smart reminders (Celery), m.in. reminder_scheduled_visit. |

---

## 25. Sitemap i routing (§34)

| Obszar | Stan | Uwagi |
|--------|------|--------|
| Publiczne (/ , /o-firmie, /kontakt, /faq, /blog, /hammer-glass-..., /akcesoria-..., /serwis-..., /zglos-naprawe, polityka, regulamin) | ❌ | Brak frontendu. |
| Konto klienta (/konto/logowanie, /panel, /panel/zgloszenia/...) | ⚠️ | API gotowe; frontend brak. |
| Staff (/staff, /staff/dashboard, /staff/przyjecie, /staff/kalendarz, ...) | ⚠️ | API gotowe; frontend brak. |
| Admin (/admin/dashboard, /admin/raporty, /admin/pracownicy, ...) | ⚠️ | Django Admin + analytics API; brak dedykowanego frontu admina. |

---

## 26. Stack technologiczny (§35)

| Składnik w prokom.md | Stan | Uwagi |
|----------------------|------|--------|
| Django, DRF, PostgreSQL, CORS, django-filter, drf-spectacular, Pillow, environ, WhiteNoise, Gunicorn | ✅ | requirements.txt, config. |
| reportlab, qrcode[pil] | ✅ | documents. |
| celery, redis, django-celery-beat | ✅ | config/celery.py, CELERY_* w settings; backup, reminders, snapshoty. |
| python-dateutil, drf-nested-routers, django-imagekit, django-admin-interface | ⚠️ | Część w requirements; admin-interface opcjonalnie. |
| Frontend: Next.js, TypeScript, Tailwind | ❌ | Brak katalogu frontend. |

---

## 27. Roadmapa implementacji (§36)

| Krok w prokom.md | Stan |
|------------------|------|
| 1. Fundament techniczny | ✅ |
| 2. Konta i role | ✅ |
| 3. Modele urządzeń i zgłoszeń | ✅ |
| 4. Formularze | ✅ (API submit) |
| 5. Komunikacja i timeline | ✅ (modele, timeline; brak automatyki wysyłki) |
| 6. Wyceny i finanse | ✅ |
| 7. Checklisty i remindery | ✅ checklisty; ❌ remindery (Celery) |
| 8. Dokumenty i etykiety | ✅ |
| 9. Panele klient/staff/admin | ✅ API; ❌ frontend |
| 10. Content i SEO | ❌ frontend |
| 11. Hammer Glass i akcesoria | ✅ modele i API; ❌ frontend, pakiety |
| 12. Dopracowanie UX, dark/light mode, backup | ⚠️ BackupLog; brak zadań backup, brak frontu |

---

## 28. RODO i compliance (prokom.md — rozproszone)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Wnioski RODO (eksport, usunięcie danych) | ✅ | GdprRequest, endpointy eksportu/usunięcia. |
| Rejestr wniosków, polityki/regulamin (wersje) | ✅ | TermsVersion, ClientConsent.terms_version. |
| Backup (rejestr, zadania) | ⚠️ | BackupLog; brak Celery/backup. |

---

## 29. Podsumowanie — co brać pod uwagę przy dalszej pracy

- **Porównuj projekt zarówno z ERD (`POROWNANIE_ERD_Z_PROJEKTEM.md`), jak i z wymaganiami biznesowymi z `prokom.md` (niniejszy plik).**
- **Etapy implementacji brakującego backendu:** patrz **[ETAPY_IMPLEMENTACJI_BACKEND.md](ETAPY_IMPLEMENTACJI_BACKEND.md)** — rozpisane 9 etapów z zadaniami i zależnościami.
- **Backend (prokom.md) — zaimplementowane:** Celery/Redis, reklamacja (parent_repair, repair_type), odbiór paczki, szybkie przyjęcie, StaffProfile (specjalizacje), auto-przypisanie, health score, widoki specjalne, QuoteVersion/QuoteDecision, NotificationRule + automatyka wysyłki, smart reminders, AccessoryBundle, adres paczkomatu, EmployeeStatsSnapshot, manager-view, globalne wyszukiwanie, dokument skrócony A4, RepairNote (note_type, pinned), formularz publiczny (hammer_glass_interest, accessory_interest, walidacja wg kategorii), backup. Wszystkie 9 etapów z ETAPY_IMPLEMENTACJI_BACKEND.md ukończone.
- **Brakuje (poza backendem):** frontendu (Next.js), ewentualnie model SlaRule w DB (progi SLA dziś w kodzie), warianty szablonów per kanał (MessageTemplateVariant — opcjonalnie).
- **Dobrze pokryte:** warstwy API, role, zgłoszenia (w tym reklamacje, z umówionym terminem), panel klienta/staff/admin (API), dokumenty, timeline, audit log, finanse, Hammer Glass i akcesoria (w tym pakiety), kalendarz, checklisty, RODO, KPI/raporty, komunikacja (szablony + reguły + taski).

---

*Dokument utworzony na podstawie prokom.md (sekcje podsumowania systemu) oraz przeglądu backendu Django.*
