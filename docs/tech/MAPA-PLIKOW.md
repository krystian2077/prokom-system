# PRO-KOM Tech — mapa plików starej strony publicznej

Wersja 1.0 · 14.11.2026 · sesja T0 (gałąź `chore/tech-t0`, commit bazowy `4064f91`)
Cel: z tego dokumentu wykonuje się TD1 (co podmienić) i TD6 (co usunąć). Każde „używa / nie używa” poniżej ma dowód z grep (komendy w §5). Liczby linii: `wc -l`.
Ścieżki względem `frontend/`. Nazwy komponentów docelowych wg SPEC §6–§7 (katalog `components/tech/`).

Akcje:
- **zastąpić** — nowy komponent/strona przejmuje rolę, stary plik przestaje być importowany w danej sesji, kasowany w TD6.
- **przenieść treść** — tekst/dane przenosimy do nowego kodu (z poprawkami SPEC §8), potem jak „zastąpić”.
- **usunąć w TD6** — martwy albo zbędny kod, kasujemy po grep w TD6.
- **301** — strona znika, adres przekierowany w `next.config.js` (`redirects`, `permanent: true`).
- **ZOSTAJE** — nie wolno usunąć, bo używa go strefa zakazana (patrz §4).

---

## 1. Pliki strony publicznej → nowe komponenty → sesja

### 1.1 Powłoka i layouty

| Plik | Linie | Zastępuje go | Sesja | Akcja | Uwagi |
|---|---:|---|---|---|---|
| `app/(public)/layout.tsx` | 10 | ten sam plik: `TechShell` + import `tech.css` + kroje Archivo/Manrope + skrypt motywu + JSON-LD | TD1 | przepisać w miejscu | dziś renderuje tylko `ConditionalPublicLayout` |
| `app/layout.tsx` (root, plik wspólny) | 220 | — | TD1 / TD6 | zmiana w zakresie SPEC §2 | TD1: metadane domyślne „PRO-KOM Tech”, JSON-LD (ok. 120 linii, `LocalBusiness`) → layout publiczny. TD6: usunąć `Syne` i `Plus_Jakarta_Sans` (§4.2). **Skrypt `prokom-theme`/`data-theme` i `DM_Sans`, `Unbounded` zostają** (§4.3) |
| `components/layout/ConditionalPublicLayout.tsx` | 22 | `TechShell` | TD1 (PR 2) | zastąpić, usunąć w TD6 | jedyny importer: `app/(public)/layout.tsx` |
| `components/layout/PublicNavbar.tsx` | 537 | `BrandBar` + `Capsule` + `TabBar` + `MenuSheet` | TD1 (PR 2) | zastąpić na stronie publicznej, **ZOSTAJE** | importuje go też `app/client/ClientGate.tsx:9,87` (strefa zakazana) — §4.1 |
| `components/layout/PublicFooter.tsx` | 210 | `Footer` + `LinesBand` + `LegalBar` | TD1 (PR 2) | zastąpić na stronie publicznej, **ZOSTAJE** | importuje go też `app/client/ClientGate.tsx:10,89` — §4.1 |
| `components/layout/ScopeBar.tsx` | 46 | — (to nie jest element strony) | — | **ZOSTAJE** | używany przez panel: `app/panel/dashboard/page.tsx:16,736` |
| `components/layout/LiveBadge.tsx` | 14 | — | — | **ZOSTAJE** | importowany przez `ScopeBar.tsx:4` (panel) |
| `components/layout/ClientTopbar.tsx` | 56 | — | TD6 | usunąć w TD6 | **martwy**: zero importów w repo (nie ma go na liście SPEC §2 — dopisać) |
| `app/(public)/zgloszenie/layout.tsx` | 10 | metadane strony w nowym `/zgloszenie` | TD3 | zastąpić | tylko `metadata` + `<>{children}</>` |
| `app/(public)/kontakt/layout.tsx` | 15 | metadane w nowym `/kontakt` | TD4 | zastąpić | |
| `app/(public)/akcesoria/layout.tsx` | 38 | — | TD4 | 301 (usunąć z katalogiem) | importuje `BlogTeaser` |

Brak w `app/(public)/**`: `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx` (sprawdzone `find`). Własna 404 powstaje w TD5 od zera.

### 1.2 Strony (`app/(public)/**`)

