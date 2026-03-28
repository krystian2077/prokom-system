"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { ErrorState } from "@/components/ui/ErrorState";
import { StackedRowSkeleton } from "@/components/ui/Skeleton";

type AvailabilityScope = "today" | "tomorrow" | "week";

type AvailabilityTypeValue =
  | "available"
  | "service_trip"
  | "installation"
  | "temporarily_unavailable"
  | "day_off"
  | "vacation"
  | "sick_leave";

type AvailabilityEntry = {
  id: string;
  employee?: string | null;
  employee_name?: string | null;
  availability_type: AvailabilityTypeValue | string;
  availability_type_display: string;
  date: string;
  is_all_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
  note?: string;
  is_active?: boolean;
};

type StaffRow = {
  id: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
};

const AVAILABILITY_TYPE_OPTIONS: Array<{ value: AvailabilityTypeValue; label: string }> = [
  { value: "available", label: "Dostępny" },
  { value: "service_trip", label: "Wyjazd serwisowy" },
  { value: "installation", label: "Montaż" },
  { value: "temporarily_unavailable", label: "Niedostępny czasowo" },
  { value: "day_off", label: "Dzień wolny" },
  { value: "vacation", label: "Urlop" },
  { value: "sick_leave", label: "Chorobowe" },
];

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function AvailabilityPageInner() {
  const { user, token } = useAuth();
  const addToast = useStore((s) => s.addToast);
  const isAdmin = user?.role === "admin";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const scope = useMemo<AvailabilityScope>(() => {
    const s = searchParams.get("scope");
    if (s === "tomorrow" || s === "week") return s;
    return "today";
  }, [searchParams]);

  const setScope = (val: AvailabilityScope) => {
    const p = new URLSearchParams(searchParams.toString());
    if (val === "today") p.delete("scope");
    else p.set("scope", val);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };
  const [entries, setEntries] = useState<AvailabilityEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const [adminStaff, setAdminStaff] = useState<StaffRow[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => toISODate(today), [today]);

  const [availabilityType, setAvailabilityType] = useState<AvailabilityTypeValue>("available");
  const [dateStr, setDateStr] = useState(initialDate);
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("");

  const scopeToUrl = (s: AvailabilityScope) => {
    switch (s) {
      case "today":
        return "/availability/today/";
      case "tomorrow":
        return "/availability/tomorrow/";
      case "week":
        return "/availability/week/";
      default:
        return "/availability/today/";
    }
  };

  const loadEntries = async () => {
    if (!token) return;
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const res = await api.get<AvailabilityEntry[]>(scopeToUrl(scope), token);
      setEntries(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać dostępności.";
      setEntriesError(msg);
    } finally {
      setEntriesLoading(false);
    }
  };

  const loadStaffForAdmin = async () => {
    if (!token || !isAdmin) return;
    setStaffLoading(true);
    setStaffError(null);
    try {
      const res = await api.get<StaffRow[]>(`/accounts/staff/?is_active=true`, token);
      setAdminStaff(res);
      if (!employeeId && res[0]?.id) setEmployeeId(res[0].id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać listy pracowników.";
      setStaffError(msg);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, scope]);

  useEffect(() => {
    if (!token) return;
    void loadStaffForAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    const base = new Date();
    if (scope === "today") setDateStr(toISODate(base));
    if (scope === "tomorrow") {
      base.setDate(base.getDate() + 1);
      setDateStr(toISODate(base));
    }
    if (scope === "week") setDateStr(toISODate(base));
  }, [scope]);

  const grouped = useMemo(() => {
    const byEmployee = new Map<string, AvailabilityEntry[]>();
    for (const e of entries) {
      const key = e.employee_name ?? e.employee ?? "unknown";
      const arr = byEmployee.get(key) ?? [];
      arr.push(e);
      byEmployee.set(key, arr);
    }
    return Array.from(byEmployee.entries()).map(([k, list]) => ({ employeeName: k, items: list }));
  }, [entries]);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token) return;

    if (isAdmin && !employeeId) {
      setEntriesError("Wybierz pracownika.");
      return;
    }

    const payload: Record<string, unknown> = {
      availability_type: availabilityType,
      date: dateStr,
      is_all_day: isAllDay,
      note: note.trim(),
    };
    if (isAdmin) payload.employee = employeeId;
    if (!isAllDay) {
      payload.start_time = startTime;
      payload.end_time = endTime;
    }

    try {
      await api.post(`/availability/`, payload, token);
      setNote("");
      addToast("Wpis dostępności dodany.", "success");
      await loadEntries();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się dodać wpisu.";
      setEntriesError(msg);
      addToast(msg, "error");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">
          {isAdmin ? "Panel Admina" : "Panel pracownika"} · Moduł
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Dostępność zespołu</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">Widok na dziś/jutro/tydzień + dodawanie wpisów.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["today", "Dziś"],
                  ["tomorrow", "Jutro"],
                  ["week", "Tydzień"],
                ] as Array<[AvailabilityScope, string]>
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setScope(val)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    scope === val
                      ? "border-white/20 bg-[var(--row-active)] text-[var(--white)]"
                      : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--white)]">
                {scope === "today" ? "Dziś" : scope === "tomorrow" ? "Jutro" : "Tydzień"}
              </h2>
              {entriesLoading ? <span className="inline-block h-3 w-20 animate-pulse rounded bg-[var(--row-active)]" aria-hidden /> : null}
            </div>

            {entriesError ? (
              <div className="mt-3">
                <ErrorState error={new Error(entriesError)} onRetry={() => void loadEntries()} title="Błąd dostępności" />
              </div>
            ) : null}
            {!entriesError && !entriesLoading && entries.length === 0 && (
              <p className="mt-3 text-sm text-[var(--muted)]">Brak wpisów dostępności.</p>
            )}

            {entriesLoading ? (
              <div className="mt-4">
                <StackedRowSkeleton rows={5} />
              </div>
            ) : null}

            {!entriesError && !entriesLoading && entries.length > 0 && (
              <div className="mt-4 space-y-4">
                {grouped.map((g) => (
                  <div key={g.employeeName} className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] p-4">
                    <p className="text-sm font-semibold text-[var(--white)]">{g.employeeName}</p>
                    <div className="mt-3 space-y-2">
                      {g.items.map((e) => {
                        const times = e.is_all_day
                          ? "Cały dzień"
                          : `${e.start_time ?? ""}-${e.end_time ?? ""}`.replace(/^-|-$/g, "");
                        return (
                          <div key={e.id} className="rounded-xl border border-[var(--border)] bg-[var(--s1)] p-3">
                            <p className="text-sm font-semibold text-[var(--white)]">{e.availability_type_display}</p>
                            <p className="mt-1 text-sm text-[var(--ink2)]">
                              {e.date} · {times}
                            </p>
                            {e.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{e.note}</p> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <h2 className="text-sm font-semibold text-[var(--white)]">Dodaj wpis</h2>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {isAdmin ? "Administrator wybiera pracownika." : "Pracownik dodaje tylko własną dostępność."}
            </p>

            {staffError && <p className="mt-3 text-sm text-[#fca5a5]">{staffError}</p>}

            <form onSubmit={submit} className="mt-4 space-y-4">
              {isAdmin && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                    Pracownik
                  </label>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={staffLoading}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)] disabled:opacity-60"
                  >
                    {adminStaff.length === 0 ? <option value="">Brak danych</option> : null}
                    {adminStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.email || s.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                  Typ dostępności
                </label>
                <select
                  value={availabilityType}
                  onChange={(e) => setAvailabilityType(e.target.value as AvailabilityTypeValue)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                >
                  {AVAILABILITY_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                  Data
                </label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Cały dzień</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#e5e7eb]">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="h-4 w-4"
                  />
                  {isAllDay ? "Tak" : "Nie"}
                </label>
              </div>

              {!isAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                      Start
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                      Koniec
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                  Notatka (opcjonalnie)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Np. gdzie jesteś / jaka sprawa / uwagi…"
                  className="min-h-[90px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
                />
              </div>

              <button
                type="submit"
                disabled={!token}
                className="w-full rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b61717] disabled:opacity-60"
              >
                Dodaj wpis
              </button>
            </form>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function AvailabilityPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-[var(--row-active)]" />
          <StackedRowSkeleton rows={6} />
        </main>
      }
    >
      <AvailabilityPageInner />
    </Suspense>
  );
}
