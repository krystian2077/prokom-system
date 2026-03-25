# PRO-KOM SERWIS — Kompletna Dokumentacja Frontendu
## Źródło prawdy dla Cursora · Wersja aktualna

> **Dokument opisuje obecną architekturę kodu** — nie idealne wzorce z fazy planowania.
> Jeśli kod i dokument się różnią, kod jest źródłem prawdy.
> **Swagger UI** `http://localhost:8000/api/docs/` jest zawsze źródłem prawdy dla struktury API response.

---

## ROZDZIAŁ 1 — STAN PROJEKTU I STACK

### Co istnieje w repozytorium

```
frontend/
├── app/
│   ├── (public)/        ✅ strona publiczna
│   ├── client/          ✅ panel klienta
│   ├── panel/           ✅ panel pracownika — zaimplementowany
│   └── admin-panel/     ✅ panel admina — zaimplementowany
├── lib/
│   ├── api.ts           ✅ klient HTTP oparty o fetch (nie axios)
│   ├── auth-storage.ts  ✅ przechowywanie tokena
│   ├── format.ts        ✅ formatowanie
│   └── queryClient.ts   ✅ konfiguracja TanStack Query
├── store/
│   └── index.ts         ✅ Zustand — AppStore (toasty, modal stany, filtry)
├── stores/
│   └── workerStore.ts   ✅ re-eksport useStore dla kompatybilności wstecznej
├── hooks/
│   ├── useAutoRefresh.ts ✅ odświeżanie co N sekund (queryKeys[])
│   └── useClientProfile.ts ✅ profil klienta
├── components/
│   ├── panel/           ✅ WorkerSidebar, AdminSidebar, PanelTopbar, modale
│   ├── ui/              ✅ Skeleton, EmptyState, ErrorState, Toast, ConfirmDialog
│   └── repairs/         ✅ RepairStatusBadge, RepairPriorityBadge, NextActionBadge
```

### Stan wdrożenia — aktualny

| Obszar | Stan |
|--------|------|
| **lib/api.ts** | ✅ Fetch-based, `api.get/post/patch/delete(path, token?)`, `authApi.*` (auto-token), `fetchAllPages()`. |
| **Komponenty bazowe** | ✅ Skeleton (wiele wariantów), EmptyState + EMPTY_STATES, ErrorState, ToastContainer (w layout), ConfirmDialog + useConfirm. |
| **Zustand store** | ✅ scope, statusModal, assignModal, selectedRepairIds (string[]), repairFilters, toasts. |
| **Panel pracownika** | ✅ Dashboard, naprawy, historia, komunikacja, zadania, czesci-hurtownie, reklamacje, powiadomienia, wyszukiwanie, kalendarz, klienci, odbiory, nieprzypisane, wszystkie. |
| **Panel admina** | ✅ Dashboard, repairs, clients + /clients/[id], claims, pickups, calendar, search, workload, stats, hurtownie, parts, notif, unassigned, zespol, dostepnosc, zamowienia, konfiguracja. |
| **Trasy URL** | ✅ Angielskie slug jako główny routing (`/panel/repairs`, `/admin-panel/repairs`). Aliasy polskie przez rewrite tylko dla `/panel/naprawy` → `/panel/repairs`. Pozostałe PL-nazwy jako foldery (`/panel/kalendarz`, `/panel/klienci`, `/panel/historia` itd.). |
| **Hooki React Query** | ✅ Inline w komponentach (`useQuery`, `useMutation` bezpośrednio). Brak centralnego pliku hooków — decyzja architektoniczna. |
| **UX reguły (rozdz. 12)** | ✅ Kluczowe zasady spełnione; pozostałe wyjątki opisane w rozdz. 12. |

Szczegóły API: Swagger `http://localhost:8000/api/docs/`. Endpoint kolejki: `GET /api/v1/inventory/parts-queue/` (parametry `status`, `assigned_to`, paginacja DRF).

### Stack (z package.json)

| Biblioteka | Wersja | Rola |
|------------|--------|------|
| Next.js | 14.2.18 | Framework (App Router) |
| React | 18.x | UI |
| TypeScript | 5.x | Typowanie |
| Tailwind CSS | 3.x | Style |
| TanStack Query | 5.x | Data fetching, cache, optimistic updates |
| Zustand | latest | Globalny UI state |
| Framer Motion | latest | Animacje (opcjonalnie, nie wszędzie używane) |
| lucide-react | latest | Ikony |

### API — kluczowe fakty

```
BASE URL: NEXT_PUBLIC_API_URL + /api/v1/
Autentykacja: Token {token} w nagłówku Authorization
Panel pracownika używa: /api/v1/staff/repairs/ i /api/v1/staff/dashboard/
Panel admina używa:     /api/v1/repairs/ (pełny dostęp)

Klient HTTP: fetch() przez lib/api.ts — NIE axios.
api.get<T>(path, token?)    — token jawny (kompatybilność wsteczna)
authApi.get<T>(path)        — token z localStorage automatycznie (nowe komponenty)
fetchAllPages<T>(path, token) — pełne dociąganie paginowanych wyników
```

---

## ROZDZIAŁ 2 — DESIGN SYSTEM

### 2.1 CSS Variables — kopiuj dokładnie

```css
/* globals.css — :root = dark mode (domyślny) */
:root {
  /* Powierzchnie */
  --page:  #07080c;   /* tło strony */
  --s1:    #0f1117;   /* karty, sidebar */
  --s2:    #141720;   /* nagłówki kart, topbar */
  --s3:    #191d28;   /* inputy, dropdowny */
  --s4:    #1c2030;   /* secondary buttons, głębsze elementy */
  --s5:    #212538;   /* najgłębsze */
  --faint: #2c3145;   /* nieaktywne borders */

  /* Tekst */
  --white: #fff;
  --ink:   #d0d4de;   /* tekst główny */
  --ink2:  #8b93a8;   /* tekst drugorzędny */
  --muted: #525b6e;   /* wygaszone, placeholders */

  /* Borders */
  --border:  rgba(255,255,255,.07);
  --border2: rgba(255,255,255,.13);

  /* Kolory akcji */
  --red:    #dc1e1e;  --red-h: #b81818;
  --rl: rgba(220,30,30,.08);   --rb: rgba(220,30,30,.22);
  --green:  #22c55e;
  --gl: rgba(34,197,94,.10);   --gb: rgba(34,197,94,.25);
  --amber:  #f59e0b;
  --al: rgba(245,158,11,.10);  --ab: rgba(245,158,11,.25);
  --blue:   #3b82f6;
  --bl: rgba(59,130,246,.10);  --bb: rgba(59,130,246,.25);
  --purple: #8b5cf6;
  --pl: rgba(139,92,246,.10);  --pb: rgba(139,92,246,.25);
  --orange: #f97316;
  --ol: rgba(249,115,22,.10);  --ob: rgba(249,115,22,.25);
  --cyan:   #06b6d4;
  --cl: rgba(6,182,212,.10);   --cb: rgba(6,182,212,.25);

  --nav: 248px; /* szerokość sidebara */
}

/* Light mode override */
[data-theme="light"] {
  --page:  #eef1f8;
  --s1:    #ffffff;
  --s2:    #f4f6fc;
  --s3:    #eaecf4;
  --s4:    #e0e3ef;
  --s5:    #d5d9e8;
  --faint: #c5c9d8;
  --white: #111827;
  --ink:   #1f2334;
  --ink2:  #4b5268;
  --muted: #7c859e;
  --border:  rgba(0,0,0,.08);
  --border2: rgba(0,0,0,.14);
  /* Akcenty ciemniejsze dla kontrastu na białym */
  --red:    #c81919;  --red-h: #a31414;
  --rl: rgba(200,25,25,.07);   --rb: rgba(200,25,25,.18);
  --green:  #15803d;
  --gl: rgba(21,128,61,.09);   --gb: rgba(21,128,61,.22);
  --amber:  #b45309;
  --al: rgba(180,83,9,.09);    --ab: rgba(180,83,9,.22);
  --blue:   #1d4ed8;
  --bl: rgba(29,78,216,.09);   --bb: rgba(29,78,216,.22);
  --purple: #6d28d9;
  --pl: rgba(109,40,217,.09);  --pb: rgba(109,40,217,.22);
  --orange: #c2410c;
  --ol: rgba(194,65,12,.09);   --ob: rgba(194,65,12,.22);
  --cyan:   #0369a1;
  --cl: rgba(3,105,161,.09);   --cb: rgba(3,105,161,.22);
}

/* Light mode structural overrides */
[data-theme="light"] body::before {
  background: radial-gradient(ellipse, rgba(29,78,216,.06), transparent 65%);
}
[data-theme="light"] .topbar {
  background: rgba(238,241,248,.92);
  border-bottom-color: rgba(0,0,0,.09);
}
[data-theme="light"] .card,
[data-theme="light"] .twrap,
[data-theme="light"] .sc {
  box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
}
[data-theme="light"] .trow:hover,
[data-theme="light"] .rrow:hover,
[data-theme="light"] .mi:hover,
[data-theme="light"] .arch-row:hover { background: rgba(0,0,0,.025); }
[data-theme="light"] .sp.new  { background: rgba(0,0,0,.05); border-color: rgba(0,0,0,.12); }
[data-theme="light"] .sp.done { background: rgba(0,0,0,.04); }
[data-theme="light"] .modal-overlay { background: rgba(0,0,0,.45); }
[data-theme="light"] .modal  { box-shadow: 0 20px 60px rgba(0,0,0,.18); }
[data-theme="light"] .finput,
[data-theme="light"] .sel,
[data-theme="light"] .cia-ta { background: var(--s1); border-color: var(--faint); color: var(--ink); }
```

### 2.2 Animacje — globals.css

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .35; }
}
@keyframes glowR {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220,30,30,0); }
  50%       { box-shadow: 0 0 0 6px rgba(220,30,30,.3); }
}
@keyframes glowG {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
  50%       { box-shadow: 0 0 0 6px rgba(34,197,94,.3); }
}
@keyframes glowB {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  50%       { box-shadow: 0 0 0 6px rgba(59,130,246,.3); }
}
@keyframes tickIn {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: none; }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 2.3 Fonty — aktualna implementacja

Fonty ładowane przez `next/font/google` w `app/layout.tsx` (nie przez `<link>` tag):

```typescript
// app/layout.tsx — aktualne
import { Syne, DM_Sans, Unbounded, Plus_Jakarta_Sans } from "next/font/google";

const syne        = Syne({ subsets: ["latin"], weight: ["700","800"], variable: "--font-syne" });
const dmSans      = DM_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-dm-sans" });
const unbounded   = Unbounded({ subsets: ["latin"], weight: ["700","900"], variable: "--font-unbounded" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-jakarta" });
```

Zmienne CSS fontów:
- `--font-dm-sans`  — cały tekst interfejsu (body, font-family: sans w tailwind)
- `--font-unbounded` — numery napraw, wartości KPI, tytuły sekcji (font-family: display)
- `--font-syne` — nagłówki dekoracyjne (opcjonalnie)
- `--font-jakarta` — alternatywa Plus Jakarta Sans (dostępna przez klasę `font-plus-jakarta`)

**Body domyślnie używa DM Sans**, nie Plus Jakarta Sans jak w starszych mockupach.

### 2.4 Tailwind config — aktualna

