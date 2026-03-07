# PRO-KOM — Porównanie projektu z wymaganiami z pliku prokom.md

Data: 2025-03-07  
Odniesienie: **prokom.md** (pełne podsumowanie systemu, sekcje ok. 13782–15230 oraz wcześniejsze fragmenty)

## 1. Cel dokumentu

Weryfikacja zgodności aktualnego projektu (backend Django) z wymaganiami opisanymi w **prokom.md**.  
Dokument uzupełnia **POROWNANIE_ERD_Z_PROJEKTEM.md** (porównanie z diagramem ERD).

**Legenda:** ✅ zaimplementowane | ⚠️ częściowo | ❌ brak

---

## 2. Warstwy systemu (prokom.md §2)

| Warstwa | W prokom.md | W projekcie | Uwagi |
|---------|--------------|-------------|--------|
| **A. Strona publiczna** | Strona główna, o firmie, kontakt, FAQ, blog, Hammer Glass, akcesoria, podstrony usług, formularz zgłoszenia, opinie, CTA | ❌ | Brak frontendu; backend ma API do zgłoszeń (`POST /repairs/submit/`), brands, device models. |
| **B. System zgłoszeń** | Online, stacjonarne, telefon, WhatsApp, Facebook, reklamacje, gwarancyjne, standardowe, z umówionym terminem | ✅ / ⚠️ | Źródła: `RepairSource` (online, in_person, phone, email, facebook, whatsapp, other). Brak osobnego „typu reklamacja” (nowa sprawa powiązana z poprzednią). `RepairVisitSchedule` = naprawa z umówionym terminem. `is_warranty` = gwarancyjna. |
| **C. Panel klienta** | Zgłoszenia, urządzenia, statusy, wiadomości, wycena, timeline, ankieta, akcesoria | ✅ | API: `/repairs/`, `/repairs/my-summary/`, timeline, quote-respond, satisfaction survey. Brak frontendu. |
| **D. Panel staff** | Przyjęcia, szybkie przyjęcie, naprawy z terminem, kolejki, remindery, checklisty, wyceny, części, komunikacja, dokumenty, etykiety, kalendarz, wyszukiwanie, sugestie HG/akcesoria | ✅ / ⚠️ | Dashboard, CRUD napraw, przypisanie, statusy, notatki, zdjęcia, części, wyceny, checklisty, kalendarz (modele), dokumenty PDF/QR. Brak: automatyczne remindery (Celery), pełny flow „szybkiego przyjęcia” w API. |
| **E. Panel admina** | Wszystkie naprawy, finanse, zysk, pracownicy, health score, SLA, audit log, dashboardy, statystyki, raporty, akcesoria/HG | ✅ / ⚠️ | Admin Django, KPI/raporty w analytics. Audit log (AuditLogEntry). Brak: dedykowany „health score” per zgłoszenie, progi SLA w DB, widok menedżerski pracownika w API. |

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
| Pracownicy: specjalizacje (telefony/tablety→Kuba, laptopy/drukarki→Rafał itd.) | ⚠️ | Brak pól specjalizacji w `StaffProfile` (position, bio, is_available). Przypisanie ręczne lub przez logikę po stronie frontu. |
| Automatyczne przypisanie według kategorii urządzenia | ❌ | Nie zaimplementowane w backendzie. |
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
| reklamacja | ❌ | Brak: „reklamacja = nowa sprawa powiązana z poprzednią naprawą”. Nie ma FK parent_repair / repair_type=reklamacja. |
| naprawa z umówionym terminem | ✅ | `RepairVisitSchedule` (visit_date, visit_time, no_show, confirmed_at). |

---