| Plik | Linie | Po przebudowie (SPEC §6–§7) | Sesja | Akcja | Uwagi |
|---|---:|---|---|---|---|
| `page.tsx` (`/`) | 49 | główna: hero, `BrandMarquee`, `RepairWizard`, `DeviceGrid`, `PodhaleMap`, `Steps` + `RepairTracker`, `Faq`, `CtaBand` | TD2 | zastąpić | składa 11 sekcji z `sections/` (§1.3) |
| `zgloszenie/page.tsx` | **1281** | `RepairForm` (5 kroków) | TD3 | zastąpić (logika payloadu → `lib/tech/contract.ts`) | `"use client"`; `api.get("/clients/me/")` :186, `api.post("/repairs/submit/")` :348; własne `next/font` Unbounded + Jakarta :10–11 |
| `track/page.tsx` | 479 | `TrackForm` + `RepairTracker` | TD3 | zastąpić | `"use client"`; `fetch ${API_V1}/repairs/track/?ref=…&phone_last4=…` :184; własne `next/font` :6–17 |
| `claim-repair/page.tsx` | 89 | nowa skórka, logika bez zmian | TD3 | przenieść logikę 1:1 | `api.post("/repairs/claim/", {token})` :33, `useAuth`, `getStoredToken` |
| `kontakt/page.tsx` | 626 | `/kontakt` wg wzorca + `InquiryForm` | TD4 | przenieść treść | `"use client"`; dziś **bez formularza** (mailto + iframe Google Maps) → `OsmMap` |
| `obslugiwane-miejscowosci/page.tsx` | 186 | nowa skórka, 2 grupy miejscowości | TD4 | przenieść treść | zawiera słowo „paczkomat” — usunąć (SPEC §8) |
| `akcesoria/page.tsx` | **886** | — | TD4 | **301 → `/hammer-glass`**, usunąć | `"use client"`, sklep |
| `oferta/page.tsx` | 36 | — | TD4 | **301 → `/`**, usunąć | własne `next/font` Unbounded + Jakarta :7–8 |
| `oferta/OfertaContent.tsx` | **1113** | — | TD4 | usunąć (z 301) | jedyny dziś działający formularz zapytania: `fetch ${API_V1}/communications/inquiry/` :1016 → wzór dla `InquiryForm` (KONTRAKT §4) |
| `oferta/oferta.css` | 382 | — | TD4 | usunąć (z 301) | importowany tylko w `oferta/page.tsx` |
| `uslugi/page.tsx` | 37 | hub „Naprawy” | TD5 | zastąpić | własne `next/font` Unbounded + Jakarta :6–7 |
| `uslugi/UslugiContent.tsx` | **587** | hub „Naprawy” + szablon strony urządzenia | TD5 | przenieść treść | `"use client"`; korzysta z bloku `.uslugi-page` w globals (§2) |
| `serwis-laptopow/page.tsx` | 58 | szablon strony urządzenia | TD5 | przenieść treść | `Button`, `BlogTeaser` |
| `serwis-tabletow/page.tsx` | 46 | j.w. | TD5 | przenieść treść | `Button` |
| `serwis-komputerow/page.tsx` | 62 | j.w. | TD5 | przenieść treść | `Button`, `BlogTeaser` |
| `serwis-drukarek/page.tsx` | 47 | j.w. | TD5 | przenieść treść | `Button`, `BlogTeaser` |
| `serwis-konsol/page.tsx` | 40 | j.w. | TD5 | przenieść treść | `Button` |
| `serwis-smartwatchy/page.tsx` | 39 | j.w. | TD5 | przenieść treść | `Button` |
| `odzyskiwanie-danych/page.tsx` | 61 | j.w. | TD5 | przenieść treść | `Button` |
| — (`/serwis-telefonow`) | — | prawdziwa strona | TD4 | usunąć redirect z `next.config.js` | dziś 301 → `/uslugi`, a `sitemap.ts:40` mimo to ją zgłasza |
| — (`/serwis-telefonow-rabka-zdroj`, `-zakopane`, `/punkty-serwisowe`, `/o-firmie`) | — | nowe strony | TD4 | nowe | |
| `hammer-glass/page.tsx` | 37 | `/hammer-glass` wg wzorca | TD5 | zastąpić | składa 7 komponentów `components/hammer-glass/` (§1.4) |
| `faq/page.tsx` | 87 | `Faq` w nowej skórce | TD5 | przenieść treść | `Card` z `components/ui`; zawiera „paczkomat” — usunąć |
| `blog/page.tsx` | 62 | nowa skórka listy | TD5 | zastąpić skórkę | `BLOG_POSTS` z `lib/blog-posts.ts` (treść bez zmian) |
| `blog/BlogPageClient.tsx` | 464 | j.w. | TD5 | zastąpić | `"use client"`, `framer-motion` (nie wchodzi do nowego kodu) |
| `blog/[slug]/page.tsx` | 441 | nowa skórka wpisu | TD5 | zastąpić skórkę | używa `.blog-content` z globals (§2) |
| `polityka-prywatnosci/page.tsx` | 406 | nowa skórka + hosting webh.pl | TD5 | przenieść treść | |
| `regulamin/page.tsx` | 562 | nowa skórka | TD5 | przenieść treść | |

### 1.3 `sections/**` (tylko strona główna)

Jedyny importer wszystkich sekcji: `app/(public)/page.tsx:20–31` (5 statycznie, 6 przez `next/dynamic`). Każda sekcja używa `framer-motion`.