```typescript
// tailwind.config.ts — aktualna wersja z repozytorium
// Pełna paleta kolorów:
colors: {
  page: '#07080c',  s1: '#0f1117', s2: '#141720', s3: '#191d28', s4: '#1c2030', s5: '#212538',
  faint: '#2c3145', ink: '#d0d4de', ink2: '#8b93a8', mutedPanel: '#525b6e',
  accent: { red:'#dc1e1e', green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6', purple:'#8b5cf6', orange:'#f97316', cyan:'#06b6d4' },
  primary: '#e11d1d', dark: '#0f0f0f', neutral: '#6b7280',
  // Paleta formularzów klientów (prefix: zgl, zglf — używaj wg kontekstu)
  // zgl.*  — dark UI strony zgłoszeń
  // zglf.* — formularz online klienta (light + dark mix)
  prokom: { white:'#fff', black:'#0f0f0f', accent:'#e11d1d', gray:'#6b7280', success:'#16a34a', warning:'#ea580c', error:'#dc2626', info:'#2563eb' }
}
// fontFamily:
//   sans:    ["var(--font-dm-sans)", "system-ui", "sans-serif"]   ← DM Sans (body domyślny)
//   display: ["var(--font-unbounded)", "system-ui", "sans-serif"] ← Unbounded (KPI, nr napraw)
//   syne:    ["var(--font-syne)", "system-ui", "sans-serif"]
//   plus-jakarta: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"]
// borderRadius dodatkowe: zgl-card (22px), zgl-field (12px), zgl-pill (9999px)
// boxShadow: soft, card
// screens: xs (400px), zgl (860px)
// Animacje: step-in, step-slide, fade-in, fade-up, shimmer, ring-pulse, glow-r/g/b,
//           slide-down, count-up, spin-fast, shimmer-slow, success-bounce, check-pop itd.
```

### 2.5 Theme Toggle — implementacja

```typescript
// lib/theme.ts
export function initTheme() {
  // Wywołaj PRZED pierwszym renderem (w layout script tag)
  const saved  = typeof localStorage !== 'undefined' ? localStorage.getItem('prokom-theme') : null
  const system = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', saved || system)
}

export function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light'
  const next = isLight ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('prokom-theme', next)
}

export function getTheme(): 'dark' | 'light' {
  return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
}
```

```typescript
// W app/layout.tsx — zapobiega FOUC (flash of unstyled content)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var saved = localStorage.getItem('prokom-theme');
            var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', saved || system);
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## ROZDZIAŁ 3 — TYPY TYPESCRIPT

```typescript
// types/index.ts

export type UserRole       = 'admin' | 'staff' | 'client'
export type DeviceCategory = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'printer' | 'console' | 'smartwatch' | 'other'
export type RepairStatus   = 'new' | 'diagnosis' | 'waiting_for_quote_approval' | 'in_progress' | 'waiting_for_parts' | 'ready_for_pickup' | 'delivered' | 'cancelled'
export type RepairPriority = 'low' | 'normal' | 'high' | 'urgent'
export type DeliveryMethod = 'in_person' | 'courier' | 'parcel_locker'
export type ReturnMethod   = 'in_person' | 'courier' | 'parcel_locker'
export type PaymentStatus  = 'unpaid' | 'deposit_paid' | 'paid'
export type NoteType       = 'client' | 'internal' | 'system' | 'team'
export type TaskStatus     = 'open' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority   = 'low' | 'normal' | 'high' | 'urgent'
export type PartStatus     = 'pending' | 'ordered' | 'in_transit' | 'arrived' | 'used'
export type Scope          = 'today' | 'tomorrow' | 'week' | 'month'

export interface User {
  id: number; email: string; first_name: string; last_name: string
  full_name: string; role: UserRole; is_active: boolean; phone?: string
}

export interface StaffProfile {
  user: User; phone?: string; avatar_color?: string
  specializations: DeviceCategory[]; is_available: boolean; availability_note?: string
}

export interface Client {
  id: number; client_number: string; first_name: string; last_name: string
  full_name: string; email?: string; phone: string; is_company: boolean
  company_name?: string; nip?: string; notes?: string; is_premium: boolean; created_at: string
}

export interface Brand        { id: number; name: string; slug: string }
export interface DeviceModel  { id: number; brand: Brand; name: string; category: DeviceCategory }
export interface Device {
  id: number; client: number; brand: Brand; model: DeviceModel
  serial_number?: string; imei?: string; color?: string; storage?: string
}

export interface RepairRequest {
  id: number; repair_number: string; client: Client; device: Device
  status: RepairStatus; priority: RepairPriority
  delivery_method: DeliveryMethod; return_method: ReturnMethod
  payment_status: PaymentStatus; fault_description: string
  service_type?: string;         // TEXT — nie select!
  internal_notes?: string;       // tylko staff/admin
  estimated_cost?: string; final_cost?: number
  estimated_completion?: string; assigned_to?: User; is_warranty: boolean
  is_complaint: boolean; created_at: string; updated_at: string
  sla_overdue?: boolean; days_waiting?: number
}

export interface RepairListItem {
  id: number; repair_number: string; client_name: string; client_phone: string
  device_label: string; device_category: DeviceCategory
  status: RepairStatus; priority: RepairPriority; payment_status: PaymentStatus
  assigned_to?: { id: number; full_name: string; initials: string; avatar_color?: string }
  is_warranty: boolean; is_complaint: boolean
  estimated_completion?: string; created_at: string
  sla_overdue: boolean; days_waiting: number
}

export interface RepairNote {
  id: number; repair: number; author: User; content: string
  note_type: NoteType; is_read: boolean; created_at: string
}

export interface TimelineEvent {
  id: number; type: 'status_change' | 'note' | 'assignment' | 'image' | 'checklist' | 'quote'
  timestamp: string; actor_name: string; description: string
  old_status?: RepairStatus; new_status?: RepairStatus
}

export interface Quote {
  id: number; repair: number; created_by: User
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  total_amount: number; notes?: string; created_at: string
  items: QuoteItem[]; client_decision_at?: string
}
export interface QuoteItem {
  id: number; description: string; quantity: number; unit_price: number; total_price: number
}
export interface CostSummary { parts_cost: number; labour_cost: number; revenue: number; profit: number }

export interface Supplier { id: number; name: string; website?: string; phone?: string; email?: string }
export interface Part {
  id: number; name: string; sku?: string; supplier: Supplier
  unit_price: number; quantity_in_stock: number; category: DeviceCategory
}
export interface PartUsage {
  id: number; repair: number; part: Part; quantity: number
  unit_price: number; total_price: number; status: PartStatus
  ordered_at?: string; arrived_at?: string
}

export interface Task {
  id: number; title: string; description?: string
  priority: TaskPriority; status: TaskStatus
  assigned_to?: User; created_by: User
  related_repair?: number; due_date?: string
  created_at: string; updated_at: string; comments: TaskComment[]
}
export interface TaskComment { id: number; author: User; content: string; created_at: string }

export interface CalendarEvent {
  id: number; title: string
  event_type: 'repair_eta' | 'pickup' | 'part_arrival' | 'task' | 'availability' | 'sla'
  date: string; repair?: number; assigned_to?: number
  color: 'red' | 'green' | 'blue' | 'amber' | 'purple' | 'gray'
}

export interface StaffNotification {
  id: number; type: string; title: string; description: string
  related_repair?: number; is_read: boolean; created_at: string
}

export interface DashboardKPI {
  total_active: number; total_ready: number; total_unassigned: number
  revenue_30d: number; complaints_open: number; avg_repair_days: number
}

export interface StaffKPI {
  user: User; repairs_completed: number; avg_repair_days: number
  complaint_rate: number; health_score: number; revenue: number
}

export interface PaginatedResponse<T> {
  count: number; next: string | null; previous: string | null; results: T[]
}

export interface SearchResults {
  repairs: RepairListItem[]; clients: Client[]; parts?: Part[]
}
```

---

## ROZDZIAŁ 4 — KONFIGURACJA API — AKTUALNA

**WAŻNE: lib/api.ts używa fetch(), NIE axios.**

```typescript
// lib/api.ts — aktualna architektura
// BASE URL: NEXT_PUBLIC_API_URL + /api/v1/
// Klient rzuca ApiError (extends Error) z .status i .body przy !res.ok

// Dwa tryby użycia:
// 1. api.* — token jawny (dla stron z useAuth().token)
api.get<T>(path, token?)
api.post<T>(path, body?, token?)
api.patch<T>(path, body?, token?)
api.put<T>(path, body?, token?)
api.delete<T>(path, token?)

// 2. authApi.* — token czytany z localStorage automatycznie (nowsze komponenty)
authApi.get<T>(path)
authApi.post<T>(path, body?)
authApi.patch<T>(path, body?)
authApi.delete<T>(path)

// 3. fetchAllPages<T>(firstPath, token) — dociąga wszystkie strony listy
export type PaginatedList<T> = { count?: number; next?: string | null; results?: T[] }

// Obsługa błędów: getErrorMessageFromBody(errBody, fallback) → czytelny komunikat
// handleUnauthorized() → clearToken + redirect do /panel/login
```

```typescript
// lib/queryClient.ts — aktualna konfiguracja
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: (failureCount, error: unknown) => {
        if (error instanceof ApiError) {
          if (error.status === 404 || error.status === 403) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
```

```typescript
// next.config.js — rewrites (aktualny)
// Jedyny alias PL→EN: /panel/naprawy → /panel/repairs
// Pozostałe ścieżki PL-folder są routowane bezpośrednio (np. /panel/kalendarz)
rewrites: [
  { source: "/panel/naprawy", destination: "/panel/repairs" },
  { source: "/panel/naprawy/:path*", destination: "/panel/repairs/:path*" },
]
```

```typescript
// Uwaga — middleware.ts:
// Auth guard jest realizowany po stronie komponentów (useAuth hook + AuthContext)
// a NIE przez next/server middleware. Nie ma pliku middleware.ts.
```

---

## ROZDZIAŁ 5 — KOMPONENTY BAZOWE (zbuduj PIERWSZE)

### 5.1 Skeleton Loader

```typescript
// components/ui/Skeleton.tsx
// Używaj zamiast spinner — KAŻDY widok podczas ładowania

interface SkeletonProps { className?: string; variant?: 'line' | 'circle' | 'card' | 'table-row' }

export function Skeleton({ className = '', variant = 'line' }: SkeletonProps) {
  const base = 'animate-pulse rounded bg-gradient-to-r from-s3 via-s4 to-s3 bg-[length:200%_100%] animate-shimmer'
  
  if (variant === 'circle')    return <div className={`${base} rounded-full ${className}`} />
  if (variant === 'card')      return <div className={`${base} h-24 rounded-2xl ${className}`} />
  if (variant === 'table-row') return (
    <div className="flex items-center gap-3 p-3 border-b border-[var(--border)]">
      <div className={`${base} h-4 w-16 rounded`} />
      <div className={`${base} h-4 flex-1 rounded`} />
      <div className={`${base} h-4 w-24 rounded`} />
      <div className={`${base} h-6 w-20 rounded-full`} />
    </div>
  )
  return <div className={`${base} h-4 rounded ${className}`} />
}

// Skeleton dla KPI kart (5 kart w rzędzie)
export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--s1)] border border-[var(--border)] rounded-[13px] p-[13px]">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

