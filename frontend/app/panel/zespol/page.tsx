"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CalendarOff,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useStore } from "@/store";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";
import { WorkerTeamPage } from "@/components/panel/WorkerTeamPage";
import { AdminAbsenceRequestsPanel } from "@/components/panel/AdminAbsenceRequestsPanel";
import type { UserRole } from "@/types/auth";
import type { TeamOverviewResponse, TeamOverviewRow, TeamTodayStatus } from "@/types/staff";

type AttendanceWorkedDay = {
  date: string;
  seconds: number;
  hours: number;
  sessions_count: number;
  is_open: boolean;
};

type AttendanceAbsenceDay = {
  date: string;
  types: { key: string; label: string }[];
  notes: string[];
};

type AdminAttendanceEmployee = {
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  total_work_seconds: number;
  total_work_hours: number;
  worked_days_count: number;
  absence_days_count: number;
  worked_days: AttendanceWorkedDay[];
  absence_days: AttendanceAbsenceDay[];
};

type AdminAttendanceMonthSummary = {
  month: string;
  from: string;
  to: string;
  employees: AdminAttendanceEmployee[];
};

type StaffForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  specialization: string;
  calendar_color: string;
  display_name: string;
  is_visible_in_rankings: boolean;
  is_available: boolean;
  accepts_shipment_repairs: boolean;
  password: string;
};

type StatusFilter = "all" | TeamTodayStatus;

function emptyForm(): StaffForm {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "staff",
    is_active: true,
    specialization: "",
    calendar_color: "#3498db",
    display_name: "",
    is_visible_in_rankings: true,
    is_available: true,
    accepts_shipment_repairs: true,
    password: "",
  };
}

function statusPillClass(status: TeamTodayStatus): string {
  if (status === "working_today") return "border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]";
  if (status === "off_today") return "border-[#ef4444]/35 bg-[#ef4444]/12 text-[#fca5a5]";
  if (status === "unknown") return "border-[#64748b]/35 bg-[#64748b]/12 text-[#cbd5e1]";
  return "border-[#f59e0b]/35 bg-[#f59e0b]/12 text-[#fde68a]";
}

function statusIcon(status: TeamTodayStatus) {
  if (status === "working_today") return <CalendarCheck size={12} className="inline-block" />;
  if (status === "off_today") return <CalendarOff size={12} className="inline-block" />;
  return <CalendarClock size={12} className="inline-block" />;
}

function toDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function absenceRangeLabel(startDate: string, endDate: string): string {
  if (!startDate) return "-";
  if (startDate === endDate) return toDate(startDate);
  return `${toDate(startDate)} - ${toDate(endDate)}`;
}

function currentMonthIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function hoursMinutesFromSeconds(seconds: number | null | undefined): string {
  const total = Math.max(0, Number(seconds ?? 0));
  const mins = Math.floor(total / 60);
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-[#7e8aa5]">{sub}</p> : null}
    </div>
  );
}

