"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2 } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStore } from "@/stores/workerStore";
import type { TaskListItem, TaskSuggestion } from "@/types/tasks";

type QuickTemplateId = "order" | "call" | "message" | "client_update" | "final_test";

const QUICK_TEMPLATES: Array<{
  id: QuickTemplateId;
  label: string;
  defaultTitle: (repairNumber: string) => string;
  priority?: string;
}> = [
  { id: "order", label: "Zamówić część", defaultTitle: (n) => `Zamówić część — ${n}` },
  { id: "call", label: "Zadzwonić do klienta", defaultTitle: (n) => `Zadzwonić do klienta — ${n}` },
  {
    id: "message",
    label: "Napisać do klienta",
    defaultTitle: (n) => `Napisać do klienta (SMS / e-mail) — ${n}`,
  },
  {
    id: "client_update",
    label: "Status dla klienta",
    defaultTitle: (n) => `Poinformować klienta o postępie naprawy — ${n}`,
  },
  {
    id: "final_test",
    label: "Test po naprawie",
    defaultTitle: (n) => `Wykonać test końcowy po naprawie — ${n}`,
    priority: "important",
  },
];

function parseTaskList(res: unknown): TaskListItem[] {
  if (Array.isArray(res)) return res as TaskListItem[];
  const r = res as { results?: unknown } | null;
  if (r && Array.isArray(r.results)) return r.results as TaskListItem[];
  return [];
}

const TASK_PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  important: 1,
  standard: 2,
  low: 3,
};

function getTaskPriorityRank(priority?: string | null) {
  return TASK_PRIORITY_RANK[(priority ?? "").toLowerCase()] ?? 99;
}

function getTaskDateRank(date?: string | null) {
  if (!date) return Number.POSITIVE_INFINITY;
  const ts = Date.parse(date);
  return Number.isNaN(ts) ? Number.POSITIVE_INFINITY : ts;
}