// Skeleton dla tabeli napraw
export function RepairTableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-[var(--s1)] border border-[var(--border)] rounded-[15px] overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="table-row" />
      ))}
    </div>
  )
}
```

### 5.2 Empty State

```typescript
// components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: string          // emoji
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = '📋', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <div className="font-display font-bold text-[15px] text-[var(--ink)] mb-2">{title}</div>
      {description && (
        <p className="text-[12.5px] text-[var(--muted)] max-w-[280px] leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 bg-[var(--bl)] border border-[var(--bb)] text-[var(--blue)] text-[12.5px] font-bold rounded-[10px] hover:bg-[rgba(59,130,246,.18)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Predefiniowane empty states dla każdego widoku:
export const EMPTY_STATES = {
  myRepairs:     { icon: '🔧', title: 'Brak przypisanych napraw',      description: 'Nowe naprawy pojawią się tutaj gdy admin Cię przypisze.' },
  archive:       { icon: '📦', title: 'Brak zakończonych napraw',      description: 'Historia napraw pojawi się po ukończeniu pierwszego zlecenia.' },
  messages:      { icon: '💬', title: 'Brak wiadomości',               description: 'Klienci będą się kontaktować przez ten panel.' },
  tasks:         { icon: '✓',  title: 'Wszystkie zadania ukończone',   description: 'Nowe zadania pojawią się tutaj.' },
  notifications: { icon: '🔔', title: 'Brak powiadomień',             description: 'Powiadomienia systemowe pojawią się tutaj.' },
  parts:         { icon: '⚙️', title: 'Brak aktywnych części',        description: 'Zamówione części do Twoich napraw pojawią się tutaj.' },
  clients:       { icon: '👥', title: 'Brak klientów',                description: 'Klienci pojawią się po przyjęciu pierwszego zgłoszenia.' },
  search:        { icon: '🔍', title: 'Brak wyników',                  description: 'Spróbuj zmienić zapytanie lub filtry.' },
  unassigned:    { icon: '⏳', title: 'Brak nieprzypisanych napraw',  description: 'Wszystkie naprawy mają przypisanych pracowników.' },
  calendar:      { icon: '📅', title: 'Brak zdarzeń',                 description: 'Zdarzenia kalendarza pojawią się tutaj.' },
  claims:        { icon: '🛡', title: 'Brak reklamacji',              description: 'Reklamacje i gwarancje pojawią się tutaj.' },
  pickups:       { icon: '📍', title: 'Brak urządzeń do odbioru',    description: 'Gotowe urządzenia pojawią się tutaj.' },
}
```

### 5.3 Error State

```typescript
// components/ui/ErrorState.tsx
interface ErrorStateProps {
  error?: Error | null
  onRetry?: () => void
  title?: string
}

export function ErrorState({ error, onRetry, title = 'Nie można załadować danych' }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--rl)] border border-[var(--rb)] flex items-center justify-center text-[var(--red)] text-xl mb-4">
        ⚠
      </div>
      <div className="font-semibold text-[13.5px] text-[var(--ink)] mb-1">{title}</div>
      {error?.message && (
        <p className="text-[11.5px] text-[var(--muted)] mb-4 max-w-[240px]">{error.message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[var(--s3)] border border-[var(--border2)] text-[var(--ink)] text-[12px] font-semibold rounded-[9px] hover:bg-[var(--s4)] transition-colors"
        >
          Spróbuj ponownie
        </button>
      )}
    </div>
  )
}
```

### 5.4 Toast System

```typescript
// components/ui/Toast.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store'

