"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

type TaskStatusValue = "new" | "in_progress" | "waiting" | "done" | "completed" | "cancelled";
type TaskPriorityValue = "low" | "normal" | "standard" | "high" | "important" | "urgent";
type TasksScope = "all" | "today" | "urgent" | "done";

type TaskItem = {
  id: string;
  title: string;
  status: TaskStatusValue | string;
  status_display?: string;
  priority: TaskPriorityValue | string;
  priority_display?: string;
  due_date?: string | null;
  completed_at?: string | null;
  related_repair?: string | null;
  related_repair_number?: string | null;
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Niski",
  normal: "Normalny",
  standard: "Normalny",
  high: "Wysoki",
  important: "Wysoki",
  urgent: "Pilny",
};

function statusIsDone(statusRaw: string | undefined): boolean {
  const v = (statusRaw ?? "").toLowerCase();
  return v === "done" || v === "completed";
}

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function isDueToday(task: TaskItem): boolean {
  const d = parseDate(task.due_date);
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isUrgent(task: TaskItem): boolean {
  return (task.priority ?? "").toLowerCase() === "urgent";
}

function priorityPillClass(priorityRaw: string | undefined): string {
  const p = (priorityRaw ?? "").toLowerCase();
  if (p === "urgent") return "border-[#dc1e1e]/40 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (p === "high" || p === "important") return "border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#ffd9a6]";
  return "border-white/10 bg-white/5 text-[#9ca3af]";
}

export default function TasksPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const scope = (searchParams.get("scope") as TasksScope) || "all";
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [updateTaskError, setUpdateTaskError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriorityValue>("normal");
  const [newDueDate, setNewDueDate] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const setScopeInUrl = (next: TasksScope) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("scope");
    else params.set("scope", next);
    router.push(`/panel/zadania?${params.toString()}`);
  };

  const loadTasks = async () => {
    if (!token) return;
    setTasksLoading(true);
    setTasksError(null);
    try {
      const params = new URLSearchParams();
      params.set("assigned_to", "me");
      if (scope === "done") params.set("status", "done");
      if (scope === "urgent") params.set("priority", "urgent");
      const res = await api.get<any>(`/tasks/?${params.toString()}`, token);
      const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];
      setTasks(list as TaskItem[]);
    } catch (e) {
      setTasksError(e instanceof Error ? e.message : "Nie udało się pobrać zadań.");
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, scope]);

  const visibleTasks = useMemo(() => {
    if (scope === "all") return tasks;
    if (scope === "today") return tasks.filter(isDueToday);
    if (scope === "urgent") return tasks.filter(isUrgent);
    if (scope === "done") return tasks.filter((t) => statusIsDone(t.status));
    return tasks;
  }, [scope, tasks]);

  const openTasks = useMemo(() => visibleTasks.filter((t) => !statusIsDone(t.status)), [visibleTasks]);
  const doneTasks = useMemo(() => visibleTasks.filter((t) => statusIsDone(t.status)), [visibleTasks]);
  const doneToday = useMemo(
    () =>
      doneTasks.filter((t) => {
        const d = parseDate(t.completed_at ?? t.due_date);
        if (!d) return false;
        const n = new Date();
        return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
      }),
    [doneTasks],
  );

  const handleToggleDone = async (task: TaskItem, checked: boolean) => {
    if (!token) return;
    setUpdateTaskError(null);
    setUpdatingTaskId(task.id);
    const prev = tasks;
    const nextStatus = checked ? "done" : "in_progress";
    setTasks((curr) =>
      curr.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              status_display: checked ? "Wykonane" : "W trakcie",
              completed_at: checked ? new Date().toISOString() : null,
            }
          : t,
      ),
    );
    try {
      await api.patch(`/tasks/${task.id}/`, { status: nextStatus }, token);
    } catch (e) {
      setTasks(prev);
      setUpdateTaskError(e instanceof Error ? e.message : "Nie udało się zaktualizować zadania.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddError(null);
    if (!newTitle.trim()) {
      setAddError("Podaj tytuł zadania.");
      return;
    }
    setAddingTask(true);
    try {
      await api.post(
        `/tasks/`,
        { title: newTitle.trim(), priority: newPriority, due_date: newDueDate || undefined },
        token,
      );
      setNewTitle("");
      setNewPriority("normal");
      setNewDueDate("");
      setShowAddForm(false);
      await loadTasks();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Nie udało się dodać zadania.");
    } finally {
      setAddingTask(false);
    }
  };

  const scopeLabel =
    scope === "all" ? "Wszystkie" : scope === "today" ? "Dziś" : scope === "urgent" ? "Pilne" : "Zakończone";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel pracownika</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Moje zadania</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddError(null);
          }}
          className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
        >
          + Dodaj zadanie
        </button>
      </header>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#0c0d12] p-3">
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "Wszystkie"],
            ["today", "Dziś"],
            ["urgent", "Pilne"],
            ["done", "Zakończone"],
          ] as Array<[TasksScope, string]>).map(([v, lbl]) => (
            <button
              key={v}
              type="button"
              onClick={() => setScopeInUrl(v)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                scope === v
                  ? "border-[#3b82f6]/45 bg-[#3b82f6]/15 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </section>

      {showAddForm ? (
        <form
          onSubmit={handleAddTask}
          className="mb-4 animate-[slideDown_.25s_ease] rounded-2xl border border-white/10 bg-[#0c0d12] p-4"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_180px_190px_auto]">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tytuł zadania..."
              className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriorityValue)}
              className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
            >
              <option value="normal">Normalny</option>
              <option value="high">Wysoki</option>
              <option value="urgent">Pilny</option>
              <option value="low">Niski</option>
            </select>
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
            />
            <button
              type="submit"
              disabled={addingTask}
              className="rounded-xl bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:opacity-60"
            >
              {addingTask ? "Dodaję..." : "Dodaj"}
            </button>
          </div>
          {addError ? <p className="mt-2 text-sm text-[#fca5a5]">{addError}</p> : null}
        </form>
      ) : null}

      {tasksError ? (
        <ErrorState title="Nie udało się pobrać zadań" error={new Error(tasksError)} onRetry={() => void loadTasks()} />
      ) : null}
      {updateTaskError ? <p className="mb-3 text-sm text-[#fca5a5]">{updateTaskError}</p> : null}

      {!tasksError ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Otwarte · {scopeLabel}</h2>
              <span className="rounded-full border border-[#f59e0b]/35 bg-[#f59e0b]/15 px-2 py-0.5 text-xs font-semibold text-[#ffd9a6]">
                {openTasks.length}
              </span>
            </div>
            {tasksLoading ? (
              <p className="text-sm text-[#9ca3af]">Ładowanie...</p>
            ) : openTasks.length === 0 ? (
              <EmptyState
                icon={EMPTY_STATES.tasks.icon}
                title={EMPTY_STATES.tasks.title}
                description={EMPTY_STATES.tasks.description}
              />
            ) : (
              <div className="space-y-2">
                {openTasks.map((t) => (
                  <label key={t.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0f1117] p-3">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled={updatingTaskId === t.id}
                      onChange={(e) => void handleToggleDone(t, e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#3b82f6]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{t.title}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityPillClass(t.priority)}`}>
                          {t.priority_display || PRIORITY_LABEL[(t.priority ?? "normal").toLowerCase()] || "Normalny"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[#9ca3af]">
                        {t.related_repair_number ? (
                          <Link href={`/panel/naprawy/${t.related_repair ?? ""}`} className="text-[#3b82f6] hover:underline">
                            {t.related_repair_number}
                          </Link>
                        ) : (
                          "Bez powiązanej naprawy"
                        )}
                        {t.due_date ? ` · Termin: ${new Date(t.due_date).toLocaleString("pl-PL")}` : ""}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Zakończone dziś</h2>
              <span className="rounded-full border border-[#22c55e]/35 bg-[#22c55e]/15 px-2 py-0.5 text-xs font-semibold text-[#bbf7d0]">
                {doneToday.length}
              </span>
            </div>
            {tasksLoading ? (
              <p className="text-sm text-[#9ca3af]">Ładowanie...</p>
            ) : doneTasks.length === 0 ? (
              <EmptyState
                icon={EMPTY_STATES.tasks.icon}
                title="Brak zakończonych zadań"
                description="Zakończone zadania pojawią się tutaj."
              />
            ) : (
              <div className="space-y-2">
                {doneTasks.map((t) => (
                  <label key={t.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0f1117] p-3 opacity-85">
                    <input
                      type="checkbox"
                      checked
                      disabled={updatingTaskId === t.id}
                      onChange={(e) => void handleToggleDone(t, e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#22c55e]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#9ca3af] line-through">{t.title}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityPillClass(t.priority)}`}>
                          {t.priority_display || PRIORITY_LABEL[(t.priority ?? "normal").toLowerCase()] || "Normalny"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[#6b7280]">
                        Ukończono: {t.completed_at ? new Date(t.completed_at).toLocaleString("pl-PL") : "—"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