## 7. Formularz zgłoszenia online (§8)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Kategorie: telefon, tablet, smartwatch, laptop, PC, drukarka, konsola, odzyskiwanie, inny | ✅ | `DeviceCategory` w enum + API device models. |
| Dynamiczne pola wg kategorii (telefon: Apple/Android, marka, model, usterka, zdjęcia; laptop: marka, model, OS, czy się uruchamia; drukarka: producent, model, typ) | ⚠️ | Backend przyjmuje device (category, brand, model, problem_description). Szczegółowa walidacja pól wg kategorii — po stronie frontu lub rozszerzenie serializera. |
| Pytanie Hammer Glass (tak/nie/zapytaj/gratis) | ⚠️ | `RepairHammerGlassOffer` istnieje; w public submit nie ma obowiązkowego pytania HG w payloadzie. |
| Sekcja akcesoriów (ładowarki, kable, etui, „dobierz do telefonu”) | ⚠️ | `RepairAccessoryInterest`; brak wymuszenia w formularzu publicznym. |
| Dane kontaktowe + preferowany kontakt + sposób dostawy/zwrotu | ✅ | Client, delivery_method, return_method, preferred_contact (w client/device). |

---

## 8. Dostarczenie i zwrot (§9)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Sposoby: osobiście, kurier, paczkomat | ✅ | `DeliveryMethod`, `ReturnMethod`: in_person, courier, parcel_locker. |
| Adres paczkomatu PRO-KOM (Zakopiańska 10f) | ⚠️ | Brak stałej w systemie — można dodać w ustawieniach/konfigu. |
| Ręczny proces MVP: staff potwierdza odbiór paczki, zdjęcie, komentarz, kto odebrał, numer zgłoszenia w przesyłce | ❌ | Brak modelu `REPAIR_SHIPPING` (package_received_at, package_ok, request_number_attached). Pola na naprawie: delivery_method, return_method, adresy. |

---

## 9. Przyjęcie stacjonarne (§10)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Szybkie przyjęcie / pełne przyjęcie | ⚠️ | API tworzy naprawę z pełnym zestawem pól. Brak osobnego flow „szybkie przyjęcie” (minimalne dane + uzupełnienie później) w API. |
| Naprawa z umówionym terminem (etapy: przygotowanie, dostawa części, umówienie wizyty, przyjęcie, realizacja) | ✅ | `RepairVisitSchedule`; statusy i flow realizowane przez status naprawy. |

---

## 10. Dokumenty i etykiety (§11, §12, §13)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Dokument przyjęcia A4 (dane firmy, numer, QR, klient, urządzenie, opis, stan, regulamin, zaliczka, podpisy) | ✅ | Endpoint PDF: `/documents/repair/<id>/acceptance-protocol/`. |
| Dokument wydania A4 | ✅ | Endpoint PDF wydania. |
| Skrócony dokument dla naprawy z umówionym terminem | ⚠️ | Do doprecyzowania w documents (szablon skrócony). |
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
| Kolejki: moje sprawy, wszystkie, pilne, zaległe, dziś do kontaktu, gotowe do odbioru, oczekuje na dostarczenie, nieodebrane, umówione, część dotarła | ✅ / ⚠️ | Dashboard zwraca listy; filtry w API. Widok „urządzenia nieodebrane” — brak dedykowanego endpointu z progiem dni. |
| Globalne wyszukiwanie (numer, login, imię, nazwisko, telefon, email, model, IMEI, seryjny) | ⚠️ | Wyszukiwanie po numerze naprawy, kliencie, urządzeniach — zakres pól do rozszerzenia. |
| Kalendarz, remindery, etykiety, wydruki | ✅ / ⚠️ | Modele CalendarEvent, TimeslotBlock. Brak Celery/reminderów. Wydruki PDF/QR. |
| Checklisty | ✅ | ChecklistTemplate, ChecklistRun, RunItem. |

---