export function ToastContainer() {
  const { toasts, removeToast } = useStore()

  return (
    <div className="fixed top-[76px] right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: .95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: .95 }}
            transition={{ duration: .2 }}
            className={`
              pointer-events-auto flex items-center gap-2.5 px-4 py-3
              bg-[var(--s2)] border rounded-[11px] text-[12.5px] font-bold
              shadow-[0_8px_24px_rgba(0,0,0,.4)] max-w-[320px]
              ${toast.type === 'success' ? 'border-[var(--gb)] text-[var(--green)]' : ''}
              ${toast.type === 'error'   ? 'border-[var(--rb)] text-[#ff6b6b]' : ''}
              ${toast.type === 'info'    ? 'border-[var(--bb)] text-[var(--blue)]' : ''}
            `}
          >
            <span className="text-base">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="flex-1">{toast.msg}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-50 hover:opacity-100 text-[var(--ink)] ml-1"
            >×</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

### 5.5 Confirm Dialog

```typescript
// components/ui/ConfirmDialog.tsx
// Używaj przed KAŻDĄ destruktywną akcją

import { useState } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen, title, description,
  confirmLabel = 'Potwierdź', cancelLabel = 'Anuluj',
  variant = 'danger', onConfirm, onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger:  { btn: 'bg-gradient-to-br from-[var(--red)] to-[var(--red-h)] text-white shadow-[0_4px_12px_rgba(220,30,30,.3)]', icon: '⚠️' },
    warning: { btn: 'bg-[var(--al)] border border-[var(--ab)] text-[var(--amber)]', icon: '⚠' },
    info:    { btn: 'bg-[var(--bl)] border border-[var(--bb)] text-[var(--blue)]',  icon: 'ℹ' },
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center animate-[fadeUp_.2s_ease]">
      <div className="bg-[var(--s2)] border border-[var(--border2)] rounded-[18px] w-[420px] max-w-[95vw] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.55)]">
        <div className="p-5 flex items-start gap-3">
          <div className="text-2xl mt-0.5">{variantStyles[variant].icon}</div>
          <div>
            <div className="font-display font-black text-[14px] text-[var(--white)] mb-1">{title}</div>
            <p className="text-[12.5px] text-[var(--ink2)] leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-[var(--s3)] border border-[var(--border)] text-[var(--ink)] text-[12.5px] font-semibold rounded-[10px] hover:bg-[var(--s4)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 text-[12.5px] font-bold rounded-[10px] transition-all hover:-translate-y-px ${variantStyles[variant].btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook do łatwego użycia:
export function useConfirm() {
  const [state, setState] = useState<{
    isOpen: boolean; title: string; description: string
    confirmLabel?: string; variant?: 'danger' | 'warning'; resolve?: (v: boolean) => void
  }>({ isOpen: false, title: '', description: '' })

  const confirm = (opts: { title: string; description: string; confirmLabel?: string; variant?: 'danger' | 'warning' }) => {
    return new Promise<boolean>(resolve => {
      setState({ ...opts, isOpen: true, resolve })
    })
  }

  const handleConfirm = () => { state.resolve?.(true);  setState(s => ({ ...s, isOpen: false })) }
  const handleCancel  = () => { state.resolve?.(false); setState(s => ({ ...s, isOpen: false })) }

  return { confirm, dialogProps: { ...state, onConfirm: handleConfirm, onCancel: handleCancel } }
}
```

### 5.6 RepairStatusBadge

```typescript
// components/repairs/RepairStatusBadge.tsx
import type { RepairStatus } from '@/types'

const CONFIG: Record<RepairStatus, { label: string; bg: string; color: string; border: string; pulse: boolean }> = {
  new:                        { label: 'Nowe',           bg: 'rgba(255,255,255,.05)', color: 'var(--ink2)', border: 'var(--border2)', pulse: false },
  diagnosis:                  { label: 'Diagnostyka',    bg: 'var(--cl)',             color: 'var(--cyan)',  border: 'var(--cb)',      pulse: false },
  waiting_for_quote_approval: { label: 'Czeka na wycenę',bg: 'var(--pl)',             color: 'var(--purple)',border: 'var(--pb)',      pulse: false },
  in_progress:                { label: 'W naprawie',     bg: 'var(--al)',             color: 'var(--amber)', border: 'var(--ab)',      pulse: true  },
  waiting_for_parts:          { label: 'Czeka na część', bg: 'var(--bl)',             color: 'var(--blue)',  border: 'var(--bb)',      pulse: false },
  ready_for_pickup:           { label: 'Gotowe',         bg: 'var(--gl)',             color: 'var(--green)', border: 'var(--gb)',      pulse: true  },
  delivered:                  { label: 'Wydano',         bg: 'rgba(255,255,255,.04)', color: 'var(--muted)', border: 'var(--border)', pulse: false },
  cancelled:                  { label: 'Anulowano',      bg: 'var(--rl)',             color: '#ff6b6b',      border: 'var(--rb)',      pulse: false },
}

interface Props { status: RepairStatus; size?: 'sm' | 'md' }

export function RepairStatusBadge({ status, size = 'md' }: Props) {
  const c = CONFIG[status]
  const textSize = size === 'sm' ? 'text-[8.5px]' : 'text-[9.5px]'
  return (
    <span
      className={`inline-flex items-center gap-1 ${textSize} font-bold uppercase tracking-[.04em] px-2 py-[3px] rounded-full whitespace-nowrap`}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      <span
        className="w-1 h-1 rounded-full flex-shrink-0"
        style={{ background: c.color, animation: c.pulse ? 'pulse 1.5s infinite' : 'none' }}
      />
      {c.label}
    </span>
  )
}
```

### 5.7 RepairPriorityBadge

```typescript
// components/repairs/RepairPriorityBadge.tsx
import type { RepairPriority } from '@/types'

const CONFIG: Record<RepairPriority, { label: string; show: boolean; bg: string; color: string; border: string; glow: boolean }> = {
  low:    { label: 'Niski',  show: false, bg: 'var(--s4)',              color: 'var(--muted)', border: 'var(--border)',              glow: false },
  normal: { label: '',       show: false, bg: '',                       color: '',             border: '',                           glow: false },
  high:   { label: 'Wysoki', show: true,  bg: 'var(--al)',              color: 'var(--amber)', border: 'var(--ab)',                  glow: false },
  urgent: { label: 'Pilne',  show: true,  bg: 'rgba(220,30,30,.16)',    color: '#ff4444',      border: 'rgba(220,30,30,.38)',        glow: true  },
}

export function RepairPriorityBadge({ priority }: { priority: RepairPriority }) {
  const c = CONFIG[priority]
  if (!c.show) return null
  return (
    <span
      className="inline-flex items-center text-[8.5px] font-black uppercase tracking-[.06em] px-1.5 py-[2px] rounded-[5px]"
      style={{
        background: c.bg, color: c.color,
        border: `1px solid ${c.border}`,
        animation: c.glow ? 'glowR 2s infinite' : 'none',
      }}
    >
      {c.label}
    </span>
  )
}
```

### 5.8 NextActionBadge

```typescript
// components/repairs/NextActionBadge.tsx
import type { RepairListItem, RepairStatus } from '@/types'

export type NextAction =
  | 'assign' | 'diagnosis' | 'send_quote' | 'wait_decision'
  | 'order_part' | 'repair' | 'mount_part' | 'contact_client'
  | 'notify_ready' | 'done'

const ACTION_CONFIG: Record<NextAction, { label: string; bg: string; color: string; border: string }> = {
  assign:         { label: '⚠ Przypisz pracownika', bg: 'var(--al)', color: 'var(--amber)', border: 'var(--ab)' },
  diagnosis:      { label: '🔍 Diagnostyka',         bg: 'var(--cl)', color: 'var(--cyan)',  border: 'var(--cb)' },
  send_quote:     { label: '→ Wyślij wycenę',        bg: 'var(--bl)', color: 'var(--blue)',  border: 'var(--bb)' },
  wait_decision:  { label: '⏳ Czekaj na decyzję',   bg: 'var(--pl)', color: 'var(--purple)',border: 'var(--pb)' },
  order_part:     { label: '→ Zamów część',           bg: 'var(--al)', color: 'var(--amber)', border: 'var(--ab)' },
  repair:         { label: '▶ Kontynuuj naprawę',    bg: 'rgba(34,197,94,.08)', color: 'var(--green)', border: 'rgba(34,197,94,.2)' },
  mount_part:     { label: '▶ Zamontuj część',       bg: 'rgba(34,197,94,.12)', color: 'var(--green)', border: 'rgba(34,197,94,.3)' },
  contact_client: { label: '☎ Skontaktuj się',       bg: 'var(--rl)', color: '#ff6b6b',      border: 'var(--rb)' },
  notify_ready:   { label: '✓ Poinformuj klienta',  bg: 'rgba(34,197,94,.12)', color: 'var(--green)', border: 'rgba(34,197,94,.3)' },
  done:           { label: '✓ Zakończono',           bg: 'rgba(255,255,255,.04)', color: 'var(--muted)', border: 'var(--border)' },
}

export function getNextAction(r: Pick<RepairListItem, 'status' | 'assigned_to'>): NextAction {
  if (!r.assigned_to)                                    return 'assign'
  if (r.status === 'new')                                return 'diagnosis'
  if (r.status === 'diagnosis')                          return 'send_quote'
  if (r.status === 'waiting_for_quote_approval')         return 'wait_decision'
  if (r.status === 'waiting_for_parts')                  return 'order_part'
  if (r.status === 'in_progress')                        return 'repair'
  if (r.status === 'ready_for_pickup')                   return 'notify_ready'
  if (r.status === 'delivered' || r.status === 'cancelled') return 'done'
  return 'repair'
}

export function NextActionBadge({ repair }: { repair: Pick<RepairListItem, 'status' | 'assigned_to'> }) {
  const action = getNextAction(repair)
  const c = ACTION_CONFIG[action]
  if (action === 'done') return null
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2 py-[3px] rounded-[6px] whitespace-nowrap"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  )
}
```

### 5.9 Zustand Store — aktualna implementacja

```typescript
// store/index.ts — aktualna wersja
// WAŻNE: selectedRepairIds to string[], nie number[]
// statusModalRepairId / assignModalRepairId — string | null (po String(id))

interface AppStore {
  scope: Scope;                          // 'today' | 'tomorrow' | 'week' | 'month'
  setScope: (s: Scope) => void;

  statusModalRepairId: string | null;
  openStatusModal: (id: string | number) => void;  // String(id) wewnątrz
  closeStatusModal: () => void;

  assignModalRepairId: string | null;
  openAssignModal: (id: string | number) => void;
  closeAssignModal: () => void;

  selectedRepairIds: string[];           // UUID/string — nie number!
  toggleRepair: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  repairFilters: Record<string, string>;
  setFilter: (k: string, v: string | undefined) => void;
  clearFilters: () => void;

  toasts: Toast[];
  addToast: (msg: string, type: Toast["type"]) => void;  // auto-remove po 3500ms
  removeToast: (id: string) => void;
}

// Użycie:
import { useStore } from "@/store";
const { addToast, openStatusModal } = useStore();
addToast("Zapisano", "success");
```

### 5.10 Auto-refresh Hook — aktualna implementacja

```typescript
// hooks/useAutoRefresh.ts
// WAŻNE: przyjmuje tablicę QueryKey[], nie pojedynczy QueryKey
// Invaliduje wszystkie podane klucze jednocześnie

export function useAutoRefresh(queryKeys: QueryKey[], ms = 30_000) {
  // zwraca: { countdown: number, isRefreshing: boolean, refresh: () => void }
}

// Użycie (array wrapping!):
const { countdown, isRefreshing, refresh } = useAutoRefresh(
  [['dashboard', 'staff', scope], ['repairs', 'my']],
  30_000
);
// Nie: useAutoRefresh(['dashboard', 'staff', scope])  ← BŁĄD (płaski array)
// Tak: useAutoRefresh([['dashboard', 'staff', scope]])  ← tablica tablic
```

---

## ROZDZIAŁ 6 — WZORZEC DATA FETCHING — AKTUALNA ARCHITEKTURA

**Decyzja architektoniczna:** w projekcie NIE ma centralnego pliku `hooks/useRepairs.ts`.
Hooki TanStack Query są pisane inline w komponentach (`useQuery`, `useMutation` bezpośrednio w `page.tsx`).
Jest to celowa decyzja — unika over-abstraction.

Wzorzec stosowany w stronach:

```typescript
// Wzorzec query w page.tsx — stosuj konsekwentnie
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// W komponencie:
const { token } = useAuth();
const qc = useQueryClient();

// Query:
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["repairs", "my", filters],
  queryFn: () => api.get<PaginatedRepairs>(`/staff/repairs/?assigned_to=me&page_size=20`, token),
  staleTime: 10_000,
  enabled: !!token,
});

// Mutation z toast:
const { addToast } = useStore();
const mutation = useMutation({
  mutationFn: (payload) => api.post(`/staff/repairs/${id}/change-status/`, payload, token),
  onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ["repairs"] });
    addToast("Status zmieniony", "success");
  },
  onError: (e) => {
    addToast(e instanceof Error ? e.message : "Błąd", "error");
  },
});
```

Kilka hooków domenowych w `hooks/` istnieje:
- `hooks/useAutoRefresh.ts` — auto-invalidacja wielu query co N sekund
- `hooks/useClientProfile.ts` — profil klienta

Paginacja URL:
```typescript
// Wzorzec stron z paginacją
const searchParams = useSearchParams();
const router = useRouter();
const page = Number(searchParams.get("page") ?? 1);
const setPage = (p: number) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(p));
  router.push(`?${params.toString()}`);
};
// API: /staff/repairs/?page=${page}&page_size=20
```

Wzorzec dla stron z filtrami w URL (status, search, page):
```typescript
const status = searchParams.get("status") ?? "";
const search = searchParams.get("search") ?? "";
// Buduj URL dynamicznie przed zapytaniem
const qs = new URLSearchParams({ page_size: "20", ...(status && { status }), ...(search && { search }), page: String(page) });
queryFn: () => api.get(`/repairs/?${qs}`, token),
queryKey: ["repairs", "all", { status, search, page }],
```

---

## ROZDZIAŁ 7 — LAYOUT PANELI — AKTUALNA ARCHITEKTURA

### 7.1 Topbar — aktualny komponent

Komponent: `components/panel/PanelTopbar.tsx`

```typescript
// Układ:
// LEWO: Logo "PRO-KOM" + badge roli
// PRAWO: ThemeToggle + BellIcon (z badge unread) + Avatar + Logout

// Bell: badge gdy unread > 0 → navigate /panel/powiadomienia lub /admin-panel/notif
// Avatar: inicjały użytkownika z AuthContext
// ThemeToggle: data-theme na <html>
```

### 7.2 Staff Sidebar — aktualna

Komponent: `components/panel/WorkerSidebar.tsx`

Kanoniczne trasy panelu pracownika (foldery faktycznie istniejące):

| Link w sidebar | Ścieżka URL |
|----------------|-------------|
| Dashboard | `/panel/dashboard` |
| Moje naprawy | `/panel/repairs` (alias: `/panel/naprawy`) |
| Wszystkie naprawy | `/panel/all-repairs` |
| Historia | `/panel/archive` |
| Komunikacja | `/panel/comm` |
| Zadania | `/panel/tasks` |
| Moje części | `/panel/czesci-hurtownie` |
| Reklamacje | `/panel/reklamacje-gwarancje` |
| Powiadomienia | `/panel/powiadomienia` |
| Wyszukiwanie | `/panel/wyszukiwanie` |
| Kalendarz | `/panel/kalendarz` |
| Klienci | `/panel/klienci` |
| Nieprzypisane | `/panel/unassigned` |
| Odbiory | `/panel/odbior` |

Aktywny link: `usePathname()` + sprawdzenie czy pathname startsWith lub === href.
Akcent kolorystyczny: niebieski `#3b82f6`.

### 7.3 Admin Sidebar — aktualna

Komponent: `components/panel/AdminSidebar.tsx`

Kanoniczne trasy panelu admina (foldery faktycznie istniejące):

| Sekcja | Link | Ścieżka URL |
|--------|------|-------------|
| Główne | Dashboard | `/admin-panel/dashboard` |
| | Przyjęcie | `/admin-panel/intake` |
| | Naprawy | `/admin-panel/repairs` |
| | Nieprzypisane | `/admin-panel/unassigned` |
| | Obciążenie | `/admin-panel/workload` |
| | Klienci | `/admin-panel/clients` |
| | Wyszukiwanie | `/admin-panel/search` |
| | Komunikacja | `/admin-panel/comm` |
| | Powiadomienia | `/admin-panel/notif` |
| | Kalendarz | `/admin-panel/calendar` |
| | Odbiory | `/admin-panel/pickups` |
| | Reklamacje | `/admin-panel/claims` |
| | Części | `/admin-panel/parts` |
| | Hurtownie | `/admin-panel/hurtownie` |
| Zarządzanie | Statystyki | `/admin-panel/stats` |
| | Zespół | `/admin-panel/team` |
| | Dostępność | `/admin-panel/availability` |
| | Zamówienia | `/admin-panel/orders` |
| | Konfiguracja | `/admin-panel/config` |

**Uwaga:** Admin-panel używa wyłącznie angielskich slugów. Brak aliasów PL.

Akcent kolorystyczny: czerwony `#dc1e1e`.

### 7.4 Schemat URL — uwagi

**Schemat hybrydowy** — mix angielskich i polskich slugów:
- Anglojęzyczne (główne widoki admina): `/admin-panel/repairs`, `/admin-panel/clients`, `/admin-panel/pickups`
- Polskie folderowe (panel pracownika): `/panel/kalendarz`, `/panel/klienci`, `/panel/historia`
- Angielski alias przez rewrite: `/panel/naprawy` → `/panel/repairs`
- **Brak osobnego middleware.ts** — autoryzacja po stronie komponentu przez `useAuth().user?.role`

Widoki duplikujące (stare i nowe — istnieją obie wersje):
- `/panel/repairs` = `/panel/naprawy` (rewrite)
- `/panel/archive` i `/panel/historia` (mogą być tą samą treścią)
- `/panel/unassigned` i `/panel/nieprzypisane`

Przy dodawaniu nowych linków do sidebar — używaj kanonicznej ścieżki z tabeli powyżej.

---

## ROZDZIAŁ 8 — PANEL PRACOWNIKA: WSZYSTKIE WIDOKI

### 8.1 Dashboard `/panel/dashboard`

**Endpoint:** `GET /api/v1/staff/dashboard/?scope=today|tomorrow|week|month`

#### ScopeBar — animacja przejścia (FIX!)

```typescript
// components/layout/ScopeBar.tsx
import { motion, AnimatePresence } from 'framer-motion'

export function ScopeBar({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <div className="flex items-center gap-1 bg-[var(--s2)] border border-[var(--border)] rounded-[11px] p-1 mb-[18px] flex-wrap">
      {(['today','tomorrow','week','month'] as const).map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`
            px-4 py-[7px] rounded-[8px] text-[12px] font-semibold transition-all duration-150
            ${value === s
              ? 'bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white font-bold shadow-[0_2px_8px_rgba(59,130,246,.3)]'
              : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }
          `}
        >
          {{ today: 'Dziś', tomorrow: 'Jutro', week: 'Ten tydzień', month: 'Ten miesiąc' }[s]}
        </button>
      ))}
      <div className="flex-1" />
      <LiveBadge />
    </div>
  )
}
```

#### Counter animation na kartach statystycznych (FIX!)

```typescript
// Przy zmianie scope → liczby animują się
// Użyj AnimatePresence z key={scope} → fadeUp przy każdej zmianie

function StatCard({ id, label, sub, value, barColor }: StatCardProps) {
  return (
    <motion.div
      key={`${id}-${value}`}             // zmiana value → nowa animacja
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .3 }}
      className="bg-[var(--s1)] border border-[var(--border)] rounded-[13px] p-[13px_15px_15px] relative overflow-hidden hover:-translate-y-0.5 transition-transform cursor-default"
    >
      {/* ... zawartość karty */}
    </motion.div>
  )
}
```

#### Sekcja "NASTĘPNE DZIAŁANIA"

```typescript
// Dane z response.next_actions: RepairListItem[]
// Sortuj po: urgent SLA first, then assigned but blocked, then by days_waiting desc

// Każdy wiersz na-item:
// - Hover: translateX(2px) transition .15s
// - Kliknięcie: navigate /panel/naprawy/{id}
// - Priorytety:
//   1: vhi (czerwony) = sla_overdue || priority === 'urgent'
//   2: md  (amber)    = priority === 'high' || days_waiting > 3
//   3: lo  (szary)    = pozostałe
//   4: g   (zielony)  = status === 'ready_for_pickup' (powiadom klienta)
```

#### Auto-refresh wizualizacja

```typescript
// W topbarze lub pod ScopeBar:
const { countdown, isRefreshing, refresh } = useAutoRefresh(['dashboard', 'staff', scope])

// Wyświetl:
// Spinner (12px, animation spin) gdy isRefreshing
// + tekst "Auto-refresh za {countdown}s"
// + przycisk "↺ Odśwież" onClick={refresh}
// Po odświeżeniu: addToast("✓ Dane odświeżone", 'success')
```

---

### 8.2 Moje naprawy `/panel/naprawy`

**Endpoint:** `GET /api/v1/staff/repairs/?assigned_to=me`

```typescript
// Tabela — kolumny (grid):
// [60px] [2fr] [1.4fr] [1fr] [1fr] [90px] [44px]
// Nr ref | Urządzenie + NextAction | Klient | Status | Bloker | ETA | Akcja

// Wiersz z sla_overdue:
// - klasa: row-urg → czerwona linia lewa ZAWSZE widoczna (transform: scaleY(1))
// - color nr ref: #ff6b6b

// Wiersz z is_complaint lub is_warranty:
// - dodatkowy badge po prawej stronie StatusBadge

// HOVER wiersza:
// background: rgba(255,255,255,.022)
// ::before linia lewa: scaleY 0→1, transition .17s, kolor niebieski (staff) / czerwony (admin)
```

---

### 8.3 Szczegóły naprawy `/panel/naprawy/[id]`

**Endpoint:** `GET /api/v1/staff/repairs/{id}/`

#### Hero sekcja

```
Lewy górny: "← Wróć do napraw" (link, muted color)
Ikona urządzenia (50px, var(--s2) tło, border)
Nr naprawy: FONT DISPLAY, 16px, bold (np. "PK-54298")
Nazwa urządzenia + opis usługi
Rząd badge'y: StatusBadge + PriorityBadge + SLA info
Shimmer niebieski 2px na górze karty (staff)
```

#### Quick actions (prawa strona hero)

```typescript
// Przyciski:
// "Zmień status" (zielony) → openStatusModal(id)
// "Wiadomość" (niebieski)  → scrollTo + focus na textarea komun.
// "..." (secondary)        → dropdown: Drukuj przyjęcie / Duplikuj / Otwórz reklamację

// Na górze widoku: "← Wróć do napraw" (BRAKOWAŁO w admin detail)
```

#### StatusChangeModal — POPRAWIONA KOLEJNOŚĆ PÓL (FIX!)

```typescript
// components/repairs/StatusChangeModal.tsx
// NOWA KOLEJNOŚĆ (zgodna z logiką pracownika "co zrobiłem → co powiedzieć"):
// 1. BLOKER SPRAWY (opcjonalny) — "Co mnie blokuje? Co właśnie usunąłem?"
// 2. STATUS WEWNĘTRZNY          — "Co technicznie zrobiłem?"
// 3. STATUS PUBLICZNY           — "Co zobaczy klient?"
// 4. NOTATKA WEWNĘTRZNA         — opcjonalna
// 5. SUGEROWANA WIADOMOŚĆ       — pojawia się po wyborze statusu publicznego

// Logika sugerowanej wiadomości:
// Jeśli backend zwraca suggested_sms w response → użyj
// Jeśli nie → GET /communications/templates/?trigger={new_status}&channel=panel
// Wyświetl w niebieskim boksie z przyciskami "Wyślij SMS" / "Wyślij e-mail" / "Wyślij oba"

// WAŻNE: Modal NIE zamyka się po POST change-status
// Zamknij dopiero gdy user kliknie "Wyślij" lub "Pomiń komunikat"

// CONFIRMACJA dla statusu 'delivered' (Wydano klientowi):
// Przed POST → useConfirm:
// title: "Oznaczyć urządzenie jako wydane?"
// description: "Ta akcja oznaczy urządzenie PK-XXXXX jako wydane klientowi. Nie można cofnąć."
// confirmLabel: "Tak, wydano"
// variant: 'danger'
// Jeśli user anuluje → nie wysyłaj POST
```

#### Zakładki szczegółów

```typescript
// [Szczegóły] [Checklista (X/10)] [Test końcowy] [Komunikacja] [Wycena] [Historia klienta]

// ZAKŁADKA: Szczegóły
// 2 kolumny: lewa (dane + timeline + tagi), prawa (następne działanie + status + klient + kosztorys)

// ZAKŁADKA: Checklista
// Pasek postępu: 4px, niebieski gradient, transition: width .5s
// Sekcje: PRZYJĘCIE | DIAGNOSTYKA I WYCENA | NAPRAWA | WYDANIE
// Checkbox toggle → PATCH /staff/repairs/{id}/checklist/{item_id}/ optimistic update
// BLOKADA KROKÓW (FIX!):
//   - Kroki w sekcji NAPRAWA są zablokowane (pointer-events: none, opacity .4)
//     dopóki wszystkie kroki w DIAGNOSTYKA I WYCENA nie są zaznaczone
//   - Specjalny krok "Część zamówiona i dostarczona":
//     gdy PartUsage.status === 'arrived' → zielona ramka glowG + "⚡ ZAMONTUJ TERAZ!"
//   - Krok "Wydanie" → zablokowany dopóki Test końcowy nie zaliczony

// ZAKŁADKA: Test końcowy
// Szablon wg device_category (kliknij → cykl: na → pass → fail → na)
// PATCH /staff/repairs/{id}/test-items/{item_id}/
// Jeśli fail → czerwony baner ostrzeżenia

// ZAKŁADKA: Komunikacja
// Wątek wiadomości + pole kompozycji
// LICZNIK ZNAKÓW SMS (FIX!):
//   Gdy zakładka "SMS" aktywna → pokaż licznik pod textarea: "X / 160 znaków"
//   Jeśli > 160 → pokaż "2 SMS (X / 320)" itd.
//   Kolor licznika: zielony → amber przy 130+ → czerwony przy 155+
// AUTO-SAVE DRAFTU (FIX!):
//   onChange textarea → debounce 1000ms → localStorage.setItem(`draft-${repairId}`, value)
//   onMount → if localStorage.getItem(`draft-${repairId}`) → przywróć do textarea
//   onSend → localStorage.removeItem(`draft-${repairId}`)

// ZAKŁADKA: Historia klienta
// GET /staff/repairs/?client={client_id}&status=delivered
// Lista arch-row + sekcja "Podobne naprawy" (ten sam device_category)
```

---

### 8.4 Przyjęcie stacjonarne `/panel/przyjecie`

#### Krok 2 — wybór kategorii (FIX!)

```typescript
// Kliknięcie kategorii:
// 1. Animacja kliknięcia: scale 0.96 → 1 (transform transition .1s)
// 2. Czerwony/niebieski border + kolorowe tło
// 3. Sidebar podgląd reaguje NATYCHMIAST (React state, bez API)
// 4. Auto-scroll do następnego pola (device brand) po .2s

function DeviceCategoryGrid({ value, onChange }) {
  const categories = [
    { id: 'phone',     icon: '📱', label: 'Telefon'   },
    { id: 'laptop',    icon: '💻', label: 'Laptop'    },
    { id: 'tablet',    icon: '📟', label: 'Tablet'    },
    { id: 'desktop',   icon: '🖥', label: 'Komputer'  },
    { id: 'printer',   icon: '🖨', label: 'Drukarka'  },
    { id: 'console',   icon: '🎮', label: 'Konsola'   },
  ]
  return (
    <div className="grid grid-cols-3 gap-[7px] mb-[11px]">
      {categories.map(c => (
        <motion.button
          key={c.id}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            onChange(c.id)
            setTimeout(() => brandRef.current?.focus(), 200) // auto-scroll
          }}
          className={`
            p-[9px_7px] rounded-[9px] border-[1.5px] text-center transition-all duration-150
            ${value === c.id
              ? 'border-[var(--blue)] bg-[var(--bl)]'
              : 'border-[var(--faint)] bg-[var(--s3)] hover:border-[var(--border2)]'
            }
          `}
        >
          <div className="text-[17px] mb-1">{c.icon}</div>
          <div className={`text-[11px] font-semibold ${value === c.id ? 'text-[var(--blue)]' : 'text-[var(--muted)]'}`}>
            {c.label}
          </div>
        </motion.button>
      ))}
    </div>
  )
}
```

#### Typ usługi — KRYTYCZNE

```html
<!-- NIE to: -->
<select name="service_type">...</select>

<!-- ZAWSZE tak: -->
<input
  type="text"
  name="service_type"
  placeholder="Opisz zakres naprawy ręcznie, np. 'Wymiana ekranu OLED + diagnostyka baterii'"
  className="finput w-full"
/>
<!-- Nad polem info baner: "💡 Wpisz zakres naprawy ręcznie — pełna swoboda opisu" -->
```

---

### 8.5 Historia napraw `/panel/historia`

**Endpoint:** `GET /api/v1/staff/repairs/?assigned_to=me&status=delivered`

Typy wierszy (5 wariantów wizualnych):
1. **Standardowa** — zielony "Odebrana ✓", szare tło
2. **Reklamacja** — pomarańczowy border, badge "Reklamacja", ostrzeżenie pod wierszem
3. **Nieodebrana** — czerwony border, badge "Nieodebrana Xd!", przycisk "Zadzwoń"
4. **Gwarancja** — fioletowy badge "Gwarancja 90d", data ważności
5. **Powracający klient** — cyan badge "VIP powracający", info o poprzednich naprawach

---

### 8.6 Zadania `/panel/zadania` (ROZBUDOWANIE!)

**Endpoint:** `GET /api/v1/tasks/?assigned_to=me`

```typescript
// Page header:
// Tytuł: "Moje zadania"
// Przycisk: "+ Dodaj zadanie" → inline form lub modal

// Filtry scope (pod header):
// [ Wszystkie ] [ Dziś ] [ Pilne ] [ Zakończone ]
// Params: ?status=open, ?priority=urgent, ?status=done

// Dwie kolumny:
// LEWA: "Otwarte · {scope}" (count badge amber)
// PRAWA: "Zakończone dziś" (count badge zielony)

// INLINE forma "Dodaj zadanie" (FIX!):
// Po kliknięciu "+ Dodaj zadanie" → pojawia się inline formularz NA GÓRZE listy
// Pola: input tytułu + select priorytetu + date picker (opcjonalny) + "Dodaj" button
// animacja slideDown
// POST /tasks/ body: {title, priority, due_date?, related_repair?}

// Wiersz zadania:
// Checkbox (optimistic toggle) → PATCH /tasks/{id}/ body: {status: 'done'}
// Tytuł + badge priorytetu (Pilne=czerwony, Wysoki=amber, Normalny=brak) + link do naprawy
// Przy done: przekreślony tekst, czas ukończenia

// Filtr scope → params: ?scope=today → backend filtruje wg due_date
// lub oblicz po frontendzie gdy backend nie wspiera
```

---

### 8.7 Części `/panel/czesci` (ROZBUDOWANIE!)

**Endpoint:** `GET /api/v1/staff/repairs/?assigned_to=me` → dla każdej → `/staff/repairs/{id}/parts/`

```typescript
// Page header:
// Eyebrow: "Magazyn"
// Tytuł: "Moje części"
// Subtitle: "Części przypisanych napraw"

// Filtry (FIX! — brakowało):
// [ Wszystkie ] [ W drodze ] [ Dotarły — zamontuj! ] [ Użyte ]
// Params: ?status=in_transit, ?status=arrived, ?status=used

// SEKCJA "Aktywne części" (cz-row format):
// Każdy wiersz:
// - Ikona urządzenia (30px, var(--s3) tło)
// - Nazwa części + meta (naprawa, dostawca, data)
// - Badge statusu:
//   in_transit: niebieski "W drodze"
//   arrived:    ZIELONY "Dotarła ✓" + animacja glowG + tekst ZAMONTUJ!
//   used:       szary "Użyta"
//   ordered:    amber "Zamówiona"

// Badge "Zamontuj!" dla arrived:
// background: var(--gl), color: var(--green), border: var(--gb)
// animation: glowG 2s infinite
// font-weight: 800
// tekst: "Zamontuj!" (nie "Arrived")

// SEKCJA "Hurtownie" (FIX! — brakowało):
// Lista 3 kart dostawców: Dostawca A - GSM Parts PL | Dostawca B - MobileHub | Dostawca C - iTech Supply
// Każda karta: nazwa + URL + "Czas dostawy: X dni"
// GET /inventory/suppliers/
```

---

### 8.8 Reklamacje `/panel/reklamacje` (ROZBUDOWANIE!)

**Endpoint:** `GET /api/v1/staff/repairs/?is_complaint=true`

```typescript
// Page header:
// Tytuł: "Reklamacje i gwarancje"
// Przyciski: (brak — pracownik nie tworzy reklamacji)

// Filtry (FIX! — brakowało):
// [ Wszystkie ] [ W toku ] [ Oczekuje ] [ Zamknięte ] | [ Reklamacje ] [ Gwarancje ]

// Lista reklamacji (rek-row format):
// Każdy wiersz:
// - Nr reklamacji (REK-001) + nr naprawy (PK-54187)
// - Ikona urządzenia + opis problemu
// - Meta: klient · kto zgłosił · kiedy · przypisany pracownik
// - StatusBadge reklamacji: "W toku" (amber) / "Oczekuje" (niebieski) / "Zamknięta" (szary)
// - Kliknięcie → szczegóły naprawy /panel/naprawy/{id}
```

---

### 8.9 Powiadomienia `/panel/powiadomienia` (ROZBUDOWANIE!)

**Endpoint:** `GET /api/v1/accounts/notifications/`

```typescript
// Page header:
// Tytuł: "Powiadomienia"
// Przycisk: "Oznacz wszystkie" → POST /accounts/notifications/mark-all-read/

// Filtry:
// [ Wszystkie ] [ Nieprzeczytane ] [ Części ] [ Wiadomości ] [ Zadania ] [ System ]

// GRUPOWANIE (FIX! — brakowało):
// Sekcja "Dzisiaj"
// Sekcja "Wczoraj"
// Sekcja "Wcześniejsze" (starsze niż 2 dni)

// Każde powiadomienie (notif-item format):
// - Czerwona kropka (5px) po lewej gdy is_read === false (position absolute)
// - Ikona w kolorowym tle (30px, zaokrąglone)
// - Tytuł (bold) + opis (muted)
// - Czas po prawej (relative: "5 min", "2 godz", "wczoraj", "08.01")
// - Kliknięcie → PATCH /notifications/{id}/ {is_read: true} + navigate do naprawy (optimistic)

// Typy powiadomień + ikony + kolory:
// part_arrived:    📦 zielony  → "Bateria MacBook Pro dotarła! · PK-54298"
// new_message:     💬 czerwony → "Nowa wiadomość — Kowalski Jan · 'Kiedy telefon...'"
// quote_accepted:  ✅ amber    → "Wycena zaakceptowana — Nowak Anna · 480 zł"
// sla_warning:     ⏰ czerwony → "SLA zagrożone — PK-54321 · termin: jutro 17:00"
// repair_assigned: 👤 niebieski→ "Nowa naprawa przypisana — PK-54356 · Samsung S24"
// status_changed:  🔄 szary   → (systemowe zmiany statusów)
```

---

### 8.10 Wyszukiwanie `/panel/wyszukiwanie`

**Endpoint:** `GET /api/v1/search/global/?q={query}`

```typescript
// DUŻE POLE WYSZUKIWANIA (52px wysokości):
// - Ikona lupy + input + skrót ⌘K po prawej
// - Fokus: niebieska poświata
// - Placeholder: "Szukaj: PK-54321, Kowalski, +48 600, IMEI, iPhone 15…"
// - oninput debounce 300ms → GET /search/global/?q={val}

// OSTATNIE WYSZUKIWANIA (FIX! — były statyczne):
// localStorage: prokom-recent-searches (max 5 pozycji, FIFO)
// Chip = klikalne → wypełnia pole + uruchamia search
// Usuwanie: × na każdym chipie

// Zakładki filtrów:
// [ Wszystko ] [ Moje naprawy ] [ Archiwum ] [ Klienci ] [ Części ]
// Filtruj wyniki z API po sekcjach

// Sekcje wyników (groupBy type):
// "Moje aktywne naprawy (N)" — trow format, kliknięcie → /panel/naprawy/{id}
// "Historia napraw (N)"       — arch-row format
// "Klienci"                   — row format z avatarem

// Animacja wyników: fadeUp przy pojawieniu się (po 2+ znakach w inpucie)
```

---

### 8.11 Kalendarz `/panel/kalendarz`

**Endpoint:** `GET /api/v1/calendar/events/?assigned_to=me&start={date}&end={date}`

```typescript
// Layout: 2 kolumny (siatka 7×6 | sidebar)

// Siatka kalendarza:
// Nawigacja: ← "Styczeń 2025" → + badge "Dziś: Wt 14"
// 7 nagłówków DOW: Pon Wt Śr Czw Pt Sob(25% opacity) Nd(20% opacity)
// Komórki dni: min-height 80px, border-radius 10px, padding 6px

// KLASY CSS (z panel-admin.html):
// .cal-day { min-height:80px; border-radius:10px; padding:6px 8px; cursor:pointer }
// .cal-day:hover { background: rgba(255,255,255,.035) }
// .cal-day.today { background: rgba(220,30,30,.07); border: 1px solid rgba(220,30,30,.2) }
// .cal-day.other-month { opacity: .35 }
// .cal-event { font-size:9.5px; font-weight:600; padding:2px 6px; border-radius:5px; margin-bottom:2px; white-space:nowrap; overflow:hidden }
// .cal-event.pickup  { bg: rgba(34,197,94,.15);  color: green  }
// .cal-event.task    { bg: rgba(245,158,11,.15); color: amber  }
// .cal-event.repair  { bg: rgba(59,130,246,.15); color: blue   }
// .cal-event.urgent  { bg: rgba(220,30,30,.15);  color: red    }
// .cal-event.unavail { bg: rgba(255,255,255,.06); color: muted  }

// INTERAKCJA z eventem (FIX! — brakowało):
// Kliknięcie w event → popup (mini-modal) z detalami:
//   - title + type badge + opis
//   - Jeśli repair event → link "Otwórz naprawę →" → /panel/naprawy/{id}
//   - Jeśli task event → link "Otwórz zadanie →"
// Popup: position absolute, card style, z-index wysoki, zamknij onClick outside

// Sidebar kalendarza:
// Legenda typów eventów (colored box 11×11px)
// "Dziś · {data}" → lista eventów dnia (klikalne)
// "Jutro · {data}" → lista eventów jutrzejszego dnia
```

---

### 8.12 Nieprzypisane `/panel/nieprzypisane`

**Endpoint:** `GET /api/v1/staff/repairs/?assigned_to__isnull=true&status=new`

```typescript
// READ-ONLY — pracownik NIE może przypisywać
// Info baner: niebieski, wyjaśnia zasady
// Alert dla najstarszej naprawy: czerwony boks + "Pilnie → Admin" button
//   → POST /staff/repairs/{id}/notes/ body: {content: "Proszę o pilne przypisanie", note_type: "internal"}
//   → toast "✓ Powiadomienie wysłane do admina"

// Tabela: Nr ref | Urządzenie | Klient | Kategoria | Oczekiwanie | Sugerowany
// Oczekiwanie kolorowanie:
//   < 3h:  amber
//   3-12h: amber/orange
//   > 12h: orange + ⚠
//   > 24h: czerwony + ⚠⚠

// Stopka z info o specjalizacjach pracownika
// Przycisk "Wyślij sugestię przypisania" dla napraw pasujących do specjalizacji
```

---

### 8.13 Klienci `/panel/klienci`

**Endpoint:** `GET /api/v1/clients/?search={q}`

```typescript
// Wyszukiwarka: debounce 300ms → GET /clients/?search={q}
// Filtry: [ Wszyscy ] [ Stali ] [ VIP ] [ Firmy ] [ Aktywna naprawa ]
// Lista klientów: avatar + imię + badge VIP/B2B + kontakt + liczniki napraw
// Paginacja: "Wyświetlono X z Y klientów"
// Kliknięcie → GET /clients/{id}/ + GET /staff/repairs/?client={id}
```

---

### 8.14 Komunikacja `/panel/komunikacja`

**Endpoint lista wątków:** `GET /api/v1/staff/repairs/?has_unread_messages=true`

```typescript
// Layout: 2 kolumny (lista wątków | aktywny wątek)
// Wątek = naprawa z nieprzeczytanymi wiadomościami od klienta

// Aktywny wątek:
// GET /staff/repairs/{id}/messages/?note_type=client
// POST /staff/repairs/{id}/notes/ body: {content, note_type: 'client'}

// Sugerowana odpowiedź:
// GET /communications/templates/?trigger={status}&channel=panel
// Pokaż jako niebieski box "💡 Sugerowana odpowiedź"

// Licznik SMS (FIX!): patrz §8.3 zakładka Komunikacja
// Auto-save draftu (FIX!): patrz §8.3 zakładka Komunikacja
```

---

### 8.15 Wszystkie naprawy `/panel/wszystkie`

**Endpoint:** `GET /api/v1/repairs/` (bez filtra assigned_to)

```typescript
// READ-ONLY dla pracownika (FIX! — było zbyt ubogie)
// Info baner: "Tryb podglądu · Twoje naprawy wyróżnione · Przepisywanie przez admina"

// Moje naprawy (assigned_to.id === currentUser.id):
// - NIEBIESKA LINIA LEWA zawsze widoczna (nie tylko na hover)
// - tekst "(ja)" przy nazwisku w kolumnie Przypisany

// Kliknięcie wiersza (FIX! — konfuzja):
// - navigate → /panel/naprawy/{id} dla swoich napraw (pełny widok)
// - navigate → /panel/podglad/{id} dla cudzych napraw (read-only, bez przycisków edycji)
// LUB: otwórz detail ale ukryj przyciski "Zmień status" / "Wiadomość" dla napraw nie swoich
```

---

### 8.16 Odbiory `/panel/odbiory`

```typescript
// LEWA: "Gotowe do odbioru"
// GET /staff/repairs/?assigned_to=me&status=ready_for_pickup
// Każda karta: nr ref + urządzenie + klient + czas oczekiwania + pracownik
// "Nie powiadomiony!" → przycisk "Wyślij SMS"
//   POST /communications/send/ body: {repair_id, channel: 'sms', template_type: 'ready_for_pickup'}

// PRAWA: "Wydane dziś"
// GET /staff/repairs/?assigned_to=me&status=delivered&delivered_today=true
// Kompaktowe wiersze: nr ref + czas ✓ + urządzenie + kwota

// Brak sekcji "Nieodebrane >7 dni" w widoku pracownika (to jest w admin)
```

---

## ROZDZIAŁ 9 — PANEL ADMINA: WSZYSTKIE WIDOKI

### 9.1 Dashboard `/admin-panel/dashboard`

**Endpoint:** `GET /api/v1/analytics/kpi/`

```typescript
// Jeśli /analytics/kpi/ nie istnieje → oblicz z GET /repairs/?page_size=500
// 4 alerty zarządcze obliczaj po frontend stronie (kanoniczne EN trasy admina):
const alerts = [
  { type: 'unassigned', count: repairs.filter(r => !r.assigned_to).length,
    title: `${count} napraw bez przypisanego pracownika`,
    severity: count > 0 ? 'red' : null,
    href: '/admin-panel/unassigned' },
  { type: 'sla_overdue', count: repairs.filter(r => r.sla_overdue).length,
    title: `${count} napraw z przekroczonym SLA`,
    href: '/admin-panel/repairs?status=in_progress' },
  { type: 'waiting_response',
    count: repairs.filter(r => r.status === 'waiting_for_quote_approval').length,
    title: `${count} klientów czeka na odpowiedź`,
    href: '/admin-panel/comm' },
  { type: 'uncollected',
    count: repairs.filter(r => r.status === 'ready_for_pickup' && r.days_waiting > 3).length,
    title: `${count} gotowych urządzeń nieodebranych >3 dni`,
    href: '/admin-panel/pickups' },
]
// Jeśli count === 0 → ukryj alert (nie renderuj)
```

---

### 9.2 Lista napraw admina `/admin-panel/repairs`

```typescript
// DODATKOWE vs lista pracownika:
// Checkbox bulk select (Zustand selectedRepairIds)
// Kolumna "Przypisany": avatar + imię + ikona strzałek → openAssignModal(repair.id)

// WYRÓŻNIENIE zaznaczonych wierszy (FIX!):
// Gdy repair.id w selectedRepairIds:
//   background: rgba(59,130,246,.07)  ← niebieski odcień tła
//   border-left: 2px solid var(--blue)
// Checkbox: pokazuj zawsze na hover + gdy zaznaczony

// BULK ACTION BAR (Framer Motion slideDown/slideUp):
// AnimatePresence: jeśli selectedRepairIds.length > 0 → pokaż bar
// Niebieski gradient tło, shadow
// "Zaznaczono: N napraw"
// Przyciski: "Przypisz" | "Zmień status" | "Eksportuj CSV"
// "✕ Anuluj" → clearSelection()

// Filter pills zawierają filtry po pracownikach:
// [ Wszystkie ] [ W naprawie ] [ Czeka na część ] [ Gotowe ] [ Nieprzypisane ] | [ Kuba P. ] [ Rafał P. ] [ Marek K. ] | [ Reklamacje ]
```

---

### 9.3 Wyszukiwanie admina `/admin-panel/search`

**Endpoint:** `GET /api/v1/search/advanced/`

```typescript
// Page header:
// Tytuł: "Wyszukiwanie globalne"
// Subtitle: "Szukaj po: IMEI, nr tel, kliencie, nr naprawy, modelu, opisie usterki"

// GŁÓWNE POLE (52px):
// identyczne jak w panelu pracownika
// ⌘K shortcut
// Placeholder: "Szukaj: PK-54321, Kowalski, +48 600, 354612..., 'rozbity ekran'..."
// GET /search/global/?q={val}  lub  GET /search/advanced/ z filtrami

// ZAAWANSOWANE FILTRY (rozwijane po kliknięciu "Filtry"):
// Animacja slideDown
// Status: select (Nowe / W naprawie / Czeka / Gotowe / Wydane)
// Kategoria: select (Telefon / Laptop / Tablet / ...)
// Priorytet: select (Normalny / Wysoki / Pilne)
// Przypisany: select (pracownicy z /accounts/staff/)
// Data od: date input
// Data do: date input
// Gwarancja: checkbox
// Reklamacja: checkbox

// OSTATNIE WYSZUKIWANIA: localStorage (jak w panelu pracownika, klikalne chipy)

// SEKCJE WYNIKÓW:
// "Naprawy aktywne (N)" — trow format, kliknięcie → /admin-panel/naprawy/{id}
// "Historia napraw (N)"  — arch-row format
// "Klienci (N)"          — row format

// Link w sidebarze admina (FIX! — brakowało!):
// Dodaj do sekcji GŁÓWNE: { id: 'wyszukiwanie', label: 'Wyszukiwanie', href: '/admin-panel/wyszukiwanie', icon: Search }
```

---

### 9.4 Klienci admina `/admin-panel/clients`

**Endpoint:** `GET /api/v1/clients/`

```typescript
// Page header:
// Tytuł: "Klienci"
// Subtitle: "Baza klientów · N łącznie"
// Przycisk: "+ Nowy klient"

// WYSZUKIWARKA (FIX! — brakowało):
// input full-width, debounce 300ms
// GET /clients/?search={q}
// Placeholder: "Szukaj po nazwie, telefonie, emailu, NIP..."

// FILTRY (FIX! — brakowały):
// [ Wszyscy(N) ] [ VIP(N) ] [ Firmy(N) ] [ Stali(N) ] [ Aktywna naprawa(N) ]
// Params: ?is_premium=true, ?is_company=true

// Lista klientów: row format (identyczny jak w panelu pracownika)
// Avatar (okrągły dla osób, kwadratowy dla firm)
// Tagi: VIP (amber), B2B Firma (niebieski), Stały (szary)
// Liczniki: naprawy | aktywne | reklamacje
// Kliknięcie → /admin-panel/klienci/{id}

// Paginacja: "Wyświetlono X z Y klientów"
```

---

### 9.5 Kalendarz admina `/admin-panel/calendar`

**Endpoint:** `GET /api/v1/calendar/events/?start={date}&end={date}&assigned_to=all`

```typescript
// Admin widzi eventy WSZYSTKICH pracowników (nie tylko swoje)
// Dodatkowy typ eventu: .unavail (niedostępność pracownika)

// SIATKA 7×6 (FIX! — admin miał tylko sidebar, bez siatki):
// IDENTYCZNA implementacja jak w panelu pracownika (§8.11)
// Różnica: zdarzenia dla wszystkich, nie tylko assigned_to=me

// INTERAKCJA z eventem (FIX!):
// Kliknięcie → popup z detalami + link do naprawy/zadania

// Sidebar kalendarza:
// Legenda + Dziś + Jutro + "Dostępność zespołu"
// Dostępność: GET /availability/?date={today}
// Lista pracowników: avatar + imię + status dot + opis
// Kolory: zielony=dostępny, amber=zajęty, orange=zewnętrzny, gray=nieobecny
```

---

### 9.6 Reklamacje admina `/admin-panel/claims`

**Endpoint:** `GET /api/v1/repairs/?is_complaint=true`

```typescript
// Page header:
// Tytuł: "Reklamacje i Gwarancje"
// Przycisk: "+ Nowa reklamacja" (czerwony CTA)

// Filtry (FIX! — brakowały):
// [ Wszystkie ] [ Reklamacje ] [ Gwarancje ] | [ W toku ] [ Oczekuje ] [ Zamknięte ]

// Lista (rek-row format):
// REK-001 · PK-54187 | Dell XPS 15 - Płyta główna | TechCorp · 3 dni temu · Rafał P. | "W toku" (amber)
// REK-002 · PK-53500 | iPhone 13 - Jakość ekranu | Zając Tomasz · wczoraj · Kuba P. | "Oczekuje" (niebieski)
// GAW-001 · PK-52100 | iPad Air - Wyświetlacz | Nowak Anna · tydzień temu | "Zamknięta" (szary)

// Każdy wiersz:
// - ikona 🛡️ dla reklamacji, ⚠️ dla gwarancji
// - kliknięcie → /admin-panel/naprawy/{repair_id}
// - Admin może oznaczyć decyzję: "Uznana" | "Odrzucona"
```

---

### 9.7 Powiadomienia admina `/admin-panel/notif`

**Endpoint:** `GET /api/v1/accounts/notifications/`

```typescript
// Identyczna implementacja jak powiadomienia pracownika (§8.9)
// ALE: dodatkowe typy powiadomień admina:
// new_unassigned:  👤 amber    → "Nowe zgłoszenie bez przypisania — PK-54400 · Sugerowany: Rafał P."
// part_arrived:    📦 niebieski→ "Część dotarła — Bateria MacBook Pro · Dostawca A · PK-54298"
// complaint:       🛡 fioletowy→ "Nowa reklamacja — Dell XPS 15 · TechCorp"

// Sekcje: Dzisiaj | Wczoraj | Wcześniejsze (FIX! — brakowało grupowania)
```

---

### 9.8 Odbiory admina `/admin-panel/pickups`

```typescript
// Grid 3 kolumny (FIX! — brakowała 3. kolumna):

// KOLUMNA 1: "Gotowe do odbioru"
// GET /repairs/?status=ready_for_pickup
// Karty z: nr ref + urządzenie + klient + czas oczekiwania + przypisany

// KOLUMNA 2: "Nieodebrane >7 dni" (FIX! — brakowało!)
// GET /repairs/?status=ready_for_pickup&days_since_ready__gt=7
// Czerwone ramki kart
// Czas oczekiwania: czerwony text + "⚠ Kontakt wymagany"
// Przycisk "Zadzwoń" (czerwony)

// KOLUMNA 3: "Wydane dziś"
// GET /repairs/?status=delivered&delivered_today=true
// Kompaktowe wiersze z ✓ + godziną + kwotą
```

---

### 9.9 Części admina `/admin-panel/parts`

```typescript
// Grid 2 kolumny:

// LEWA: "Aktywne części"
// GET /inventory/purchase-orders/?status=in_progress
// + GET /staff/repairs/ wszystkich pracowników → parts usage
// Każdy wiersz (czesc-row):
//   - nazwa części + naprawa + dostawca
//   - StatusBadge: W drodze(niebieski) / Dotarła(zielony+glow) / Użyta(szary)
//   - Przypisany pracownik

// PRAWA: "Hurtownie" (FIX! — brakowało!)
// GET /inventory/suppliers/
// Każda karta dostawcy: nazwa + URL + czas dostawy
// Przycisk "+ Zamów część" → otwiera modal/formularz
```

---

### 9.10 Obciążenie zespołu `/admin-panel/workload`

```typescript
// GET /analytics/staff-kpi/ → StaffKPI[]
// GET /availability/?date={today} → dostępność
// GET /repairs/?status__in=in_progress,waiting_for_parts → grupuj po assigned_to

// 3 karty pracowników (grid 3 kolumny)
// Karta: avatar + imię + specjalizacje + dostępność
// Grid 4 statystyk: Aktywne | Pilne | Gotowe | Reklamacje
// Pasek obciążenia: (active_count/10)*100%, kolor: green<60%, amber 60-80%, red>80%
// Health score Unbounded font

// Tabela pod kartami: naprawy wg pracownika
// Przełącznik pracownik tabs
// Każdy wiersz: ikona przepisania → router.push(/admin-panel/repairs/{id})
```

---

### 9.11 Statystyki `/admin-panel/stats`

```typescript
// GET /analytics/kpi/
// GET /analytics/repairs-chart/?period=day&start={30d_ago}&end={today}
// GET /analytics/category-chart/
// GET /analytics/staff-kpi/

// 6 KPI kart (grid 3+3):
// Naprawy przyjęte | Przychód | Śr. czas naprawy | Reklamacje | Wskaźnik rek. | Zadowolenie

// Bar chart (SVG): 14 słupków, dzisiaj = czerwony
// Donut chart (SVG): segmenty wg kategorii
// Tabela pracowników: imię + spec-tagi + naprawy + rek. + śr. SLA + health + obciążenie

// Przełącznik okresu: [ Dziś ] [ Ten miesiąc ] + date range picker
```

---

### 9.12 Szczegóły naprawy admina `/admin-panel/repairs/[id]`

```typescript
// IDENTYCZNE jak worker detail ale:
// 1. "← Wróć do napraw" (FIX! — brakowało w admin)
// 2. Przycisk "Przepisz" → openAssignModal(id) (worker nie ma tego przycisku)
// 3. AssignModal globalny (renderowany w admin layout)
// 4. Widoczność WSZYSTKICH notatek (nie tylko client type)
// 5. Zakładka "Historia przypisań" (zamiast "Historia klienta")

// AssignModal (globalny, w admin layout):
// GET /accounts/staff/ → lista pracowników
// System sugeruje: matchuj device_category z specializations + niższy workload
// Sugerowany pracownik: zielony border + badge "✓ Sugerowany" (automatycznie zaznaczony)
// POST /repairs/{id}/assign/ body: {assigned_to: userId}
// onSuccess: toast "✓ Pracownik przypisany" + invalidate queries

// Potwierdzenie dla 'delivered' (FIX!):
// Ta sama logika co w §8.3 StatusChangeModal
```

---

## ROZDZIAŁ 10 — ENDPOINTY API (kompletna tabela)

Prefix: `NEXT_PUBLIC_API_URL + /api/v1/`

| Metoda | URL | Panel | Opis |
|--------|-----|-------|------|
| POST | `/accounts/login/` | All | `{email, password}` → `{token, user}` |
| POST | `/accounts/logout/` | All | — |
| GET  | `/accounts/me/` | All | Zalogowany user |
| GET  | `/accounts/staff/` | Admin | Lista pracowników |
| POST | `/accounts/staff/` | Admin | Dodaj pracownika |
| PATCH | `/accounts/staff/{id}/` | Admin | Edycja |
| POST | `/accounts/staff/{id}/reset-password/` | Admin | Reset hasła |
| GET  | `/accounts/notifications/` | Staff/Admin | Lista powiadomień |
| GET  | `/accounts/notifications/count/` | All | `{unread: number}` |
| PATCH | `/accounts/notifications/{id}/` | All | `{is_read: true}` |
| POST | `/accounts/notifications/mark-all-read/` | All | — |
| GET  | `/staff/repairs/` | Staff | Naprawy (dla staff) `?assigned_to=me ?status= ?search=` |
| GET  | `/staff/repairs/{id}/` | Staff | Szczegóły naprawy |
| PATCH | `/staff/repairs/{id}/` | Staff | Edycja |
| POST | `/staff/repairs/{id}/change-status/` | Staff | `{status, notes?}` |
| POST | `/staff/repairs/{id}/assign/` | Admin | `{assigned_to: id}` |
| POST | `/staff/repairs/{id}/notes/` | Staff/Admin | `{content, note_type}` |
| POST | `/staff/repairs/{id}/images/` | Staff | FormData |
| GET  | `/staff/repairs/{id}/timeline/` | Staff | `TimelineEvent[]` |
| GET  | `/staff/repairs/{id}/messages/` | Staff | `RepairNote[]` |
| GET  | `/staff/repairs/{id}/parts/` | Staff | `PartUsage[]` |
| POST | `/staff/repairs/{id}/parts/` | Staff | `{part_id, quantity, unit_price}` |
| GET  | `/staff/repairs/{id}/cost-summary/` | Staff | `CostSummary` |
| GET  | `/staff/dashboard/` | Staff | `?scope=today\|tomorrow\|week\|month` |
| GET  | `/repairs/` | Admin | Wszystkie naprawy |
| POST | `/repairs/` | Admin | Tworzenie (intake) |
| GET  | `/repairs/{id}/` | Admin | Szczegóły |
| PATCH | `/repairs/{id}/` | Admin | Edycja |
| POST | `/repairs/{id}/change-status/` | Admin | Zmiana statusu |
| POST | `/repairs/{id}/assign/` | Admin | `{assigned_to: id}` |
| POST | `/repairs/{id}/notes/` | Admin | Notatka |
| GET  | `/repairs/{id}/timeline/` | Admin | Timeline |
| GET  | `/repairs/{id}/messages/` | Admin | Wiadomości |
| GET  | `/repairs/{id}/parts/` | Admin | Części |
| POST | `/repairs/{id}/parts/` | Admin | Dodaj część |
| GET  | `/repairs/{id}/cost-summary/` | Admin | Koszty |
| POST | `/repairs/submit/` | Public | AllowAny — formularz online |
| GET  | `/clients/` | All | `?search= ?is_company= ?is_premium=` |
| POST | `/clients/` | Admin | Tworzenie |
| GET  | `/clients/{id}/` | All | Szczegóły |
| PATCH | `/clients/{id}/` | Admin | Edycja |
| GET  | `/devices/brands/` | All | Marki |
| GET  | `/devices/models/` | All | `?brand={id}&category={cat}` |
| GET  | `/pricing/quotes/` | All | `?repair={id}` |
| POST | `/pricing/quotes/` | Staff | Tworzenie wyceny |
| PATCH | `/pricing/quotes/{id}/` | Staff | Edycja |
| POST | `/pricing/quotes/{id}/items/` | Staff | `{description, quantity, unit_price}` |
| GET  | `/pricing/labour-types/` | All | Typy robocizny |
| GET  | `/pricing/deposits/` | All | `?repair={id}` |
| POST | `/pricing/deposits/` | Staff | Kaucja |
| GET  | `/inventory/suppliers/` | All | Dostawcy |
| GET  | `/inventory/parts/` | All | `?supplier= ?category= ?search=` |
| POST | `/inventory/parts/` | Admin | Tworzenie |
| GET  | `/inventory/purchase-orders/` | Admin | `?supplier= ?status=` |
| POST | `/inventory/purchase-orders/` | Admin | Zamówienie |
| GET  | `/tasks/` | All | `?assigned_to=me ?status= ?priority= ?repair=` |
| POST | `/tasks/` | All | Tworzenie |
| PATCH | `/tasks/{id}/` | All | Edycja (np. `{status:'done'}`) |
| POST | `/tasks/{id}/comments/` | All | `{content}` |
| GET  | `/availability/` | All | `?user= ?date_from= ?date_to=` |
| POST | `/availability/` | All | Dodaj dostępność |
| PATCH | `/availability/{id}/` | Admin | Edycja |
| GET  | `/calendar/events/` | All | `?start= ?end= ?assigned_to=` |
| POST | `/calendar/events/` | All | Dodaj zdarzenie |
| GET  | `/communications/templates/` | Staff | Szablony |
| POST | `/communications/send/` | Staff | `{repair_id, channel, template_id?, content}` |
| GET  | `/communications/logs/` | All | `?repair={id}` |
| GET  | `/hammer-glass/products/` | All | `?category=` |
| GET  | `/hammer-glass/offers/` | All | `?repair=` |
| POST | `/hammer-glass/offers/` | Staff | Propozycja |
| GET  | `/accessories/products/` | All | `?category=` |
| GET  | `/accessories/offers/` | All | `?repair=` |
| GET  | `/search/global/` | All | `?q= ?limit=10` |
| GET  | `/search/intake/` | Staff | `?q=` — wyszuk. klienta |
| GET  | `/search/advanced/` | Admin | `?q= ?status= ?category= ?assigned_to= ?date_from= ?date_to=` |
| GET  | `/documents/repair/{id}/protocol/` | Staff | PDF protokół |
| GET  | `/documents/repair/{id}/qr/` | Staff | QR code |
| GET  | `/documents/repair/{id}/label/` | Staff | PDF etykieta |
| GET  | `/analytics/kpi/` | Admin | Dashboard KPI |
| GET  | `/analytics/staff-kpi/` | Admin | KPI pracowników |
| GET  | `/analytics/repairs-chart/` | Admin | `?period=day ?start= ?end=` |
| GET  | `/analytics/category-chart/` | Admin | Wg kategorii |
| GET  | `/analytics/revenue-chart/` | Admin | Przychód |
| GET  | `/orders/` | Admin | Zamówienia |
| POST | `/orders/` | Admin | Tworzenie |
| GET  | `/orders/products/` | Admin | Katalog |
| GET  | `/compliance/requests/` | Admin | Wnioski RODO |
| POST | `/compliance/export-request/` | Client | Eksport danych |

---

## ROZDZIAŁ 11 — STAN IMPLEMENTACJI (AKTUALNY)

### Co zostało zaimplementowane ✅

**Fundament:**
- `lib/api.ts` — fetch-based, `api.*` + `authApi.*` + `fetchAllPages`
- `lib/queryClient.ts` — TanStack Query z ApiError-aware retry
- `store/index.ts` — Zustand AppStore (scope, modals, selectedIds: string[], filters, toasts)
- `globals.css` — CSS variables dark + light mode, animacje Tailwind
- Komponenty bazowe: `Skeleton`, `EmptyState` + EMPTY_STATES, `ErrorState`, `ToastContainer`

**Panel pracownika (`/panel/`):**
- login, dashboard, repairs (+ /[id]), archive, comm, tasks, czesci-hurtownie
- reklamacje-gwarancje, powiadomienia, wyszukiwanie, kalendarz, klienci
- unassigned, odbior, all-repairs, intake, statystyki, dostepnosc, konfiguracja
- WorkerSidebar, PanelTopbar, StatusChangeModal, AssignModal, AddNoteModal

**Panel admina (`/admin-panel/`):**
- dashboard, repairs (+ /[id]), clients (+ /[id]), claims, pickups
- calendar, search, workload, stats, hurtownie, parts, notif
- unassigned, zespol, dostepnosc, zamowienia, konfiguracja
- AdminSidebar, SupplierFormModal, AdminAssignRepairsModal

### Obszary do dalszego doskonalenia ⚠️

1. **ConfirmDialog** — pokryte dla: bulk `delivered` (admin/repairs), `Zablokuj konto` (zespol), zmiana statusu (StatusChangeModal, WorkerStatusChangeModal). Pozostałe akcje nie są destruktywne.
2. **Optimistic updates** — wdrożone na checkliście i powiadomieniach; inne mutacje nie mają rollback.
3. **⌘K shortcut** — topbar search nie ma skrótu klawiaturowego.

### Przy dodawaniu nowych widoków — checklist

- [ ] `useQuery` z `isLoading` → `Skeleton`
- [ ] `error` → `ErrorState` z `onRetry`
- [ ] Pusta lista → `EmptyState` z EMPTY_STATES
- [ ] Paginacja → `page` w URL params, `page_size=20`
- [ ] Filtry → `status`, `search` w URL params
- [ ] Mutacje → `addToast("...", "success")` / `addToast(e.message, "error")`
- [ ] Destruktywne akcje → `useConfirm` przed mutacją

---

## ROZDZIAŁ 12 — ZASADY UX

Poniżej lista z aktualnym stanem wdrożenia (✅ = zrobione, ⚠️ = częściowe, ❌ = brakuje):

| # | Zasada | Stan |
|---|--------|------|
| 1 | **Skeleton zamiast spinnera** na każdej liście | ✅ `RepairTableSkeleton`, `Skeleton` w kluczowych widokach |
| 2 | **Empty state** przy pustej liście — `EmptyState` z `EMPTY_STATES` | ✅ zaimplementowane; dodano klucz `repairs` do `EMPTY_STATES` |
| 3 | **Error state** gdy API błąd — `ErrorState` z `onRetry` | ✅ zaimplementowane we wszystkich kluczowych widokach listowych; dodano do `all-repairs` i `admin-panel/calendar` |
| 4 | **Filtry w URL** (`?status=ready&page=2`) — back button działa | ✅ zaimplementowane w `repairs`, `all-repairs`, `archive`, `admin/repairs`, `admin/clients` |
| 5 | **Optimistic updates** dla: toggle zadania, mark notif read, checkbox checklista | ✅ zaimplementowane |
| 6 | **Toasty** przy każdej mutacji — `addToast("...", "success/error")` | ✅ zaimplementowane; dodano do `SupplierFormModal`; admin bulk actions pokryte w `admin/repairs` |
| 7 | **StatusModal NIE zamyka się po POST** — czeka na akcję z komunikatem | ✅ zaimplementowane |
| 8 | **ConfirmDialog przed destruktywnymi akcjami** — `useConfirm` | ✅ pokryte dla wszystkich rzeczywistych destruktywnych akcji: bulk delivered, Zablokuj konto, zmiana statusu |
| 9 | **Typ usługi = `<input type="text">`** — nigdy select | ✅ zaimplementowane w intake |
| 10 | **Counter animation** przy zmianie scope w dashboardzie | ⚠️ częściowe |
| 11 | **Kliknięcie kategorii w intake** — animacja + auto-scroll | ✅ zaimplementowane |
| 12 | **Licznik SMS** (160 znaków) w zakładce komunikacji | ✅ zaimplementowane w `comm/page.tsx` (`smsMeta`) |
| 13 | **Auto-save draftu** w komunikacji → localStorage | ✅ zaimplementowane w `comm`, `zgloszenia/[id]`, `repairs/[id]` |
| 14 | **Klikalne chipy wyszukiwania** → wypełniają input + uruchamiają search | ✅ zaimplementowane |
| 15 | **Kliknięcie eventu w kalendarzu** → popup z detalami i linkiem | ✅ zaimplementowane (`PopupState` z pozycjonowaniem x/y) |
| 16 | **Zaznaczone wiersze w bulk** → niebieskie tło `rgba(59,130,246,.07)` | ✅ zaimplementowane |
| 17 | **Checklista — blokada kroków** — sekcja NAPRAWA zablokowana | ✅ zaimplementowane (`rowLocked` + toast info) |
| 18 | **Wyszukiwanie w sidebarze admina** | ✅ link `/admin-panel/search` w AdminSidebar |
| 19 | **"← Wróć"** w każdym widoku szczegółów | ✅ zaimplementowane |
| 20 | **Paginacja** — `page_size=20`, numer strony w URL | ✅ `PAGE_SIZE = 20` + `useSearchParams` w listach; `all-repairs`, `repairs`, `archive`, `admin/repairs`, `admin/clients` |
| 21 | **⌘K shortcut** → focus na search input | ❌ do implementacji |
| 22 | **`page_size=20`** na każdym żądaniu API | ✅ stosowane w zapytaniach do backendu |

### Wzorzec paginacji URL (stosuj wszędzie)

```typescript
// Każda strona z listą powinna mieć:
const searchParams = useSearchParams();
const router = useRouter();
const page = Number(searchParams.get("page") ?? 1);

const setPage = (p: number) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(p));
  router.push(`?${params.toString()}`);
};

// W query:
queryKey: ["resource", { page, status, search }],
queryFn: () => api.get(`/resource/?page=${page}&page_size=20&status=${status}`, token),
```

### Wzorzec toast przy mutacji (stosuj wszędzie)

```typescript
const { addToast } = useStore();
const mutation = useMutation({
  mutationFn: (payload) => api.post(url, payload, token),
  onSuccess: () => {
    void qc.invalidateQueries({ queryKey });
    addToast("Operacja zakończona pomyślnie", "success");
  },
  onError: (e) => {
    addToast(e instanceof Error ? e.message : "Błąd serwera", "error");
  },
});
```
