"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Clock4,
  ArrowLeft,
  MessageSquareText,
  Receipt,
  History,
  ClipboardList,
  ShieldAlert,
  Smartphone,
  Package,
  CalendarDays,
  Tag,
  Plus,
} from "lucide-react";

import { api } from "@/lib/api";
import { AcceptanceProtocolPreviewModal } from "@/components/panel/AcceptanceProtocolPreviewModal";
import { parseRepairDate } from "@/lib/repairListDisplay";
import { deliveryMethodLabel, returnMethodLabel } from "@/lib/repairMethodLabels";
import { clientAddressRows, formatClientAddressLine } from "@/lib/clientAddress";
import { hammerGlassInterestLabel } from "@/lib/hammerGlassLabels";
import type { RepairDetail, RepairThreadItem, RepairTimelineEvent } from "@/types/repairs";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStore } from "@/stores/workerStore";
import { RepairPartsSection } from "@/components/panel/RepairPartsSection";
import { RepairTasksPanel } from "@/components/panel/RepairTasksPanel";
import { RepairDetailLoadingSkeleton } from "@/components/panel/RepairDetailLoadingSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

type TabId = "tasks" | "parts" | "comms" | "pricing" | "client_history";

const TAB_QUERY_VALUES: TabId[] = ["tasks", "parts", "comms", "pricing", "client_history"];

/** Liczba belek skeletonu przy ładowaniu osi czasu (wizualnie ~ile wierszy). */
const TIMELINE_STATUS_SKELETON_ROWS = 6;

/** Klient podał adres, na który można wysłać e-mail (nie placeholder techniczny). */
function clientHasDeliverableEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return false;
  if (e.endsWith("@prokom.local")) return false;
  return true;
}

