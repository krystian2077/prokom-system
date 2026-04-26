"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
  Truck,
  CalendarDays,
  Tag,
  Plus,
  Info,
  Mail,
  Send,
  Trash2,
  PencilLine,
} from "lucide-react";

import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import { formatQuoteListEmailSentCell, formatQuoteNumberLabel } from "@/lib/quoteLabels";
import { AcceptanceProtocolPreviewModal } from "@/components/panel/AcceptanceProtocolPreviewModal";
import { parseRepairDate } from "@/lib/repairListDisplay";
import { deliveryMethodLabel, returnMethodLabel } from "@/lib/repairMethodLabels";
import { clientAddressRows, formatClientAddressLine } from "@/lib/clientAddress";
import { hammerGlassInterestLabel } from "@/lib/hammerGlassLabels";
import { repairStatusPublicLabel } from "@/lib/repairStatusPublic";
import type { RepairDetail, RepairThreadItem, RepairTimelineEvent } from "@/types/repairs";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStore } from "@/stores/workerStore";
import { RepairPartsSection } from "@/components/panel/RepairPartsSection";
import { RepairTasksPanel } from "@/components/panel/RepairTasksPanel";
import { RepairCourierTab } from "@/components/panel/RepairCourierTab";
import { SuggestedNextStatusStrip } from "@/components/panel/SuggestedNextStatusStrip";
import { RepairDetailLoadingSkeleton } from "@/components/panel/RepairDetailLoadingSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

type TabId = "details" | "tasks" | "parts" | "comms" | "pricing" | "courier" | "client_history";

const TAB_QUERY_VALUES: TabId[] = ["details", "tasks", "parts", "comms", "pricing", "courier", "client_history"];

const QUOTE_PART_ORIGIN_OPTIONS = [
  { value: "original", label: "Oryginalna (OEM)" },
  { value: "aftermarket", label: "Zamiennik" },
] as const;

/** Łączy nazwę części i opis w jedno pole `description` w API (split przy edycji). */
const QUOTE_LINE_DESC_JOINER = " — ";

function buildQuoteItemDescription(partName: string, extraDescription: string): string {
  const n = partName.trim();
  const x = extraDescription.trim();
  if (n && x) return `${n}${QUOTE_LINE_DESC_JOINER}${x}`;
  return n || x;
}

function parseQuoteItemDescription(raw: unknown): { partName: string; extra: string } {
  const s = String(raw ?? "").trim();
  if (!s) return { partName: "", extra: "" };
  const idx = s.indexOf(QUOTE_LINE_DESC_JOINER);
  if (idx === -1) return { partName: s, extra: "" };
  return {
    partName: s.slice(0, idx).trim(),
    extra: s.slice(idx + QUOTE_LINE_DESC_JOINER.length).trim(),
  };
}

function parseMoneyish(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Liczba belek skeletonu przy ładowaniu osi czasu (wizualnie ~ile wierszy). */
const TIMELINE_STATUS_SKELETON_ROWS = 8;

/** Maks. liczba wpisów statusu na osi (API sortuje od najnowszych). */
const TIMELINE_STATUS_DISPLAY_MAX = 8;

/** Klient podał adres, na który można wysłać e-mail (nie placeholder techniczny). */
function clientHasDeliverableEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return false;
  if (e.endsWith("@prokom.local")) return false;
  return true;
}

function quoteStatusLabelPl(status: string | undefined): string {
  const m: Record<string, string> = {
    draft: "Szkic",
    sent: "Wysłana",
    accepted: "Zaakceptowana",
    rejected: "Odrzucona",
    expired: "Wygasła",
  };
  return m[status ?? ""] ?? status ?? "—";
}

/** Szkic lub wysłana — pełna edycja pozycji i wysyłka. */
function quoteIsStaffEditable(status: string | undefined): boolean {
  return status === "draft" || status === "sent";
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

  const labelText = status_display?.trim() || repairStatusPublicLabel(status);

  return (
    <span
      className="rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide"
      style={{ background: bg, borderColor: border, color: text }}
      title="Status"
    >
      {labelText}
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
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.85 }}
      className="inline-flex min-h-[42px] items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition-[border-color,background,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        borderColor: active ? "rgba(59,130,246,.45)" : "rgba(255,255,255,.10)",
        background: active ? "linear-gradient(135deg, rgba(59,130,246,.18), rgba(37,99,235,.10))" : "transparent",
        color: active ? "#fff" : "#9ca3af",
        boxShadow: active ? "0 0 0 1px rgba(59,130,246,.12), 0 4px 14px -8px rgba(59,130,246,.35)" : "none",
      }}
    >
      <motion.span
        className="inline-flex items-center justify-center"
        animate={{ scale: active ? 1.06 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {icon}
      </motion.span>
      <span className="whitespace-nowrap">{label}</span>
    </motion.button>
  );
}

