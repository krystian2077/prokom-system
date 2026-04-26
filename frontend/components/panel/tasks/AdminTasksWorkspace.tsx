"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { addDays, format, isSameDay, isValid, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ArchiveRestore,
  CalendarDays,
  CheckCircle2,
  CircleSlash2,
  Loader2,
  PencilLine,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { api, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TaskListSkeleton } from "@/components/ui/Skeleton";
import { PanelDateTimePicker } from "@/components/panel/PanelDateTimePicker";
import type { TaskListItem } from "@/types/tasks";

type StaffOption = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  picker_label?: string;
  role?: string;
  is_active?: boolean;
};

type TaskCommentItem = {
  id: string;
  body: string;
  author_name?: string | null;
  created_at: string;
};

type TaskDetail = TaskListItem & {
  description?: string;
  created_at?: string;
  updated_at?: string;
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  is_archived?: boolean;
  comments?: TaskCommentItem[];
};

type TaskFormState = {
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: string;
  due_date: string;
  is_archived: boolean;
};

type ViewFilter = "all" | "mine" | "team" | "open" | "completed" | "cancelled" | "urgent" | "unassigned";

type WorkspaceMode = "admin" | "staff";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Niski" },
  { value: "standard", label: "Standardowy" },
  { value: "important", label: "Ważny" },
  { value: "urgent", label: "Pilny" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "Nowe" },
  { value: "in_progress", label: "W trakcie" },
  { value: "waiting", label: "Czeka" },
  { value: "completed", label: "Wykonane" },
  { value: "cancelled", label: "Anulowane" },
];

const FILTERS: Array<{ value: ViewFilter; label: string }> = [
  { value: "all", label: "Wszystkie" },
  { value: "mine", label: "Moje" },
  { value: "team", label: "Zespół" },
  { value: "open", label: "Otwarte" },
  { value: "completed", label: "Zakończone" },
  { value: "cancelled", label: "Anulowane" },
  { value: "urgent", label: "Pilne" },
  { value: "unassigned", label: "Bez przypisania" },
];

function pad(v: number): string {
  return String(v).padStart(2, "0");
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toLocalDateTimeValue(date: Date): string {
  return `${ymd(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
}

function parseYmd(value: string | null): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

function isoLabel(value?: string | null): string {
  const d = parseLocalDate(value);
  if (!d) return "—";
  return d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fullDateLabel(value?: string | null): string {
  const d = parseLocalDate(value);
  if (!d) return "—";
  return d.toLocaleString("pl-PL", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}

function taskIsDone(status?: string): boolean {
  const v = (status ?? "").toLowerCase();
  return v === "completed" || v === "cancelled";
}

function taskIsOpen(status?: string): boolean {
  return !taskIsDone(status);
}

function taskPriorityTone(priority?: string): string {
  const p = (priority ?? "").toLowerCase();
  if (p === "urgent") return "border-[#dc1e1e]/40 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (p === "important") return "border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#ffd9a6]";
  return "border-white/10 bg-white/[0.04] text-[#cbd5e1]";
}

function statusTone(status?: string): string {
  const s = (status ?? "").toLowerCase();
  if (s === "completed") return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
  if (s === "cancelled") return "border-[#dc1e1e]/40 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (s === "waiting") return "border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#ffd9a6]";
  if (s === "in_progress") return "border-[#3b82f6]/40 bg-[#3b82f6]/15 text-[#bfdbfe]";
  return "border-white/10 bg-white/[0.04] text-[#dbeafe]";
}

function defaultCreateForm(assigneeId: string): TaskFormState {
  const d = addDays(new Date(), 1);
  d.setHours(9, 0, 0, 0);
  return {
    title: "",
    description: "",
    priority: "standard",
    status: "new",
    assigned_to: assigneeId,
    due_date: `${ymd(d)}T09:00`,
    is_archived: false,
  };
}

function formFromTask(task: TaskDetail): TaskFormState {
  const due = task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : "";
  return {
    title: task.title ?? "",
    description: task.description ?? "",
    priority: task.priority ?? "standard",
    status: task.status ?? "new",
    assigned_to: task.assigned_to ? String(task.assigned_to) : "",
    due_date: due,
    is_archived: Boolean(task.is_archived),
  };
}

function normalizeAssigneeLabel(row: StaffOption): string {
  return (
    row.picker_label ||
    row.full_name ||
    `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
    row.email ||
    "Pracownik"
  );
}