function repairSourceLabel(source: string | undefined, sourceDisplay: string | null | undefined): string {
  if (sourceDisplay) return sourceDisplay;
  const map: Record<string, string> = {
    online: "Formularz internetowy",
    in_person: "Przyjęcie stacjonarne",
    phone: "Telefoniczne",
    email: "E-mail",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    other: "Inne",
  };
  return map[source ?? ""] ?? source ?? "—";
}

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
      className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-[border-color,background,color,box-shadow] duration-200 ease-out"
      style={{
        borderColor: active ? "rgba(59,130,246,.45)" : "rgba(255,255,255,.10)",
        background: active ? "linear-gradient(135deg, rgba(59,130,246,.18), rgba(37,99,235,.10))" : "transparent",
        color: active ? "#fff" : "#9ca3af",
        boxShadow: active ? "0 0 0 1px rgba(59,130,246,.12), 0 4px 14px -8px rgba(59,130,246,.35)" : "none",
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
  const searchParams = useSearchParams();
  const repairId = params?.id;
  const tabInUrl = searchParams.get("tab");

  const isAdminRepairContext = pathname.startsWith("/admin-panel");
  const repairsListHref = isAdminRepairContext ? "/admin-panel/repairs" : "/panel/naprawy";
  const repairsBackLabel = isAdminRepairContext ? "Wróć do listy napraw" : "Wróć do napraw";
  const repairSiblingHref = (id: string) =>
    isAdminRepairContext ? `/admin-panel/repairs/${encodeURIComponent(id)}` : `/panel/naprawy/${encodeURIComponent(id)}`;

  const openStatusModal = useWorkerStore((s) => s.openStatusModal);
  const showToast = useWorkerStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<TabId>("tasks");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [acceptancePreviewOpen, setAcceptancePreviewOpen] = useState(false);
  const [commChannel, setCommChannel] = useState<"panel" | "email">("panel");
  const [commDraft, setCommDraft] = useState("");
  const [commEmailSubject, setCommEmailSubject] = useState("");
  const [plannedWorkDateDraft, setPlannedWorkDateDraft] = useState("");
  const [quoteLineDesc, setQuoteLineDesc] = useState("");
  const [quoteLineQty, setQuoteLineQty] = useState("1");
  const [quoteLineUnit, setQuoteLineUnit] = useState("");
  const commTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commSectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const tabTransition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };
  const tabMotionProps = {
    initial: reduceMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 },
    transition: tabTransition,
  };

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

  const messagesQuery = useQuery({
    queryKey: ["repair", repairId, "messages"],
    enabled: Boolean(token && user && repairId && activeTab === "comms"),
    queryFn: async () => {
      if (!token || !repairId) throw new Error("Missing token/repairId");
      return api.get<RepairThreadItem[]>(`/repairs/${repairId}/messages/`, token);
    },
    staleTime: 5_000,
  });

  const repair = repairQuery.data ?? null;
  const timeline = timelineQuery.data ?? [];
  const threadMessages = messagesQuery.data ?? [];

  const repairOverviewTimelineStatuses = useMemo(
    () => timeline.filter((e) => e.type === "status_change"),
    [timeline],
  );

  const canEmailClient = useMemo(
    () => clientHasDeliverableEmail(repairQuery.data?.client.email),
    [repairQuery.data?.client?.email],
  );

  useEffect(() => {
    if (!canEmailClient && commChannel === "email") setCommChannel("panel");
  }, [canEmailClient, commChannel]);

  useEffect(() => {
    const p = repair?.staff_planned_work_date;
    if (!p) {
      setPlannedWorkDateDraft("");
      return;
    }
    setPlannedWorkDateDraft(String(p).slice(0, 10));
  }, [repair?.id, repair?.staff_planned_work_date]);

  useEffect(() => {
    setQuoteLineDesc("");
    setQuoteLineQty("1");
    setQuoteLineUnit("");
  }, [repairId]);

  const plannedWorkDateMutation = useMutation({
    mutationFn: async () => {
      if (!token || !repairId) throw new Error("Brak sesji.");
      const raw = plannedWorkDateDraft.trim();
      const payload =
        raw === "" ? { staff_planned_work_date: null as null } : { staff_planned_work_date: raw };
      return api.patch<RepairDetail>(`/repairs/${repairId}/`, payload, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["repair", repairId], data);
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "staff"] });
      void queryClient.invalidateQueries({ queryKey: ["repairs", "staff", "list"] });
      if (isAdminRepairContext) {
        void queryClient.invalidateQueries({ queryKey: ["repairs", "admin", "list"] });
      }
      void queryClient.invalidateQueries({ queryKey: ["sidebar", "dashboard-buckets"] });
      showToast("Zapisano plan pracy.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się zapisać planu pracy.", "error");
    },
  });

  const serverPlannedSlice = repair?.staff_planned_work_date
    ? String(repair.staff_planned_work_date).slice(0, 10)
    : "";
  const plannedWorkDirty = plannedWorkDateDraft !== serverPlannedSlice;

  const applyQuickPlannedDate = (daysFromToday: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysFromToday);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setPlannedWorkDateDraft(`${y}-${m}-${day}`);
  };

  const lastUpdatedText = useMemo(() => {
    const d = repair?.updated_at ? new Date(repair.updated_at) : null;
    return d ? d.toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—";
  }, [repair?.updated_at]);

  const showInstallCta = (repair?.status ?? "").toLowerCase() === "ready_for_pickup";

  /** Nowa naprawa w widoku — start od zakładki Zadania; potem nadpisuje ?tab=. */
  useEffect(() => {
    setActiveTab("tasks");
  }, [repairId]);

  /** Deep link (np. ?tab=comms). Stare wartości: details / checklist / test → zadania. */
  useEffect(() => {
    const raw = (tabInUrl || "").toLowerCase().trim();
    if (!raw) return;
    if (raw === "details" || raw === "checklist" || raw === "test") {
      setActiveTab("tasks");
      return;
    }
    if (TAB_QUERY_VALUES.includes(raw as TabId)) {
      setActiveTab(raw as TabId);
    }
  }, [repairId, tabInUrl]);

  /** Po wejściu na zakładkę Komunikacja: przewiń do sekcji i fokus w polu odpowiedzi. */
  useEffect(() => {
    if (activeTab !== "comms") return;
    const id = window.setTimeout(() => {
      commSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      commTextareaRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => window.clearTimeout(id);
  }, [activeTab, repairId]);

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

  const quotesList = quotesListQuery.data ?? [];
  const quoteDetail = quoteDetailQuery.data ?? null;
  const quoteVersions = quoteVersionsQuery.data ?? [];
  const clientRepairs = clientRepairsQuery.data ?? [];

  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!token || !repair?.id) throw new Error("Brak danych naprawy.");
      return api.post<{ id: string }>(`/pricing/quotes/`, { repair: repair.id }, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quotes-list"] });
      showToast("Utworzono wycenę (szkic). Możesz dodać pozycje.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się utworzyć wyceny.", "error");
    },
  });

  const addQuoteItemMutation = useMutation({
    mutationFn: async () => {
      if (!token || !selectedQuoteId) throw new Error("Brak aktywnej wyceny.");
      const qty = Number(quoteLineQty);
      const unit = Number(String(quoteLineUnit).trim().replace(",", "."));
      if (!quoteLineDesc.trim()) throw new Error("Podaj opis pozycji.");
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Ilość musi być większa od zera.");
      if (!Number.isFinite(unit) || unit <= 0) throw new Error("Cena jednostkowa musi być większa od zera.");
      return api.post(`/pricing/quotes/${selectedQuoteId}/items/`, {
        item_type: "other",
        description: quoteLineDesc.trim(),
        quantity: qty,
        unit_price: unit,
      }, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quotes-list"] });
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quote-detail", selectedQuoteId] });
      setQuoteLineDesc("");
      setQuoteLineQty("1");
      setQuoteLineUnit("");
      showToast("Dodano pozycję do wyceny.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się dodać pozycji.", "error");
    },
  });

  const commSendMutation = useMutation({
    mutationFn: async () => {
      if (!token || !repairId) throw new Error("Brak sesji.");
      if (!commDraft.trim()) throw new Error("Wpisz treść.");
      if (commChannel === "email") {
        if (!commEmailSubject.trim()) throw new Error("Podaj temat e-maila.");
        return api.post(`/repairs/${repairId}/send-client-email/`, { subject: commEmailSubject.trim(), body: commDraft.trim() }, token);
      }
      return api.post(`/repairs/${repairId}/notes/`, { note: commDraft.trim(), is_internal: false, note_type: "client_contact" }, token);
    },
    onSuccess: (_, __) => {
      if (!repairId) return;
      const key = `draft-${repairId}`;
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}-email-subj`);
      setCommDraft("");
      setCommEmailSubject("");
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "messages"] });
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "timeline"] });
      showToast("Wysłano.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Błąd wysyłki.", "error");
    },
  });

  useEffect(() => {
    if (!repairId) return;
    const key = `draft-${repairId}`;
    const saved = localStorage.getItem(key);
    if (saved) setCommDraft(saved);
    setCommEmailSubject(localStorage.getItem(`${key}-email-subj`) || "");
  }, [repairId]);

  useEffect(() => {
    if (!repairId) return;
    const key = `draft-${repairId}`;
    const t = window.setTimeout(() => {
      if (commDraft.trim()) localStorage.setItem(key, commDraft);
      else localStorage.removeItem(key);
      if (commEmailSubject.trim()) localStorage.setItem(`${key}-email-subj`, commEmailSubject);
      else localStorage.removeItem(`${key}-email-subj`);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [repairId, commDraft, commEmailSubject]);

  if (repairQuery.isLoading) {
    return <RepairDetailLoadingSkeleton listHref={repairsListHref} backLabel={repairsBackLabel} />;
  }

  if (repairQuery.error || !repair) {
    const msg = repairQuery.error instanceof Error ? repairQuery.error.message : "Nie udało się pobrać szczegółów naprawy.";
    return (
      <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
        <div className="rounded-3xl border border-red-500/25 bg-[var(--s1)] p-6 text-[#fca5a5]">
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
    <>
      <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={repairsListHref}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            >
              <ArrowLeft size={18} />
              {repairsBackLabel}
            </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2 text-sm text-[var(--ink2)]">
            <Clock4 size={16} className="text-[#3b82f6]" />
            <span>Aktualizacja:</span>
            <span className="font-semibold text-[var(--white)]">{lastUpdatedText}</span>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-90"
            aria-hidden
          />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-4">
                <div
                  className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--s2)]"
                  style={{ background: "var(--s2, #141720)" }}
                >
                  <Smartphone size={24} className="text-[#3b82f6]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Naprawa</div>
                  <h1 className="mt-2 flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-base font-bold tracking-tight text-[var(--white)] md:text-lg">{repair.repair_number}</span>
                    <span className="text-sm font-semibold text-[var(--ink2)]">· {repair.device_name}</span>
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusPill status_display={repair.status_display} status={repair.status} />
                    {repair.priority_display ? (
                      <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-3 py-1 text-[11px] font-semibold text-[var(--ink2)]">
                        {repair.priority_display}
                      </span>
                    ) : null}
                    {repair.estimated_completion_date ? (
                      <span className="inline-flex rounded-full border border-[#3b82f6]/25 bg-[#3b82f6]/10 px-3 py-1 text-[11px] font-semibold text-[#93c5fd]">
                        Termin oddania:{" "}
                        {parseRepairDate(repair.estimated_completion_date)?.toLocaleDateString("pl-PL") ??
                          repair.estimated_completion_date}
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

              <div className="mt-4 flex flex-wrap items-center gap-2">
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
                  className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[var(--white)] transition hover:bg-[#2563eb]"
                >
                  Wiadomość
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQuickMenu((v) => !v)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                  >
                    ...
                  </button>
                  {showQuickMenu ? (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-52 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-2 shadow-xl">
                      <button
                        type="button"
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#d1d5db] hover:bg-[var(--row-hover)]"
                        onClick={() => {
                          setShowQuickMenu(false);
                          setAcceptancePreviewOpen(true);
                        }}
                      >
                        Podgląd wydruku / druk
                      </button>
                      <button type="button" className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-[#d1d5db] hover:bg-[var(--row-hover)]">
                        Duplikuj
                      </button>
                      <button type="button" className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-[#d1d5db] hover:bg-[var(--row-hover)]">
                        Otwórz reklamację
                      </button>
                    </div>
                  ) : null}
                </div>
                <div
                  className="inline-flex min-h-[42px] max-w-[min(100%,20rem)] items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--row-hover)] to-[var(--row-hover)]/70 px-2 py-1.5 pl-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-white/12 hover:from-[var(--row-active)] hover:to-[var(--row-hover)]"
                  title={`Źródło zgłoszenia: ${repairSourceLabel(repair.source, repair.source_display)}`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#3b82f6]/14 text-[#7dd3fc] ring-1 ring-[#3b82f6]/25"
                    aria-hidden
                  >
                    <Tag size={15} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 pr-1">
                    <div className="text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-[var(--ink2)]">Źródło</div>
                    <div className="mt-0.5 truncate text-sm font-semibold leading-tight tracking-tight text-[var(--white)]">
                      {repairSourceLabel(repair.source, repair.source_display)}
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
              {activeTab === "tasks" && (
              <motion.div
                key="repair-overview"
                id="repair-overview-section"
                className="mt-5 w-full space-y-4 scroll-mt-24"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                transition={tabTransition}
              >
                <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--s2)]/80 to-[var(--s1)] px-4 py-5 sm:px-6">
                  <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
                    <div className="flex min-h-0 min-w-0 flex-col justify-center lg:col-span-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink2)]">Zgłoszony problem</div>
                      <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#e5e7eb] sm:text-base">{repair.problem_description}</p>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[var(--row-hover)]/35 p-4 shadow-inner shadow-black/20 lg:col-span-7">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#3b82f6]/25 bg-[#3b82f6]/10">
                          <CalendarDays size={18} className="text-[#3b82f6]" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Plan pracy (wewnętrzny)</div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">
                              Kiedy wracasz do naprawy (np. po częściach). Osobno od terminu gotowości dla klienta.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => applyQuickPlannedDate(1)}
                              className="rounded-xl border border-white/12 bg-[var(--s1)]/80 px-3 py-1.5 text-xs font-semibold text-[#e5e7eb] transition hover:border-white/20 hover:bg-[var(--row-active)]"
                              aria-label="Ustaw datę planu na jutro"
                            >
                              Jutro
                            </button>
                            <button
                              type="button"
                              onClick={() => applyQuickPlannedDate(2)}
                              className="rounded-xl border border-white/12 bg-[var(--s1)]/80 px-3 py-1.5 text-xs font-semibold text-[#e5e7eb] transition hover:border-white/20 hover:bg-[var(--row-active)]"
                              aria-label="Ustaw datę planu na pojutrze"
                            >
                              Pojutrze
                            </button>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              type="date"
                              value={plannedWorkDateDraft}
                              onChange={(e) => setPlannedWorkDateDraft(e.target.value)}
                              className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2.5 text-sm text-[var(--white)] [color-scheme:dark] sm:max-w-[11rem] sm:flex-1"
                            />
                            <button
                              type="button"
                              disabled={!plannedWorkDirty || plannedWorkDateMutation.isPending}
                              onClick={() => plannedWorkDateMutation.mutate()}
                              className="w-full shrink-0 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-xs font-semibold text-[var(--white)] transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                              {plannedWorkDateMutation.isPending ? "Zapisywanie…" : "Zapisz"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--s2)]/40 p-4 sm:p-5">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Szczegóły naprawy</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Urządzenie</div>
                          <div className="mt-2 text-sm font-semibold text-[var(--white)]">{repair.device_name}</div>
                          <div className="mt-1 text-xs text-[var(--ink2)]">{repair.device.category}</div>
                          <div className="mt-2 text-xs text-[var(--ink2)]">Weryfikacja: {repair.device_turns_on ? "tak" : "—"}</div>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Klient</div>
                          <div className="mt-2 text-sm font-semibold text-[var(--white)]">{repair.client.full_name}</div>
                          <div className="mt-1 text-xs text-[var(--ink2)]">
                            {canEmailClient
                              ? repair.client.email
                              : "— (brak adresu e-mail — wiadomości przez panel po przypisaniu konta)"}
                          </div>
                          <div className="mt-2 text-xs text-[var(--ink2)]">Telefon: {repair.client.phone ?? "—"}</div>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Wewnętrzny status</div>
                          <div className="mt-2 text-sm font-semibold text-[var(--white)]">{repair.internal_status ?? "—"}</div>
                          <div className="mt-2 text-xs text-[var(--ink2)]">Wymaga reakcji: {repair.requires_attention ? "tak" : "nie"}</div>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Opis wizualny</div>
                          <p className="mt-2 line-clamp-6 text-sm leading-relaxed text-[#e5e7eb] whitespace-pre-wrap xl:line-clamp-[10]">
                            {(repair.visual_condition_description ?? "").trim() || "—"}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--muted)]">Stan obudowy / ekranu z formularza online.</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3 sm:p-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                            Akcesoria (formularz / urządzenie)
                          </div>
                          <p className="mt-1.5 max-h-28 overflow-y-auto text-sm leading-snug text-[#e5e7eb] whitespace-pre-wrap">
                            {(() => {
                              const fromDevice = (repair.device_accessories_included ?? "").trim();
                              const fromForm = (repair.accessory_selection_summary ?? "").trim();
                              const fallback =
                                repair.accessory_choose_for_me && !fromForm
                                  ? `Dobierz za mnie${repair.accessory_wishlist?.trim() ? `: ${repair.accessory_wishlist.trim()}` : ""}`
                                  : "";
                              const block = [fromDevice && `Przy urządzeniu: ${fromDevice}`, fromForm || fallback].filter(Boolean);
                              return block.length ? block.join("\n\n") : "—";
                            })()}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Hammer Glass</div>
                          <div className="mt-2 text-sm font-semibold text-[var(--white)]">
                            {hammerGlassInterestLabel(repair.hammer_glass_interest)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:col-span-2 xl:col-span-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Notatki klienta</div>
                          <p className="mt-2 min-h-[10rem] max-h-[min(22rem,45vh)] overflow-y-auto text-sm leading-relaxed text-[#e5e7eb] whitespace-pre-wrap">
                            {(repair.client_notes ?? "").trim() || "—"}
                          </p>
                        </div>
                      </div>

                      {repair.internal_notes ? (
                        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Notatki wewnętrzne</div>
                          <div className="mt-2 text-sm text-[#e5e7eb] whitespace-pre-wrap">{repair.internal_notes}</div>
                        </div>
                      ) : null}
                  </div>
                </div>
              </motion.div>
              )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
            {activeTab === "tasks" && (
            <motion.div
              key="repair-sidebar"
              className="flex w-full min-w-0 flex-col gap-4 lg:max-w-[380px] lg:shrink-0 lg:self-stretch"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
              transition={tabTransition}
            >
              <div className="relative flex min-h-[240px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#161a22]/95 via-[var(--s2)]/40 to-[var(--s1)]/25 p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_0_1px_rgba(59,130,246,0.06),0_12px_40px_-18px_rgba(0,0,0,0.55)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(59,130,246,0.12),transparent_55%)] before:opacity-90 sm:p-0">
                <div className="relative flex shrink-0 items-center gap-2.5 border-b border-[var(--border)]/60 bg-gradient-to-r from-transparent via-[#3b82f6]/[0.06] to-transparent px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#93c5fd] via-[#3b82f6] to-[#1e40af] shadow-[0_0_16px_rgba(59,130,246,0.45),0_0_0_1px_rgba(147,197,253,0.25)]"
                    aria-hidden
                  />
                  <h2 className="bg-gradient-to-r from-[var(--ink2)] to-[#e2e8f0] bg-clip-text text-[11px] font-semibold uppercase tracking-[0.18em] text-transparent">
                    OŚ Czasu Naprawy
                  </h2>
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                  {timelineQuery.isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: TIMELINE_STATUS_SKELETON_ROWS }).map((_, idx) => (
                        <div
                          key={`tl-sk-${idx}`}
                          className="h-[72px] animate-pulse rounded-xl border border-white/[0.06] bg-gradient-to-r from-[var(--row-hover)]/60 via-[var(--row-hover)]/40 to-[var(--row-hover)]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        />
                      ))}
                    </div>
                  ) : repairOverviewTimelineStatuses.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)]/70 bg-gradient-to-b from-black/25 to-transparent px-4 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink2)]">Brak zmian statusu</div>
                      <p className="mt-2 max-w-[14rem] text-sm leading-relaxed text-[var(--muted)]">
                        Historia statusów pojawi się tutaj po pierwszej zmianie.
                      </p>
                    </div>
                  ) : (
                    <div className="repair-timeline-scroll max-h-[min(32rem,52vh)] min-h-0 overflow-y-auto pr-1">
                      <ul className="relative m-0 list-none space-y-3 border-l border-white/[0.12] pl-5">
                        {repairOverviewTimelineStatuses.map((ev, idx) => {
                          const at = ev.created_at;
                          const when = at
                            ? new Date(at).toLocaleString("pl-PL", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—";
                          const label = ev.new_status_display ?? ev.new_status ?? "—";
                          return (
                            <li key={`status-${(ev as { id?: number }).id ?? idx}`} className="group relative">
                              <span
                                className="absolute -left-[21px] top-1/2 z-[1] h-2.5 w-2.5 origin-center -translate-y-1/2 rounded-full border-2 border-[#7dd3fc] bg-[#0f172a] shadow-[0_0_0_4px_rgba(59,130,246,0.2)] transition-[transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none group-hover:scale-125 group-hover:border-[#bae6fd] group-hover:shadow-[0_0_0_5px_rgba(59,130,246,0.28),0_0_18px_rgba(59,130,246,0.35)]"
                                aria-hidden
                              />
                              <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-[var(--s1)]/98 via-[var(--s1)]/90 to-[#0c1220]/90 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_14px_-6px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/[0.06] before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-inset after:ring-white/[0.04] motion-reduce:transform-none motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:border-[#3b82f6]/30 group-hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]">
                                <time
                                  dateTime={at || undefined}
                                  className="relative text-xs font-medium tabular-nums tracking-wide text-[var(--ink2)] transition-colors duration-300 group-hover:text-[#93c5fd]/90"
                                >
                                  {when}
                                </time>
                                <div className="relative mt-1.5 text-base font-semibold leading-snug tracking-tight text-[var(--white)] transition-colors duration-300 group-hover:text-white">
                                  {label}
                                </div>
                                {ev.notes ? (
                                  <div className="relative mt-2 line-clamp-2 border-t border-[var(--border)]/40 pt-2 text-sm leading-relaxed text-[var(--muted)] transition-colors duration-300 group-hover:border-[#3b82f6]/20 group-hover:text-[#cbd5e1]">
                                    {ev.notes}
                                  </div>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Odbiór / dostawa</div>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
                    <span className="text-[var(--ink2)]">Źródło</span>
                    <span className="max-w-[180px] text-right font-semibold leading-tight text-[var(--white)]">
                      {repairSourceLabel(repair.source, repair.source_display)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--ink2)]">Dostawa</span>
                    <span className="font-semibold text-[var(--white)]">{deliveryMethodLabel(repair.delivery_method)}</span>
                  </div>
                  <div className="border-t border-[var(--border)] pt-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Adres dostawy</div>
                    {(() => {
                      const a = clientAddressRows(repair.delivery_address);
                      const country =
                        typeof repair.delivery_address === "object" && repair.delivery_address?.country
                          ? repair.delivery_address.country.trim()
                          : "";
                      const rows: [string, string][] = [
                        ["Kod pocztowy", a.postal_code],
                        ["Miasto", a.city],
                        ["Ulica", a.street],
                        ["Numer domu / lokalu", a.house_number],
                      ];
                      if (country && country !== "Polska") rows.push(["Kraj", country]);
                      return (
                        <div className="mt-2 space-y-1.5 text-sm">
                          {rows.map(([lab, val]) => (
                            <div key={lab} className="flex justify-between gap-3">
                              <span className="shrink-0 text-[var(--ink2)]">{lab}</span>
                              <span className="max-w-[70%] text-right font-semibold leading-snug text-[var(--white)] break-words">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {formatClientAddressLine(repair.return_address) !== "—" &&
                  formatClientAddressLine(repair.return_address) !== formatClientAddressLine(repair.delivery_address) ? (
                    <div className="border-t border-[var(--border)] pt-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Adres zwrotu</div>
                      {(() => {
                        const a = clientAddressRows(repair.return_address);
                        const country =
                          typeof repair.return_address === "object" && repair.return_address?.country
                            ? repair.return_address.country.trim()
                            : "";
                        const rows: [string, string][] = [
                          ["Kod pocztowy", a.postal_code],
                          ["Miasto", a.city],
                          ["Ulica", a.street],
                          ["Numer domu / lokalu", a.house_number],
                        ];
                        if (country && country !== "Polska") rows.push(["Kraj", country]);
                        return (
                          <div className="mt-2 space-y-1.5 text-sm">
                            {rows.map(([lab, val]) => (
                              <div key={`ret-${lab}`} className="flex justify-between gap-3">
                                <span className="shrink-0 text-[var(--ink2)]">{lab}</span>
                                <span className="max-w-[70%] text-right font-semibold leading-snug text-[var(--white)] break-words">
                                  {val}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--ink2)]">Zwrot</span>
                    <span className="font-semibold text-[var(--white)]">{returnMethodLabel(repair.return_method)}</span>
                  </div>
                </div>
                {showInstallCta ? (
                  <div className="mt-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("tasks");
                        window.setTimeout(() => {
                          document.getElementById("repair-tasks-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 0);
                      }}
                      className="w-full rounded-2xl bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-[var(--white)] transition hover:bg-[#2563eb]"
                    >
                      Zamontuj teraz!
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
            )}
            </AnimatePresence>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="flex flex-wrap gap-3">
            <TabButton
              active={activeTab === "tasks"}
              onClick={() => {
                setActiveTab("tasks");
                window.setTimeout(() => {
                  document.getElementById("repair-tasks-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }}
              icon={<ClipboardList size={16} />}
              label="Zadania"
            />
            <TabButton active={activeTab === "parts"} onClick={() => setActiveTab("parts")} icon={<Package size={16} />} label="Części" />
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

        <AnimatePresence mode="wait">
          <div className="relative w-full min-h-[12rem]">
        {activeTab === "tasks" && repair ? (
          <motion.div
            key="tab-tasks"
            className="w-full"
            {...tabMotionProps}
          >
            <RepairTasksPanel repairId={repair.id} repairNumber={repair.repair_number} />
          </motion.div>
        ) : null}

        {activeTab === "parts" && repairId ? (
          <motion.section
            key="tab-parts"
            className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
            {...tabMotionProps}
          >
            <RepairPartsSection
              repairId={repairId}
              token={token}
              onAfterMutation={async () => {
                await repairQuery.refetch();
              }}
            />
          </motion.section>
        ) : null}

        {activeTab === "comms" ? (
          <motion.section
            key="tab-comms"
            ref={commSectionRef}
            className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
            {...tabMotionProps}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Komunikacja</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Wątek z klientem</h2>
              </div>
              <Link href="/panel/comm" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                Pełna lista
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {messagesQuery.isLoading ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-4 py-5 text-sm text-[var(--ink2)]">
                  Ładowanie wątku…
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-4 py-5 text-sm text-[var(--ink2)]">
                  Brak wiadomości w wątku (panel + e-mail wychodzący).
                </div>
              ) : (
                <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3">
                  {threadMessages.map((m) =>
                    m.kind === "note" ? (
                      <div key={`n-${m.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--s1)] p-3">
                        <div className="text-xs text-[var(--ink2)]">
                          {(m.thread_origin === "client" || m.thread_origin === "email_inbound" ? "Klient" : m.author_name) || "—"} ·{" "}
                          {m.created_at
                            ? new Date(m.created_at).toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
                            : ""}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-sm text-[#e5e7eb]">{m.note}</div>
                      </div>
                    ) : (
                      <div key={`e-${m.id}`} className="rounded-xl border border-dashed border-white/15 bg-[var(--s1)] p-3">
                        <div className="text-[11px] font-semibold uppercase text-[var(--ink2)]">E-mail wychodzący</div>
                        <div className="mt-1 text-sm font-semibold text-[var(--white)]">{m.subject}</div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{m.body_snapshot}</div>
                        <div className="mt-2 text-xs text-[var(--ink2)]">
                          {m.sent_by_name || "—"} ·{" "}
                          {m.sent_at
                            ? new Date(m.sent_at).toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
                            : ""}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Odpowiedź</div>
                  <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--row-hover)] p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setCommChannel("panel")}
                      className={`rounded-lg px-3 py-1 font-semibold ${commChannel === "panel" ? "bg-[#3b82f6]/20 text-[#bfdbfe]" : "text-[var(--ink2)]"}`}
                    >
                      Panel klienta
                    </button>
                    <button
                      type="button"
                      disabled={!canEmailClient}
                      title={
                        canEmailClient
                          ? undefined
                          : "Klient nie ma zapisanego adresu e-mail — wyślij przez panel klienta."
                      }
                      onClick={() => canEmailClient && setCommChannel("email")}
                      className={`rounded-lg px-3 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${commChannel === "email" ? "bg-[#3b82f6]/20 text-[#bfdbfe]" : "text-[var(--ink2)]"}`}
                    >
                      E-mail
                    </button>
                  </div>
                </div>
                {!canEmailClient ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-200/90">
                    Brak adresu e-mail u klienta — nie wyślesz wiadomości e-mailem. Użyj <strong>Panel klienta</strong>. Po
                    założeniu konta i przypisaniu naprawy klient zobaczy wiadomości w panelu.
                  </p>
                ) : null}
                {commChannel === "email" ? (
                  <input
                    type="text"
                    value={commEmailSubject}
                    onChange={(e) => setCommEmailSubject(e.target.value)}
                    placeholder="Temat e-maila…"
                    className="mb-3 mt-3 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
                  />
                ) : null}
                <textarea
                  ref={commTextareaRef}
                  value={commDraft}
                  onChange={(e) => setCommDraft(e.target.value)}
                  className="mt-1 w-full resize-y rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
                  rows={4}
                  placeholder={
                    commChannel === "email"
                      ? "Treść e-maila (klient widzi w skrzynce i w historii w panelu)…"
                      : "Wiadomość widoczna w panelu klienta…"
                  }
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={
                      commSendMutation.isPending ||
                      !commDraft.trim() ||
                      (commChannel === "email" && !commEmailSubject.trim())
                    }
                    onClick={() => commSendMutation.mutate()}
                    className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[var(--white)] hover:bg-[#2563eb] disabled:opacity-60"
                  >
                    {commSendMutation.isPending ? "Wysyłanie…" : commChannel === "panel" ? "Wyślij do panelu" : "Wyślij e-mail"}
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}

        {activeTab === "pricing" ? (
          <motion.section
            key="tab-pricing"
            className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
            {...tabMotionProps}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Wycena</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Podgląd wyceny</h2>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 text-sm text-[var(--ink2)]">
                {quoteDetail ? (
                  <>
                    Status: <span className="font-semibold text-[var(--white)]">{quoteDetail.status}</span> · Suma:{" "}
                    <span className="font-semibold text-[var(--white)]">{String(quoteDetail.total_amount ?? "—")} zł</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Pozycje</div>
                      <div className="mt-1 text-sm text-[#e5e7eb]">
                        {quoteDetail ? `${quoteDetail.items?.length ?? 0} pozycji` : "Brak wyceny"}
                      </div>
                    </div>
                  </div>

                  {quotesListQuery.isLoading || (quotesList.length > 0 && quoteDetailQuery.isLoading) ? (
                    <div className="mt-4 space-y-2">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={idx} className="h-[44px] animate-pulse rounded-xl bg-[var(--row-hover)] border border-[var(--border)]" />
                      ))}
                    </div>
                  ) : quoteDetail ? (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        {(quoteDetail.items ?? []).length ? (
                          (quoteDetail.items ?? []).map((it: any) => (
                            <div key={it.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-[var(--white)]">{it.description || it.labour_type_name || it.part?.name || "Pozycja"}</div>
                                <div className="mt-0.5 text-xs text-[var(--ink2)]">
                                  {it.item_type?.toString()?.toUpperCase?.() ?? ""} · Ilość: {it.quantity ?? "—"}
                                </div>
                              </div>
                              <div className="shrink-0 text-sm font-semibold text-[var(--white)]">
                                {String(it.total ?? "0")} zł
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-4 py-4 text-sm text-[var(--ink2)]">
                            Brak pozycji — dodaj pierwszą poniżej (szkic możesz potem wysłać do klienta z poziomu wyceny).
                          </p>
                        )}
                      </div>
                      {quoteDetail.status === "draft" ? (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)]/40 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Dodaj pozycję</div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">Opis</label>
                              <input
                                value={quoteLineDesc}
                                onChange={(e) => setQuoteLineDesc(e.target.value)}
                                placeholder="Np. wymiana wyświetlacza, robocizna…"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">Ilość</label>
                              <input
                                value={quoteLineQty}
                                onChange={(e) => setQuoteLineQty(e.target.value)}
                                inputMode="decimal"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm text-[var(--white)]"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">Cena jedn. (zł)</label>
                              <input
                                value={quoteLineUnit}
                                onChange={(e) => setQuoteLineUnit(e.target.value)}
                                inputMode="decimal"
                                placeholder="0"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm text-[var(--white)]"
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              disabled={addQuoteItemMutation.isPending}
                              onClick={() => addQuoteItemMutation.mutate()}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
                            >
                              <Plus size={16} aria-hidden />
                              {addQuoteItemMutation.isPending ? "Dodawanie…" : "Dodaj pozycję"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-4 py-6 text-center">
                      <p className="text-sm text-[var(--ink2)]">Nie utworzono jeszcze wyceny dla tej naprawy.</p>
                      <button
                        type="button"
                        disabled={createQuoteMutation.isPending || !repair}
                        onClick={() => createQuoteMutation.mutate()}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/20 transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={18} aria-hidden />
                        {createQuoteMutation.isPending ? "Tworzenie…" : "Utwórz wycenę (szkic)"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Historia wersji</div>
                  <div className="mt-2 space-y-2">
                    {quoteVersionsQuery.isLoading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={idx} className="h-[52px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--s1)]" />
                      ))
                    ) : quoteVersions.length ? (
                      quoteVersions.map((v: any) => (
                        <div key={v.id} className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-[var(--white)]">v{v.version_number ?? "—"}</div>
                            <div className="text-xs text-[var(--ink2)]">
                              {v.created_at ? new Date(v.created_at).toLocaleDateString("pl-PL") : ""}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-[var(--ink2)]">Suma: {String(v.total_amount ?? "0")} zł</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-[var(--ink2)]">Brak wersji.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}

        {activeTab === "client_history" ? (
          <motion.section
            key="tab-client-history"
            className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
            {...tabMotionProps}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Historia klienta</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">{repair.client.full_name}</h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {clientRepairsQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={idx} className="h-[86px] animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--s1)]" />
                ))
              ) : clientRepairs.length ? (
                clientRepairs
                  .filter((r: any) => r.id !== repair.id)
                  .slice(0, 8)
                  .map((r: any) => (
                    <Link
                      key={r.id}
                      href={repairSiblingHref(String(r.id))}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 transition hover:border-white/20 hover:bg-[var(--s1)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-[var(--white)]">{r.repair_number}</span>
                            <span className="truncate text-sm font-semibold text-[var(--ink2)]">{r.device_name}</span>
                          </div>
                          <div className="mt-1 text-xs text-[var(--ink2)]">
                            Ostatnia aktualizacja:{" "}
                            <span className="font-semibold text-[var(--white)]">
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
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-4 py-5 text-sm text-[var(--ink2)]">
                  Brak innych napraw tego klienta.
                </div>
              )}
            </div>
          </motion.section>
        ) : null}
        </div>
        </AnimatePresence>
      </div>
    </main>
      <AcceptanceProtocolPreviewModal
        open={acceptancePreviewOpen}
        onClose={() => setAcceptancePreviewOpen(false)}
        repairId={repair.id}
        repairNumber={repair.repair_number}
        token={token}
      />
    </>
  );
}