export default function TeamAdminPage() {
  const { token, user } = useAuth();
  const addToast = useStore((s) => s.addToast);
  const { confirm } = useConfirm();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  const [rows, setRows] = useState<TeamOverviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "staff">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<"team" | "attendance">("team");

  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceMonth, setAttendanceMonth] = useState(currentMonthIso());
  const [attendanceQuery, setAttendanceQuery] = useState("");
  const [attendanceEmployeeFilter, setAttendanceEmployeeFilter] = useState<string>("all");
  const [attendanceRows, setAttendanceRows] = useState<AdminAttendanceEmployee[]>([]);
  const [attendanceSelectedId, setAttendanceSelectedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(() => emptyForm());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [resetPasswordMode, setResetPasswordMode] = useState<"generate" | "send_link">("generate");
  const [resetCustomPassword, setResetCustomPassword] = useState("");
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<TeamOverviewResponse>(`/accounts/staff/team-overview/?to=${encodeURIComponent(new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().slice(0, 10))}`, token);
      setRows(Array.isArray(res?.results) ? res.results : []);
      setLastUpdated(new Date());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać danych zespołu.";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadAttendance = useCallback(async () => {
    if (!token || !isAdmin) return;
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const res = await api.get<AdminAttendanceMonthSummary>(
        `/availability/work-sessions/admin/month-summary/?month=${encodeURIComponent(attendanceMonth)}`,
        token,
      );
      setAttendanceRows(Array.isArray(res?.employees) ? res.employees : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać listy obecności.";
      setAttendanceError(msg);
      setAttendanceRows([]);
    } finally {
      setAttendanceLoading(false);
    }
  }, [attendanceMonth, isAdmin, token]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    void load();
  }, [token, isAdmin, load]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    void loadAttendance();
  }, [token, isAdmin, loadAttendance]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (statusFilter !== "all" && r.today_status !== statusFilter) return false;
        if (roleFilter !== "all" && r.role !== roleFilter) return false;
        if (!q) return true;
        const phone = (r as { phone?: string }).phone ?? "";
        const text = `${r.full_name ?? ""} ${r.email ?? ""} ${phone} ${r.role_display ?? ""} ${r.staff_profile?.specialization_display ?? ""}`.toLowerCase();
        return text.includes(q);
      })
      .sort((a, b) => {
        const activeRank = (a.is_active ? 0 : 1) - (b.is_active ? 0 : 1);
        if (activeRank !== 0) return activeRank;
        return (a.full_name || "").localeCompare(b.full_name || "", "pl");
      });
  }, [rows, query, statusFilter, roleFilter]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedId(null);
      return;
    }
    const exists = filteredRows.some((r) => r.id === selectedId);
    if (!exists) setSelectedId(filteredRows[0].id);
  }, [filteredRows, selectedId]);

  const selected = useMemo(() => filteredRows.find((r) => r.id === selectedId) ?? null, [filteredRows, selectedId]);

  const attendanceFilteredRows = useMemo(() => {
    const q = attendanceQuery.trim().toLowerCase();
    return attendanceRows.filter((r) => {
      if (attendanceEmployeeFilter !== "all" && r.employee_id !== attendanceEmployeeFilter) return false;
      if (!q) return true;
      return `${r.full_name} ${r.email} ${r.role}`.toLowerCase().includes(q);
    });
  }, [attendanceRows, attendanceEmployeeFilter, attendanceQuery]);

  useEffect(() => {
    if (attendanceFilteredRows.length === 0) {
      setAttendanceSelectedId(null);
      return;
    }
    const exists = attendanceFilteredRows.some((r) => r.employee_id === attendanceSelectedId);
    if (!exists) setAttendanceSelectedId(attendanceFilteredRows[0].employee_id);
  }, [attendanceFilteredRows, attendanceSelectedId]);

  const attendanceSelected = useMemo(
    () => attendanceFilteredRows.find((r) => r.employee_id === attendanceSelectedId) ?? null,
    [attendanceFilteredRows, attendanceSelectedId],
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const activeAccounts = rows.filter((r) => r.is_active).length;
    const working = rows.filter((r) => r.today_status === "working_today").length;
    const offToday = rows.filter((r) => r.today_status === "off_today").length;
    const planned = rows.filter((r) => r.today_status === "planned_off").length;
    const unknown = rows.filter((r) => r.today_status === "unknown").length;
    return { total, activeAccounts, working, offToday, planned, unknown };
  }, [rows]);

  const setTodayStatus = async (employeeId: string, status: "working_today" | "off_today") => {
    if (!token) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const existing = await api.get<Array<{ id: string }>>(
        `/availability/?employee=${encodeURIComponent(employeeId)}&date=${encodeURIComponent(today)}&is_active=true`,
        token,
      );
      if (Array.isArray(existing) && existing.length) {
        await Promise.allSettled(existing.map((entry) => api.delete(`/availability/${entry.id}/`, token)));
      }
      await api.post(
        "/availability/",
        {
          employee: employeeId,
          date: today,
          is_all_day: true,
          availability_type: status === "working_today" ? "available" : "day_off",
          note: status === "working_today" ? "Oznaczone przez administratora: obecny w pracy" : "Oznaczone przez administratora: dzień wolny",
        },
        token,
      );
      addToast(status === "working_today" ? "Ustawiono: dziś w pracy." : "Ustawiono: dziś wolne.", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować statusu na dziś.";
      addToast(msg, "error");
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: TeamOverviewRow) => {
    setModalMode("edit");
    setEditingId(row.id);
    setForm({
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      email: row.email || "",
      phone: (row as { phone?: string }).phone || "",
      role: (row.role as UserRole) || "staff",
      is_active: Boolean(row.is_active),
      specialization: row.staff_profile?.specialization || "",
      calendar_color: row.staff_profile?.calendar_color || "#3498db",
      display_name: row.staff_profile?.display_name || "",
      is_visible_in_rankings: true,
      is_available: row.staff_profile?.is_available !== false,
      accepts_shipment_repairs: true,
      password: "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const submitForm = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token) return;

    setFormBusy(true);
    setFormError(null);

    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
        is_active: form.is_active,
        specialization: form.specialization,
        calendar_color: form.calendar_color,
        display_name: form.display_name,
        is_visible_in_rankings: form.is_visible_in_rankings,
        is_available: form.is_available,
        accepts_shipment_repairs: form.accepts_shipment_repairs,
      };

      if (modalMode === "create") {
        if (form.role === "admin" && !form.password.trim()) {
          throw new Error("Hasło jest wymagane dla nowego administratora.");
        }
        if (form.password.trim()) payload.password = form.password.trim();
        await api.post("/accounts/staff/", payload, token);
        addToast("Pracownik został dodany.", "success");
      } else {
        if (!editingId) throw new Error("Brak ID pracownika do edycji.");
        await api.patch(`/accounts/staff/${editingId}/update/`, payload, token);
        addToast("Dane pracownika zostały zapisane.", "success");
      }

      setModalOpen(false);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zapisać pracownika.";
      setFormError(msg);
      addToast(msg, "error");
    } finally {
      setFormBusy(false);
    }
  };

  const removeUser = async (row: TeamOverviewRow) => {
    if (!token) return;
    const ok = await confirm({
      title: "Usunąć pracownika?",
      description: `Konto ${row.full_name} zostanie dezaktywowane (soft delete).`,
      confirmLabel: "Tak, usuń",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(row.id);
    try {
      await api.delete(`/accounts/staff/${row.id}/`, token);
      addToast("Pracownik został usunięty (dezaktywowany).", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się usunąć pracownika.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const resetPassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token || !resetPasswordId) return;
    setResetBusy(true);
    setResetResult(null);
    try {
      const body: Record<string, unknown> = { action: resetPasswordMode };
      if (resetPasswordMode === "generate" && resetCustomPassword.trim()) {
        body.new_password = resetCustomPassword.trim();
      }
      const res = await api.post<{ message?: string; temporary_password?: string; token_created?: boolean }>(
        `/accounts/staff/${resetPasswordId}/reset-password/`,
        body,
        token,
      );
      if (resetPasswordMode === "generate") {
        const tmp = res.temporary_password;
        setResetResult(tmp ? `Tymczasowe hasło: ${tmp}` : res.message ?? "Hasło zostało wygenerowane i ustawione.");
      } else {
        setResetResult(res.message ?? "Link do resetu hasła został wysłany na e-mail pracownika.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zresetować hasła.";
      setResetResult(msg);
    } finally {
      setResetBusy(false);
    }
  };

  if (isStaff) {
    return <WorkerTeamPage />;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1450px] space-y-5 px-4 py-8">
      <header className="rounded-[2rem] border border-[#2b3550] bg-gradient-to-r from-[#0d1526] via-[#121d34] to-[#0d1628] p-5 shadow-[0_16px_50px_rgba(0,0,0,.35)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9fb4de]">Panel Admina</p>
            <h1 className="mt-1.5 text-3xl font-semibold text-white">Zespół</h1>
            <p className="mt-1 text-sm text-[#98a8c8]">Profesjonalny panel ludzi i dostępności: kto dziś pracuje, kto ma wolne i kiedy planuje nieobecność.</p>
            <p className="mt-1 text-xs text-[#6f7fa1]">
              {lastUpdated ? `Ostatnia synchronizacja: ${toDateTime(lastUpdated.toISOString())}` : "Jeszcze nie zsynchronizowano"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeAdminTab === "attendance") {
                  void loadAttendance();
                } else {
                  void load();
                }
              }}
              disabled={activeAdminTab === "attendance" ? attendanceLoading : loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={16} className={(activeAdminTab === "attendance" ? attendanceLoading : loading) ? "animate-spin" : ""} />
              Odśwież
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#3b82f6]/50 bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,.35)] transition hover:brightness-110"
            >
              <Plus size={16} />
              Dodaj pracownika
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Wszyscy pracownicy" value={stats.total} sub="admin + staff" />
          <StatCard label="Aktywne konta" value={stats.activeAccounts} sub="mają dostęp do systemu" />
          <StatCard label="Dziś w pracy" value={stats.working} />
          <StatCard label="Dziś wolne" value={stats.offToday} />
          <StatCard label="Brak deklaracji" value={stats.unknown} />
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-[#0c0f18] p-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveAdminTab("team")}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeAdminTab === "team"
                ? "border border-[#3b82f6]/45 bg-[#3b82f6]/15 text-white"
                : "border border-white/10 bg-white/[0.03] text-[#9ca3af] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            Przegląd zespołu
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab("attendance")}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeAdminTab === "attendance"
                ? "border border-[#3b82f6]/45 bg-[#3b82f6]/15 text-white"
                : "border border-white/10 bg-white/[0.03] text-[#9ca3af] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            Lista obecności
          </button>
        </div>
      </section>

      {activeAdminTab === "team" ? (
        <>
          <AdminAbsenceRequestsPanel />

          {error ? <ErrorState error={new Error(error)} onRetry={() => void load()} title="Błąd panelu zespołu" /> : null}

          <section className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0c0f18] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">Lista pracowników</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">{filteredRows.length}</span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <Search size={14} className="text-[#7f8ca6]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po imieniu, e-mailu, roli..."
                className="w-full bg-transparent text-white outline-none placeholder:text-[#60708f]"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "staff")}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="all">Wszystkie role</option>
              <option value="admin">Administrator</option>
              <option value="staff">Pracownik</option>
            </select>

            <div className="flex gap-1">
              {([
                ["all", "Wszyscy"],
                ["working_today", "W pracy"],
                ["off_today", "Wolne"],
                ["planned_off", "Planują"],
                ["unknown", "Brak deklaracji"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                    statusFilter === key
                      ? "border-[#3b82f6]/40 bg-[#3b82f6]/18 text-[#bfdbfe]"
                      : "border-white/10 bg-white/5 text-[#9ca3af] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 max-h-[72vh] space-y-2 overflow-auto pr-1">
            {loading ? (
              <RepairTableSkeleton rows={8} />
            ) : filteredRows.length === 0 ? (
              <EmptyState icon="👥" title="Brak wyników" description="Zmień filtry lub dodaj nową osobę do zespołu." />
            ) : (
              filteredRows.map((r) => {
                const selectedRow = selectedId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      selectedRow ? "border-[#3b82f6]/40 bg-[#3b82f6]/12" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{r.full_name}</p>
                        <p className="mt-0.5 text-[11px] text-[#8ea2c8]">{r.email}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusPillClass(r.today_status)}`}>
                        {statusIcon(r.today_status)}
                        {r.today_status_label}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[#9ca3af]">
                        Rola: <span className="font-semibold text-white">{r.role_display || r.role}</span>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[#9ca3af]">
                        Nieobecność: <span className="font-semibold text-white">{r.next_absence ? toDate(r.next_absence.start_date) : "-"}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0c0f18] p-4">
          {!selected ? (
            <EmptyState icon="🧑‍💼" title="Wybierz pracownika" description="Po lewej stronie wybierz osobę, aby zobaczyć status i zaplanowane nieobecności." />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">Profil pracownika</p>
                  <h3 className="mt-1 truncate text-xl font-semibold text-white">{selected.full_name}</h3>
                  <p className="mt-0.5 text-xs text-[#9ca3af]">{selected.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(selected)}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] transition hover:bg-white/10"
                  >
                    <Pencil size={13} />
                    Edytuj
                  </button>
                   <button
                     type="button"
                     onClick={() => {
                       setResetPasswordId(selected.id);
                       setResetPasswordMode("generate");
                       setResetCustomPassword("");
                       setResetResult(null);
                       setShowResetPasswordModal(true);
                     }}
                     className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#fbbf24] transition hover:bg-white/10"
                   >
                     <RefreshCw size={13} />
                     Resetuj hasło
                   </button>
                  <button
                    type="button"
                    onClick={() => void removeUser(selected)}
                    disabled={deletingId === selected.id || Boolean(selected.is_superadmin)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/12 px-3 py-1.5 text-xs font-semibold text-[#fecaca] transition hover:bg-[#ef4444]/20 disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    {deletingId === selected.id ? "Usuwam..." : "Usuń"}
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <InfoLine icon={<UserRound size={13} />} label="Imię i nazwisko" value={selected.full_name || "-"} />
                <InfoLine icon={<Mail size={13} />} label="E-mail" value={selected.email || "-"} href={selected.email ? `mailto:${selected.email}` : undefined} />
                <InfoLine
                  icon={<Phone size={13} />}
                  label="Telefon"
                  value={(selected as { phone?: string }).phone || "Brak"}
                  href={(selected as { phone?: string }).phone ? `tel:${((selected as { phone?: string }).phone || "").replace(/\s/g, "")}` : undefined}
                />
                <InfoLine icon={<Shield size={13} />} label="Rola" value={selected.role_display || selected.role} />
                <InfoLine icon={<Users size={13} />} label="Status konta" value={selected.is_active ? "Aktywne" : "Nieaktywne"} />
                <InfoLine icon={<MapPin size={13} />} label="Specjalizacja" value={selected.staff_profile?.specialization_display || "Brak"} />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void setTodayStatus(selected.id, "working_today")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#22c55e]/35 bg-[#22c55e]/12 px-3 py-2 text-xs font-semibold text-[#bbf7d0] transition hover:bg-[#22c55e]/20"
                >
                  <CalendarCheck size={14} />
                  Oznacz dziś: W pracy
                </button>
                <button
                  type="button"
                  onClick={() => void setTodayStatus(selected.id, "off_today")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ef4444]/35 bg-[#ef4444]/12 px-3 py-2 text-xs font-semibold text-[#fecaca] transition hover:bg-[#ef4444]/20"
                >
                  <CalendarOff size={14} />
                  Oznacz dziś: Wolne
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <MetricBox
                  label="Status na dziś"
                  value={selected.today_status_label}
                  tone={selected.today_status === "working_today" ? "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#bbf7d0]" : selected.today_status === "off_today" ? "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fecaca]" : "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fde68a]"}
                />
                <MetricBox
                  label="Najbliższa nieobecność"
                  value={selected.next_absence ? absenceRangeLabel(selected.next_absence.start_date, selected.next_absence.end_date) : "Brak"}
                  tone="border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#bfdbfe]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">Dzisiaj</h4>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${statusPillClass(selected.today_status)}`}>
                    {statusIcon(selected.today_status)}
                    {selected.today_status_label}
                  </span>
                </div>
                {selected.today_entries.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-[#7e8aa5]">Brak wpisów szczegółowych na dzisiaj.</div>
                ) : (
                  <div className="space-y-2">
                    {selected.today_entries.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-white/10 bg-[#0f1320] px-3 py-2">
                        <p className="text-sm font-semibold text-white">{entry.availability_type_label}</p>
                        <p className="text-[11px] text-[#8ea2c8]">
                          {entry.is_all_day ? "Cały dzień" : `${entry.start_time || "-"} - ${entry.end_time || "-"}`}
                        </p>
                        {entry.note ? <p className="mt-1 text-[11px] text-[#9ca3af]">{entry.note}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">Planowane nieobecności</h4>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[#9ca3af]">
                    {selected.planned_absence_ranges.length}
                  </span>
                </div>
                {selected.planned_absence_ranges.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-[#7e8aa5]">Brak zaplanowanych nieobecności.</div>
                ) : (
                  <div className="space-y-2">
                    {selected.planned_absence_ranges.map((r, idx) => (
                      <div key={`${r.start_date}-${r.end_date}-${idx}`} className="rounded-xl border border-white/10 bg-[#0f1320] px-3 py-2">
                        <p className="text-sm font-semibold text-white">{r.availability_type_label}</p>
                        <p className="text-[11px] text-[#8ea2c8]">{absenceRangeLabel(r.start_date, r.end_date)}</p>
                        {r.note ? <p className="mt-1 text-[11px] text-[#9ca3af]">{r.note}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
          </section>
        </>
      ) : (
        <>
          {attendanceError ? (
            <ErrorState error={new Error(attendanceError)} onRetry={() => void loadAttendance()} title="Błąd listy obecności" />
          ) : null}

          <section className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
            <div className="rounded-3xl border border-white/10 bg-[#0c0f18] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">Lista obecności pracowników</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">{attendanceFilteredRows.length}</span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <Search size={14} className="text-[#7f8ca6]" />
                  <input
                    value={attendanceQuery}
                    onChange={(e) => setAttendanceQuery(e.target.value)}
                    placeholder="Szukaj po imieniu lub e-mailu..."
                    className="w-full bg-transparent text-white outline-none placeholder:text-[#60708f]"
                  />
                </label>

                <input
                  type="month"
                  value={attendanceMonth}
                  onChange={(e) => setAttendanceMonth(e.target.value || currentMonthIso())}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />

                <select
                  value={attendanceEmployeeFilter}
                  onChange={(e) => setAttendanceEmployeeFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  <option value="all">Wszyscy pracownicy</option>
                  {attendanceRows.map((r) => (
                    <option key={r.employee_id} value={r.employee_id}>
                      {r.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 max-h-[72vh] space-y-2 overflow-auto pr-1">
                {attendanceLoading ? (
                  <RepairTableSkeleton rows={8} />
                ) : attendanceFilteredRows.length === 0 ? (
                  <EmptyState icon="📊" title="Brak danych" description="Brak wpisów obecności dla wybranego filtra/miesiąca." />
                ) : (
                  attendanceFilteredRows.map((r) => {
                    const selectedRow = attendanceSelectedId === r.employee_id;
                    return (
                      <button
                        key={r.employee_id}
                        type="button"
                        onClick={() => setAttendanceSelectedId(r.employee_id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                          selectedRow ? "border-[#3b82f6]/40 bg-[#3b82f6]/12" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{r.full_name}</p>
                            <p className="mt-0.5 text-[11px] text-[#8ea2c8]">{r.email}</p>
                          </div>
                          <span className="inline-flex items-center rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#bfdbfe]">
                            {r.role}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
                          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[#9ca3af]">
                            Godziny: <span className="font-semibold text-white">{hoursMinutesFromSeconds(r.total_work_seconds)}</span>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[#9ca3af]">
                            Dni pracy: <span className="font-semibold text-white">{r.worked_days_count}</span>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[#9ca3af]">
                            Nieobecności: <span className="font-semibold text-white">{r.absence_days_count}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0c0f18] p-4">
              {!attendanceSelected ? (
                <EmptyState icon="🗓" title="Wybierz pracownika" description="Po lewej wybierz osobę, aby zobaczyć miesięczne podsumowanie i szczegóły obecności." />
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">Szczegóły obecności</p>
                    <h3 className="mt-1 truncate text-xl font-semibold text-white">{attendanceSelected.full_name}</h3>
                    <p className="mt-0.5 text-xs text-[#9ca3af]">{attendanceSelected.email} · {attendanceMonth}</p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <MetricBox
                      label="Suma godzin"
                      value={hoursMinutesFromSeconds(attendanceSelected.total_work_seconds)}
                      tone="border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#bfdbfe]"
                    />
                    <MetricBox
                      label="Dni pracy"
                      value={attendanceSelected.worked_days_count}
                      tone="border-[#22c55e]/30 bg-[#22c55e]/10 text-[#bbf7d0]"
                    />
                    <MetricBox
                      label="Dni nieobecności"
                      value={attendanceSelected.absence_days_count}
                      tone="border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fecaca]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">Dni pracy</h4>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[#9ca3af]">
                          {attendanceSelected.worked_days.length}
                        </span>
                      </div>
                      {attendanceSelected.worked_days.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-[#7e8aa5]">Brak dni pracy w wybranym miesiącu.</div>
                      ) : (
                        <div className="max-h-[42vh] space-y-2 overflow-auto pr-1">
                          {attendanceSelected.worked_days.map((day) => (
                            <div key={day.date} className="rounded-xl border border-white/10 bg-[#0f1320] px-3 py-2">
                              <p className="text-sm font-semibold text-white">{toDate(day.date)}</p>
                              <p className="text-[11px] text-[#8ea2c8]">Czas: {hoursMinutesFromSeconds(day.seconds)} · Sesje: {day.sessions_count}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">Dni nieobecności</h4>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[#9ca3af]">
                          {attendanceSelected.absence_days.length}
                        </span>
                      </div>
                      {attendanceSelected.absence_days.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-[#7e8aa5]">Brak nieobecności w wybranym miesiącu.</div>
                      ) : (
                        <div className="max-h-[42vh] space-y-2 overflow-auto pr-1">
                          {attendanceSelected.absence_days.map((day) => (
                            <div key={day.date} className="rounded-xl border border-white/10 bg-[#0f1320] px-3 py-2">
                              <p className="text-sm font-semibold text-white">{toDate(day.date)}</p>
                              <p className="text-[11px] text-[#8ea2c8]">{day.types.map((t) => t.label).join(", ") || "Nieobecność"}</p>
                              {day.notes.length ? <p className="mt-1 text-[11px] text-[#9ca3af]">{day.notes.join(" · ")}</p> : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl rounded-3xl border border-[#2b3550] bg-[#0f1629] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9fb4de]">{modalMode === "create" ? "Dodaj" : "Edytuj"}</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {modalMode === "create" ? "Nowego pracownika" : "Dane pracownika"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              >
                Zamknij
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4 p-4">
              {formError ? <p className="text-sm text-[#fca5a5]">{formError}</p> : null}

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Imię" required>
                  <input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none" required />
                </Field>
                <Field label="Nazwisko" required>
                  <input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none" required />
                </Field>
                <Field label="E-mail" required className="md:col-span-2">
                  <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none" required />
                </Field>
                <Field label="Telefon" className="md:col-span-2">
                  <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none" />
                </Field>
                <Field label="Rola">
                  <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none">
                    <option value="staff">Pracownik</option>
                    <option value="admin">Administrator</option>
                  </select>
                </Field>
                <Field label="Aktywne konto">
                  <select value={String(form.is_active)} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === "true" }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none">
                    <option value="true">Tak</option>
                    <option value="false">Nie</option>
                  </select>
                </Field>
                <Field label="Specjalizacja" className="md:col-span-2">
                  <input value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none" />
                </Field>
                <Field label="Nazwa w UI">
                  <input value={form.display_name} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none" />
                </Field>
                <Field label="Kolor kalendarza">
                  <input value={form.calendar_color} onChange={(e) => setForm((p) => ({ ...p, calendar_color: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none" />
                </Field>

                {modalMode === "create" ? (
                  <Field label={form.role === "admin" ? "Hasło (wymagane dla admina)" : "Hasło (opcjonalnie)"} className="md:col-span-2">
                    <input
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none"
                      type="password"
                      required={form.role === "admin"}
                    />
                  </Field>
                ) : (
                  <Field label="Zmień hasło (opcjonalnie)" className="md:col-span-2">
                    <div className="flex flex-col gap-2">
                      <input
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none"
                        type="password"
                        placeholder="Wpisz nowe hasło (pozostaw puste, aby nie zmienić)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setResetPasswordId(editingId);
                          setResetPasswordMode("generate");
                          setResetCustomPassword("");
                          setResetResult(null);
                          setShowResetPasswordModal(true);
                        }}
                        className="text-left text-xs text-[#7e8aa5] hover:text-[#bfdbfe] transition"
                      >
                        Albo użyj opcji &quot;Resetuj hasło&quot; poniżej →
                      </button>
                    </div>
                  </Field>
                )}
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#d1d5db]">
                  <input type="checkbox" checked={form.is_available} onChange={(e) => setForm((p) => ({ ...p, is_available: e.target.checked }))} />
                  Dostępny do przypisań
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#d1d5db]">
                  <input type="checkbox" checked={form.is_visible_in_rankings} onChange={(e) => setForm((p) => ({ ...p, is_visible_in_rankings: e.target.checked }))} />
                  Widoczny w rankingach
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#d1d5db]">
                  <input type="checkbox" checked={form.accepts_shipment_repairs} onChange={(e) => setForm((p) => ({ ...p, accepts_shipment_repairs: e.target.checked }))} />
                  Przyjmuje wysyłki
                </label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="rounded-xl border border-[#3b82f6]/40 bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {formBusy ? "Zapisuję..." : "Zapisz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showResetPasswordModal && resetPasswordId ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-3xl border border-[#2b3550] bg-[#0f1629] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9fb4de]">Reset hasła</p>
                <p className="mt-1 text-lg font-semibold text-white">Dla wybranego pracownika</p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              >
                Zamknij
              </button>
            </div>

            <form onSubmit={resetPassword} className="space-y-4 p-4">
              {resetResult ? (
                <div className={`rounded-xl border p-3 text-sm ${resetResult.includes("pomyślnie") || resetResult.includes("Tymczasowe") || resetResult.includes("wysłany") ? "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#bbf7d0]" : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fecaca]"}`}>
                  {resetResult}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8ea2c8]">Akcja</label>
                <select
                  value={resetPasswordMode}
                  onChange={(e) => setResetPasswordMode(e.target.value as "generate" | "send_link")}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none"
                >
                  <option value="generate">Wygeneruj tymczasowe hasło</option>
                  <option value="send_link">Wyślij link do resetu</option>
                </select>
              </div>

              {resetPasswordMode === "generate" ? (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8ea2c8]">
                    Nowe hasło (opcjonalnie)
                  </label>
                  <input
                    value={resetCustomPassword}
                    onChange={(e) => setResetCustomPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none"
                    type="password"
                    placeholder="Jeśli puste, system wygeneruje losowe"
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={resetBusy}
                  className="rounded-xl border border-[#3b82f6]/40 bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {resetBusy ? "Wykonuję..." : "Wykonaj"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8ea2c8]">
        {label}
        {required ? <span className="ml-1 text-[#fca5a5]">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function MetricBox({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${tone}`}>
      <p className="text-[11px] uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="truncate text-[#d1d5db] hover:text-white"
    >
      {value}
    </a>
  ) : (
    <span className="truncate text-[#d1d5db]">{value}</span>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-[#7e8aa5]">
        {icon}
        {label}
      </p>
      {content}
    </div>
  );
}
