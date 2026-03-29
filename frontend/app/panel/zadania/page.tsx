"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStore } from "@/stores/workerStore";
import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TaskListSkeleton } from "@/components/ui/Skeleton";

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

type TaskCommentItem = {
  id: string;
  body: string;
  author_name?: string | null;
  created_at: string;
};

type TaskDetail = TaskItem & {
  description?: string;
  created_at?: string;
  updated_at?: string;
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  is_overdue?: boolean;
  comments?: TaskCommentItem[];
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
  return "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]";
}

export default function TasksPage() {
  const { token, user } = useAuth();
  const panelPaths = usePanelBasePath();
  const showToast = useWorkerStore((s) => s.addToast);
  const router = useRouter();
  const searchParams = useSearchParams();

  const scope = (searchParams.get("scope") as TasksScope) || "all";
  const relatedRepairFilter = searchParams.get("related_repair");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [updateTaskError, setUpdateTaskError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriorityValue>("standard");
  const [newDueDate, setNewDueDate] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<TaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const closeDetail = useCallback(() => {
    setDetailTaskId(null);
    setDetailTask(null);
    setDetailError(null);
  }, []);

  const openDetail = useCallback(
    async (id: string) => {
      if (!token) return;
      setDetailTaskId(id);
      setDetailTask(null);
      setDetailLoading(true);
      setDetailError(null);
      try {
        const d = await api.get<TaskDetail>(`/tasks/${id}/`, token);
        setDetailTask(d);
      } catch (e) {
        setDetailError(e instanceof Error ? e.message : "Nie udało się wczytać zadania.");
      } finally {
        setDetailLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!detailTaskId) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailTaskId, closeDetail]);

  const setScopeInUrl = (next: TasksScope) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("scope");
    else params.set("scope", next);
    router.push(`${panelPaths.zadaniaPath}?${params.toString()}`);
  };

  const loadTasks = async () => {
    if (!token || !user?.id) return;
    setTasksLoading(true);
    setTasksError(null);
    try {
      const params = new URLSearchParams();
      params.set("assigned_to", user.id);
      if (relatedRepairFilter) params.set("related_repair", relatedRepairFilter);
      if (scope === "done") params.set("status", "completed");
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
    if (!token || !user?.id) return;
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, scope, relatedRepairFilter]);

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
    const nextStatus = checked ? "completed" : "in_progress";
    const completedAtIso = checked ? new Date().toISOString() : null;
    setTasks((curr) =>
      curr.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              status_display: checked ? "Wykonane" : "W trakcie",
              completed_at: completedAtIso,
            }
          : t,
      ),
    );
    setDetailTask((d) =>
      d && d.id === task.id
        ? {
            ...d,
            status: nextStatus,
            status_display: checked ? "Wykonane" : "W trakcie",
            completed_at: completedAtIso,
          }
        : d,
    );
    try {
      await api.patch(`/tasks/${task.id}/`, { status: nextStatus }, token);
      showToast(checked ? "Zadanie oznaczone jako wykonane." : "Zadanie przywrócone do toku.", "success");
    } catch (e) {
      setTasks(prev);
      if (detailTaskId === task.id) void openDetail(task.id);
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować zadania.";
      setUpdateTaskError(msg);
      showToast(msg, "error");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.id) return;
    setAddError(null);
    if (!newTitle.trim()) {
      setAddError("Podaj tytuł zadania.");
      return;
    }
    setAddingTask(true);
    try {
      await api.post(
        `/tasks/`,
        {
          title: newTitle.trim(),
          priority: newPriority,
          due_date: newDueDate || undefined,
          assigned_to: user.id,
        },
        token,
      );
      setNewTitle("");
      setNewPriority("standard");
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
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Panel pracownika</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Moje zadania</h1>
          {relatedRepairFilter ? (
            <p className="mt-2 text-sm text-[#93c5fd]">
              Widok ograniczony do zadań powiązanych z wybraną naprawą.{" "}
              <button
                type="button"
                onClick={() => {
                  const qs = new URLSearchParams(searchParams.toString());
                  qs.delete("related_repair");
                  router.push(`${panelPaths.zadaniaPath}?${qs.toString()}`);
                }}
                className="font-semibold text-[var(--white)] underline decoration-[#3b82f6] underline-offset-2 hover:text-[#bfdbfe]"
              >
                Pokaż wszystkie
              </button>
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddError(null);
          }}
          className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[var(--white)] transition hover:bg-[#2563eb]"
        >
          + Dodaj zadanie
        </button>
      </header>

      <section className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3">
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
                  ? "border-[#3b82f6]/45 bg-[#3b82f6]/15 text-[var(--white)]"
                  : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
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
          className="mb-4 animate-[slideDown_.25s_ease] rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_180px_190px_auto]">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tytuł zadania..."
              className="rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriorityValue)}
              className="rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
            >
              <option value="standard">Normalny</option>
              <option value="important">Wysoki</option>
              <option value="urgent">Pilny</option>
              <option value="low">Niski</option>
            </select>
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
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
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--white)]">Otwarte · {scopeLabel}</h2>
              <span className="rounded-full border border-[#f59e0b]/35 bg-[#f59e0b]/15 px-2 py-0.5 text-xs font-semibold text-[#ffd9a6]">
                {openTasks.length}
              </span>
            </div>
            {tasksLoading ? (
              <TaskListSkeleton rows={5} />
            ) : openTasks.length === 0 ? (
              <EmptyState
                icon={EMPTY_STATES.tasks.icon}
                title={EMPTY_STATES.tasks.title}
                description={EMPTY_STATES.tasks.description}
              />
            ) : (
              <div className="space-y-2">
                {openTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-stretch gap-2 rounded-xl border border-[var(--border)] bg-[var(--s1)] p-2 sm:flex-nowrap sm:items-center sm:gap-3 sm:p-3"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => void openDetail(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          void openDetail(t.id);
                        }
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-left outline-none transition hover:bg-[var(--row-hover)] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    >
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--white)]">{t.title}</span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityPillClass(t.priority)}`}
                          >
                            {t.priority_display || PRIORITY_LABEL[(t.priority ?? "normal").toLowerCase()] || "Normalny"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--ink2)]">
                          {t.related_repair_number ? (
                            <Link
                              href={panelPaths.repairDetailPath(t.related_repair ?? "")}
                              className="text-[#3b82f6] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t.related_repair_number}
                            </Link>
                          ) : (
                            "Bez powiązanej naprawy"
                          )}
                          {t.due_date ? ` · Termin: ${new Date(t.due_date).toLocaleString("pl-PL")}` : ""}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={updatingTaskId === t.id}
                      onClick={() => void handleToggleDone(t, true)}
                      className="shrink-0 rounded-xl bg-[#22c55e] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#16a34a] disabled:opacity-60 sm:self-center"
                    >
                      {updatingTaskId === t.id ? "…" : "Zakończ"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--white)]">Zakończone dziś</h2>
              <span className="rounded-full border border-[#22c55e]/35 bg-[#22c55e]/15 px-2 py-0.5 text-xs font-semibold text-[#bbf7d0]">
                {doneToday.length}
              </span>
            </div>
            {tasksLoading ? (
              <TaskListSkeleton rows={4} />
            ) : doneTasks.length === 0 ? (
              <EmptyState
                icon={EMPTY_STATES.tasks.icon}
                title="Brak zakończonych zadań"
                description="Zakończone zadania pojawią się tutaj."
              />
            ) : (
              <div className="space-y-2">
                {doneTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-stretch gap-2 rounded-xl border border-[var(--border)] bg-[var(--s1)] p-2 opacity-90 sm:flex-nowrap sm:items-center sm:gap-3 sm:p-3"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => void openDetail(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          void openDetail(t.id);
                        }
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-left outline-none transition hover:bg-[var(--row-hover)] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    >
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--ink2)] line-through">{t.title}</span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityPillClass(t.priority)}`}
                          >
                            {t.priority_display || PRIORITY_LABEL[(t.priority ?? "normal").toLowerCase()] || "Normalny"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Ukończono: {t.completed_at ? new Date(t.completed_at).toLocaleString("pl-PL") : "—"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={updatingTaskId === t.id}
                      onClick={() => void handleToggleDone(t, false)}
                      className="shrink-0 rounded-xl border border-white/15 bg-[var(--row-hover)] px-4 py-2.5 text-xs font-semibold text-[#e5e7eb] transition hover:bg-[var(--row-active)] disabled:opacity-60 sm:self-center"
                    >
                      {updatingTaskId === t.id ? "…" : "Przywróć"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {detailTaskId ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 px-4 py-8 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="task-detail-title"
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--s1)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--s1)]/95 px-5 py-4 backdrop-blur">
              <h2 id="task-detail-title" className="pr-8 text-lg font-semibold text-[var(--white)]">
                {detailLoading ? "Ładowanie…" : detailTask?.title ?? "Zadanie"}
              </h2>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-xl p-2 text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                aria-label="Zamknij"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              {detailError ? (
                <p className="text-sm text-[#fca5a5]">{detailError}</p>
              ) : detailLoading ? (
                <TaskListSkeleton rows={4} />
              ) : detailTask ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${priorityPillClass(detailTask.priority)}`}
                    >
                      {detailTask.priority_display ||
                        PRIORITY_LABEL[(detailTask.priority ?? "normal").toLowerCase()] ||
                        "Priorytet"}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink2)]">
                      {detailTask.status_display ?? detailTask.status}
                    </span>
                    {detailTask.is_overdue ? (
                      <span className="rounded-full border border-[#dc1e1e]/40 bg-[#dc1e1e]/15 px-2.5 py-1 text-[11px] font-semibold text-[#ffb4b4]">
                        Po terminie
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Opis</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#d1d5db]">
                      {(detailTask.description ?? "").trim() || "Brak opisu."}
                    </p>
                  </div>
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-1.5">
                      <dt className="text-[var(--ink2)]">Przypisane do</dt>
                      <dd className="text-right font-medium text-[var(--white)]">{detailTask.assigned_to_name ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-1.5">
                      <dt className="text-[var(--ink2)]">Utworzył</dt>
                      <dd className="text-right font-medium text-[var(--white)]">{detailTask.created_by_name ?? "—"}</dd>
                    </div>
                    {detailTask.due_date ? (
                      <div className="flex justify-between gap-4 border-b border-[var(--border)] py-1.5">
                        <dt className="text-[var(--ink2)]">Termin</dt>
                        <dd className="text-right font-medium text-[var(--white)]">
                          {new Date(detailTask.due_date).toLocaleString("pl-PL")}
                        </dd>
                      </div>
                    ) : null}
                    {detailTask.completed_at ? (
                      <div className="flex justify-between gap-4 border-b border-[var(--border)] py-1.5">
                        <dt className="text-[var(--ink2)]">Ukończono</dt>
                        <dd className="text-right font-medium text-[var(--white)]">
                          {new Date(detailTask.completed_at).toLocaleString("pl-PL")}
                        </dd>
                      </div>
                    ) : null}
                    {detailTask.related_repair ? (
                      <div className="flex justify-between gap-4 py-1.5">
                        <dt className="text-[var(--ink2)]">Naprawa</dt>
                        <dd className="text-right">
                          <Link
                            href={panelPaths.repairDetailPath(detailTask.related_repair)}
                            className="font-semibold text-[#3b82f6] hover:underline"
                            onClick={closeDetail}
                          >
                            Otwórz zgłoszenie
                          </Link>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {detailTask.comments && detailTask.comments.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Komentarze</p>
                      <ul className="mt-2 space-y-2">
                        {detailTask.comments.map((c) => (
                          <li key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm">
                            <div className="flex justify-between gap-2 text-[11px] text-[var(--muted)]">
                              <span>{c.author_name ?? "—"}</span>
                              <span>{new Date(c.created_at).toLocaleString("pl-PL")}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-[#d1d5db]">{c.body}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
                    {!statusIsDone(detailTask.status) ? (
                      <button
                        type="button"
                        disabled={updatingTaskId === detailTask.id}
                        onClick={() => void handleToggleDone(detailTask, true)}
                        className="rounded-xl bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:opacity-60"
                      >
                        {updatingTaskId === detailTask.id ? "Zapisywanie…" : "Zakończ"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updatingTaskId === detailTask.id}
                        onClick={() => void handleToggleDone(detailTask, false)}
                        className="rounded-xl border border-white/15 bg-[var(--row-hover)] px-5 py-2.5 text-sm font-semibold text-[var(--white)] transition hover:bg-[var(--row-active)] disabled:opacity-60"
                      >
                        {updatingTaskId === detailTask.id ? "Zapisywanie…" : "Przywróć do toku"}
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

