"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarCheck, RefreshCw, Send, Users, Clock3, BadgeCheck, BadgeAlert, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useStore } from "@/store";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PanelDateRangePicker } from "@/components/panel/PanelDateRangePicker";
import type { TeamAbsenceRequest, TeamOverviewResponse, TeamOverviewRow } from "@/types/staff";

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function datePlusDaysIso(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTime(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(fromIso: string | null | undefined, nowMs: number) {
  if (!fromIso) return "-";
  const from = new Date(fromIso).getTime();
  if (Number.isNaN(from) || nowMs < from) return "-";
  const totalMinutes = Math.floor((nowMs - from) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function statusBadge(status: string) {
  if (status === "working_today") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "off_today") return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  if (status === "planned_off") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function requestStatusBadge(status: TeamAbsenceRequest["status"]) {
  if (status === "approved") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "rejected") return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-white/10 bg-[#0c0f18] p-4 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-[#6f7fa1]">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function WorkerTeamPage() {
  const { token, user } = useAuth();
  const addToast = useStore((s) => s.addToast);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamOverviewResponse | null>(null);
  const [requests, setRequests] = useState<TeamAbsenceRequest[]>([]);

  const [formBusy, setFormBusy] = useState(false);
  const [formAction, setFormAction] = useState<"confirm" | "finish" | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestType, setRequestType] = useState<TeamAbsenceRequest["availability_type"]>("day_off");
  const [requestRange, setRequestRange] = useState<{ from: string; to: string }>({ from: todayIso(), to: todayIso() });
  const [note, setNote] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const [teamRes, requestsRes] = await Promise.all([
        api.get<TeamOverviewResponse>(`/accounts/staff/team-overview/?to=${encodeURIComponent(datePlusDaysIso(45))}`, token),
        api.get<TeamAbsenceRequest[]>(`/availability/requests/`, token),
      ]);
      setTeam(teamRes);
      setRequests(Array.isArray(requestsRes) ? requestsRes : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać danych zespołu.";
      setError(msg);
      setTeam(null);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const me = useMemo<TeamOverviewRow | null>(() => {
    if (!team || !user) return null;
    return team.results.find((row) => row.id === String(user.id)) ?? null;
  }, [team, user]);

  const visibleWorkingTeam = useMemo(() => {
    const rows = (team?.results ?? []).filter((row) => row.today_status === "working_today");
    const myId = String(user?.id ?? "");
    return rows.sort((a, b) => {
      if (a.id === myId) return -1;
      if (b.id === myId) return 1;
      return a.full_name.localeCompare(b.full_name, "pl");
    });
  }, [team, user]);

  const myStartEntry = useMemo(() => {
    const entries = me?.today_entries.filter((entry) => entry.availability_type === "available") ?? [];
    if (!entries.length) return null;
    return entries
      .slice()
      .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))[0];
  }, [me]);

  const teamWorking = useMemo(() => team?.results.filter((r) => r.today_status === "working_today").length ?? 0, [team]);
  const teamOff = useMemo(() => team?.results.filter((r) => r.today_status === "off_today").length ?? 0, [team]);
  const teamUnknown = useMemo(() => team?.results.filter((r) => r.today_status === "unknown").length ?? 0, [team]);
  const todayAvailableEntries = useMemo(
    () => me?.today_entries.filter((entry) => entry.availability_type === "available") ?? [],
    [me],
  );
  const hasConfirmedPresence = todayAvailableEntries.length > 0;

  const confirmPresence = async () => {
    if (!token || !user) return;
    if (hasConfirmedPresence) {
      addToast("Obecność na dziś jest już potwierdzona.", "success");
      return;
    }
    setFormBusy(true);
    setFormAction("confirm");
    try {
      await api.post(
        "/availability/",
        {
          availability_type: "available",
          date: todayIso(),
          is_all_day: true,
          note: "Potwierdzenie obecności przez pracownika",
        },
        token,
      );
      addToast("Potwierdzono obecność na dziś.", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się potwierdzić obecności.";
      addToast(msg, "error");
    } finally {
      setFormBusy(false);
      setFormAction(null);
    }
  };

  const finishWork = async () => {
    if (!token || !user) return;
    if (!todayAvailableEntries.length) {
      addToast("Nie masz aktywnej obecności do zakończenia.", "error");
      return;
    }

    setFormBusy(true);
    setFormAction("finish");
    try {
      await Promise.all(todayAvailableEntries.map((entry) => api.delete(`/availability/${entry.id}/`, token)));
      addToast("Praca na dziś została zakończona.", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zakończyć pracy.";
      addToast(msg, "error");
    } finally {
      setFormBusy(false);
      setFormAction(null);
    }
  };

  const submitRequest = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token || !user) return;
    if (!requestRange.from || !requestRange.to) {
      addToast("Wybierz pełny zakres dat (od i do).", "error");
      return;
    }
    if (requestRange.to < requestRange.from) {
      addToast("Data końcowa nie może być wcześniejsza niż data początkowa.", "error");
      return;
    }

    setRequestBusy(true);
    try {
      await api.post(
        "/availability/requests/",
        {
          availability_type: requestType,
          start_date: requestRange.from,
          end_date: requestRange.to,
          note,
        },
        token,
      );
      addToast("Zgłoszenie zostało wysłane do akceptacji admina.", "success");
      setNote("");
      setRequestType("day_off");
      setRequestRange({ from: todayIso(), to: todayIso() });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się wysłać zgłoszenia.";
      addToast(msg, "error");
    } finally {
      setRequestBusy(false);
    }
  };

  if (error) {
    return <div className="mx-auto min-h-screen max-w-[1450px] px-4 py-8"><ErrorState error={new Error(error)} onRetry={() => void load()} title="Nie można załadować danych" /></div>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1450px] space-y-5 px-4 py-8">
      <header className="rounded-[2rem] border border-[#2b3550] bg-gradient-to-r from-[#0d1526] via-[#121d34] to-[#0d1628] p-5 shadow-[0_16px_50px_rgba(0,0,0,.35)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9fb4de]">Panel pracownika</p>
            <h1 className="mt-1.5 text-3xl font-semibold text-white">Zespół</h1>
            <p className="mt-1 text-sm text-[#98a8c8]">
              Kto jest dziś w pracy, Twoja obecność oraz szybkie zgłoszenie dnia wolnego lub urlopu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Odśwież
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Dziś w pracy" value={teamWorking} sub="w zespole" icon={<BadgeCheck size={16} />} />
          <StatCard label="Dziś wolne" value={teamOff} sub="w zespole" icon={<BadgeAlert size={16} />} />
          <StatCard label="Brak deklaracji" value={teamUnknown} sub="do uzupełnienia" icon={<Clock3 size={16} />} />
          <StatCard label="Moja obecność" value={me?.today_status_label || "—"} sub={me?.today_status === "working_today" ? "Jesteś oznaczony jako obecny" : "Potwierdź lub zgłoś nieobecność"} icon={<Users size={16} />} />
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.02fr_.98fr]">
        <SectionCard title="Zespół dzisiaj" subtitle="Widzisz obecnych pracowników. Twój wpis pokazuje godzinę startu i czas pracy.">
          <div className="space-y-2 max-h-[64vh] overflow-auto pr-1">
            {loading && !team ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[#9ca3af]">Ładowanie…</div>
            ) : visibleWorkingTeam.length ? (
              visibleWorkingTeam.map((row) => {
                const mine = row.id === String(user?.id);
                return (
                  <div
                    key={row.id}
                    className={`rounded-2xl border px-3 py-3 ${mine ? "border-[#3b82f6]/40 bg-[#3b82f6]/10" : "border-white/10 bg-white/[0.03]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{row.full_name || row.email}</p>
                        <p className="mt-0.5 text-xs text-[#8ea2c8]">
                          {row.role_display} · {row.staff_profile?.specialization_display || "Brak specjalizacji"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(row.today_status)}`}>
                        {row.today_status_label}
                      </span>
                    </div>
                    {row.next_absence ? (
                      <p className="mt-2 text-[11px] text-[#7e8aa5]">
                        Najbliższa nieobecność: {row.next_absence.availability_type_label} · {fmtDate(row.next_absence.start_date)} — {fmtDate(row.next_absence.end_date)}
                      </p>
                    ) : null}
                    {mine ? (
                      <div className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-[#0f1320] px-3 py-2 text-[11px] text-[#cbd5e1] sm:grid-cols-2">
                        <p>
                          Start pracy: <span className="font-semibold text-white">{fmtTime(myStartEntry?.created_at)}</span>
                        </p>
                        <p>
                          Czas pracy: <span className="font-semibold text-white">{fmtDuration(myStartEntry?.created_at, nowMs)}</span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <EmptyState icon="👥" title="Nikt nie jest teraz oznaczony jako obecny" description="Gdy Ty lub ktoś z zespołu potwierdzi obecność, pojawi się tutaj." />
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Moja obecność" subtitle="Potwierdź, że jesteś dziś w pracy">
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#8ea2c8]">Dzisiaj</p>
                <p className="mt-1 text-sm font-semibold text-white">{me?.today_status_label || "Brak deklaracji"}</p>
                <p className="mt-1 text-xs text-[#7e8aa5]">Jeśli jesteś na miejscu, kliknij przycisk poniżej.</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void confirmPresence()}
                  disabled={formBusy || hasConfirmedPresence}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/18 disabled:opacity-50"
                >
                  <CalendarCheck size={16} />
                  {formBusy && formAction === "confirm" ? "Potwierdzam..." : hasConfirmedPresence ? "Obecność potwierdzona" : "Potwierdzam obecność"}
                </button>
                <button
                  type="button"
                  onClick={() => void finishWork()}
                  disabled={formBusy || !hasConfirmedPresence}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/35 bg-rose-500/12 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/18 disabled:opacity-50"
                >
                  <LogOut size={16} />
                  {formBusy && formAction === "finish" ? "Kończę..." : "Zakończ pracę"}
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Zgłoszenie wolnego / urlopu" subtitle="Wyślij prośbę do akceptacji admina">
            <form onSubmit={submitRequest} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-[11px] uppercase tracking-[0.12em] text-[#8ea2c8]">Typ</span>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value as TeamAbsenceRequest["availability_type"])}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="day_off">Dzień wolny</option>
                    <option value="vacation">Urlop</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-[11px] uppercase tracking-[0.12em] text-[#8ea2c8]">Zakres dat</span>
                  <PanelDateRangePicker
                    value={requestRange}
                    onChange={setRequestRange}
                    disabled={requestBusy}
                  />
                </label>

                <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#8ea2c8]">
                  Wybrany zakres: <span className="font-semibold text-white">{requestRange.from || "-"}</span> - <span className="font-semibold text-white">{requestRange.to || "-"}</span>
                </div>

                <label className="space-y-1 sm:col-span-2">
                  <span className="block text-[11px] uppercase tracking-[0.12em] text-[#8ea2c8]">Notatka</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Opcjonalnie: powód / szczegóły"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-[#60708f]"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={requestBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3b82f6]/40 bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                <Send size={16} />
                {requestBusy ? "Wysyłam..." : "Wyślij do akceptacji"}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Moje zgłoszenia" subtitle="Status Twoich próśb o wolne / urlop">
            <div className="space-y-2 max-h-[33vh] overflow-auto pr-1">
              {requests.length ? (
                requests.map((req) => (
                  <div key={req.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{req.availability_type_display}</p>
                        <p className="mt-0.5 text-xs text-[#8ea2c8]">
                          {fmtDate(req.start_date)} — {fmtDate(req.end_date)} · {req.days_count} dni
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${requestStatusBadge(req.status)}`}>
                        {req.status_display}
                      </span>
                    </div>
                    {req.note ? <p className="mt-2 text-xs text-[#9ca3af]">{req.note}</p> : null}
                    {req.review_note ? <p className="mt-1 text-xs text-[#7e8aa5]">Decyzja admina: {req.review_note}</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#7e8aa5]">Brak zgłoszeń.</div>
              )}
            </div>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">{label}</p>
          <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-[#7e8aa5]">{sub}</p> : null}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#bfdbfe]">{icon}</div>
      </div>
    </div>
  );
}

