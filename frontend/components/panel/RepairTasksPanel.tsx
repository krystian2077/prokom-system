"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Info, Loader2, Sparkles } from "lucide-react";

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

  const zadaniaFilteredHref = `${tasksListHref}?${new URLSearchParams({ related_repair: repairId }).toString()}`;

  return (
    <section id="repair-tasks-section" className="scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
            <ClipboardList size={16} className="text-[#3b82f6]" aria-hidden />
            Zadania przy tej naprawie
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Szybkie zadania na siebie, powiązane z {repairNumber}. Propozycje systemu (gdy nie masz otwartych zadań przy
            tej naprawie) dodasz jednym kliknięciem.
          </p>
        </div>
        <Link
          href={zadaniaFilteredHref}
          className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[#93c5fd] transition hover:bg-[var(--row-active)]"
        >
          Moje zadania (filtr)
        </Link>
      </div>

      {openTasks.length > 0 ? (
        <div
          className="mt-4 rounded-2xl border border-[#3b82f6]/30 bg-gradient-to-br from-[#3b82f6]/12 to-transparent px-4 py-3"
          role="status"
        >
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#3b82f6]/35 bg-[#3b82f6]/15">
              <Info className="h-4 w-4 text-[#93c5fd]" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--white)]">Masz już otwarte zadania przy tej naprawie</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">
                Łącznie:{" "}
                <span className="font-medium text-[#e5e7eb]">
                  {openTasks.length}{" "}
                  {openTasks.length === 1 ? "aktywne zadanie" : "aktywnych zadań"}
                </span>{" "}
                przy tym zgłoszeniu.{" "}
                <span className="font-medium text-[#e5e7eb]">Propozycje systemu są wstrzymane</span>, dopóki coś
                jest otwarte — po zamknięciu (Zakończ) system zaproponuje kolejne kroki. Nadal możesz dodać zadanie
                ręcznie lub z szablonu poniżej.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          <Sparkles size={14} className="text-[#f59e0b]" aria-hidden />
          Propozycje systemu
        </div>
        {suggestionsQuery.isLoading ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-[var(--ink2)]">
            <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" aria-hidden />
            Ładowanie propozycji…
          </div>
        ) : suggestions.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {openTasks.length > 0
              ? "Propozycje systemu pojawią się tutaj, gdy zamkniesz wszystkie otwarte zadania przy tej naprawie (np. „Zakończ” w Moje zadania). Do tego czasu skorzystaj z formularza lub szablonów poniżej."
              : "Brak dopasowanych propozycji dla bieżącego statusu i opisu problemu — użyj formularza lub szablonów poniżej."}
          </p>
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

      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Nowe zadanie</div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Wpisz tytuł poniżej lub użyj szablonu — wstawi on tekst w pole (możesz go edytować).
        </p>
        <div className="mt-3 rounded-2xl border border-[#3b82f6]/25 bg-[var(--s1)] p-3">
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

      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Twoje otwarte zadania ({openTasks.length})
          </span>
          {tasksQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" aria-hidden /> : null}
        </div>
        {tasksQuery.isError ? (
          <p className="mt-2 text-sm text-[#fca5a5]">Nie udało się wczytać listy zadań.</p>
        ) : openTasks.length === 0 && !tasksQuery.isLoading ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Brak otwartych zadań przypisanych do Ciebie przy tej naprawie.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {openTasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={zadaniaFilteredHref}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm transition hover:border-white/20 hover:bg-[var(--row-hover)]"
                >
                  <span className="min-w-0 font-medium text-[var(--white)]">{t.title}</span>
                  <span className="shrink-0 text-[11px] font-semibold text-[var(--ink2)]">{t.status_display ?? t.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