function RepairDetailPageContent() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const repairId = params?.id;
  const tabInUrl = searchParams.get("tab");

  const p = usePanelBasePath();
  const repairsListHref = p.repairsListPath;
  const repairsBackLabel = p.isAdminPanel ? "Wróć do listy napraw" : "Wróć do napraw";
  const repairSiblingHref = (id: string) => p.repairDetailPath(id);

  const openStatusModal = useWorkerStore((s) => s.openStatusModal);
  const showToast = useWorkerStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [acceptancePreviewOpen, setAcceptancePreviewOpen] = useState(false);
  const [commChannel, setCommChannel] = useState<"panel" | "email">("panel");
  const [commDraft, setCommDraft] = useState("");
  const [commEmailSubject, setCommEmailSubject] = useState("");
  const [plannedWorkDateDraft, setPlannedWorkDateDraft] = useState("");
  /** Termin dla klienta (`estimated_completion_date`) — widoczny w panelu klienta. */
  const [estimatedCompletionDraft, setEstimatedCompletionDraft] = useState("");
  const [quoteLinePartName, setQuoteLinePartName] = useState("");
  const [quoteLineDesc, setQuoteLineDesc] = useState("");
  const [quoteLineQty, setQuoteLineQty] = useState("1");
  const [quoteLineParts, setQuoteLineParts] = useState("");
  const [quoteLineLabour, setQuoteLineLabour] = useState("");
  /** Przy potwierdzeniu wyceny: domyślnie wyślij kopię na e-mail, jeśli klient ma adres. */
  const [quoteConfirmSendEmail, setQuoteConfirmSendEmail] = useState(true);
  /** Którą wycenę z listy oglądasz (null = auto wg priorytetu, tylko w widoku edycji). */
  const [quoteViewId, setQuoteViewId] = useState<string | null>(null);
  /** Lista wszystkich wycen vs. edycja jednej (po kliknięciu „Edytuj”). */
  const [pricingSubView, setPricingSubView] = useState<"list" | "edit">("list");
  /** Inny nagłówek: świeżo po „Nowa Wycena” vs. wejście z listy „Edytuj”. */
  const [quoteEditorEntry, setQuoteEditorEntry] = useState<"created" | "browse">("browse");
  const [quoteLinePartOrigin, setQuoteLinePartOrigin] = useState<"original" | "aftermarket">("aftermarket");
  const [quoteNotesDraft, setQuoteNotesDraft] = useState("");
  /** Edycja istniejącej pozycji — formularz na dole używa `quoteLine*`; przy 1 pozycji uzupełniamy automatycznie. */
  const [editingQuoteItemId, setEditingQuoteItemId] = useState<string | null>(null);

  const resetQuoteLineForm = useCallback(() => {
    setQuoteLinePartName("");
    setQuoteLineDesc("");
    setQuoteLineQty("1");
    setQuoteLineParts("");
    setQuoteLineLabour("");
    setQuoteLinePartOrigin("aftermarket");
  }, []);

  const applyItemToQuoteLineForm = useCallback((it: any) => {
    const parsed = parseQuoteItemDescription(it.description);
    setQuoteLinePartName(parsed.partName);
    setQuoteLineDesc(parsed.extra);
    setQuoteLineQty(String(it.quantity ?? "1"));
    setQuoteLineParts(String(it.parts_price ?? "0"));
    setQuoteLineLabour(String(it.labour_price ?? "0"));
    setQuoteLinePartOrigin(it.part_origin === "original" ? "original" : "aftermarket");
  }, []);
  /** Podgląd kwoty pozycji: ilość × (cena części + robocizna) jednostkowo. */
  const quoteLineTotalPreview = useMemo(() => {
    const qty = Number(quoteLineQty);
    const parseMoney = (s: string) => Number(String(s).trim().replace(",", "."));
    const parts = parseMoney(quoteLineParts || "0");
    const labour = parseMoney(quoteLineLabour || "0");
    const q = Number.isFinite(qty) && qty > 0 ? qty : 1;
    if (!Number.isFinite(parts) || !Number.isFinite(labour)) return null;
    return q * (parts + labour);
  }, [quoteLineQty, quoteLineParts, quoteLineLabour]);
  const quoteLinePartNameInputRef = useRef<HTMLInputElement | null>(null);
  const commTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commSectionRef = useRef<HTMLElement | null>(null);
  /** Gdy odpowiedź HTTP „zginie”, reset mutacji po 45 s — przycisk nie zostaje w „Wysyłanie…”. */
  const sendQuoteStuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const tabEase = [0.22, 1, 0.36, 1] as const;
  const tabPanelTransition = reduceMotion
    ? { duration: 0.12 }
    : { duration: 0.38, ease: tabEase };
  const tabPanelMotion = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 },
    transition: tabPanelTransition,
  };
  const heroBlockTransition = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.35, ease: tabEase };
  const heroBlockMotion = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
    transition: heroBlockTransition,
  };

  /** Aliasy — niektóre wersje SWC gubią kontekst JSX przy `motion.div` w ternary wewnątrz `{...}`. */
  const MotionDiv = motion.div;
  const MotionSection = motion.section;

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
  const repairDeviceTitle = repair
    ? [String(repair.device_brand ?? "").trim(), String(repair.device_model ?? "").trim()].filter(Boolean).join(" ") || repair.device_name
    : "";

  const repairOverviewTimelineStatuses = useMemo(() => {
    const statuses = timeline.filter((e) => e.type === "status_change");
    return statuses.slice(0, TIMELINE_STATUS_DISPLAY_MAX);
  }, [timeline]);

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
    const e = repair?.estimated_completion_date;
    if (!e) {
      setEstimatedCompletionDraft("");
      return;
    }
    setEstimatedCompletionDraft(String(e).slice(0, 10));
  }, [repair?.id, repair?.estimated_completion_date]);

  useEffect(() => {
    resetQuoteLineForm();
    setQuoteViewId(null);
    setEditingQuoteItemId(null);
    setQuoteEditorEntry("browse");
  }, [repairId, resetQuoteLineForm]);

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
      if (p.isAdminPanel) {
        void queryClient.invalidateQueries({ queryKey: ["repairs", "admin", "list"] });
      }
      void queryClient.invalidateQueries({ queryKey: ["sidebar", "dashboard-buckets"] });
      showToast("Zapisano plan pracy.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się zapisać planu pracy.", "error");
    },
  });

  const estimatedCompletionMutation = useMutation({
    mutationFn: async () => {
      if (!token || !repairId) throw new Error("Brak sesji.");
      const raw = estimatedCompletionDraft.trim();
      const payload =
        raw === "" ? { estimated_completion_date: null as null } : { estimated_completion_date: raw };
      return api.patch<RepairDetail>(`/repairs/${repairId}/`, payload, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["repair", repairId], data);
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "staff"] });
      void queryClient.invalidateQueries({ queryKey: ["repairs", "staff", "list"] });
      if (p.isAdminPanel) {
        void queryClient.invalidateQueries({ queryKey: ["repairs", "admin", "list"] });
      }
      void queryClient.invalidateQueries({ queryKey: ["sidebar", "dashboard-buckets"] });
      showToast("Zapisano szacowany termin dla klienta.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się zapisać terminu.", "error");
    },
  });

  const serverPlannedSlice = repair?.staff_planned_work_date
    ? String(repair.staff_planned_work_date).slice(0, 10)
    : "";
  const plannedWorkDirty = plannedWorkDateDraft !== serverPlannedSlice;

  const serverEtaSlice = repair?.estimated_completion_date ? String(repair.estimated_completion_date).slice(0, 10) : "";
  const estimatedCompletionDirty = estimatedCompletionDraft !== serverEtaSlice;

  const applyQuickPlannedDate = (daysFromToday: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysFromToday);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setPlannedWorkDateDraft(`${y}-${m}-${day}`);
  };

  const applyQuickEstimatedCompletion = (daysFromToday: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysFromToday);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setEstimatedCompletionDraft(`${y}-${m}-${day}`);
  };

  const lastUpdatedText = useMemo(() => {
    const d = repair?.updated_at ? new Date(repair.updated_at) : null;
    return d ? d.toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—";
  }, [repair?.updated_at]);

  const showInstallCta = (repair?.status ?? "").toLowerCase() === "ready_for_pickup";

  /** Nowa naprawa w widoku — domyślnie Szczegóły; nadpisuje ?tab=. */
  useEffect(() => {
    setActiveTab("details");
  }, [repairId]);

  /** Deep link (np. ?tab=comms). Stare wartości: checklist / test → zadania. */
  useEffect(() => {
    const raw = (tabInUrl || "").toLowerCase().trim();
    if (!raw) return;
    if (raw === "checklist" || raw === "test") {
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

  const autoQuoteId = useMemo(() => {
    const quotes = quotesListQuery.data ?? [];
    if (!quotes.length) return null;
    const accepted = quotes.find((q) => q.status === "accepted");
    if (accepted) return String(accepted.id);
    const sent = quotes.find((q) => q.status === "sent");
    if (sent) return String(sent.id);
    const draft = quotes.find((q) => q.status === "draft");
    if (draft) return String(draft.id);
    return quotes[0]?.id ? String(quotes[0].id) : null;
  }, [quotesListQuery.data]);

  const selectedQuoteId = quoteViewId ?? autoQuoteId;

  useEffect(() => {
    if (activeTab !== "pricing" || pricingSubView !== "edit") return;
    const quotes = quotesListQuery.data ?? [];
    const ids = quotes.map((q) => String(q.id));
    if (!ids.length) return;
    if (quoteViewId == null || !ids.includes(quoteViewId)) {
      /** Po „Nowa Wycena” lista w React Query bywa jeszcze stara — nowe ID nie ma w `ids`, a efekt nadpisywał `quoteViewId` na `autoQuoteId` (poprzednia wycena). Nie cofaj wyboru podczas refetch ani zanim optymistyczny wpis trafi do cache. */
      if (quoteViewId != null && !ids.includes(quoteViewId) && quotesListQuery.isFetching) {
        return;
      }
      setQuoteViewId(autoQuoteId);
    }
  }, [activeTab, pricingSubView, quotesListQuery.data, quotesListQuery.isFetching, autoQuoteId, quoteViewId]);

  useEffect(() => {
    if (activeTab !== "pricing") {
      setPricingSubView("list");
      setEditingQuoteItemId(null);
    }
  }, [activeTab]);

  const quoteDetailQuery = useQuery({
    queryKey: ["repair", repairId, "quote-detail", selectedQuoteId],
    enabled: Boolean(
      token && user && repairId && activeTab === "pricing" && pricingSubView === "edit" && selectedQuoteId,
    ),
    queryFn: async () => {
      if (!token || !selectedQuoteId) throw new Error("Missing token/quoteId");
      return api.get<any>(`/pricing/quotes/${selectedQuoteId}/`, token);
    },
    staleTime: 10_000,
  });

  const quoteVersionsQuery = useQuery({
    queryKey: ["repair", repairId, "quote-versions", selectedQuoteId],
    enabled: Boolean(
      token && user && repairId && activeTab === "pricing" && pricingSubView === "edit" && selectedQuoteId,
    ),
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

  /** Suma z pozycji — zabezpieczenie gdy `total_amount` w nagłówku wyceny jeszcze nie odświeżył się po zapisie pozycji. */
  const quoteItemsSum = useMemo(() => {
    const items = quoteDetail?.items ?? [];
    return items.reduce((acc: number, it: any) => acc + parseMoneyish(it.total), 0);
  }, [quoteDetail?.items]);

  const quoteTotalNumeric = useMemo(() => {
    const header = parseMoneyish(quoteDetail?.total_amount);
    if (header > 0) return header;
    return quoteItemsSum;
  }, [quoteDetail?.total_amount, quoteItemsSum]);

  const quoteCanConfirm = useMemo(() => {
    if (!quoteDetail) return false;
    if (quoteDetail.status !== "draft" && quoteDetail.status !== "sent") return false;
    const n = quoteDetail.items?.length ?? 0;
    return n > 0 && quoteTotalNumeric > 0;
  }, [quoteDetail, quoteTotalNumeric]);

  const quoteDeletable = Boolean(
    quoteDetail && ["draft", "rejected", "expired"].includes(String(quoteDetail.status)),
  );
  /** Szkic lub wysłana — edycja pozycji i ponowne wysłanie tej samej wyceny. */
  const quoteEditable = quoteDetail?.status === "draft" || quoteDetail?.status === "sent";

  /** Przy zmianie aktywnej wyceny (lista → edycja, inna wycena, „Nowa Wycena”) — czyść formularz; dane wczyta osobny efekt po pobraniu szczegółów. */
  useEffect(() => {
    if (activeTab !== "pricing" || pricingSubView !== "edit") return;
    if (!selectedQuoteId) return;
    resetQuoteLineForm();
    setEditingQuoteItemId(null);
    setQuoteNotesDraft("");
  }, [selectedQuoteId, activeTab, pricingSubView, resetQuoteLineForm]);

  useEffect(() => {
    if (!quoteDetail?.id || String(quoteDetail.id) !== String(selectedQuoteId)) return;
    setQuoteNotesDraft(String(quoteDetail.notes ?? ""));
  }, [quoteDetail?.id, quoteDetail?.notes, selectedQuoteId]);

  /**
   * Przy wejściu z listy („browse”): jedna pozycja → podgląd w formularzu do szybkiej edycji.
   * Przy świeżo utworzonej wycenie („created”): nie wypełniaj automatycznie jedynej linii (żeby dodać kolejne pozycje).
   * Nie wywołuj tu resetQuoteLineForm w trybie „created” — przy pierwszym załadowaniu szczegółów wyceny i przy refetch
   * kasowałoby to pola, które użytkownik już wpisał; czyszczenie po zapisie pozycji robi mutacja (onSuccess).
   */
  useEffect(() => {
    if (!quoteDetail?.id || String(quoteDetail.id) !== String(selectedQuoteId)) return;
    const items = quoteDetail.items ?? [];
    if (quoteEditorEntry === "created") {
      setEditingQuoteItemId(null);
      return;
    }
    if (items.length === 1) {
      setEditingQuoteItemId(String(items[0].id));
      applyItemToQuoteLineForm(items[0]);
    } else {
      setEditingQuoteItemId(null);
      resetQuoteLineForm();
    }
  }, [
    quoteDetail?.id,
    quoteDetail?.items?.length,
    selectedQuoteId,
    quoteEditorEntry,
    applyItemToQuoteLineForm,
    resetQuoteLineForm,
  ]);

  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!token || !repair?.id) throw new Error("Brak danych naprawy.");
      return api.post<{ id: string }>(`/pricing/quotes/`, { repair: repair.id }, token);
    },
    onSuccess: (data) => {
      const id = data && typeof data === "object" && "id" in data ? String((data as { id: string }).id) : null;
      resetQuoteLineForm();
      setEditingQuoteItemId(null);
      setQuoteNotesDraft("");
      void queryClient.removeQueries({ queryKey: ["repair", repairId, "quote-detail"] });
      void queryClient.removeQueries({ queryKey: ["repair", repairId, "quote-versions"] });
      if (id && repair?.id) {
        queryClient.setQueryData(["repair", repairId, "quotes-list"], (old: unknown) => {
          const prev = Array.isArray(old) ? [...(old as any[])] : [];
          if (prev.some((q) => String(q?.id) === id)) return prev;
          prev.unshift({ id, repair: repair.id, status: "draft", total_amount: "0", version: null, items_count: 0 });
          return prev;
        });
      }
      if (id) setQuoteViewId(id);
      setQuoteEditorEntry("created");
      setPricingSubView("edit");
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quotes-list"] });
      showToast("Utworzono wycenę (szkic). Dodaj pozycje; gdy kwoty będą gotowe, możesz wysłać wycenę do klienta poniżej.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się utworzyć wyceny.", "error");
    },
  });

  const addQuoteItemMutation = useMutation({
    mutationFn: async () => {
      if (!token || !selectedQuoteId) throw new Error("Brak aktywnej wyceny.");
      const qty = Number(quoteLineQty);
      const parseMoney = (s: string) => Number(String(s).trim().replace(",", "."));
      const parts = parseMoney(quoteLineParts || "0");
      const labour = parseMoney(quoteLineLabour || "0");
      if (!quoteLinePartName.trim()) throw new Error("Podaj nazwę części.");
      const description = buildQuoteItemDescription(quoteLinePartName, quoteLineDesc);
      if (!description.trim()) throw new Error("Uzupełnij nazwę części lub opis.");
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Ilość musi być większa od zera.");
      if (!Number.isFinite(parts) || parts < 0 || !Number.isFinite(labour) || labour < 0) {
        throw new Error("Ceny muszą być poprawnymi liczbami nieujemnymi.");
      }
      if (parts + labour <= 0) throw new Error("Suma ceny części i robocizny musi być większa od zera.");
      return api.post(`/pricing/quotes/${selectedQuoteId}/items/`, {
        item_type: "other",
        description: description.trim(),
        quantity: qty,
        parts_price: parts,
        labour_price: labour,
        part_origin: quoteLinePartOrigin,
      }, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quotes-list"] });
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quote-detail", selectedQuoteId] });
      setEditingQuoteItemId(null);
      resetQuoteLineForm();
      showToast("Dodano pozycję do wyceny.", "success");
      queueMicrotask(() => quoteLinePartNameInputRef.current?.focus());
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się dodać pozycji.", "error");
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!token || !selectedQuoteId) throw new Error("Brak aktywnej wyceny.");
      return api.post<any>(`/pricing/quotes/${selectedQuoteId}/send/`, {
        send_email: Boolean(canEmailClient && quoteConfirmSendEmail),
      }, token);
    },
    onSuccess: (data) => {
      const wantedEmail = Boolean(canEmailClient && quoteConfirmSendEmail);
      const emailed = Boolean(data?.email_sent);
      const resent = Boolean(data?.resend);
      try {
        if (resent) {
          if (wantedEmail && emailed) {
            showToast("Zaktualizowana wycena wysłana — klient widzi nowe kwoty w panelu; wysłano też e-mail.", "success");
          } else if (wantedEmail && !emailed) {
            showToast(
              "Zaktualizowana wycena w panelu klienta. E-mail nie został wysłany (sprawdź adres lub skrzynkę).",
              "error",
            );
          } else {
            showToast("Zaktualizowana wycena wysłana do klienta (panel).", "success");
          }
        } else if (wantedEmail && emailed) {
          showToast("Wycena potwierdzona — klient zobaczy ją w panelu; wysłano też e-mail.", "success");
        } else if (wantedEmail && !emailed) {
          showToast(
            "Wycena potwierdzona w panelu klienta. E-mail nie został wysłany (sprawdź adres lub skrzynkę).",
            "error",
          );
        } else {
          showToast("Wycena potwierdzona — klient zobaczy ją w panelu klienta.", "success");
        }
      } catch (e) {
        console.error("sendQuote onSuccess toast", e);
      }
      // Odświeżenia po mikrotasku — unika zacięcia UI, gdy refetch zablokuje ten sam tick co zakończenie mutacji.
      queueMicrotask(() => {
        void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quotes-list"] });
        void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quote-detail", selectedQuoteId] });
        void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quote-versions", selectedQuoteId] });
        void queryClient.invalidateQueries({ queryKey: ["repair", repairId] });
        void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "timeline"] });
      });
      /** Wymuszenie stanu idle — bez tego przycisk potrafi zostawać na „Wysyłanie…” mimo zakończonego POST (TanStack Query + refetch). */
      window.setTimeout(() => {
        sendQuoteMutation.reset();
      }, 0);
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się wysłać wyceny.", "error");
      window.setTimeout(() => {
        sendQuoteMutation.reset();
      }, 0);
    },
  });

  const handleSendQuote = useCallback(() => {
    if (sendQuoteStuckTimerRef.current) {
      clearTimeout(sendQuoteStuckTimerRef.current);
      sendQuoteStuckTimerRef.current = null;
    }
    sendQuoteStuckTimerRef.current = setTimeout(() => {
      sendQuoteStuckTimerRef.current = null;
      sendQuoteMutation.reset();
      showToast(
        "Brak odpowiedzi z serwera w czasie 45 s. Jeśli e-mail dotarł, odśwież stronę — wycena mogła zostać wysłana.",
        "error",
      );
    }, 45_000);

    sendQuoteMutation.mutate(undefined, {
      onSettled: () => {
        if (sendQuoteStuckTimerRef.current) {
          clearTimeout(sendQuoteStuckTimerRef.current);
          sendQuoteStuckTimerRef.current = null;
        }
        sendQuoteMutation.reset();
      },
    });
  }, [sendQuoteMutation, showToast]);

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      if (!token) throw new Error("Brak sesji.");
      return api.delete(`/pricing/quotes/${quoteId}/`, token);
    },
    onSuccess: () => {
      setQuoteViewId(null);
      setEditingQuoteItemId(null);
      setQuoteEditorEntry("browse");
      setPricingSubView("list");
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quotes-list"] });
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quote-detail"] });
      showToast("Usunięto wycenę.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się usunąć wyceny.", "error");
    },
  });

  const saveQuoteNotesMutation = useMutation({
    mutationFn: async () => {
      if (!token || !selectedQuoteId) throw new Error("Brak wyceny.");
      return api.patch(`/pricing/quotes/${selectedQuoteId}/`, { notes: quoteNotesDraft }, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quote-detail", selectedQuoteId] });
      showToast("Zapisano notatki do wyceny.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się zapisać notatek.", "error");
    },
  });

  const updateQuoteItemMutation = useMutation({
    mutationFn: async () => {
      if (!token || !selectedQuoteId || !editingQuoteItemId) throw new Error("Brak danych.");
      const q = Number(quoteLineQty);
      const parseMoney = (s: string) => Number(String(s).trim().replace(",", "."));
      const parts = parseMoney(quoteLineParts || "0");
      const labour = parseMoney(quoteLineLabour || "0");
      if (!quoteLinePartName.trim()) throw new Error("Podaj nazwę części.");
      const description = buildQuoteItemDescription(quoteLinePartName, quoteLineDesc);
      if (!description.trim()) throw new Error("Uzupełnij nazwę części lub opis.");
      if (!Number.isFinite(q) || q <= 0) throw new Error("Ilość musi być większa od zera.");
      if (parts + labour <= 0) throw new Error("Suma ceny części i robocizny musi być większa od zera.");
      return api.patch(`/pricing/quotes/${selectedQuoteId}/items/${editingQuoteItemId}/`, {
        item_type: "other",
        description: description.trim(),
        quantity: q,
        parts_price: parts,
        labour_price: labour,
        part_origin: quoteLinePartOrigin,
      }, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quotes-list"] });
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quote-detail", selectedQuoteId] });
      showToast("Zapisano zmiany pozycji.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się zapisać pozycji.", "error");
    },
  });

  const deleteQuoteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!token || !selectedQuoteId) throw new Error("Brak danych.");
      return api.delete(`/pricing/quotes/${selectedQuoteId}/items/${itemId}/`, token);
    },
    onSuccess: () => {
      setEditingQuoteItemId(null);
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quotes-list"] });
      void queryClient.invalidateQueries({ queryKey: ["repair", repairId, "quote-detail", selectedQuoteId] });
      showToast("Usunięto pozycję.", "success");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Nie udało się usunąć pozycji.", "error");
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
    <Fragment>
      <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
        <div className="flex flex-col gap-8">
        <SuggestedNextStatusStrip repairId={repair.id} currentStatus={repair.status} />
        <div className="z-[100] lg:sticky lg:top-28">
          <section className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(14,20,32,0.96),rgba(10,14,22,0.96))] p-5 shadow-[0_14px_40px_-16px_rgba(0,0,0,0.72)] backdrop-blur-xl">
            <div className="flex flex-wrap gap-3.5">
              <TabButton
                active={activeTab === "details"}
                onClick={() => {
                  setActiveTab("details");
                  window.setTimeout(() => {
                    document.getElementById("repair-overview-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 0);
                }}
                icon={<Info size={16} />}
                label="Szczegóły"
              />
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
                active={activeTab === "courier"}
                onClick={() => setActiveTab("courier")}
                icon={<Truck size={16} />}
                label="Kurier"
              />
              <TabButton
                active={activeTab === "client_history"}
                onClick={() => setActiveTab("client_history")}
                icon={<History size={16} />}
                label="Historia klienta"
              />
            </div>
          </section>
        </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Fragment>
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
            </Fragment>
          </div>

        <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-6 lg:p-7">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-90"
            aria-hidden
          />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-5">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--s2)]"
                  style={{ background: "var(--s2, #141720)" }}
                >
                  <Smartphone size={24} className="text-[#3b82f6]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Naprawa</div>
                  <h1 className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2 md:gap-x-5">
                    <span className="shrink-0 font-display text-base font-bold tracking-tight text-[var(--white)] md:text-lg">
                      {repair.repair_number}
                    </span>
                    <span className="min-w-0 text-lg font-semibold leading-snug tracking-tight text-[#e8edf5] md:text-xl">
                      {repairDeviceTitle}
                    </span>
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <StatusPill status_display={repair.public_status ?? repair.status_display} status={repair.status} />
                    {repair.estimated_completion_date ? (
                      <span className="inline-flex rounded-full border border-[#3b82f6]/25 bg-[#3b82f6]/10 px-3.5 py-1.5 text-xs font-semibold text-[#93c5fd]">
                        Termin oddania:{" "}
                        {parseRepairDate(repair.estimated_completion_date)?.toLocaleDateString("pl-PL") ??
                          repair.estimated_completion_date}
                      </span>
                    ) : null}
                    {repair.requires_attention ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#f59e0b]">
                        <ShieldAlert size={14} />
                        Wymaga reakcji
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)]/60 pt-4">
                <button
                  type="button"
                  onClick={() => openStatusModal(repair.id)}
                  className="min-h-[42px] rounded-2xl bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#22c55e]/25 transition hover:bg-[#16a34a]"
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
                  className="min-h-[42px] rounded-2xl bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-[var(--white)] transition hover:bg-[#2563eb]"
                >
                  Wiadomość
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQuickMenu((v) => !v)}
                    className="min-h-[42px] rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
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
                  className="inline-flex min-h-[44px] max-w-[min(100%,24rem)] items-center gap-3 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--row-hover)] to-[var(--row-hover)]/70 px-2.5 py-2 pl-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-white/12 hover:from-[var(--row-active)] hover:to-[var(--row-hover)]"
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

              <AnimatePresence mode="wait" initial={false}>
              {activeTab === "details" ? (
                <MotionDiv
                key="repair-overview"
                id="repair-overview-section"
                className="mt-5 w-full space-y-4 scroll-mt-32"
                {...heroBlockMotion}
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

                    <div className="mt-4 rounded-2xl border border-[#3b82f6]/22 bg-gradient-to-br from-[#3b82f6]/10 to-[var(--s1)]/40 p-4 sm:p-5">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/12">
                          <CalendarDays size={18} className="text-[#93c5fd]" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                              Szacowany czas naprawy (dla klienta)
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">
                              Data widoczna w panelu klienta w sekcji „Informacje serwisowe”. Osobno od wewnętrznego planu
                              pracy powyżej.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => applyQuickEstimatedCompletion(1)}
                              className="rounded-xl border border-white/12 bg-[var(--s1)]/80 px-3 py-1.5 text-xs font-semibold text-[#e5e7eb] transition hover:border-white/20 hover:bg-[var(--row-active)]"
                              aria-label="Ustaw termin na jutro"
                            >
                              Jutro
                            </button>
                            <button
                              type="button"
                              onClick={() => applyQuickEstimatedCompletion(2)}
                              className="rounded-xl border border-white/12 bg-[var(--s1)]/80 px-3 py-1.5 text-xs font-semibold text-[#e5e7eb] transition hover:border-white/20 hover:bg-[var(--row-active)]"
                              aria-label="Ustaw termin na pojutrze"
                            >
                              Pojutrze
                            </button>
                            <button
                              type="button"
                              onClick={() => applyQuickEstimatedCompletion(7)}
                              className="rounded-xl border border-white/12 bg-[var(--s1)]/80 px-3 py-1.5 text-xs font-semibold text-[#e5e7eb] transition hover:border-white/20 hover:bg-[var(--row-active)]"
                              aria-label="Ustaw termin za tydzień"
                            >
                              Za tydzień
                            </button>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              type="date"
                              value={estimatedCompletionDraft}
                              onChange={(e) => setEstimatedCompletionDraft(e.target.value)}
                              className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2.5 text-sm text-[var(--white)] [color-scheme:dark] sm:max-w-[11rem] sm:flex-1"
                            />
                            <button
                              type="button"
                              disabled={!estimatedCompletionDirty || estimatedCompletionMutation.isPending}
                              onClick={() => estimatedCompletionMutation.mutate()}
                              className="w-full shrink-0 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-xs font-semibold text-[var(--white)] transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                              {estimatedCompletionMutation.isPending ? "Zapisywanie…" : "Zapisz"}
                            </button>
                          </div>
                          {repair.estimated_duration_display ? (
                            <p className="text-[11px] text-[var(--muted)]">
                              Z wyceny / kartą: {repair.estimated_duration_display} — w panelu klienta pokazujemy razem z
                              datą.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Urządzenie</div>
                          <div className="mt-2 text-base font-semibold leading-snug tracking-tight text-[#e8edf5] md:text-lg">
                            {repairDeviceTitle}
                          </div>
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
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4"
                          style={repair.requires_data_backup ? { borderColor: "rgba(59,130,246,.4)", background: "rgba(59,130,246,.08)" } : {}}>
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Kopia zapasowa danych</div>
                          {repair.requires_data_backup ? (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sm" style={{ background: "#3b82f6" }}>💾</span>
                              <span className="text-sm font-semibold" style={{ color: "#93c5fd" }}>Tak — klient prosi o backup</span>
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-[var(--ink2)]">—</div>
                          )}
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:col-span-2 xl:col-span-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Notatki klienta</div>
                          <p className="mt-2 max-h-[min(22rem,45vh)] overflow-y-auto text-sm leading-relaxed text-[#e5e7eb] whitespace-pre-wrap">
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
              </MotionDiv>
              ) : null}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {activeTab === "details" ? (
              <MotionDiv
              key="repair-sidebar"
              className="flex w-full min-w-0 flex-col gap-4 lg:max-w-[380px] lg:shrink-0 lg:self-stretch"
              {...heroBlockMotion}
            >
              <div className="relative flex min-w-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#161a22]/95 via-[var(--s2)]/40 to-[var(--s1)]/25 p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_0_1px_rgba(59,130,246,0.06),0_12px_40px_-18px_rgba(0,0,0,0.55)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(59,130,246,0.12),transparent_55%)] before:opacity-90 sm:p-0">
                <div className="relative flex shrink-0 items-center gap-2.5 border-b border-[var(--border)]/60 bg-gradient-to-r from-transparent via-[#3b82f6]/[0.06] to-transparent px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#93c5fd] via-[#3b82f6] to-[#1e40af] shadow-[0_0_16px_rgba(59,130,246,0.45),0_0_0_1px_rgba(147,197,253,0.25)]"
                    aria-hidden
                  />
                  <h2 className="bg-gradient-to-r from-[var(--ink2)] to-[#e2e8f0] bg-clip-text text-[11px] font-semibold uppercase tracking-[0.18em] text-transparent">
                    OŚ Czasu Naprawy
                  </h2>
                </div>
                <div className="flex flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
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
                          const label =
                            ev.new_status_display?.trim() || repairStatusPublicLabel(ev.new_status);
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
            </MotionDiv>
            ) : null}
            </AnimatePresence>
          </div>
        </section>

          <div
            className={`relative w-full overflow-hidden ${activeTab === "details" ? "min-h-0" : "min-h-[12rem]"}`}
          >
        <AnimatePresence mode="wait" initial={false}>
        {activeTab === "tasks" && repair ? (
          <MotionDiv key="tab-tasks" className="w-full" {...tabPanelMotion}>
            <RepairTasksPanel repairId={repair.id} repairNumber={repair.repair_number} />
          </MotionDiv>
        ) : null}

        {activeTab === "parts" && repairId ? (
          <MotionSection
            key="tab-parts"
            className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
            {...tabPanelMotion}
          >
            <RepairPartsSection
              repairId={repairId}
              token={token}
              onAfterMutation={async () => {
                await repairQuery.refetch();
              }}
            />
          </MotionSection>
        ) : null}

        {activeTab === "comms" ? (
          <MotionSection
            key="tab-comms"
            ref={commSectionRef}
            className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
            {...tabPanelMotion}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Komunikacja</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Wątek z klientem</h2>
              </div>
              <Link href={p.commPath} className="text-sm font-semibold text-[#3b82f6] hover:underline">
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
                    className="mb-3 mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--s2)] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
                  />
                ) : null}
                <textarea
                  ref={commTextareaRef}
                  value={commDraft}
                  onChange={(e) => setCommDraft(e.target.value)}
                  className="mt-1 w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--s2)] px-4 py-3 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
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
          </MotionSection>
        ) : null}

        {activeTab === "pricing" ? (
          <MotionSection
            key="tab-pricing"
            className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-gradient-to-b from-[#151a22] via-[#0f1219] to-[#0a0c10] p-6 shadow-[0_28px_56px_-28px_rgba(0,0,0,0.75)]"
            {...tabPanelMotion}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/35 to-transparent" aria-hidden />

            {pricingSubView === "list" ? (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">Wycena naprawy</div>
                    <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-white">Wszystkie wyceny</h2>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#94a3b8]">
                      Kliknij <strong className="text-white">Edytuj</strong>, aby otworzyć wycenę z uzupełnionymi polami — zapisz zmiany i na dole wyślij do klienta.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={createQuoteMutation.isPending || !repair}
                    onClick={() => createQuoteMutation.mutate()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-4 py-2.5 text-sm font-semibold text-[#bfdbfe] transition hover:bg-[#3b82f6]/25 disabled:opacity-50"
                  >
                    <Plus size={16} aria-hidden />
                    Nowa Wycena
                  </button>
                </div>

                <div className="mt-6">
                  {quotesListQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={idx} className="h-14 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0e14]/80" />
                      ))}
                    </div>
                  ) : quotesList.length ? (
                    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0c0e14]/80">
                      <table className="w-full min-w-[960px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-black/20 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                            <th className="px-4 py-3">Numer</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Wysłano e-mail</th>
                            <th className="px-4 py-3 text-right tabular-nums">Ilość pozycji</th>
                            <th className="px-4 py-3">Część</th>
                            <th className="px-4 py-3 text-right">Suma całkowita</th>
                            <th className="px-4 py-3 text-right">Akcje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotesList.map((q: any) => {
                            const canEdit = quoteIsStaffEditable(q.status);
                            const canDel = ["draft", "rejected", "expired"].includes(String(q.status));
                            return (
                              <tr key={q.id} className="border-t border-white/[0.04] transition hover:bg-white/[0.02]">
                                <td className="px-4 py-3 font-semibold text-white">{formatQuoteNumberLabel(q.version)}</td>
                                <td className="px-4 py-3 text-[#cbd5e1]">{quoteStatusLabelPl(q.status)}</td>
                                <td className="max-w-[200px] px-4 py-3 text-xs text-[#cbd5e1]">
                                  {formatQuoteListEmailSentCell(q.status, q.last_client_email_sent_at)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono tabular-nums text-[#cbd5e1]">
                                  {typeof q.items_count === "number" ? q.items_count : "—"}
                                </td>
                                <td className="max-w-[220px] px-4 py-3 text-xs leading-snug text-[#cbd5e1]">
                                  {q.part_origin_summary != null && q.part_origin_summary !== ""
                                    ? String(q.part_origin_summary)
                                    : "—"}
                                </td>
                                <td className="px-4 py-3 text-right font-mono tabular-nums text-[#e2e8f0]">
                                  {String(q.total_amount ?? "0")} zł
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQuoteViewId(String(q.id));
                                        setQuoteEditorEntry("browse");
                                        setPricingSubView("edit");
                                        setEditingQuoteItemId(null);
                                      }}
                                      className="rounded-lg border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-1.5 text-xs font-semibold text-[#bfdbfe] transition hover:bg-[#3b82f6]/25"
                                    >
                                      {canEdit ? "Edytuj" : "Podgląd"}
                                    </button>
                                    {canDel ? (
                                      <button
                                        type="button"
                                        disabled={deleteQuoteMutation.isPending}
                                        onClick={() => {
                                          if (!window.confirm("Usunąć tę wycenę? Tej operacji nie można cofnąć.")) return;
                                          deleteQuoteMutation.mutate(String(q.id));
                                        }}
                                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                                      >
                                        Usuń
                                      </button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-4 py-10 text-center">
                      <p className="text-sm text-[#94a3b8]">Brak wycen — utwórz pierwszą (szkic).</p>
                      <button
                        type="button"
                        disabled={createQuoteMutation.isPending || !repair}
                        onClick={() => createQuoteMutation.mutate()}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/20 transition hover:bg-[#2563eb] disabled:opacity-50"
                      >
                        <Plus size={18} aria-hidden />
                        {createQuoteMutation.isPending ? "Tworzenie…" : "Utwórz wycenę (szkic)"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                    <button
                      type="button"
                      onClick={() => {
                        setPricingSubView("list");
                        setQuoteViewId(null);
                        setEditingQuoteItemId(null);
                        setQuoteEditorEntry("browse");
                      }}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-[#e2e8f0] transition hover:bg-white/[0.08]"
                    >
                      <ArrowLeft size={18} aria-hidden />
                      Lista wycen
                    </button>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">Wycena naprawy</div>
                      <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-white">
                        {quoteEditorEntry === "created" ? "Nowa wycena" : "Edycja wyceny"}
                      </h2>
                      <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#94a3b8]">
                        {quoteEditorEntry === "created" ? (
                          <>
                            Świeży szkic: uzupełnij pozycje (możesz dodać kilka — każdą zapisuj osobno). Sekcja{" "}
                            <strong className="text-[#cbd5e1]">wysyłki e-mailem</strong> pojawi się poniżej, gdy suma wyceny
                            będzie większa od zera.
                          </>
                        ) : (
                          <>
                            Pola odzwierciedlają zapisaną wycenę — zmień co potrzeba, zapisz pozycje/notatki, na dole wyślij do
                            klienta.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px]">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {quoteDetail ? (
                        <>
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#e2e8f0]">
                            {quoteStatusLabelPl(quoteDetail.status)}
                          </span>
                          <span className="text-sm text-[#94a3b8]">
                            Suma:{" "}
                            <span className="font-semibold tabular-nums text-white">
                              {(quoteDetail.items?.length ?? 0) > 0
                                ? `${quoteTotalNumeric.toFixed(2)} zł`
                                : `${String(quoteDetail.total_amount ?? "—")}`}
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-[#64748b]">Ładowanie wyceny…</span>
                      )}
                      {quoteDetail && quoteDeletable ? (
                        <button
                          type="button"
                          disabled={deleteQuoteMutation.isPending}
                          onClick={() => {
                            if (!window.confirm("Usunąć tę wycenę? Tej operacji nie można cofnąć.")) return;
                            deleteQuoteMutation.mutate(String(quoteDetail.id));
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <Trash2 size={14} aria-hidden />
                          Usuń wycenę
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={createQuoteMutation.isPending || !repair}
                        onClick={() => createQuoteMutation.mutate()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-1.5 text-xs font-semibold text-[#bfdbfe] transition hover:bg-[#3b82f6]/25 disabled:opacity-50"
                      >
                        <Plus size={15} aria-hidden />
                        Nowa Wycena
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="rounded-2xl border border-white/[0.06] bg-[#0c0e14]/80 p-5 backdrop-blur-sm">
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">Pozycje</div>
                      <div className="mt-1 text-sm font-medium text-[#e2e8f0]">
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
                          (quoteDetail.items ?? []).map((it: any) => {
                            const isLineEditing = quoteEditable && editingQuoteItemId === String(it.id);
                            const lineText = parseQuoteItemDescription(it.description);
                            const lineTitle =
                              lineText.partName || it.labour_type_name || it.part?.name || it.description || "Pozycja";
                            return (
                              <div
                                key={it.id}
                                className={`group flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition ${
                                  isLineEditing
                                    ? "border-[#3b82f6]/45 bg-[#0f141d] ring-1 ring-[#3b82f6]/20"
                                    : "border-white/[0.06] bg-gradient-to-br from-[#12151c] to-[#0c0e12] hover:border-[#3b82f6]/25"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-[#f1f5f9]">{lineTitle}</div>
                                  {lineText.extra ? (
                                    <div className="mt-0.5 text-xs leading-snug text-[#94a3b8]">{lineText.extra}</div>
                                  ) : null}
                                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#cbd5e1]">
                                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#e2e8f0]">
                                      {it.part_origin_display || (it.part_origin === "original" ? "Oryginalna (OEM)" : "Zamiennik")}
                                    </span>
                                    <span className="tabular-nums">× {it.quantity ?? "—"}</span>
                                    <span className="font-medium tabular-nums text-[#e2e8f0]">Części {String(it.parts_price ?? "0")} zł</span>
                                    <span className="font-medium tabular-nums text-[#e2e8f0]">Robocizna {String(it.labour_price ?? "0")} zł</span>
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                  <div className="text-sm font-semibold tabular-nums text-white">{String(it.total ?? "0")} zł</div>
                                  {quoteEditable ? (
                                    <div className="flex flex-wrap items-center justify-end gap-2 opacity-90 transition group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingQuoteItemId(String(it.id));
                                          applyItemToQuoteLineForm(it);
                                        }}
                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                          isLineEditing
                                            ? "border-[#3b82f6]/60 bg-[#3b82f6]/25 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.35)]"
                                            : "border-[#3b82f6]/40 bg-[#3b82f6]/12 text-[#bfdbfe] hover:border-[#3b82f6]/55 hover:bg-[#3b82f6]/22 hover:text-white"
                                        }`}
                                      >
                                        <PencilLine size={14} className="shrink-0 opacity-90" aria-hidden />
                                        Edytuj
                                      </button>
                                      <button
                                        type="button"
                                        title="Usuń pozycję"
                                        onClick={() => {
                                          if (!window.confirm("Usunąć tę pozycję?")) return;
                                          deleteQuoteItemMutation.mutate(String(it.id));
                                        }}
                                        className="rounded-lg border border-red-500/25 bg-red-500/10 p-1.5 text-red-300/90 transition hover:bg-red-500/15"
                                      >
                                        <Trash2 size={16} aria-hidden />
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-4 text-sm text-[#64748b]">
                            Brak pozycji — dodaj pierwszą poniżej (szkic możesz potem wysłać do klienta z poziomu wyceny).
                          </p>
                        )}
                      </div>

                      {(quoteDetail.items?.length ?? 0) > 0 ? (
                        <div className="mt-4 rounded-2xl border border-[#3b82f6]/20 bg-gradient-to-b from-[#121a24]/90 to-[#0c0e14] p-4 shadow-[0_12px_40px_-16px_rgba(59,130,246,0.35)]">
                          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-3">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#93c5fd]">Podsumowanie wyceny</div>
                              <p className="mt-1 text-xs text-[#94a3b8]">
                                Wszystkie zapisane pozycje — suma jest widoczna także dla klienta po wysłaniu.
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Suma całkowita</div>
                              <div className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-white">
                                {quoteTotalNumeric.toFixed(2)} zł
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20">
                            <table className="w-full min-w-[560px] text-left text-sm">
                              <thead>
                                <tr className="border-b border-white/[0.06] bg-black/25 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                                  <th className="px-3 py-2.5">#</th>
                                  <th className="px-3 py-2.5">Część / opis</th>
                                  <th className="px-3 py-2.5 text-right">Ilość</th>
                                  <th className="px-3 py-2.5 text-right">Części (jedn.)</th>
                                  <th className="px-3 py-2.5 text-right">Robocizna (jedn.)</th>
                                  <th className="px-3 py-2.5 text-right">Razem</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(quoteDetail.items ?? []).map((it: any, idx: number) => {
                                  const lineText = parseQuoteItemDescription(it.description);
                                  const lineTitle = lineText.partName || String(it.description ?? "—");
                                  return (
                                    <tr key={it.id} className="border-b border-white/[0.04] last:border-b-0">
                                      <td className="px-3 py-2.5 align-top tabular-nums text-[#64748b]">{idx + 1}</td>
                                      <td className="max-w-[220px] px-3 py-2.5 align-top">
                                        <div className="font-medium text-[#f1f5f9]">{lineTitle}</div>
                                        {lineText.extra ? (
                                          <div className="mt-0.5 text-xs leading-snug text-[#94a3b8]">{lineText.extra}</div>
                                        ) : null}
                                      </td>
                                      <td className="px-3 py-2.5 text-right align-top tabular-nums text-[#cbd5e1]">
                                        {String(it.quantity ?? "—")}
                                      </td>
                                      <td className="px-3 py-2.5 text-right align-top tabular-nums text-[#cbd5e1]">
                                        {parseMoneyish(it.parts_price).toFixed(2)} zł
                                      </td>
                                      <td className="px-3 py-2.5 text-right align-top tabular-nums text-[#cbd5e1]">
                                        {parseMoneyish(it.labour_price).toFixed(2)} zł
                                      </td>
                                      <td className="px-3 py-2.5 text-right align-top font-semibold tabular-nums text-white">
                                        {parseMoneyish(it.total).toFixed(2)} zł
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}

                      {quoteEditable && quoteDetail ? (
                        quoteCanConfirm ? (
                          <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-950/15 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200/90">
                              Wyślij Wycenę
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-[#e5e7eb]">
                              {quoteDetail.status === "sent" ? (
                                <>
                                  Klient otrzyma zaktualizowaną wycenę ze <strong className="text-[var(--white)]">wszystkimi pozycjami</strong>{" "}
                                  (panel, powiadomienia i e-mail, jeśli włączysz).
                                </>
                              ) : (
                                <>
                                  Po wysłaniu cała wycena (wszystkie części i kwoty z podsumowania powyżej) będzie widoczna w{" "}
                                  <strong className="text-[var(--white)]">panelu klienta</strong>. Możesz dołączyć kopię na e-mail.
                                </>
                              )}
                            </p>
                            {canEmailClient ? (
                              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-[#e5e7eb]">
                                <input
                                  type="checkbox"
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] bg-[var(--s1)] text-emerald-600 focus:ring-emerald-500"
                                  checked={quoteConfirmSendEmail}
                                  onChange={(e) => setQuoteConfirmSendEmail(e.target.checked)}
                                />
                                <span>
                                  <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--white)]">
                                    <Mail size={15} className="text-emerald-300" aria-hidden />
                                    Wyślij wycenę e-mailem do klienta (kopia PDF / treść)
                                  </span>
                                  <span className="mt-0.5 block text-xs text-[var(--ink2)]">
                                    ({repair?.client?.email ?? "—"})
                                  </span>
                                </span>
                              </label>
                            ) : (
                              <p className="mt-3 text-xs text-amber-200/90">
                                Klient nie ma zapisanego poprawnego adresu e-mail — wycena trafi tylko do panelu klienta (po założeniu konta / przypisaniu naprawy).
                              </p>
                            )}
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                disabled={sendQuoteMutation.isPending || addQuoteItemMutation.isPending}
                                onClick={handleSendQuote}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Send size={17} aria-hidden />
                                {sendQuoteMutation.isPending ? "Wysyłanie…" : "Wyślij Wycenę"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4">
                            <div className="flex flex-wrap items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-emerald-300/90">
                                <Mail size={20} aria-hidden />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                                  Wysyłka całej wyceny (e-mail)
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">
                                  Zapisz co najmniej jedną pozycję z{" "}
                                  <strong className="text-white">ceną części lub robocizny większą od zera</strong>, żeby suma była
                                  dodatnia — wtedy odblokują się opcje e-mail i przycisk wyślij powyżej (pod podsumowaniem).
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      ) : null}

                      {quoteEditable ? (
                        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#0a0c10]/90 p-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Notatki do wyceny</div>
                          <p className="mt-1 text-xs text-[#64748b]">Widoczne dla zespołu; klient nie widzi notatek, dopóki nie wyślesz treści innym kanałem.</p>
                          <textarea
                            value={quoteNotesDraft}
                            onChange={(e) => setQuoteNotesDraft(e.target.value)}
                            rows={3}
                            placeholder="Uwagi wewnętrzne, ustalenia z klientem…"
                            className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-[#0c0e14] px-3 py-2.5 text-sm text-[#e2e8f0] outline-none placeholder:text-[#64748b] focus:border-[#3b82f6]/40"
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              disabled={saveQuoteNotesMutation.isPending}
                              onClick={() => saveQuoteNotesMutation.mutate()}
                              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-[#e2e8f0] transition hover:bg-white/[0.1] disabled:opacity-50"
                            >
                              {saveQuoteNotesMutation.isPending ? "Zapisywanie…" : "Zapisz notatki"}
                            </button>
                          </div>
                        </div>
                      ) : quoteDetail.notes ? (
                        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Notatki</div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-[#cbd5e1]">{String(quoteDetail.notes)}</p>
                        </div>
                      ) : null}
                      {quoteEditable ? (
                        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--row-hover)]/40 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                            {editingQuoteItemId ? "Edytuj pozycję" : "Nowa pozycja"}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-[var(--ink2)]">
                            {editingQuoteItemId
                              ? "Zmiany zapiszesz przyciskiem poniżej — zaznaczona pozycja na liście jest podświetlona."
                              : "Kliknij Zapisz — kursor wróci do nazwy części, żeby od razu dodać kolejną linię."}
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">
                                Nazwa części <span className="text-red-300/90">*</span>
                              </label>
                              <input
                                ref={quoteLinePartNameInputRef}
                                value={quoteLinePartName}
                                onChange={(e) => setQuoteLinePartName(e.target.value)}
                                placeholder="Np. wyświetlacz OEM, bateria…"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">
                                Opis / uwagi <span className="font-normal text-[var(--muted)]">(opcjonalnie)</span>
                              </label>
                              <input
                                value={quoteLineDesc}
                                onChange={(e) => setQuoteLineDesc(e.target.value)}
                                placeholder="Np. wymiana z przeniesieniem danych, robocizna…"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">
                                Część oryginalna / zamiennik
                              </label>
                              <select
                                value={quoteLinePartOrigin}
                                onChange={(e) => setQuoteLinePartOrigin(e.target.value as "original" | "aftermarket")}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm text-[var(--white)]"
                              >
                                {QUOTE_PART_ORIGIN_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
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
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">Cena części (zł / szt.)</label>
                              <input
                                value={quoteLineParts}
                                onChange={(e) => setQuoteLineParts(e.target.value)}
                                inputMode="decimal"
                                placeholder="0"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm text-[var(--white)]"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">Cena robocizny (zł / szt.)</label>
                              <input
                                value={quoteLineLabour}
                                onChange={(e) => setQuoteLineLabour(e.target.value)}
                                inputMode="decimal"
                                placeholder="0"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-sm text-[var(--white)]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink2)]">Cena całkowita (pozycji)</label>
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-sm font-semibold text-[var(--white)]">
                                {quoteLineTotalPreview !== null ? `${quoteLineTotalPreview.toFixed(2)} zł` : "—"}
                              </div>
                              <p className="mt-1 text-[11px] text-[var(--ink2)]">Ilość × (cena części + cena robocizny) na jednostkę.</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              {(quoteDetail.items?.length ?? 0) >= 1 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQuoteItemId(null);
                                    resetQuoteLineForm();
                                  }}
                                  className="rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2 text-xs font-semibold text-[var(--ink2)] transition hover:bg-white/5"
                                >
                                  Wyczyść formularz (dodaj kolejną pozycję)
                                </button>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {editingQuoteItemId ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const items = quoteDetail.items ?? [];
                                    if (items.length === 1) {
                                      applyItemToQuoteLineForm(items[0]);
                                      setEditingQuoteItemId(String(items[0].id));
                                    } else {
                                      setEditingQuoteItemId(null);
                                      resetQuoteLineForm();
                                    }
                                  }}
                                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-white/5"
                                >
                                  Anuluj edycję
                                </button>
                              ) : null}
                              <button
                                type="button"
                                disabled={
                                  editingQuoteItemId ? updateQuoteItemMutation.isPending : addQuoteItemMutation.isPending
                                }
                                onClick={() => {
                                  if (editingQuoteItemId) updateQuoteItemMutation.mutate();
                                  else addQuoteItemMutation.mutate();
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
                              >
                                {editingQuoteItemId ? null : <Plus size={16} aria-hidden />}
                                {editingQuoteItemId
                                  ? updateQuoteItemMutation.isPending
                                    ? "Zapisywanie…"
                                    : "Zapisz"
                                  : addQuoteItemMutation.isPending
                                    ? "Zapisywanie…"
                                    : "Zapisz"}
                              </button>
                            </div>
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
                            <div className="text-sm font-semibold text-[var(--white)]">{formatQuoteNumberLabel(v.version_number)}</div>
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
              </>
            )}
          </MotionSection>
        ) : null}

        {activeTab === "courier" ? (
          <MotionSection
            key="tab-courier"
            className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
            {...tabPanelMotion}
          >
            <RepairCourierTab repair={repair} repairId={repairId} />
          </MotionSection>
        ) : null}

        {activeTab === "client_history" ? (
          <MotionSection
            key="tab-client-history"
            className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
            {...tabPanelMotion}
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
                          <StatusPill status={r.status} status_display={r.public_status ?? r.status_display} />
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
          </MotionSection>
        ) : null}
        </AnimatePresence>
        </div>
      </div>
    </main>
      <AcceptanceProtocolPreviewModal
        open={acceptancePreviewOpen}
        onClose={() => setAcceptancePreviewOpen(false)}
        repairId={repair.id}
        repairNumber={repair.repair_number}
        token={token}
      />
    </Fragment>
  );
}

function RepairDetailSuspenseFallback() {
  const p = usePanelBasePath();
  return (
    <RepairDetailLoadingSkeleton
      listHref={p.repairsListPath}
      backLabel={p.isAdminPanel ? "Wróć do listy napraw" : "Wróć do napraw"}
    />
  );
}

export default function RepairDetailPage() {
  return (
    <Suspense fallback={<RepairDetailSuspenseFallback />}>
      <RepairDetailPageContent />
    </Suspense>
  );
}