| Plik | Linie | Nowy odpowiednik | Sesja | Akcja |
|---|---:|---|---|---|
| `Hero.tsx` | 293 | hero głównej (TD2 PR 1) | TD2 | zastąpić, usunąć w TD6 |
| `TrustStats.tsx` | 190 | obietnice w hero / „Dlaczego” | TD2 | zastąpić |
| `DeviceCategories.tsx` | 205 | `DeviceGrid` („Co naprawiamy”) | TD2 | zastąpić |
| `HowItWorks.tsx` | 271 | `Steps` + `RepairTracker` („Od zgłoszenia do odbioru”) | TD2 | zastąpić |
| `MostCommonRepairs.tsx` | **783** | „Najczęstsze naprawy” (TD2 PR 2) | TD2 | przenieść treść |
| `Reviews.tsx` | 160 | — (karta opinii tylko po decyzji szefa, SPEC §10) | TD2 | usunąć w TD6 |
| `HammerGlass.tsx` | 286 | blok Hammer Glass na głównej | TD2 | zastąpić |
| `Accessories.tsx` | 164 | — (bez sklepu, SPEC §8) | TD2 | usunąć w TD6 |
| `CTA.tsx` | 70 | `CtaBand` | TD2 | zastąpić |
| `FAQ.tsx` | 378 | `Faq` | TD2 | przenieść treść |
| `Contact.tsx` | 356 | `PointCard` + `OsmMap` (sekcja punktów) | TD2 | zastąpić (iframe Google Maps znika) |

WhatsApp: `grep -rliE "wa\.me|whatsapp"` po wszystkich starych plikach publicznych → **0 trafień** (punkt 3 z TD1 PR 2 jest już nieaktualny — wystarczy potwierdzić).

### 1.4 `components/hammer-glass/**` i `components/blog/**`

| Plik | Linie | Importer (grep) | Nowy odpowiednik | Sesja | Akcja |
|---|---:|---|---|---|---|
| `hammer-glass/HammerHero.tsx` | 216 | `app/(public)/hammer-glass/page.tsx` | hero `/hammer-glass` | TD5 | zastąpić; używa `font-syne` |
| `hammer-glass/HammerHowItWorks.tsx` | 84 | j.w. | kroki | TD5 | zastąpić; `font-syne` |
| `hammer-glass/HammerFilms.tsx` | 189 | j.w. | wybór 9 folii z podglądem | TD5 | przenieść treść; `font-syne` |
| `hammer-glass/HammerSpecs.tsx` | 138 | j.w. | specyfikacja | TD5 | przenieść treść |
| `hammer-glass/HammerCompare.tsx` | 215 | j.w. | (porównanie — jeśli jest we wzorcu) | TD5 | przenieść treść / usunąć |
| `hammer-glass/HammerDevices.tsx` | 69 | j.w. | j.w. | TD5 | przenieść treść / usunąć |
| `hammer-glass/HammerCta.tsx` | 50 | j.w. | `CtaBand` | TD5 | zastąpić |
| `blog/BlogTeaser.tsx` | 98 | `akcesoria/layout.tsx`, `oferta/page.tsx`, `uslugi/page.tsx`, `serwis-laptopow`, `serwis-komputerow`, `serwis-drukarek` | blok „z bloga” w szablonie urządzenia (opcjonalnie) | TD5 | zastąpić, usunąć w TD6 |

### 1.5 `features/zgloszenie/**` — druga implementacja formularza

| Plik | Linie | Importer | Akcja |
|---|---:|---|---|
| `features/zgloszenie/SubmissionForm.tsx` | 572 | **brak** (`grep -rn SubmissionForm` → tylko definicja `:83`) | martwy kod już dziś; usunąć w TD6. Przed usunięciem TD3 może z niego wziąć mapowanie payloadu (`api.post("/repairs/submit/")` :238, `/clients/me/` :118) dla porównania z `zgloszenie/page.tsx` |

### 1.6 Inne moduły importowane przez stronę publiczną

| Plik | Linie | Kto importuje (grep) | Wniosek |
|---|---:|---|---|
| `components/ui/PremiumButton.tsx` | 86 | `PublicNavbar`, `SubmissionForm`, `sections/{Hero,CTA,Contact,HammerGlass}` | **ZOSTAJE**, dopóki żyje `PublicNavbar` (klient, §4.1) |
| `components/ui/PremiumCard.tsx` | 23 | tylko `SubmissionForm` | po TD6 osierocony → usunąć w TD6 (poza listą SPEC §2, dopisać) |
| `components/ui/Input.tsx` | 35 | tylko `SubmissionForm` | j.w. |
| `components/ui/Textarea.tsx` | 36 | tylko `SubmissionForm` | j.w. |
| `components/ui/Button.tsx` | 63 | 7 stron `serwis-*`/`odzyskiwanie-danych` + `ClientTopbar` (martwy) | po TD5/TD6 osierocony → usunąć w TD6 |
| `components/ui/Card.tsx` | 31 | tylko `faq/page.tsx` | po TD5 osierocony → usunąć w TD6 |
| `components/ui/Select.tsx` | 178 | `SubmissionForm` + panele (5 stron + `components/panel/RepairPartsSection.tsx`) | **ZOSTAJE** |
| `lib/site-config.ts` | — | 17 plików publicznych + `app/layout.tsx`, `robots.ts`, `sitemap.ts` | **ZOSTAJE** (`SITE_URL`) |
| `lib/blog-posts.ts`, `lib/blog-categories.ts` | — | blog, `BlogTeaser`, `sitemap.ts` (posts) | **ZOSTAJĄ** (treść bloga bez zmian) |
| `lib/api.ts`, `lib/auth-storage.ts`, `contexts/AuthContext.tsx` | — | zgloszenie, track, claim-repair, oferta, PublicNavbar | strefa zakazana — tylko import |
| `app/sitemap.ts` | — | — | TD4: z danych; dziś zawiera `/oferta` :22, `/akcesoria` :28 i przekierowany `/serwis-telefonow` :40 |
| `app/globals.tmp.css` | 21 | **nikt** (śledzony w git, kopia początku globals) | usunąć w TD6 |