## 14. Panel admina (§20)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| KPI: nowe, w toku, gotowe do odbioru, przychód, zysk, nieodebrane | ✅ | Analytics KPI, summary. |
| Alerty, health score, SLA, zaniedbania | ⚠️ | Brak modeli SLA/HealthScore; KPI liczą m.in. overdue. |
| Wykresy, tabele, raporty, statystyki pracowników/źródeł/kategorii/akcesoriów | ✅ | repairs-report, staff-ranking, by_source, itd. |
| Zakładka pracownicy: lista, aktywni dziś, ostatnie logowanie, status, widok menedżerski, statystyki, health score, alerty, zadania | ⚠️ | LoginActivity; rankingi w analytics. Brak: „zalogowany teraz”, widok menedżerski per pracownik w API. |

---

## 15. Health score, SLA, remindery (§21, §22)

| Wymaganie | Stan | Uwagi |
|-----------|------|--------|
| Health score zgłoszenia (zielony/żółty/czerwony) | ❌ | Nie zaimplementowane (brak pól ani reguł w DB). |
| Progi SLA (np. brak wyceny 24h, brak odpowiedzi 24h, gotowe 3 dni) | ❌ | Brak tabeli reguł SLA. |
| Smart reminders (brak wyceny, brak odpowiedzi, nieodebrane, umówiona naprawa, itd.) | ❌ | Brak Celery/Redis i zadań reminderowych. |
| Widoki: „Co dziś wymaga reakcji”, „Urządzenia nieodebrane”, „Wymaga decyzji” | ⚠️ | Dashboard + filtry; brak dedykowanych endpointów z nazwami jak w prokom. |

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
| Scenariusze: przyjęcie, diagnoza, wycena, oczekiwanie na część, decyzja, gotowe do odbioru, ankieta, Google, kurier, umówiony termin | ⚠️ | Szablony są; automatyka wysyłki (Celery) brak. |
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
| Historia wersji wyceny (kto, kiedy, co zmienił) | ❌ | Brak REPAIR_QUOTE_VERSION / QUOTE_DECISION w ERD i w projekcie. |

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
| Pakiety (ochronny, Hammer, ładowania) | ❌ | Brak ACCESSORY_BUNDLE w projekcie. |
| Inteligentne rekomendacje (marka, model, złącze, moc, rodzaj naprawy) | ⚠️ | compatible_device_categories (JSON); brak dedykowanego endpointu rekomendacji. |
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
| Status „niekompletne zgłoszenie” | ❌ | Brak is_incomplete w modelu. |
| Automatyczne komentarze systemowe | ❌ | Brak. |
| „Ostatnie działania” na naprawie | ✅ | Timeline. |
| Widok „Wymaga decyzji” | ⚠️ | Filtry statusu (quote_sent). |
| Dark mode / light mode | ❌ | Frontend. |
| Backup systemu | ⚠️ | Model BackupLog; brak zadań Celery/backup. |
| Blokada kalendarza | ✅ | CalendarEvent.is_locked; TimeslotBlock. |
| Badge same day | ✅ | RepairPriority.SAME_DAY, is_same_day. |
| Reminder o terminie | ❌ | Brak Celery. |

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
| celery, redis, django-celery-beat | ❌ | Brak konfiguracji Celery w projekcie. |
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
- **Brakuje:** frontendu (Next.js), Celery/Redis (remindery, backup, e-mail w tle), typu „reklamacja” (powiązana naprawa), health score/SLA w DB, pełnego flow „szybkie przyjęcie”, pakietów akcesoriów (ACCESSORY_BUNDLE), wersji wyceny (REPAIR_QUOTE_VERSION).
- **Częściowo:** formularz publiczny (dynamiczne pola, pytanie HG), globalne wyszukiwanie (rozszerzenie pól), rekomendacje akcesoriów, widok menedżerski pracownika, automatyka komunikatów.
- **Dobrze pokryte:** warstwy API (zgłoszenia, klient, staff, admin), statusy, dokumenty PDF/QR, timeline, audit log, ankieta satysfakcji, Hammer Glass i akcesoria (modele), kalendarz, checklisty, RODO, KPI/raporty.

---

*Dokument utworzony na podstawie prokom.md (sekcje podsumowania systemu) oraz przeglądu backendu Django.*
