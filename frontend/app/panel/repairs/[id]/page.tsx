"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Clock4,
  ArrowLeft,
  MessageSquareText,
  Receipt,
  History,
  ClipboardCheck,
  PlayCircle,
  Wrench,
  ShieldAlert,
  Smartphone,
  Package,
} from "lucide-react";

import { api } from "@/lib/api";
import type { RepairDetail, RepairTimelineEvent } from "@/types/repairs";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStore } from "@/stores/workerStore";
import { RepairPartsSection } from "@/components/panel/RepairPartsSection";
import { RepairDetailLoadingSkeleton } from "@/components/panel/RepairDetailLoadingSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

type TabId = "details" | "parts" | "checklist" | "test" | "comms" | "pricing" | "client_history";

/** Statusy przed zakończeniem diagnostyki — sekcja „Naprawa” w checklistie pozostaje zablokowana (Rozdz. 12). */
const PRE_DIAGNOSTICS_REPAIR_STATUSES = new Set(["new", "accepted", "in_diagnostics"]);

function StatusPill({ status_display, status }: { status_display?: string | null; status?: string | null }) {
  const s = (status ?? "").toLowerCase();
  const isReady = s === "ready_for_pickup";
  const isUrgentish = ["waiting_for_parts", "testing_failed"].includes(s);
  const bg = isReady
    ? "rgba(34,197,94,.14)"
    : isUrgentish
      ? "rgba(245,158,11,.16)"
      : "rgba(59,130,246,.14)";
  const border = isReady
    ? "rgba(34,197,94,.30)"
    : isUrgentish
      ? "rgba(245,158,11,.30)"
      : "rgba(59,130,246,.28)";
  const text = isReady ? "#22c55e" : isUrgentish ? "#f59e0b" : "#3b82f6";

  return (
    <span
      className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: bg, borderColor: border, color: text }}
      title="Status"
    >
      {status_display ?? status ?? "—"}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition"
      style={{
        borderColor: active ? "rgba(59,130,246,.45)" : "rgba(255,255,255,.10)",
        background: active ? "linear-gradient(135deg, rgba(59,130,246,.18), rgba(37,99,235,.10))" : "transparent",
        color: active ? "#fff" : "#9ca3af",
      }}
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export default function RepairDetailPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const pathname = usePathname() ?? "";
  const repairId = params?.id;

  const isAdminRepairContext = pathname.startsWith("/admin-panel");
  const repairsListHref = isAdminRepairContext ? "/admin-panel/repairs" : "/panel/naprawy";
  const repairsBackLabel = isAdminRepairContext ? "Wróć do listy napraw" : "Wróć do napraw";
  const repairSiblingHref = (id: string) =>
    isAdminRepairContext ? `/admin-panel/repairs/${encodeURIComponent(id)}` : `/panel/naprawy/${encodeURIComponent(id)}`;

  const openStatusModal = useWorkerStore((s) => s.openStatusModal);
  const showToast = useWorkerStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [commChannel, setCommChannel] = useState<"sms" | "email">("sms");
  const [commDraft, setCommDraft] = useState("");
  const commTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commSectionRef = useRef<HTMLElement | null>(null);

  const repairQuery = useQuery({
    queryKey: ["repair", repairId],
    enabled: Boolean(token && user && repairId),
    queryFn: async () => {
      if (!token || !repairId) throw new Error("Missing token/repairId");
      return api.get<RepairDetail>(`/staff/repairs/${repairId}/`, token);
    },
    staleTime: 10_000,
  });

  const timelineQuery = useQuery({
    queryKey: ["repair", repairId, "timeline"],
    enabled: Boolean(token && user && repairId),
    queryFn: async () => {
      if (!token || !repairId) throw new Error("Missing token/repairId");
      return api.get<RepairTimelineEvent[]>(`/repairs/${repairId}/timeline/`, token);
    },
    staleTime: 10_000,
  });

  const repair = repairQuery.data ?? null;
  const timeline = timelineQuery.data ?? [];

  const lastUpdatedText = useMemo(() => {
    const d = repair?.updated_at ? new Date(repair.updated_at) : null;
    return d ? d.toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—";
  }, [repair?.updated_at]);

  const commTimeline = useMemo(() => timeline.filter((ev) => ev.type === "communication"), [timeline]);

  const showInstallCta = (repair?.status ?? "").toLowerCase() === "ready_for_pickup";

  // ---------- Tab: Checklista ----------
  const checklistQuery = useQuery({
    queryKey: ["repair", repairId, "checklist"],
    enabled: Boolean(token && user && repairId && activeTab === "checklist"),
    queryFn: async () => {
      if (!token || !repairId) throw new Error("Missing token/repairId");
      const res = await api.get<any>(`/repairs/${repairId}/checklist/`, token);
      return res ?? { run: null, items: [] };
    },
    staleTime: 5_000,
  });

  const checklistItemMutation = useMutation({
    mutationFn: async (payload: { item_id: number; checked?: boolean; result?: string; note?: string }) => {
      if (!token || !repairId) throw new Error("Missing token/repairId");
      return api.patch<any>(`/repairs/${repairId}/checklist/item/`, payload, token);
    },
    onMutate: async (payload) => {
      const key = ["repair", repairId, "checklist"] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<any>(key);
      const actor = (user?.full_name ?? "").trim() || user?.email || "Ty";
      queryClient.setQueryData(key, (old: any) => {
        if (!old?.items) return old;
        const items = old.items.map((it: any) => {
          if (it.id !== payload.item_id) return it;
          if (payload.checked === true) {
            return {
              ...it,
              result: "checked",
              checked_at: new Date().toISOString(),
              checked_by_name: actor,
            };
          }
          if (payload.checked === false) {
            return { ...it, result: "", checked_at: null, checked_by_name: null };
          }
          return it;
        });
        let run = old.run;
        if (run) {
          const allDone = items.every((it: any) => it.result && String(it.result).trim());
          if (allDone) {
            run = {
              ...run,
              status: "completed",
              completed_at: run.completed_at || new Date().toISOString(),
            };
          } else {
            run = { ...run, status: "in_progress", completed_at: null };
          }
        }
        return { ...old, items, run };
      });
      return { previous };
    },
    onError: (err, _payload, ctx) => {
      const key = ["repair", repairId, "checklist"] as const;
      if (ctx?.previous !== undefined) queryClient.setQueryData(key, ctx.previous);
      showToast(err instanceof Error ? err.message : "Nie udało się zapisać checklisty.", "error");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "checklist"] });
    },
  });

  // ---------- Tab: Wycena ----------
  const quotesListQuery = useQuery({
    queryKey: ["repair", repairId, "quotes-list"],
    enabled: Boolean(token && user && repairId && activeTab === "pricing"),
    queryFn: async () => {
      if (!token || !repairId) throw new Error("Missing token/repairId");
      const res = await api.get<any>(`/pricing/quotes/?repair=${repairId}`, token);
      const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];
      return list as Array<any>;
    },
    staleTime: 10_000,
  });

  const selectedQuoteId = useMemo(() => {
    const quotes = quotesListQuery.data ?? [];
    if (!quotes.length) return null;
    const accepted = quotes.find((q) => q.status === "accepted");
    if (accepted) return accepted.id;
    const sent = quotes.find((q) => q.status === "sent");
    if (sent) return sent.id;
    const draft = quotes.find((q) => q.status === "draft");
    if (draft) return draft.id;
    return quotes[0]?.id ?? null;
  }, [quotesListQuery.data]);

  const quoteDetailQuery = useQuery({
    queryKey: ["repair", repairId, "quote-detail", selectedQuoteId],
    enabled: Boolean(token && user && repairId && activeTab === "pricing" && selectedQuoteId),
    queryFn: async () => {
      if (!token || !selectedQuoteId) throw new Error("Missing token/quoteId");
      return api.get<any>(`/pricing/quotes/${selectedQuoteId}/`, token);
    },
    staleTime: 10_000,
  });

  const quoteVersionsQuery = useQuery({
    queryKey: ["repair", repairId, "quote-versions", selectedQuoteId],
    enabled: Boolean(token && user && repairId && activeTab === "pricing" && selectedQuoteId),
    queryFn: async () => {
      if (!token || !selectedQuoteId) throw new Error("Missing token/quoteId");
      return api.get<any[]>(`/pricing/quotes/${selectedQuoteId}/versions/`, token);
    },
    staleTime: 30_000,
  });

  // ---------- Tab: Historia klienta ----------
  const clientRepairsQuery = useQuery({
    queryKey: ["repair", repairId, "client-repairs", repair?.client?.id],
    enabled: Boolean(token && user && repairId && repair?.client?.id && activeTab === "client_history"),
    queryFn: async () => {
      if (!token || !repair?.client?.id) throw new Error("Missing token/clientId");
      const res = await api.get<any>(`/staff/repairs/?client=${repair.client.id}&ordering=-created_at`, token);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 20_000,
  });

  const checklistRun = checklistQuery.data?.run ?? null;
  const checklistItems = (checklistQuery.data?.items ?? []) as Array<any>;
  const quotesList = quotesListQuery.data ?? [];
  const quoteDetail = quoteDetailQuery.data ?? null;
  const quoteVersions = quoteVersionsQuery.data ?? [];
  const clientRepairs = clientRepairsQuery.data ?? [];
  const checklistDoneCount = useMemo(
    () => checklistItems.filter((it) => Boolean(it.result && String(it.result).trim())).length,
    [checklistItems],
  );

  const repairSectionStartIndex = useMemo(() => {
    const n = checklistItems.length;
    if (n <= 1) return n;
    return Math.ceil(n / 2);
  }, [checklistItems.length]);

  const repairChecklistRowsLocked = useMemo(
    () => PRE_DIAGNOSTICS_REPAIR_STATUSES.has((repair?.status ?? "").toLowerCase()),
    [repair?.status],
  );

  useEffect(() => {
    if (!repairId) return;
    const key = `draft-${repairId}`;
    const saved = localStorage.getItem(key);
    if (saved) setCommDraft(saved);
  }, [repairId]);

  useEffect(() => {
    if (!repairId) return;
    const key = `draft-${repairId}`;
    const t = window.setTimeout(() => {
      if (commDraft.trim()) localStorage.setItem(key, commDraft);
      else localStorage.removeItem(key);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [repairId, commDraft]);

  const smsMeta = useMemo(() => {
    const len = commDraft.length;
    const chunks = Math.max(1, Math.ceil(Math.max(0, len) / 160));
    const cap = chunks * 160;
    const tone = len >= 155 ? "red" : len >= 130 ? "amber" : "green";
    return { len, chunks, cap, tone };
  }, [commDraft]);

  if (repairQuery.isLoading) {
    return <RepairDetailLoadingSkeleton listHref={repairsListHref} backLabel={repairsBackLabel} />;
  }

  if (repairQuery.error || !repair) {
    const msg = repairQuery.error instanceof Error ? repairQuery.error.message : "Nie udało się pobrać szczegółów naprawy.";
    return (
      <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
        <div className="rounded-3xl border border-red-500/25 bg-[#0f1117] p-6 text-[#fca5a5]">
          <p className="text-sm">{msg}</p>
          <Link
            href={repairsListHref}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#3b82f6] hover:underline"
          >
            <ArrowLeft size={16} />
            {repairsBackLabel}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={repairsListHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} />
            {repairsBackLabel}
          </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0c0d12] px-4 py-2 text-sm text-[#9ca3af]">
            <Clock4 size={16} className="text-[#3b82f6]" />
            <span>Aktualizacja:</span>
            <span className="font-semibold text-white">{lastUpdatedText}</span>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1117] p-5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-90"
            aria-hidden
          />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-start gap-4">
                <div
                  className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[var(--s2)]"
                  style={{ background: "var(--s2, #141720)" }}
                >
                  <Smartphone size={24} className="text-[#3b82f6]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Naprawa</div>
                  <h1 className="mt-2 flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-base font-bold tracking-tight text-white md:text-lg">{repair.repair_number}</span>
                    <span className="text-sm font-semibold text-[#9ca3af]">· {repair.device_name}</span>
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusPill status_display={repair.status_display} status={repair.status} />
                    {repair.priority_display ? (
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
                        {repair.priority_display}
                      </span>
                    ) : null}
                    {repair.estimated_completion_date ? (
                      <span className="inline-flex rounded-full border border-[#3b82f6]/25 bg-[#3b82f6]/10 px-3 py-1 text-[11px] font-semibold text-[#93c5fd]">
                        SLA: {repair.estimated_completion_date}
                      </span>
                    ) : null}
                    {repair.requires_attention ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#f59e0b]">
                        <ShieldAlert size={14} />
                        Wymaga reakcji
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openStatusModal(repair.id)}
                  className="rounded-2xl bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#22c55e]/25 transition hover:bg-[#16a34a]"
                >
                  Zmień status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("comms");
                    setTimeout(() => {
                      commSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      commTextareaRef.current?.focus();
                    }, 80);
                  }}
                  className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
                >
                  Wiadomość
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQuickMenu((v) => !v)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                  >
                    ...
                  </button>
                  {showQuickMenu ? (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-52 rounded-2xl border border-white/10 bg-[#0c0d12] p-2 shadow-xl">
                      <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#d1d5db] hover:bg-white/5">
                        Drukuj przyjęcie
                      </button>
                      <button type="button" className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-[#d1d5db] hover:bg-white/5">
                        Duplikuj
                      </button>
                      <button type="button" className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-[#d1d5db] hover:bg-white/5">
                        Otwórz reklamację
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="mt-4 text-sm text-[#9ca3af]">
                Klient: <span className="font-semibold text-white">{repair.client.full_name}</span>
              </p>

              <div className="mt-3 text-sm text-[#9ca3af]">
                <span className="font-semibold text-white">Problem:</span> {repair.problem_description}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#0c0d12] p-4 lg:min-w-[300px]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Odbiór / dostawa</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#9ca3af]">Dostawa</span>
                  <span className="font-semibold text-white">{repair.delivery_method}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#9ca3af]">Adres</span>
                  <span className="text-right font-semibold text-white">{repair.delivery_address ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#9ca3af]">Zwrot</span>
                  <span className="font-semibold text-white">{repair.return_method}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#9ca3af]">Gotowość</span>
                  <span className="font-semibold text-white">{repair.estimated_completion_date ?? "—"}</span>
                </div>
              </div>
              {showInstallCta ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("checklist")}
                    className="w-full rounded-2xl bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
                  >
                    Zamontuj teraz!
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0f1117] p-4">
          <div className="flex flex-wrap gap-3">
            <TabButton active={activeTab === "details"} onClick={() => setActiveTab("details")} icon={<Wrench size={16} />} label="Szczegóły" />
            <TabButton active={activeTab === "parts"} onClick={() => setActiveTab("parts")} icon={<Package size={16} />} label="Części" />
            <TabButton
              active={activeTab === "checklist"}
              onClick={() => setActiveTab("checklist")}
              icon={<ClipboardCheck size={16} />}
              label={`Checklista (${checklistDoneCount}/${Math.max(checklistItems.length, 10)})`}
            />
            <TabButton active={activeTab === "test"} onClick={() => setActiveTab("test")} icon={<PlayCircle size={16} />} label="Test końcowy" />
            <TabButton active={activeTab === "comms"} onClick={() => setActiveTab("comms")} icon={<MessageSquareText size={16} />} label="Komunikacja" />
            <TabButton active={activeTab === "pricing"} onClick={() => setActiveTab("pricing")} icon={<Receipt size={16} />} label="Wycena" />
            <TabButton
              active={activeTab === "client_history"}
              onClick={() => setActiveTab("client_history")}
              icon={<History size={16} />}
              label="Historia klienta"
            />
          </div>
        </section>

        {activeTab === "details" ? (
          <section className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Szczegóły naprawy</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Urządzenie</div>
                    <div className="mt-2 text-sm font-semibold text-white">{repair.device_name}</div>
                    <div className="mt-1 text-xs text-[#9ca3af]">{repair.device.category}</div>
                    <div className="mt-2 text-xs text-[#9ca3af]">Weryfikacja: {repair.device_turns_on ? "tak" : "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Klient</div>
                    <div className="mt-2 text-sm font-semibold text-white">{repair.client.full_name}</div>
                    <div className="mt-1 text-xs text-[#9ca3af]">{repair.client.email}</div>
                    <div className="mt-2 text-xs text-[#9ca3af]">Telefon: {repair.client.phone ?? "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Wewnętrzny status</div>
                    <div className="mt-2 text-sm font-semibold text-white">{repair.internal_status ?? "—"}</div>
                    <div className="mt-2 text-xs text-[#9ca3af]">Wymaga reakcji: {repair.requires_attention ? "tak" : "nie"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Notatki klienta</div>
                    <div className="mt-2 text-sm font-semibold text-white">{repair.client_notes ? "Dostępne" : "—"}</div>
                    <div className="mt-2 text-xs text-[#9ca3af]">{repair.client_notes ?? "Brak notatek od klienta."}</div>
                  </div>
                </div>

                {repair.internal_notes ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Notatki wewnętrzne</div>
                    <div className="mt-2 text-sm text-[#e5e7eb] whitespace-pre-wrap">{repair.internal_notes}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Oś czasu</h2>
                <div className="mt-4 space-y-3">
                  {timeline.slice(0, 6).map((ev, idx) => {
                    const label =
                      ev.type === "status_change"
                        ? `${ev.old_status ?? "—"} → ${ev.new_status_display ?? ev.new_status}`
                        : ev.type === "communication"
                          ? `${ev.channel_display}: ${ev.subject}`
                          : `Notatka: ${ev.is_internal ? "wewnętrzna" : "dla klienta"}`;
                    return (
                      <div key={(ev as any).id ?? idx} className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                        <div className="text-xs text-[#9ca3af]">{ev.type === "communication" ? ev.sent_at : ev.created_at}</div>
                        <div className="mt-1 text-sm font-semibold text-white">{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "parts" && repairId ? (
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Magazyn</div>
              <h2 className="mt-1 text-lg font-semibold text-white">Części w naprawie</h2>
              <p className="mt-1 text-sm text-[#9ca3af]">Dodawanie części, status zamówienia i koszt — jak w zgłoszeniach.</p>
            </div>
            <RepairPartsSection
              repairId={repairId}
              token={token}
              onAfterMutation={async () => {
                await repairQuery.refetch();
              }}
            />
          </section>
        ) : null}

        {activeTab === "checklist" ? (
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Checklista</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Kroki wykonania</h2>
                <div className="mt-2 text-xs text-[#9ca3af]">
                  {checklistRun ? (
                    <>
                      Status:{" "}
                      <span className="font-semibold text-white">
                        {checklistRun.status === "completed" ? "Zakończono" : "W toku"}
                      </span>
                      {" · "}
                      Rozpoczęto:{" "}
                      <span className="font-semibold text-white">
                        {checklistRun.started_at ? new Date(checklistRun.started_at).toLocaleString("pl-PL") : "—"}
                      </span>
                    </>
                  ) : (
                    "Brak dostępnej checklisty dla tej kategorii urządzenia."
                  )}
                </div>
              </div>
              {showInstallCta ? (
                <div className="rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-3 text-sm font-semibold text-[#bcd6ff]">
                  Zamontuj teraz! przejdź do kolejnych kroków.
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {repairChecklistRowsLocked && checklistItems.length > 1 ? (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Sekcja <span className="font-semibold">Naprawa</span> jest zablokowana do czasu zakończenia diagnostyki
                  (status musi być po etapie „W diagnostyce”).
                </div>
              ) : null}
              {checklistQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0f1117] px-4 py-3"
                  >
                    <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
                    <div className="h-5 w-5 animate-pulse rounded border border-white/10 bg-white/5" />
                  </div>
                ))
              ) : checklistRun && checklistItems.length ? (
                checklistItems.map((it: any, index: number) => {
                  const checked = Boolean(it.result && String(it.result).trim());
                  const isRepairSectionRow =
                    checklistItems.length > 1 && index >= repairSectionStartIndex;
                  const rowLocked = repairChecklistRowsLocked && isRepairSectionRow;
                  return (
                    <Fragment key={it.id}>
                      {index === 0 ? (
                        <div className="pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">
                          Diagnostyka
                        </div>
                      ) : null}
                      {index === repairSectionStartIndex && checklistItems.length > 1 ? (
                        <div className="pt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">
                          Naprawa
                        </div>
                      ) : null}
                      <label
                        onClick={() => {
                          if (rowLocked) showToast("Dokończ diagnostykę, aby odblokować kroki naprawy.", "info");
                        }}
                        className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${
                          rowLocked ? "cursor-not-allowed border-white/5 bg-[#0a0b0f] opacity-55" : ""
                        } ${checked && !rowLocked ? "border-emerald-500/20 bg-emerald-500/5" : !rowLocked ? "border-white/10 bg-[#0f1117]" : ""}`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-white">{it.template_item_label}</div>
                            {it.item_type === "checkbox" ? (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                                Checkbox
                              </span>
                            ) : null}
                            {rowLocked ? (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                                Zablokowane
                              </span>
                            ) : null}
                          </div>
                          {it.note ? <div className="mt-0.5 text-xs text-[#9ca3af] line-clamp-2">{it.note}</div> : null}
                          {it.checked_at ? (
                            <div className="mt-1 text-[11px] text-[#9ca3af]">
                              Odhaczone:{" "}
                              <span className="font-semibold text-white">
                                {new Date(it.checked_at).toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                              </span>
                              {it.checked_by_name ? ` · ${it.checked_by_name}` : ""}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {it.item_type === "checkbox" ? (
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={checklistItemMutation.isPending || rowLocked}
                              onChange={(e) => {
                                if (rowLocked) return;
                                checklistItemMutation.mutate({ item_id: it.id, checked: e.target.checked });
                              }}
                              className="h-5 w-5 rounded border-white/20 bg-transparent accent-[#3b82f6]"
                            />
                          ) : (
                            <div className={`text-xs ${rowLocked ? "text-[#6b7280]" : "text-[#9ca3af]"}`}>
                              Wynik: {it.result || "—"}
                            </div>
                          )}
                        </div>
                      </label>
                    </Fragment>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-[#9ca3af]">
                  Brak pozycji checklista do wyświetlenia.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "test" ? (
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Test końcowy</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Wyniki testu</h2>
                {(() => {
                  const latestTestEv = timeline.find(
                    (ev: any) =>
                      ev.type === "status_change" &&
                      (ev.new_status === "testing_passed" || ev.new_status === "testing_failed"),
                  ) as any | undefined;
                  if (!latestTestEv) return <div className="mt-2 text-xs text-[#9ca3af]">Brak wpisów testu w historii.</div>;
                  const passed = latestTestEv.new_status === "testing_passed";
                  return (
                    <div className="mt-2 text-xs text-[#9ca3af]">
                      Status testu:{" "}
                      <span className="font-semibold text-white">{passed ? "Przeszedł" : "Nie przeszedł"}</span>
                      {latestTestEv.notes ? (
                        <>
                          {" "}
                          · Notatka: <span className="font-semibold text-white">{latestTestEv.notes}</span>
                        </>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
              {(repair.status ?? "").toLowerCase() === "in_testing" ? (
                <button
                  type="button"
                  onClick={() => openStatusModal(repair.id)}
                  className="rounded-2xl bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
                >
                  Zakończ test końcowy
                </button>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-[#9ca3af]">
                  W tej sekcji widzisz ostatni wpis testu.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {timeline
                .filter((ev: any) => ev.type === "status_change" && (ev.new_status === "testing_passed" || ev.new_status === "testing_failed"))
                .slice(0, 4)
                .map((ev: any) => {
                  const passed = ev.new_status === "testing_passed";
                  return (
                    <div
                      key={`${ev.type}-${ev.id}`}
                      className={`rounded-2xl border p-4 ${
                        passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">{passed ? "Testy przeszły" : "Testy nie przeszły"}</div>
                        <div className="text-xs text-[#9ca3af]">
                          {ev.created_at ? new Date(ev.created_at).toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : ""}
                        </div>
                      </div>
                      {ev.notes ? <div className="mt-2 text-sm text-[#e5e7eb] whitespace-pre-wrap">{ev.notes}</div> : <div className="mt-2 text-sm text-[#6b7280]">Brak notatki.</div>}
                      {ev.changed_by_name ? <div className="mt-1 text-xs text-[#9ca3af]">Przez: {ev.changed_by_name}</div> : null}
                    </div>
                  );
                })}
              {timeline.filter((ev: any) => ev.type === "status_change" && (ev.new_status === "testing_passed" || ev.new_status === "testing_failed")).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-[#9ca3af]">
                  Brak danych testowych w historii statusu.
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeTab === "comms" ? (
          <section ref={commSectionRef} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Komunikacja</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Timeline wiadomości</h2>
              </div>
              <Link href="/panel/comm" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                Pełna lista
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
                    Kompozycja wiadomości
                  </div>
                  <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setCommChannel("sms")}
                      className={`rounded-lg px-3 py-1 font-semibold ${commChannel === "sms" ? "bg-[#3b82f6]/20 text-[#bfdbfe]" : "text-[#9ca3af]"}`}
                    >
                      SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommChannel("email")}
                      className={`rounded-lg px-3 py-1 font-semibold ${commChannel === "email" ? "bg-[#3b82f6]/20 text-[#bfdbfe]" : "text-[#9ca3af]"}`}
                    >
                      E-mail
                    </button>
                  </div>
                </div>
                <textarea
                  ref={commTextareaRef}
                  value={commDraft}
                  onChange={(e) => setCommDraft(e.target.value)}
                  className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none focus:border-[#3b82f6]"
                  rows={4}
                  placeholder="Napisz wiadomość do klienta…"
                />
                {commChannel === "sms" ? (
                  <div
                    className="mt-2 text-xs font-semibold"
                    style={{
                      color:
                        smsMeta.tone === "red"
                          ? "#f87171"
                          : smsMeta.tone === "amber"
                            ? "#fbbf24"
                            : "#86efac",
                    }}
                  >
                    {smsMeta.chunks === 1
                      ? `${smsMeta.len} / 160 znaków`
                      : `${smsMeta.chunks} SMS (${smsMeta.len} / ${smsMeta.cap})`}
                  </div>
                ) : null}
              </div>

              {commTimeline.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-[#9ca3af]">
                  Brak wiadomości do wyświetlenia.
                </div>
              ) : (
                commTimeline.map((ev) => (
                  <div key={ev.id} className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-sm font-bold text-[#bcd6ff]">
                          {(ev.recipient ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{ev.subject ?? "Wiadomość"}</div>
                          <div className="mt-0.5 text-xs text-[#9ca3af]">{ev.channel_display}</div>
                        </div>
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {ev.sent_at ? new Date(ev.sent_at).toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : ""}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-[#e5e7eb] whitespace-pre-wrap">{ev.body_preview}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "pricing" ? (
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Wycena</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Podgląd wyceny</h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-[#9ca3af]">
                {quoteDetail ? (
                  <>
                    Status: <span className="font-semibold text-white">{quoteDetail.status}</span> · Suma:{" "}
                    <span className="font-semibold text-white">{String(quoteDetail.total_amount ?? "—")} zł</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Pozycje</div>
                      <div className="mt-1 text-sm text-[#e5e7eb]">
                        {quoteDetail ? `${quoteDetail.items?.length ?? 0} pozycji` : "Brak wyceny"}
                      </div>
                    </div>
                  </div>

                  {quotesListQuery.isLoading || quoteDetailQuery.isLoading ? (
                    <div className="mt-4 space-y-2">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={idx} className="h-[44px] animate-pulse rounded-xl bg-white/5 border border-white/10" />
                      ))}
                    </div>
                  ) : quoteDetail ? (
                    <div className="mt-4 space-y-2">
                      {(quoteDetail.items ?? []).map((it: any) => (
                        <div key={it.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0c0d12] px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{it.description || it.labour_type_name || it.part?.name || "Pozycja"}</div>
                            <div className="mt-0.5 text-xs text-[#9ca3af]">
                              {it.item_type?.toString()?.toUpperCase?.() ?? ""} · Ilość: {it.quantity ?? "—"}
                            </div>
                          </div>
                          <div className="shrink-0 text-sm font-semibold text-white">
                            {String(it.total ?? "0")} zł
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-[#9ca3af]">
                      Brak wyceny dla tej naprawy.
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Historia wersji</div>
                  <div className="mt-2 space-y-2">
                    {quoteVersionsQuery.isLoading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={idx} className="h-[52px] animate-pulse rounded-2xl border border-white/10 bg-[#0c0d12]" />
                      ))
                    ) : quoteVersions.length ? (
                      quoteVersions.map((v: any) => (
                        <div key={v.id} className="rounded-2xl border border-white/10 bg-[#0c0d12] px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-white">v{v.version_number ?? "—"}</div>
                            <div className="text-xs text-[#9ca3af]">
                              {v.created_at ? new Date(v.created_at).toLocaleDateString("pl-PL") : ""}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-[#9ca3af]">Suma: {String(v.total_amount ?? "0")} zł</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-[#9ca3af]">Brak wersji.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "client_history" ? (
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Historia klienta</div>
                <h2 className="mt-1 text-lg font-semibold text-white">{repair.client.full_name}</h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {clientRepairsQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={idx} className="h-[86px] animate-pulse rounded-3xl border border-white/10 bg-[#0f1117]" />
                ))
              ) : clientRepairs.length ? (
                clientRepairs
                  .filter((r: any) => r.id !== repair.id)
                  .slice(0, 8)
                  .map((r: any) => (
                    <Link
                      key={r.id}
                      href={repairSiblingHref(String(r.id))}
                      className="rounded-3xl border border-white/10 bg-[#0f1117] px-4 py-3 transition hover:border-white/20 hover:bg-[#0c0d12]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-white">{r.repair_number}</span>
                            <span className="truncate text-sm font-semibold text-[#9ca3af]">{r.device_name}</span>
                          </div>
                          <div className="mt-1 text-xs text-[#9ca3af]">
                            Ostatnia aktualizacja:{" "}
                            <span className="font-semibold text-white">
                              {r.updated_at ? new Date(r.updated_at).toLocaleDateString("pl-PL") : "—"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <StatusPill status={r.status} status_display={r.status_display} />
                        </div>
                      </div>
                    </Link>
                  ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-[#9ca3af]">
                  Brak innych napraw tego klienta.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