Suma starych plików z §1.1–1.5 (bez root layoutu): **13 908 linii** (`wc -l` z `find` po 6 katalogach).

---

## 2. `app/globals.css` (4083 linie) — bloki publiczne

Metoda: parser reguł (skrypt w §5.3) → klasa-korzeń każdej reguły → grep klasy jako słowa w `*.ts(x)` całego `frontend/` (bez `node_modules`, `.next`). Obszary: **pub** = `app/(public)`, `sections`, `components/{hammer-glass,blog}`, `features/zgloszenie`; **lay** = `components/layout`; **pan** = `app/panel`, `app/admin-panel`, `components/panel`; **kli** = `app/client`, `features/client-*`.

### 2.1 Bloki tylko strony publicznej (do usunięcia w TD6, po TD2–TD5)

| Linie | Blok / klasa-korzeń | Reguł | Kto używa (grep) | Usunąć po |
|---|---|---:|---|---|
| 129–135 | `.zgl-scrollbar-hide` | 2 | `app/(public)/zgloszenie/page.tsx`, `sections/DeviceCategories.tsx` | TD2 + TD3 |
| 137–144 | `.accessories-mobile-scroll` (w `@media`) | 2 | `sections/Accessories.tsx` | TD2 |
| 146–157 | `.most-common-tabs-scroll` | 3 | `sections/MostCommonRepairs.tsx` | TD2 |
| 159–170 | `.akcesoria-categories-scroll` | 3 | `app/(public)/akcesoria/page.tsx` | TD4 |
| 193–248, 291–387 | `.zgloszenie-page` (+ `.form-island`, `.sb-island`, `.flabel`, `.flabel-req`, `.fi`, `.fta`, `.card-ft` — wszystkie pod `.zgloszenie-page`) | 25 | `app/(public)/zgloszenie/page.tsx` | TD3 |
| 250–289 | `@keyframes zgl-*` (9) | — | `zgloszenie/page.tsx` (6 nazw inline), CSS :298–322 (`zgl-islandIn`, `zgl-shimmerSlide`); `zgl-successBounce` nieużywany | TD3 |
| 389–869 | `.uslugi-page` (+ `.uslugi-*`, `.svc-*`, `.repair-block`, `.ri`, `.photos-col`, `.cta-btn`, `.content-col`, `.ring-pulse-dot`, `.reveal*`, `.delay-*`) + `@keyframes uslugi-*` (5) | 73 | `app/(public)/uslugi/UslugiContent.tsx` | TD5 |
| 871–883 | `.zglf-card-shimmer` + `@keyframes zglf-shimmer` | 1 | **nikt** (martwe już dziś) | TD6 |
| 885–899 | `.akcesoria-hero` | 3 | `app/(public)/akcesoria/page.tsx` | TD4 |
| 901–911 | `.reveal`, `.reveal.visible` (globalne, bez zakresu) | 2 | `akcesoria/page.tsx`, `uslugi/UslugiContent.tsx` | TD4 + TD5 |
| 913–1063 | `.pcard`, `.pcard-img`, `.pcard-wide`, `.pcard-body`, `.pcard-cta` (+ `@media` 1010–1064) | 23 | `akcesoria/page.tsx` (`.pcard-cta` nikt) | TD4 |
| 1791–1800 (w `@media (max-width:1023px)` 1791–2142) | `.public-mobile-shell` | 2 | `components/layout/ConditionalPublicLayout.tsx:14` | TD1 PR 2 → usunąć w TD6 |
| 2080–2127 (w tym samym `@media`) | `.zgloszenie-page …` mobile (+ `.step-nodes`) | ~12 | `zgloszenie/page.tsx` | TD3 |
| 2145, 2147 (w `@media (prefers-reduced-motion)` 2144–2154) | selektory `.public-mobile-shell *`, `.zgloszenie-page *` | — | j.w. | usuwać **tylko te 2 selektory**, reguła zostaje dla `.login-page *`, `.client-panel *` |
| 3098–3164 | `.blog-content` (10 reguł) | 10 | `app/(public)/blog/[slug]/page.tsx` | TD5 (jeśli nowa skórka ma własne style wpisu w `tech.css`) |
| 3166–3175 | `@keyframes slideDown` | — | **nikt** (grep nazwy: 0) | TD6 |