function taskSearchText(task: TaskListItem, assigneeName?: string | null): string {
  return [task.title, task.status_display, task.priority_display, task.related_repair_number, assigneeName, task.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function AdminTasksWorkspace({ mode = "admin" }: { mode?: WorkspaceMode }) {
  const { token, user } = useAuth();
  const addToast = useStore((s) => s.addToast);

  const isStaffMode = mode === "staff";
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isAllowed = isAdmin || (isStaffMode && isStaff);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(ymd(new Date()));
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [form, setForm] = useState<TaskFormState>(() => defaultCreateForm(user?.id ? String(user.id) : ""));
  const [detailForm, setDetailForm] = useState<TaskFormState | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchDraft.trim().toLowerCase()), 220);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (user?.id) {
      setForm((curr) => ({ ...curr, assigned_to: curr.assigned_to || String(user.id) }));
    }
  }, [user?.id]);

  const loadTasks = async () => {
    if (!token || !isAllowed) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllPages<TaskListItem>("/tasks/", token);
      setTasks(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać zadań.");
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    if (!token || !isAllowed) return;
    try {
      const res = await api.get<StaffOption[] | { results?: StaffOption[] }>("/accounts/staff/assignable-for-repairs/?include_self=1", token);
      setStaff(Array.isArray(res) ? res : res?.results ?? []);
    } catch (e) {
      setStaff([]);
      setError((prev) => prev || (e instanceof Error ? e.message : "Nie udało się pobrać listy pracowników."));
    } finally {
    }
  };

  const loadDetail = async (taskId: string) => {
    if (!token || !taskId) return;
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const row = await api.get<TaskDetail>(`/tasks/${taskId}/`, token);
      setDetail(row);
      setDetailForm(formFromTask(row));
    } catch (e) {
      setDetail(null);
      setDetailForm(null);
      setDetailError(e instanceof Error ? e.message : "Nie udało się wczytać szczegółów zadania.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!token || !isAllowed) return;
    void loadTasks();
    void loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAllowed]);

  useEffect(() => {
    if (!selectedTaskId) {
      const firstVisible = tasks[0]?.id ?? null;
      if (firstVisible) setSelectedTaskId(firstVisible);
      return;
    }
    if (!tasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0]?.id ?? null);
    }
  }, [selectedTaskId, tasks]);

  useEffect(() => {
    if (!selectedTaskId) {
      setDetail(null);
      setDetailForm(null);
      return;
    }
    void loadDetail(selectedTaskId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId, token]);

  useEffect(() => {
    if (!isCreateTaskModalOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && !creating) setIsCreateTaskModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCreateTaskModalOpen, creating]);

  const assigneeOptions = useMemo(() => {
    return [...staff].sort((a, b) => normalizeAssigneeLabel(a).localeCompare(normalizeAssigneeLabel(b), "pl"));
  }, [staff]);

  const activeFilterCounts = useMemo(() => {
    const base = tasks;
    const myId = String(user?.id ?? "");
    return {
      all: base.length,
      mine: base.filter((t) => String(t.assigned_to ?? "") === myId).length,
      team: base.filter((t) => String(t.assigned_to ?? "") !== "").length,
      open: base.filter((t) => taskIsOpen(t.status)).length,
      completed: base.filter((t) => (t.status ?? "").toLowerCase() === "completed").length,
      cancelled: base.filter((t) => (t.status ?? "").toLowerCase() === "cancelled").length,
      urgent: base.filter((t) => (t.priority ?? "").toLowerCase() === "urgent").length,
      unassigned: base.filter((t) => !t.assigned_to).length,
    };
  }, [tasks, user?.id]);

  const listRows = useMemo(() => {
    const myId = String(user?.id ?? "");
    const needle = search.trim();
    return [...tasks]
      .filter((task) => {
        const status = (task.status ?? "").toLowerCase();
        const priority = (task.priority ?? "").toLowerCase();
        const assignedTo = task.assigned_to ? String(task.assigned_to) : "";
        if (viewFilter === "mine" && assignedTo !== myId) return false;
        if (viewFilter === "team" && assignedTo === "") return false;
        if (viewFilter === "open" && !taskIsOpen(status)) return false;
        if (viewFilter === "completed" && status !== "completed") return false;
        if (viewFilter === "cancelled" && status !== "cancelled") return false;
        if (viewFilter === "urgent" && priority !== "urgent") return false;
        if (viewFilter === "unassigned" && assignedTo !== "") return false;
        if (selectedAssigneeId && assignedTo !== selectedAssigneeId) return false;
        if (!needle) return true;
        const assigneeName = normalizeAssigneeLabel(
          assigneeOptions.find((s) => String(s.id) === assignedTo) ?? ({ id: "" } as StaffOption),
        );
        return taskSearchText(task, assigneeName).includes(needle);
      })
      .sort((a, b) => {
        const aOpen = taskIsOpen(a.status);
        const bOpen = taskIsOpen(b.status);
        if (aOpen !== bOpen) return aOpen ? -1 : 1;
        const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
        if (aDue !== bDue) return aDue - bDue;
        return new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      });
  }, [assigneeOptions, search, selectedAssigneeId, tasks, user?.id, viewFilter]);

  const selectedTask = useMemo(
    () => detail ?? (tasks.find((t) => t.id === selectedTaskId) as TaskDetail | undefined) ?? null,
    [detail, selectedTaskId, tasks],
  );
  const calendarTasks = useMemo(() => {
    const selected = parseYmd(selectedDate);
    if (!selected) return [];
    return tasks.filter((t) => {
      const d = parseLocalDate(t.due_date);
      return Boolean(d && isSameDay(d, selected));
    });
  }, [selectedDate, tasks]);

  const calendarCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) {
      const d = parseLocalDate(task.due_date);
      if (!d) continue;
      const key = ymd(d);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  const createTask = async () => {
    if (!token) return;
    if (!form.title.trim()) {
      addToast("Podaj tytuł zadania.", "error");
      return;
    }
    setCreating(true);
    try {
      const created = await api.post<TaskDetail>(
        "/tasks/",
        {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          status: form.status,
          assigned_to: form.assigned_to || undefined,
          due_date: form.due_date || undefined,
          is_archived: form.is_archived,
        },
        token,
      );
      await loadTasks();
      if (created?.id) {
        setSelectedTaskId(String(created.id));
        await loadDetail(String(created.id));
      }
      setForm(defaultCreateForm(user?.id ? String(user.id) : form.assigned_to));
      setIsCreateTaskModalOpen(false);
      addToast("Zadanie utworzone.", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się utworzyć zadania.";
      addToast(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const updateTask = async (payload: Partial<TaskDetail>) => {
    if (!token || !selectedTaskId) return;
    setSaving(true);
    try {
      await api.patch(`/tasks/${selectedTaskId}/`, payload, token);
      await loadTasks();
      await loadDetail(selectedTaskId);
      addToast("Zadanie zapisane.", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zapisać zadania.";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const saveDetailForm = async () => {
    if (!detail || !detailForm) return;
    const payload: Partial<TaskDetail> = {};
    if (detailForm.title.trim() !== detail.title) payload.title = detailForm.title.trim();
    if ((detailForm.description ?? "").trim() !== (detail.description ?? "").trim()) payload.description = detailForm.description.trim();
    if (detailForm.priority !== (detail.priority ?? "")) payload.priority = detailForm.priority;
    if (detailForm.status !== (detail.status ?? "")) payload.status = detailForm.status;
    if ((detailForm.assigned_to || null) !== (detail.assigned_to ? String(detail.assigned_to) : null)) {
      payload.assigned_to = detailForm.assigned_to || null;
    }
    if ((detailForm.due_date || "") !== (detail.due_date ? format(new Date(detail.due_date), "yyyy-MM-dd'T'HH:mm") : "")) {
      payload.due_date = detailForm.due_date || null;
    }
    if (detailForm.is_archived !== Boolean(detail.is_archived)) payload.is_archived = detailForm.is_archived;
    if (Object.keys(payload).length === 0) {
      addToast("Brak zmian do zapisania.", "info");
      return;
    }
    await updateTask(payload);
  };

  const quickStatus = async (status: string) => {
    if (!selectedTaskId) return;
    await updateTask({ status });
  };

  const quickReassign = async (assigneeId: string) => {
    if (!selectedTaskId) return;
    await updateTask({ assigned_to: assigneeId });
  };

  const selectedTaskDateLabel = selectedTask?.due_date ? fullDateLabel(selectedTask.due_date) : "Brak terminu";
  if (!isAllowed) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Brak dostępu do modułu zadań.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-3 py-4 md:px-4 md:py-8">
      <header className="mb-4 rounded-2xl border border-[#2a3246] bg-gradient-to-r from-[#0e1423] via-[#121b31] to-[#0d1629] p-4 shadow-[0_18px_50px_rgba(0,0,0,.35)] md:mb-6 md:rounded-[2rem] md:p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9db0d4]">{isStaffMode ? "Panel Pracownika" : "Panel Admina"}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{isStaffMode ? "Zadania" : "Zadania zespołu"}</h1>
        <p className="mt-1 max-w-4xl text-sm text-[#a9b8d6]">
          {isStaffMode
            ? "Zarządzaj zadaniami przypisanymi do Ciebie oraz utworzonymi przez Ciebie. Możesz tworzyć, edytować i usuwać zadania w swoim zakresie uprawnień."
            : "Zarządzaj zadaniami dla siebie i pracowników w jednym, czytelnym widoku. Dodawaj zadania z terminem, godziną, priorytetem i przypisaniem, a następnie edytuj je, przekazuj dalej, anuluj lub kończ jednym kliknięciem."}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Wszystkie" value={tasks.length} tone="text-white" />
          <SummaryCard label="Otwarte" value={activeFilterCounts.open} tone="text-[#bfdbfe]" />
          <SummaryCard label="Pilne" value={activeFilterCounts.urgent} tone="text-[#ffd9a6]" />
          <SummaryCard label="Bez przypisania" value={activeFilterCounts.unassigned} tone="text-[#fca5a5]" />
        </div>
      </header>

      <section className="mb-4 rounded-2xl border border-[#2b3650] bg-[#0c1322]/88 p-3 md:rounded-[2rem] md:p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_260px]">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setViewFilter(filter.value)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  viewFilter === filter.value
                    ? "border-[#3b82f6]/45 bg-[#3b82f6]/15 text-[var(--white)]"
                    : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                }`}
              >
                {filter.label}
                <span className="ml-2 text-[11px] opacity-70">{activeFilterCounts[filter.value]}</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <Search className="h-4 w-4 text-[#93c5fd]" aria-hidden />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Szukaj po tytule, pracowniku, naprawie..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#7f8da8]"
            />
          </label>
        </div>
      </section>

      {error ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void loadTasks()} title="Błąd komunikacji" />
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[390px_1fr_380px]">
        <aside className="rounded-2xl border border-[#2a3245] bg-gradient-to-b from-[#0d1424] to-[#0a0f1d] p-3 shadow-[0_16px_46px_rgba(0,0,0,.35)] md:rounded-[2rem] md:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">Lista zadań</div>
              <p className="mt-1 text-sm text-[#a9b8d6]">Kliknij zadanie, aby przejść do edycji.</p>
            </div>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" aria-hidden /> : null}
          </div>
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={selectedAssigneeId}
              onChange={(e) => setSelectedAssigneeId(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="">Wszyscy pracownicy</option>
              {assigneeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {normalizeAssigneeLabel(opt)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSelectedAssigneeId("");
                setSelectedDate(ymd(new Date()));
              }}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-[#cbd5e1] transition hover:bg-white/[0.08]"
            >
              Reset filtrów
            </button>
          </div>
          {loading ? (
            <TaskListSkeleton rows={8} />
          ) : listRows.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={EMPTY_STATES.tasks.icon}
                title="Brak dopasowanych zadań"
                description="Zmień filtry lub wyszukiwane hasło, aby zobaczyć inne zadania."
              />
            </div>
          ) : (
            <div className="max-h-[760px] space-y-2 overflow-x-hidden overflow-y-auto pr-0 sm:pr-1">
              {listRows.map((task) => {
                const active = task.id === selectedTaskId;
                const assignee = assigneeOptions.find((s) => String(s.id) === String(task.assigned_to ?? ""));
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full rounded-2xl border px-3 py-3 text-left transition"
                    style={{
                      borderColor: active ? "rgba(79,105,163,.75)" : "rgba(255,255,255,.10)",
                      background: active ? "rgba(79,105,163,.16)" : "rgba(255,255,255,.02)",
                    }}
                  >
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 w-full sm:w-auto">
                        <p className="truncate text-sm font-semibold text-white">{task.title}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#9fb1d3]">
                          <UserRound className="h-3.5 w-3.5" aria-hidden />
                          <span className="truncate">{assignee ? normalizeAssigneeLabel(assignee) : "Bez przypisania"}</span>
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(task.status)}`}>
                        {task.status_display ?? task.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#9fb1d3]">
                      <span className={`rounded-full border px-2 py-0.5 font-semibold ${taskPriorityTone(task.priority)}`}>
                        {task.priority_display ?? task.priority}
                      </span>
                      <span>{task.due_date ? isoLabel(task.due_date) : "Bez terminu"}</span>
                      {task.related_repair_number ? (
                        <span className="max-w-full truncate">· {task.related_repair_number}</span>
                      ) : null}
                    </div>
                    {task.description ? <p className="mt-2 line-clamp-2 text-xs text-[#7f8da8]">{task.description}</p> : null}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="rounded-2xl border border-[#2a3245] bg-gradient-to-b from-[#0d1424] to-[#0a0f1d] p-3 shadow-[0_16px_46px_rgba(0,0,0,.35)] md:rounded-[2rem] md:p-4">
          {!selectedTask ? (
            <div className="py-8">
              <EmptyState
                icon={EMPTY_STATES.notifications.icon}
                title="Wybierz zadanie"
                description="Po lewej stronie wybierz zadanie, aby podejrzeć i edytować jego szczegóły."
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-[#93c5fd]">{selectedTask.id}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">{selectedTask.title}</h2>
                  <p className="mt-1 text-sm text-[#a9b8d6]">
                    Termin: <span className="font-semibold text-[#dbeafe]">{selectedTaskDateLabel}</span>
                  </p>
                  <p className="mt-1 text-sm text-[#a9b8d6]">
                    Przypisane do: <span className="font-semibold text-[#dbeafe]">{selectedTask.assigned_to_name ?? "—"}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(selectedTask.status)}`}>
                    {selectedTask.status_display ?? selectedTask.status}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${taskPriorityTone(selectedTask.priority)}`}>
                    {selectedTask.priority_display ?? selectedTask.priority}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void quickStatus("completed")}
                  className="rounded-2xl bg-[#22c55e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:opacity-60"
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden />
                  Zakończ
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void quickStatus("cancelled")}
                  className="rounded-2xl bg-[#dc1e1e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b91c1c] disabled:opacity-60"
                >
                  <CircleSlash2 className="mr-2 inline h-4 w-4" aria-hidden />
                  Anuluj
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void quickStatus("in_progress")}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#dbeafe] transition hover:bg-white/[0.08] disabled:opacity-60"
                >
                  <PencilLine className="mr-2 inline h-4 w-4" aria-hidden />
                  W toku
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">Edycja zadania</h3>
                  {loadingDetail ? <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" aria-hidden /> : null}
                </div>
                {detailError ? <p className="mt-2 text-sm text-[#fca5a5]">{detailError}</p> : null}
                {detailForm ? (
                  <div className="mt-3 space-y-3">
                    <input
                      value={detailForm.title}
                      onChange={(e) => setDetailForm((curr) => (curr ? { ...curr, title: e.target.value } : curr))}
                      placeholder="Tytuł zadania"
                      className="w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
                    />
                    <textarea
                      value={detailForm.description}
                      onChange={(e) => setDetailForm((curr) => (curr ? { ...curr, description: e.target.value } : curr))}
                      rows={5}
                      placeholder="Opis i szczegóły zadania"
                      className="w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        value={detailForm.priority}
                        onChange={(e) => setDetailForm((curr) => (curr ? { ...curr, priority: e.target.value } : curr))}
                        className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
                      >
                        {PRIORITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={detailForm.status}
                        onChange={(e) => setDetailForm((curr) => (curr ? { ...curr, status: e.target.value } : curr))}
                        className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                      <select
                        value={detailForm.assigned_to}
                        onChange={(e) => setDetailForm((curr) => (curr ? { ...curr, assigned_to: e.target.value } : curr))}
                        className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
                      >
                        <option value="">Bez przypisania</option>
                        {assigneeOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {normalizeAssigneeLabel(opt)}
                          </option>
                        ))}
                      </select>
                      <PanelDateTimePicker
                        value={detailForm.due_date}
                        onChange={(next) => setDetailForm((curr) => (curr ? { ...curr, due_date: next } : curr))}
                        placeholder="Ustaw termin zadania"
                      />
                    </div>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[#dbeafe]">
                      <span>Archiwizuj zadanie</span>
                      <input
                        type="checkbox"
                        checked={detailForm.is_archived}
                        onChange={(e) => setDetailForm((curr) => (curr ? { ...curr, is_archived: e.target.checked } : curr))}
                        className="h-4 w-4 rounded border-white/20 bg-transparent"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveDetailForm()}
                        className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
                      >
                        {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setDetailForm(detail ? formFromTask(detail) : null)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#dbeafe] transition hover:bg-white/[0.08] disabled:opacity-60"
                      >
                        Cofnij zmiany
                      </button>
                          <button
                        type="button"
                        disabled={saving}
                        onClick={() => void quickReassign(user?.id ? String(user.id) : "")}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#dbeafe] transition hover:bg-white/[0.08] disabled:opacity-60"
                      >
                        Przypisz do mnie
                      </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={async () => {
                                  if (!token || !selectedTaskId) return;
                                  try {
                                    await api.delete(`/tasks/${selectedTaskId}/`, token);
                                    setSelectedTaskId(null);
                                    setDetail(null);
                                    setDetailForm(null);
                                    await loadTasks();
                                    addToast("Zadanie usunięte.", "success");
                                  } catch (e) {
                                    addToast(e instanceof Error ? e.message : "Nie udało się usunąć zadania.", "error");
                                  }
                                }}
                                className="rounded-xl border border-[#dc1e1e]/35 bg-[#dc1e1e]/15 px-4 py-2 text-sm font-semibold text-[#fecaca] transition hover:bg-[#dc1e1e]/25 disabled:opacity-60"
                              >
                                Usuń zadanie
                              </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">Historia i komentarze</h3>
                  {selectedTask?.comments?.length ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-[#cbd5e1]">
                      {selectedTask.comments.length}
                    </span>
                  ) : null}
                </div>
                {loadingDetail ? (
                  <TaskListSkeleton rows={3} />
                ) : selectedTask?.comments?.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedTask.comments.slice(-5).map((comment) => (
                      <div key={comment.id} className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-3">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#9fb1d3]">
                          <span>{comment.author_name ?? "—"}</span>
                          <span>{isoLabel(comment.created_at)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-[#e5e7eb]">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#9fb1d3]">Brak komentarzy do tego zadania.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border border-[#2a3245] bg-gradient-to-b from-[#0d1424] to-[#0a0f1d] p-3 shadow-[0_16px_46px_rgba(0,0,0,.35)] md:rounded-[2rem] md:p-4">
          <div className="rounded-3xl border border-[#3b82f6]/35 bg-gradient-to-r from-[#1e3a8a]/35 to-[#172554]/35 p-4">
            <button
              type="button"
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="w-full rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,.35)] transition hover:from-[#2563eb] hover:to-[#1d4ed8]"
            >
              <Sparkles className="mr-2 inline h-4 w-4" aria-hidden />
              Dodaj Nowe Zadanie
            </button>
          </div>

          <div className="rounded-3xl border border-[#3b82f6]/20 bg-gradient-to-br from-[#3b82f6]/10 to-transparent p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Kalendarz</h3>
              <CalendarDays className="h-4 w-4 text-[#93c5fd]" aria-hidden />
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f172a]/60 p-3">
              <DayPicker
                mode="single"
                selected={parseYmd(selectedDate) ?? undefined}
                onSelect={(d) => setSelectedDate(d ? ymd(d) : ymd(new Date()))}
                locale={pl}
                weekStartsOn={1}
                captionLayout="dropdown"
                defaultMonth={parseYmd(selectedDate) ?? new Date()}
                modifiers={{ hasTasks: (date) => calendarCounts.has(ymd(date)) }}
                modifiersClassNames={{ hasTasks: "ring-1 ring-[#3b82f6]/40 rounded-full" }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08]"
                onClick={() => setSelectedDate(ymd(new Date()))}
              >
                Dzisiaj
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08]"
                onClick={() => setSelectedDate(ymd(addDays(new Date(), 1)))}
              >
                Jutro
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08]"
                onClick={() => {
                  const d = addDays(new Date(), 7);
                  setSelectedDate(ymd(d));
                }}
              >
                Za 7 dni
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">
                Zadania na {selectedDate}
              </div>
              {calendarTasks.length === 0 ? (
                <p className="mt-2 text-sm text-[#9fb1d3]">Brak zadań z terminem w wybranym dniu.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {calendarTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0f172a]/70 px-3 py-2 text-left transition hover:border-[#3b82f6]/40 hover:bg-[#111c31]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{task.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(task.status)}`}>
                          {task.status_display ?? task.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#9fb1d3]">
                        <span>{task.due_date ? isoLabel(task.due_date) : "—"}</span>
                        <span className={`rounded-full border px-2 py-0.5 ${taskPriorityTone(task.priority)}`}>
                          {task.priority_display ?? task.priority}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">
              <ArchiveRestore className="h-4 w-4 text-[#93c5fd]" aria-hidden />
              {isStaffMode ? "Skróty zadaniowe" : "Skróty administracyjne"}
            </div>
            <div className="mt-3 grid gap-2 text-sm text-[#d1d5db]">
              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/60 p-3">
                <p className="font-semibold text-white">Edytuj i przekaż dalej</p>
                <p className="mt-1 text-xs text-[#9fb1d3]">W panelu pośrodku zmienisz tytuł, opis, termin, priorytet, status i osobę odpowiedzialną.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/60 p-3">
                <p className="font-semibold text-white">Anuluj lub zakończ</p>
                <p className="mt-1 text-xs text-[#9fb1d3]">Szybkie przyciski na karcie zadania ustawiają status bez wchodzenia w pełną edycję.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {isCreateTaskModalOpen ? (
        <div
          className="fixed inset-0 z-[320] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => {
            if (!creating) setIsCreateTaskModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="create-task-modal-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#3b82f6]/35 bg-gradient-to-b from-[#0f172a] to-[#0b1222] p-5 shadow-[0_20px_60px_rgba(0,0,0,.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb1d3]">Nowe zadanie</p>
                <h3 id="create-task-modal-title" className="mt-1 text-2xl font-semibold text-white">
                  Dodaj Nowe Zadanie
                </h3>
                <p className="mt-1 text-sm text-[#9fb1d3]">Wypełnij formularz i zatwierdź, aby od razu przypisać zadanie.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!creating) setIsCreateTaskModalOpen(false);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-[#cbd5e1] transition hover:bg-white/[0.1]"
                aria-label="Zamknij popup dodawania zadania"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[#0b1222]/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">Opis zadania</p>
                <input
                  value={form.title}
                  onChange={(e) => setForm((curr) => ({ ...curr, title: e.target.value }))}
                  placeholder="Np. Kontakt z klientem ws. części"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none placeholder:text-[#7f8da8] focus:border-[#3b82f6]"
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((curr) => ({ ...curr, description: e.target.value }))}
                  rows={4}
                  placeholder="Kontekst, kroki, uwagi dla osoby realizującej"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none placeholder:text-[#7f8da8] focus:border-[#3b82f6]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#0b1222]/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">Priorytet i status</p>
                  <div className="mt-2 grid gap-2">
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((curr) => ({ ...curr, priority: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((curr) => ({ ...curr, status: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0b1222]/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">Przypisanie i termin</p>
                  <div className="mt-2 grid gap-2">
                    <select
                      value={form.assigned_to}
                      onChange={(e) => setForm((curr) => ({ ...curr, assigned_to: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
                    >
                      <option value="">Bez przypisania</option>
                      {assigneeOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {normalizeAssigneeLabel(opt)}
                        </option>
                      ))}
                    </select>
                    <PanelDateTimePicker
                      value={form.due_date}
                      onChange={(next) => setForm((curr) => ({ ...curr, due_date: next }))}
                      placeholder="Ustaw datę i godzinę"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08]"
                  onClick={() => {
                    const next = new Date();
                    next.setHours(17, 0, 0, 0);
                    setForm((curr) => ({ ...curr, due_date: toLocalDateTimeValue(next) }));
                  }}
                >
                  Dziś 17:00
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08]"
                  onClick={() => {
                    const next = addDays(new Date(), 1);
                    next.setHours(9, 0, 0, 0);
                    setForm((curr) => ({ ...curr, due_date: toLocalDateTimeValue(next) }));
                  }}
                >
                  Jutro 09:00
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08]"
                  onClick={() => {
                    const next = addDays(new Date(), 2);
                    next.setHours(9, 0, 0, 0);
                    setForm((curr) => ({ ...curr, due_date: toLocalDateTimeValue(next) }));
                  }}
                >
                  Za 2 dni 09:00
                </button>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[#dbeafe]">
                <span>Archiwizuj od razu</span>
                <input
                  type="checkbox"
                  checked={form.is_archived}
                  onChange={(e) => setForm((curr) => ({ ...curr, is_archived: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08]"
                    onClick={() => setForm(defaultCreateForm(String(user?.id ?? "")))}
                  >
                    Reset formularza
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[0.08]"
                    onClick={() => setForm((curr) => ({ ...curr, assigned_to: String(user?.id ?? "") }))}
                  >
                    Przypisz do mnie
                  </button>
                </div>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void createTask()}
                  className="rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:from-[#2563eb] hover:to-[#1d4ed8] disabled:opacity-60"
                >
                  {creating ? "Dodawanie..." : "Dodaj Nowe Zadanie"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}



