"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type TaskStatusValue = "new" | "in_progress" | "waiting" | "completed" | "cancelled";
type TaskPriorityValue = "low" | "standard" | "important" | "urgent";

type TaskItem = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusValue | string;
  status_display: string;
  priority: TaskPriorityValue | string;
  priority_display: string;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  is_overdue?: boolean;
  is_archived?: boolean;
  comment_count?: number;
  created_at?: string;
};

type TeamAvailabilityResponse = {
  date: string;
  entries: Array<{
    id: string;
    employee?: string | null;
    employee_name?: string | null;
    availability_type: string;
    availability_type_display: string;
    date: string;
    is_all_day: boolean;
    start_time?: string | null;
    end_time?: string | null;
    note?: string;
  }>;
};

type TasksScope = "today" | "urgent" | "overdue" | "completed";

export default function TasksPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [scope, setScope] = useState<TasksScope>("today");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [teamToday, setTeamToday] = useState<TeamAvailabilityResponse | null>(null);

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [updateTaskError, setUpdateTaskError] = useState<string | null>(null);

  const STATUS_OPTIONS: Array<{ value: TaskStatusValue; label: string }> = [
    { value: "new", label: "Nowe" },
    { value: "in_progress", label: "W trakcie" },
    { value: "waiting", label: "Czeka" },
    { value: "completed", label: "Wykonane" },
    { value: "cancelled", label: "Anulowane" },
  ];

  const PRIORITY_LABEL: Record<TaskPriorityValue, string> = {
    low: "Niski",
    standard: "Standardowy",
    important: "Ważny",
    urgent: "Pilny",
  };

  const priorityColor = (p: string | undefined) => {
    const v = (p ?? "").toLowerCase();
    if (v === "urgent") return "bg-[#dc1e1e]/15 text-[#ffb4b4] border-[#dc1e1e]/40";
    if (v === "important") return "bg-[#f59e0b]/15 text-[#ffd9a6] border-[#f59e0b]/40";
    if (v === "low") return "bg-white/5 text-[#9ca3af] border-white/10";
    return "bg-[#3b82f6]/15 text-[#bcd6ff] border-[#3b82f6]/35";
  };

  const scopeToEndpoint = (s: TasksScope) => {
    switch (s) {
      case "today":
        return "/tasks/due-today/";
      case "urgent":
        return "/tasks/urgent/";
      case "overdue":
        return "/tasks/overdue/";
      case "completed":
        return "/tasks/completed/";
      default:
        return "/tasks/due-today/";
    }
  };

  const loadTasks = async () => {
    if (!token) return;
    setTasksLoading(true);
    setTasksError(null);
    try {
      const endpoint = scopeToEndpoint(scope);
      const res = await api.get<TaskItem[]>(endpoint, token);
      setTasks(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać zadań.";
      setTasksError(msg);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadTeamToday = async () => {
    if (!token) return;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const res = await api.get<TeamAvailabilityResponse>(`/availability/team-today/`, token);
      setTeamToday(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać dostępności zespołu.";
      setAvailabilityError(msg);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadTasks();
    const interval = window.setInterval(() => {
      void loadTasks();
    }, 30_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, scope]);

  useEffect(() => {
    if (!token) return;
    void loadTeamToday();
    const interval = window.setInterval(() => {
      void loadTeamToday();
    }, 60_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUpdateTaskStatus = async (taskId: string, nextStatus: TaskStatusValue) => {
    if (!token) return;
    setUpdateTaskError(null);
    setUpdatingTaskId(taskId);
    try {
      await api.patch(`/tasks/${taskId}/`, { status: nextStatus }, token);
      await loadTasks();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować statusu.";
      setUpdateTaskError(msg);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const scopeLabel =
    scope === "today" ? "Dziś" : scope === "urgent" ? "Pilne" : scope === "overdue" ? "Zaległe" : "Zakończone";

  const scopeAccent = (s: TasksScope) => {
    switch (s) {
      case "today":
        return { accent: "#3b82f6", glow: "rgba(59,130,246,.45)" };
      case "urgent":
        return { accent: "#dc1e1e", glow: "rgba(220,30,30,.45)" };
      case "overdue":
        return { accent: "#f59e0b", glow: "rgba(245,158,11,.42)" };
      case "completed":
        return { accent: "#22c55e", glow: "rgba(34,197,94,.40)" };
      default:
        return { accent: "#dc1e1e", glow: "rgba(220,30,30,.45)" };
    }
  };

  const statusPill = (statusRaw: string | undefined) => {
    const v = (statusRaw ?? "").toString().toLowerCase();
    if (v === "completed") return "bg-[rgba(34,197,94,.14)] text-[#86efac] border-[rgba(34,197,94,.35)]";
    if (v === "cancelled") return "bg-[rgba(220,30,30,.14)] text-[#ffb4b4] border-[rgba(220,30,30,.35)]";
    if (v === "waiting") return "bg-[rgba(245,158,11,.16)] text-[#ffd9a6] border-[rgba(245,158,11,.35)]";
    if (v === "in_progress") return "bg-[rgba(59,130,246,.14)] text-[#bcd6ff] border-[rgba(59,130,246,.35)]";
    return "bg-[rgba(255,255,255,.05)] text-[#9ca3af] border-[rgba(255,255,255,.12)]";
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="mb-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
          {isAdmin ? "Panel Admina" : "Panel pracownika"} · Moduł
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Moje zlecenia</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">Lista zadań w wybranym zakresie i dostępność zespołu na dziś.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">{scopeLabel}</h2>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    {isAdmin ? "Widok zespołowy." : "Widok Twoich zadań."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      ["today", "Dziś"],
                      ["urgent", "Pilne"],
                      ["overdue", "Zaległe"],
                      ["completed", "Zakończone"],
                    ] as Array<[TasksScope, string]>
                  ).map(([val, label]) => {
                    const { accent, glow } = scopeAccent(val);
                    const on = scope === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setScope(val)}
                        className="rounded-xl border px-4 py-2 text-sm font-semibold transition"
                        style={{
                          color: on ? "#fff" : "#9ca3af",
                          background: on ? `${accent}1F` : "transparent",
                          borderColor: on ? `${accent}66` : "rgba(255,255,255,.10)",
                          boxShadow: on ? `0 0 0 1px ${glow}` : "none",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                {tasksLoading ? <span className="text-sm text-[#9ca3af]">Ładowanie…</span> : null}
                {!tasksLoading && !tasksError ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">{tasks.length} pozycji</span>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]"> </span>
                )}
              </div>

              {tasksError && <p className="text-sm text-[#fca5a5]">{tasksError}</p>}
              {updateTaskError && <p className="text-sm text-[#fca5a5]">{updateTaskError}</p>}
              {!tasksError && !tasksLoading && tasks.length === 0 && <p className="text-sm text-[#6b7280]">Brak zadań w tym widoku.</p>}

              <div className="space-y-3">
                {tasks.map((t) => {
                  const due = t.due_date ? new Date(t.due_date).toLocaleString("pl-PL") : null;
                  const pri = (t.priority as TaskPriorityValue) ?? "standard";

                  return (
                    <div key={t.id} className="rounded-2xl border border-white/10 bg-[#0b0c10] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-[240px]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityColor(
                                t.priority,
                              )}`}
                            >
                              {t.priority_display || PRIORITY_LABEL[pri] || "—"}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(String(t.status))}`}
                              title="Status"
                            >
                              {t.status_display || String(t.status)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-semibold text-white">{t.title}</p>

                          <p className="mt-1 text-sm text-[#9ca3af]">
                            Przypisane: {t.assigned_to_name ?? "—"}
                            {t.created_by_name ? ` · Utworzył: ${t.created_by_name}` : ""}
                          </p>

                          {due ? (
                            <p className="mt-1 text-sm text-[#9ca3af]">
                              Termin: {due} {t.is_overdue ? "· (przeterminowane)" : ""}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-[#9ca3af]">Termin: —</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">Status</p>
                            <select
                              value={t.status}
                              onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value as TaskStatusValue)}
                              disabled={updatingTaskId === t.id || tasksLoading}
                              className="mt-1 rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white disabled:opacity-60 outline-none focus:border-[#dc1e1e]"
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Dostępność zespołu (dziś)</h2>
              {availabilityLoading ? <span className="text-sm text-[#9ca3af]">Ładowanie…</span> : null}
            </div>
            {availabilityError && <p className="mt-3 text-sm text-[#fca5a5]">{availabilityError}</p>}

            {!availabilityError && teamToday?.entries?.length ? (
              <div className="mt-4 space-y-3">
                {teamToday.entries.map((e) => {
                  const times = e.is_all_day ? "Cały dzień" : `${e.start_time ?? ""}-${e.end_time ?? ""}`.replace(/^-|-$/g, "");
                  const lower = (e.availability_type_display ?? "").toLowerCase();
                  const dotColor =
                    lower.includes("dostęp") || lower.includes("available") || lower.includes("available")
                      ? "#22c55e"
                      : lower.includes("nieobec") || lower.includes("unavailable")
                        ? "#dc1e1e"
                        : "#3b82f6";
                  return (
                    <div key={e.id} className="rounded-2xl border border-white/10 bg-[#0b0c10] p-3">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-[3px] h-2 w-2 rounded-full"
                          style={{ background: dotColor, boxShadow: `0 0 20px ${dotColor}` }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{e.employee_name ?? "Pracownik"}</p>
                          <p className="mt-1 text-sm text-[#9ca3af]">
                            {e.availability_type_display} · {times}
                          </p>
                          {e.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{e.note}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !availabilityError && !availabilityLoading ? (
              <p className="mt-4 text-sm text-[#6b7280]">Brak wpisów dostępności na dziś.</p>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