**Uwaga do zakresów:** blok `@media (max-width: 1023px)` 1791–2142 jest **mieszany** (public-mobile-shell + `.login-page` 1803–2078 + `.zgloszenie-page` 2080–2127 + `.client-panel` 2129–2141). W TD6 wycinać tylko reguły publiczne z wnętrza, nie cały `@media`. `:root` z `--m-*` (1776–1789) zostaje — zmiennych używa też `.login-page` (:1817–1981) i `.client-panel` (:2130–2131).

Szacunek: ok. **850 linii** do usunięcia w TD6 (129–170, 193–387, 389–1063, 1791–1800, 2080–2127, 3098–3175, bez wspólnych wyjątków niżej).

### 2.2 Bloki wspólne / panelowe — NIE ruszać (strefa zakazana)

| Linie | Blok | Kto używa (grep) | Status |
|---|---|---|---|
| 1–3 | `@tailwind base/components/utilities` | wszystko | wspólne |
| 5–19 | `:root` (`--primary`, `--dark`, `--prokom-*`) | `--primary`: CSS :26, :39, :45, :125, :3151; `--prokom-black` :3101–3147 (blog); `--dark` :120 + `UslugiContent.tsx` | wspólne (`--primary` kolor `strong`/scrollbara wszędzie) |
| 21–50 | `html` + `html::-webkit-scrollbar*` | globalny pasek przewijania (strona i panele) | wspólne |
| 52–98 | `html.worker-panel*` | `components/panel/StaffLoginChrome.tsx`, `StaffPanelShell.tsx` | panel |
| 100–106 | `body { @apply bg-white text-dark … }` | globalne | wspólne |
| 108–127 | `h1…h6` (DM Sans, 800, `color: var(--dark)`), `strong, b` (**czerwone, 900**) | globalne — działa też w panelach i w nowej `.tech` | wspólne; `tech.css` musi to nadpisać pod `.tech` |
| 172–191 | `.repair-timeline-scroll` | `app/panel/repairs/[id]/page.tsx` | panel |
| 1066 | `.login-mobile-brand { display:none }` | 5 stron `app/client/*` (login, rejestracja, verify-email, forgot/reset-password) | klient |
| 1068–1555 | `.login-page` + `@keyframes login-*` (103 reguły) | 5 stron `app/client/*` | klient |
| 1557–1773 | `.client-panel` + `@keyframes` 1654–1712 (`statusPulse` → `AdminSidebar`, `WorkerSidebar`; `shimmerSlide` → CSS :2171) | `app/client/ClientGate.tsx:20` | klient / panel |
| 1775–1789 | `:root { --m-* }` | CSS: publiczne :1793 + klient :1817–2131 | wspólne |
| 1803–2078, 2129–2141 | `.login-page`, `.login-mobile-brand`, `.client-panel` w `@media` mobile | klient | klient |
| 2156–2173 | `.worker-card-shimmer` | 4 pliki panelu | panel |
| 2175–2213 | `:root` panelu (`--page`, `--s1`…, `--ink`, `--white`…) | panele + komponenty w portalach (`ConfirmDialog`, `EmptyState` używają `var(--white)`, `var(--ink)`) | panel |
| 2215–2959 | `.worker-shell` (+ `[data-worker-theme="light"]`) | `components/panel/StaffPanelShell.tsx` | panel |
| 2961–3057 | `[data-theme="light"]` (zmienne + `.topbar`, `.card`, `.twrap`, `.sc`, `.trow`, `.sp`, `.modal*`, `.finput`, `.sel`, `.cia-ta`) | atrybut z root layoutu (§4.3); `.topbar` 5 plików panelu, `.modal` 2 | wspólne/panel — zostaje |
| 3059–3096 | `@keyframes glowR/glowG/glowB/tickIn` | `glowR` → `components/repairs/RepairPriorityBadge.tsx`; reszta nikt | panel (nie ruszać, poza zakresem) |
| 3177–4068 | `.worker-shell` light overrides | panel | panel |
| 4070–4083 | `.staff-mobile-bottom-nav`, `.staff-mobile-drawer`, `.dashboard-mobile-hard-nav` | panel | panel |

Klasy o generycznych nazwach (`.in`, `.visible`, `.card`, `.sp`, `.fi`, `.font-bold`) dają fałszywe trafienia w grep po słowie — liczy się zakres selektora (np. `.zgloszenie-page .fi` ≠ `.login-page .fi` :1402).

---

## 3. Szybka tabela dla TD6 — co wolno skasować

| Do usunięcia w TD6 (po grep „0 importów”) | Warunek |
|---|---|
| `sections/**` (11 plików, 3156 linii) | TD2 scalone |
| `components/hammer-glass/**` (7 plików, 961 linii) | TD5 scalone |
| `components/blog/BlogTeaser.tsx` | TD4 (akcesoria, oferta) + TD5 (usługi, serwis-*) |
| `features/zgloszenie/SubmissionForm.tsx` | już dziś bez importów |
| `components/layout/ConditionalPublicLayout.tsx` | TD1 PR 2 |
| `components/layout/ClientTopbar.tsx` | już dziś bez importów |
| `components/ui/{PremiumCard,Input,Textarea}.tsx` | po usunięciu `SubmissionForm` |
| `components/ui/{Button,Card}.tsx` | po TD5 (`serwis-*`, `faq`) |
| `app/(public)/{akcesoria,oferta}/**` | TD4 (z 301) |
| `app/globals.tmp.css` | od razu |
| bloki globals.css z §2.1 | po sesjach z kolumny „Usunąć po” |
| `Syne`, `Plus_Jakarta_Sans` w `app/layout.tsx` | po usunięciu `sections/Reviews.tsx` i `hammer-glass/*` (§4.2) |