export function RepairTasksPanel({
  repairId,
  repairNumber,
  tasksListHref = "/panel/zadania",
}: {
  repairId: string;
  repairNumber: string;
  tasksListHref?: string;
}) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const showToast = useWorkerStore((s) => s.addToast);

  const [composerTitle, setComposerTitle] = useState("");
  const [composerPriority, setComposerPriority] = useState("standard");

  const tasksQuery = useQuery({
    queryKey: ["tasks", "by-repair", repairId, user?.id],
    enabled: Boolean(token && user?.id && repairId),
    queryFn: async () => {
      if (!token || !user?.id) throw new Error("Brak sesji.");
      const params = new URLSearchParams();
      params.set("related_repair", repairId);
      params.set("assigned_to", user.id);
      const res = await api.get<unknown>(`/tasks/?${params.toString()}`, token);
      return parseTaskList(res);
    },
    staleTime: 15_000,
  });

  const suggestionsQuery = useQuery({
    queryKey: ["tasks", "suggestions", repairId],
    enabled: Boolean(token && repairId),
    queryFn: async () => {
      if (!token) throw new Error("Brak sesji.");
      const res = await api.get<TaskSuggestion[]>(
        `/tasks/suggested-for-repair/?repair=${encodeURIComponent(repairId)}`,
        token,
      );
      return Array.isArray(res) ? res : [];
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; priority?: string; description?: string }) => {
      if (!token || !user?.id) throw new Error("Brak sesji.");
      return api.post(
        `/tasks/`,
        {
          title: payload.title.trim(),
          priority: payload.priority ?? "standard",
          description: payload.description?.trim() || undefined,
          related_repair: repairId,
          assigned_to: user.id,
        },
        token,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "by-repair", repairId] });
      void queryClient.invalidateQueries({ queryKey: ["tasks", "suggestions", repairId] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      showToast("Zadanie dodane do Twojej listy.", "success");
      setComposerTitle("");
      setComposerPriority("standard");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się dodać zadania.", "error");
    },
  });

  const tasks = tasksQuery.data ?? [];
  const suggestions = suggestionsQuery.data ?? [];
  const openTasks = tasks.filter((t) => {
    const s = (t.status ?? "").toLowerCase();
    return s !== "completed" && s !== "cancelled";
  });
  const prioritizedOpenTasks = [...openTasks].sort((a, b) => {
    const priorityDiff = getTaskPriorityRank(a.priority) - getTaskPriorityRank(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    const dueDiff = getTaskDateRank(a.due_date) - getTaskDateRank(b.due_date);
    if (dueDiff !== 0) return dueDiff;

    const updatedDiff = getTaskDateRank(b.updated_at) - getTaskDateRank(a.updated_at);
    if (updatedDiff !== 0) return updatedDiff;

    return getTaskDateRank(b.created_at) - getTaskDateRank(a.created_at);
  });
  const featuredOpenTask = prioritizedOpenTasks[0] ?? null;
  const remainingOpenTasks = prioritizedOpenTasks.slice(1);

  const zadaniaFilteredHref = `${tasksListHref}?${new URLSearchParams({ related_repair: repairId }).toString()}`;

  return (
    <section id="repair-tasks-section" className="scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
            <ClipboardList size={16} className="text-[#3b82f6]" aria-hidden />
            Zadania przy tej naprawie
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">Szybkie zadania na siebie, powiązane z {repairNumber}.</p>
        </div>
        <Link
          href={zadaniaFilteredHref}
          className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[#93c5fd] transition hover:bg-[var(--row-active)]"
        >
          Moje zadania (filtr)
        </Link>
      </div>

      <div className="mt-5 rounded-2xl border border-[#3b82f6]/20 bg-gradient-to-br from-[#3b82f6]/10 to-transparent p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">
            Aktywne zadania ({openTasks.length})
          </span>
          {tasksQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" aria-hidden /> : null}
        </div>
        {tasksQuery.isError ? (
          <p className="mt-2 text-sm text-[#fca5a5]">Nie udało się wczytać listy zadań.</p>
        ) : openTasks.length === 0 && !tasksQuery.isLoading ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Brak otwartych zadań przypisanych do Ciebie przy tej naprawie.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {featuredOpenTask ? (
              <Link
                href={zadaniaFilteredHref}
                className="block rounded-2xl border border-[#f59e0b]/40 bg-gradient-to-br from-[#f59e0b]/20 via-[#3b82f6]/10 to-transparent px-4 py-3 shadow-[0_14px_28px_-16px_rgba(245,158,11,0.65)] transition hover:border-[#f59e0b]/60 hover:shadow-[0_18px_34px_-18px_rgba(245,158,11,0.75)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#fbbf24]">
                        Najważniejsze teraz
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--ink2)]">
                        {featuredOpenTask.priority_display ?? featuredOpenTask.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold text-[var(--white)]">{featuredOpenTask.title}</p>
                    <p className="mt-1 text-sm text-[var(--ink2)]">
                      {featuredOpenTask.status_display ?? featuredOpenTask.status}
                      {featuredOpenTask.due_date ? ` · termin ${featuredOpenTask.due_date}` : " · bez terminu"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#3b82f6]/25 bg-[#3b82f6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#93c5fd]">
                    Otwórz
                  </span>
                </div>
              </Link>
            ) : null}

            {remainingOpenTasks.length > 0 ? (
              <ul className="space-y-2">
                {remainingOpenTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={zadaniaFilteredHref}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm transition hover:border-white/20 hover:bg-[var(--row-hover)]"
                    >
                      <span className="min-w-0 font-medium text-[var(--white)]">{t.title}</span>
                      <span className="shrink-0 text-[11px] font-semibold text-[var(--ink2)]">
                        {t.status_display ?? t.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-[#3b82f6]/25 bg-gradient-to-br from-[#3b82f6]/8 to-transparent p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Nowe zadanie</div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Wpisz tytuł poniżej lub użyj szablonu — wstawi on tekst w pole (możesz go edytować).
        </p>
        <div className="mt-3 rounded-2xl border border-[#3b82f6]/25 bg-[var(--s1)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <label htmlFor={`repair-task-title-${repairId}`} className="sr-only">
            Tytuł zadania
          </label>
          <input
            id={`repair-task-title-${repairId}`}
            value={composerTitle}
            onChange={(e) => setComposerTitle(e.target.value)}
            placeholder="Tytuł zadania…"
            autoComplete="off"
            className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2.5 text-sm text-[var(--white)] outline-none placeholder:text-[var(--muted)] focus:border-[#3b82f6]"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={composerPriority}
              onChange={(e) => setComposerPriority(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-[var(--white)] outline-none"
            >
              <option value="standard">Normalny</option>
              <option value="important">Wysoki</option>
              <option value="urgent">Pilny</option>
              <option value="low">Niski</option>
            </select>
            <button
              type="button"
              disabled={createMutation.isPending || !composerTitle.trim()}
              onClick={() => createMutation.mutate({ title: composerTitle, priority: composerPriority })}
              className="rounded-xl bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:opacity-50"
            >
              {createMutation.isPending ? "Dodaję…" : "Dodaj zadanie"}
            </button>
            <button
              type="button"
              onClick={() => {
                setComposerTitle("");
                setComposerPriority("standard");
              }}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--row-hover)]"
            >
              Wyczyść pole
            </button>
          </div>
        </div>

        <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Szablony (wypełniają pole)</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setComposerTitle(t.defaultTitle(repairNumber));
                setComposerPriority(t.priority ?? "standard");
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-xs font-semibold text-[#e5e7eb] transition hover:border-[#3b82f6]/40 hover:bg-[var(--row-hover)]"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {suggestionsQuery.isLoading || suggestions.length > 0 ? (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Szybkie propozycje</div>
          {suggestionsQuery.isLoading ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--ink2)]">
              <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" aria-hidden />
              Ładowanie propozycji…
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <div
                  key={s.suggestion_key}
                  className="flex max-w-full flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 sm:max-w-[320px] sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {s.reason_label === "problem" ? "Problem" : "Status"}
                    </span>
                    <p className="text-sm font-medium text-[var(--white)]">{s.title}</p>
                  </div>
                  <button
                    type="button"
                    disabled={createMutation.isPending}
                    onClick={() =>
                      createMutation.mutate({
                        title: s.title,
                        priority: s.priority,
                        description: [s.description, `Propozycja systemu (${s.suggestion_key}).`].filter(Boolean).join(" "),
                      })
                    }
                    className="shrink-0 rounded-xl bg-[#3b82f6] px-3 py-1.5 text-xs font-semibold text-[var(--white)] transition hover:bg-[#2563eb] disabled:opacity-60"
                  >
                    Dodaj
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