| NIE usuwać mimo listy SPEC §2 | Powód |
|---|---|
| `components/layout/PublicNavbar.tsx`, `PublicFooter.tsx` | `app/client/ClientGate.tsx` (strefa zakazana) |
| `components/layout/ScopeBar.tsx`, `LiveBadge.tsx` | `app/panel/dashboard/page.tsx` (strefa zakazana) |
| `components/ui/PremiumButton.tsx` | `PublicNavbar` |

---

## 4. Co używają panele (dowód grep)

Obszary paneli: `app/panel`, `app/admin-panel`, `app/client`, `components/panel`, `features/client-*` (+ `contexts`).

### 4.1 Komponenty „starej strony” importowane przez panele

```bash
cd frontend
grep -rn "PublicNavbar\|PublicFooter\|ScopeBar\|LiveBadge\|ConditionalPublicLayout\|ClientTopbar\|SubmissionForm\|BlogTeaser\|components/hammer-glass\|@/sections/" \
  --include=*.ts --include=*.tsx . | grep -v node_modules | grep -E "import|dynamic"
```

Wynik (tylko trafienia spoza strony publicznej):

| Plik panelu | Linia | Import | Użycie |
|---|---|---|---|
| `app/client/ClientGate.tsx` | 9, 10 | `PublicNavbar`, `PublicFooter` | :87, :89 — powłoka stron `/client/login`, `/rejestracja`, `/verify-email`, `/forgot-password`, `/reset-password` (gdy brak tokenu) |
| `app/panel/dashboard/page.tsx` | 16 | `ScopeBar` (→ `LiveBadge`) | :736 |

`sections/`, `hammer-glass/`, `blog/`, `features/zgloszenie/`, `ConditionalPublicLayout`: **0 importów z paneli**.

Konsekwencja: po TD1 strona publiczna ma nową powłokę, a ekrany logowania klienta dalej pokazują **stary** `PublicNavbar` (linki „Oferta”, „Akcesoria” :38–48 → po TD4 trafią w 301) i `PublicFooter` (3× `/akcesoria` :14–16). Zgodne z SPEC §1 („konto klienta bez zmian, także wizualnie”), ale wymaga decyzji — §6, ryzyko 1.

### 4.2 Kroje (`next/font`)

```bash
grep -rn "next/font\|variable: \"--font" --include=*.tsx --include=*.ts app components features sections
grep -n "fontFamily" -A6 tailwind.config.ts
# liczba trafień per obszar:
for p in font-syne --font-syne --font-jakarta font-plus-jakarta --font-unbounded --font-dm-sans font-display font-sans; do
  for a in "app/(public)" sections components/layout components/hammer-glass app/panel app/admin-panel app/client components/panel features/client-dashboard features/client-naprawy features/client-profil components/ui app/globals.css; do
    c=$(grep -rF -- "$p" "$a" --include=*.tsx --include=*.ts --include=*.css | wc -l); [ "$c" != 0 ] && printf "  %s:%s" "$a" "$c"
  done; echo " <- $p"
done
```

Gdzie ładowane:

| Krój | Root `app/layout.tsx` (zmienna) | Lokalne `next/font` | Tailwind `fontFamily` (sekcja `theme`, strefa zakazana) |
|---|---|---|---|
| Syne | :8–12 `--font-syne` | — | `syne` :100 |
| DM Sans | :13–17 `--font-dm-sans` + `body className={dmSans.className}` | — | `sans` :99 (domyślny krój Tailwinda) |
| Unbounded | :18–22 `--font-unbounded` | public: `zgloszenie`, `track`, `uslugi`, `oferta`; **klient: 5 stron `app/client/*`** | `unbounded`, `display` :101–102 |
| Plus Jakarta Sans | :23–27 `--font-jakarta` | ta sama lista co Unbounded, ale ze zmienną **`--font-plus-jakarta`** | `plus-jakarta` :103 (`var(--font-plus-jakarta)`) |

Kto używa:

| Token | Strona publiczna | Panele | Wniosek |
|---|---|---|---|
| `font-syne` / `--font-syne` | `sections/Reviews.tsx` (1), `components/hammer-glass/*` (4) | **0** | Syne z root layoutu: usunąć w TD6 po TD2+TD5. Klasa `font-syne` w Tailwind zostaje (sekcja `theme` zakazana), bez zmiennej spadnie na `system-ui` — nikt jej już nie użyje |
| `--font-jakarta` (zmienna z root layoutu) | 0 | **0** | **Martwa już dziś** — usunąć `Plus_Jakarta_Sans` z root layoutu w TD6 (można wcześniej) |
| `--font-plus-jakarta` (lokalne ładowania) | 12 (4 strony) | `app/client`: 13 (5 stron, własne `next/font`) | Krój Jakarta **jest używany przez klienta**, ale ładowany lokalnie w `app/client/*` — usunięcie z roota go nie dotyka. SPEC §3 „Jakarta nigdzie” = prawda tylko dla ładowania w root layoucie |
| `--font-unbounded` / `font-unbounded` | 39 + `PublicNavbar` 2 | `app/panel/dashboard` 1, `components/panel/{PanelNav,StaffPanelNav,StatusBadge}` 3, `features/client-*` 20, `app/client` 25 | **ZOSTAJE w root layoucie** — `components/panel/*` i `features/client-*` polegają na zmiennej z roota (nie ładują jej same) |
| `--font-dm-sans` / `font-sans` / `font-display` | `--font-dm-sans` 6, `font-sans` 8 | globals `h1–h6` :115; `font-display` (= Unbounded): `app/panel/repairs/[id]` 3, `components/ui/{ConfirmDialog,EmptyState}` 2; DM Sans to krój `body` dla wszystkich | **ZOSTAJE** |

### 4.3 Motyw: `lib/theme.ts`, `data-theme`, `prokom-theme`

```bash
grep -rln "lib/theme[\"']" --include=*.ts --include=*.tsx .        # importy lib/theme.ts
grep -rn "prokom-theme" --include=*.ts --include=*.tsx .
grep -rln "data-theme" --include=*.ts --include=*.tsx . | xargs grep -c data-theme
grep -n "STORAGE_KEY =" contexts/*.tsx
grep -c "data-theme" app/globals.css
```

| Element | Wynik grep | Wniosek |
|---|---|---|
| `lib/theme.ts` (`initTheme`, `toggleTheme`, `getTheme`, klucz `prokom-theme`) | **0 importów** w całym `frontend/` | martwy, ale w strefie zakazanej — nie ruszamy, nie usuwamy |
| `prokom-theme` | `app/layout.tsx:103` (skrypt inline w `<head>`), `lib/theme.ts:3` | jedyny realny zapis atrybutu robi skrypt w root layoucie |
| `data-theme` w TS/TSX | `app/layout.tsx` (1), `lib/theme.ts` (4) | skrypt ustawia `data-theme` na `<html>` = zapisana wartość albo motyw systemu |
| `data-theme` w CSS | `globals.css` 20 wystąpień, wszystkie w 2961–3053 (`[data-theme="light"]`) | blok przestawia zmienne panelu (`--page`, `--s1`, `--ink`, `--white`…) na `<html>` |
| Motyw paneli dziś | `contexts/WorkerPanelThemeContext.tsx:14` → `prokom-worker-panel-theme`; `contexts/ClientPanelThemeContext.tsx:14` → `prokom-client-panel-theme`; atrybut `data-worker-theme` / klasa `client-panel--light` | panele mają **własne** klucze i klasy; `data-theme` działa tylko jako warstwa zmiennych na `<html>` (np. dla portali/modali poza `.worker-shell`) |

Wniosek dla TD1: skrypt `prokom-theme` w root layoucie i blok `[data-theme="light"]` **zostają** (wpływają na zmienne widoczne w panelach). Nowa strona używa wyłącznie `data-tech-theme` + `pk-theme` (SPEC §3). Test `panele.spec.ts` powinien sprawdzać, że po zmianie motywu strony nie zmieniają się: `data-theme`, `prokom-theme`, `prokom-worker-panel-theme`, `prokom-client-panel-theme`.

### 4.4 globals.css używane przez panele — podsumowanie

Wszystko spoza §2.1 zostaje. W szczególności panele zależą od: 5–127 (zmienne, scrollbar, `body`, `h1–h6`, `strong`), 52–98, 172–191, 1066–1773, 1775–1789, mobilne reguły `.login-page`/`.client-panel` w 1791–2142, 2144–2154 (reduced motion — bez 2 selektorów publicznych), 2156–4083 poza 3098–3175.

---

## 5. Komendy dowodowe (do powtórzenia w TD6)

### 5.1 Inwentarz i liczby linii
```bash
cd frontend
find "app/(public)" sections components/layout components/hammer-glass components/blog features/zgloszenie -type f | xargs wc -l | sort -k2
```

### 5.2 Kto importuje dany plik (przed każdym `git rm`)
```bash
grep -rn "<NazwaKomponentu>\|<ścieżka/bez/rozszerzenia>" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v "^./.next"
# komponenty ui:
for c in Button Card Input Select Textarea PremiumButton PremiumCard; do echo "## $c"; grep -rlE "components/ui/$c['\"]" --include=*.tsx . | grep -v node_modules; done
```

### 5.3 Klasa CSS → pliki
```bash
grep -rlw "<klasa>" --include=*.tsx --include=*.ts app components sections features lib
# keyframes (nazwa jako słowo, bez prefiksów zgl-/login-):
LC_ALL=C.UTF-8 grep -rlP "(?<![\w-])fadeUp(?![\w-])" --include=*.tsx app components features sections lib
```
Dla całego pliku użyto parsera Pythona: dzieli `globals.css` na reguły (z liniami), bierze pierwszą klasę selektora jako korzeń, grepuje ją po słowie w `*.ts(x)` i grupuje trafienia per obszar. Wyniki są w tabelach §2. W TD6 wystarczy powtórzyć grep z §5.3 dla klas-korzeni z §2.1 i oczekiwać 0 trafień.

---

## 6. Wnioski i ryzyka

1. **`PublicNavbar`/`PublicFooter` używa konto klienta** (`app/client/ClientGate.tsx:9–10, 87–89`). SPEC §2 każe je usunąć w TD6 — nie da się bez zmiany w strefie zakazanej. Opcje: (a) zostawić oba pliki „zamrożone” na stałe (zalecane, zgodne z „klient bez zmian”); (b) wyjątek w `WYJATKI.md` i podmiana na powłokę Tech w `ClientGate` (zmiana wyglądu logowania klienta). `TODO(krystian):` decyzja. Przy (a) w TD4 warto przynajmniej zdecydować, czy linki `Oferta`/`Akcesoria` w starej nawigacji klienta mogą prowadzić w 301.
2. **`ScopeBar` + `LiveBadge` to komponenty panelu** (`app/panel/dashboard/page.tsx:16, 736`), nie strony. Skreślić je z listy usuwanych w SPEC §2 i `tech.md` TD6.
3. **Formularz zgłoszenia jest jeden, nie dwa**: `features/zgloszenie/SubmissionForm.tsx` (572) nie ma importów — działa tylko `app/(public)/zgloszenie/page.tsx` (1281). TD3 zastępuje jeden plik; drugi to martwy kod do porównania mapowania pól i usunięcia.
4. **Jedyny działający formularz zapytania jest na `/oferta`** (`OfertaContent.tsx:1016` → `communications/inquiry/`), a `/oferta` znika w TD4 (301 → `/`). `/kontakt` dziś nie ma formularza. Kolejność w TD4: najpierw `InquiryForm` na `/kontakt`, potem 301 dla `/oferta`.
5. **Root layout**: `body` ma inline `backgroundColor: #fff; color: #0f0f0f` (`app/layout.tsx:214`), a globals ma globalne `h1–h6` (DM Sans 800) i `strong, b` (czerwone, 900). Nowa `.tech` musi to jawnie nadpisać w `tech.css` (tło, kolor, kroje nagłówków, `strong`), inaczej tryb ciemny i typografia Archivo się nie ułożą. Nie zmieniać tych reguł globalnie (używają ich panele).
6. **Kroje**: `Plus_Jakarta_Sans` w root layoucie (`--font-jakarta`) jest martwy już dziś; Syne używają tylko `sections/Reviews` i `hammer-glass/*`. `Unbounded` i `DM_Sans` zostają w roocie (panel + `features/client-*`). Klient ładuje Unbounded/Jakarta lokalnie w 5 stronach `app/client/*`.
7. **Motyw**: `lib/theme.ts` nie jest nigdzie importowany; `data-theme` ustawia wyłącznie skrypt w root layoucie i steruje blokiem `[data-theme="light"]` (2961–3057), który zmienia zmienne panelu na `<html>`. Skryptu nie usuwać ani nie przenosić do layoutu panelu bez wyjątku.
8. **globals.css**: części publiczne nie leżą w jednym miejscu — mieszany `@media` 1791–2142 i reguła reduced-motion 2144–2154. W TD6 ciąć regułę po regule, `panele.spec` po każdym kroku. Ok. 850 linii do usunięcia; dodatkowo martwe już dziś: `.zglf-card-shimmer`, `.pcard-cta`, `.delay-2/3`, `@keyframes slideDown`, `zgl-successBounce`, `uslugi-lineGrow`.
9. **`next.config.js` redirects**: dziś `/serwis-telefonow` → `/uslugi` (permanent) i `/panel/podglad/:path*` → `/panel/naprawy/:path*` (tymczasowy, **panelowy — nie ruszać**). TD4: usunąć tylko pierwszy, dodać `/akcesoria` → `/hammer-glass` i `/oferta` → `/`. `rewrites` (`/api/proxy`, `/panel/naprawy`) bez zmian. CSP report-only ma `frame-src` Google Maps — po przejściu na `OsmMap` można zaostrzyć (opcjonalnie).
10. **`sitemap.ts`** zgłasza `/serwis-telefonow` (dziś 301), `/oferta`, `/akcesoria` — błąd SEO do poprawy w TD4.
11. **Treść**: WhatsApp — 0 trafień (już usunięty); „paczkomat” — `faq/page.tsx`, `obslugiwane-miejscowosci/page.tsx` (do usunięcia przy przenoszeniu treści w TD4/TD5; `lib/repairMethodLabels.ts` to etykiety panelu — nie ruszać).
12. **`framer-motion`** zostaje w `transpilePackages` i zależnościach: używają go panele (7 importów w `app/panel`, `app/admin-panel`, `app/client`, `components/panel`, `features/client-*`) i `PremiumButton`/`PremiumCard`; nowy kod strony go nie importuje.
