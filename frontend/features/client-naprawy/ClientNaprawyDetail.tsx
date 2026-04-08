"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/panel/StatusBadge";
import { apiRepairDetailToPanel, type ApiRepairDetail } from "@/lib/panel-api";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatQuoteNumberLabel } from "@/lib/quoteLabels";
import { repairStatusPublicLabel } from "@/lib/repairStatusPublic";
import { formatPrice, formatTotalPrice, getDeviceEmoji } from "@/types/panel";
import type { Repair } from "@/types/panel";
import type { RepairThreadItem, RepairTimelineEvent } from "@/types/repairs";

type StatusChangeEvent = Extract<RepairTimelineEvent, { type: "status_change" }>;

function labelForStatusChange(ev: StatusChangeEvent): string {
  return (ev.new_status_display ?? "").trim() || repairStatusPublicLabel(ev.new_status);
}

function sortedStatusChanges(events: RepairTimelineEvent[]): StatusChangeEvent[] {
  const rows = events.filter((e): e is StatusChangeEvent => e.type === "status_change");
  rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return rows;
}

function DetailItem({
  label,
  value,
  full,
  mono,
  tag,
}: {
  label: string;
  value: string | null | undefined;
  full?: boolean;
  mono?: boolean;
  tag?: boolean;
}) {
  if (value == null || value === "") return null;
  return (
    <div className={full ? "col-span-full" : ""}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</p>
      <p
        className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--ink)", fontFamily: mono ? "'Courier New', monospace" : undefined }}
      >
        {tag ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: "var(--green-l)", color: "var(--green)", border: "1px solid var(--green-b)" }}>
            ✓ {value}
          </span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

const REPAIR_STEPS = [
  { id: "received", label: "Przyjęte", icon: "📥" },
  { id: "diagnostic", label: "Diagnostyka", icon: "🔍" },
  { id: "quote", label: "Wycena", icon: "📋" },
  { id: "repair", label: "Naprawa", icon: "🔧" },
  { id: "ready", label: "Do odbioru", icon: "✅" },
  { id: "done", label: "Wydane", icon: "🎊" },
];

function getStepIndex(status: string): number {
  // Status jest już skonwertowany z API na panel status (z API_STATUS_TO_PANEL)
  // Możliwe statusy panelu: "new", "diagnosed", "wait_decision", "in_progress", "ready", "done", "cancelled"
  const s = (status ?? "").toLowerCase().trim();

  // Krok 5: Gotowe / Wydane
  if (["done"].includes(s)) {
    return 5;
  }

  // Krok 4: Do odbioru
  if (["ready"].includes(s)) {
    return 4;
  }

  // Krok 3: W naprawie
  if (["in_progress"].includes(s)) {
    return 3;
  }

  // Krok 2: Wycena / oczekiwanie na decyzję
  if (["wait_decision"].includes(s)) {
    return 2;
  }

  // Krok 1: Diagnostyka
  if (["diagnosed"].includes(s)) {
    return 1;
  }

  // Krok 0: Przyjęte (domyślnie) - nowy, anulowany, itd.
  return 0;
}

function getNextAction(status: string): { icon: string; title: string; body: string; color: "amber" | "green" | "blue" | "default" } {
  // Status jest już skonwertowany z API na panel status (z API_STATUS_TO_PANEL)
  // Możliwe statusy panelu: "new", "diagnosed", "wait_decision", "in_progress", "ready", "done", "cancelled"
  const s = (status ?? "").toLowerCase().trim();

  // Oczekiwanie na decyzję - wycena wysłana
  if (["wait_decision"].includes(s)) {
    return { icon: "⚠️", title: "Wymagana Twoja decyzja", body: "Przygotowaliśmy wycenę naprawy. Przejrzyj ją poniżej i zaakceptuj lub odrzuć, aby kontynuować.", color: "amber" };
  }

  // Trwa naprawa / w naprawie
  if (["in_progress"].includes(s)) {
    return { icon: "🔧", title: "Trwa naprawa", body: "Technik pracuje nad Twoim urządzeniem. Powiadomimy Cię, gdy naprawa zostanie zakończona.", color: "blue" };
  }

  // Gotowe do odbioru
  if (["ready"].includes(s)) {
    return { icon: "✅", title: "Urządzenie gotowe do odbioru!", body: "Naprawa zakończona. Możesz odebrać urządzenie w serwisie lub czekać na wysyłkę kurierem.", color: "green" };
  }

  // Naprawa zakończona
  if (["done"].includes(s)) {
    return { icon: "🎉", title: "Naprawa zakończona", body: "Dziękujemy za zaufanie! W razie pytań dotyczących gwarancji — jesteśmy do dyspozycji.", color: "green" };
  }

  // Trwa diagnostyka
  if (["diagnosed"].includes(s)) {
    return { icon: "🔍", title: "Trwa diagnostyka urządzenia", body: "Nasz technik analizuje usterkę. Wkrótce otrzymasz wycenę i informację o możliwości naprawy.", color: "blue" };
  }

  // Domyślnie: Zgłoszenie przyjęte (nowy, anulowany, itd.)
  return { icon: "📥", title: "Zgłoszenie przyjęte", body: "Twoje urządzenie zostało zarejestrowane. Technik wkrótce przystąpi do diagnostyki.", color: "default" };
}

export function ClientNaprawyDetail({ repairId }: { repairId: string }) {
  const { token } = useAuth();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [courierInput, setCourierInput] = useState("");
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState<"ok" | "err" | null>(null);
  const [thread, setThread] = useState<RepairThreadItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [msgDraft, setMsgDraft] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState<"ok" | "err" | null>(null);
  const [quoteRespondBusy, setQuoteRespondBusy] = useState(false);
  const [quoteRespondError, setQuoteRespondError] = useState<string | null>(null);
  const [statusTimeline, setStatusTimeline] = useState<StatusChangeEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const fetchRepair = async () => {
    if (!token) return;
    try {
      const data = await api.get<ApiRepairDetail>(`/repairs/${repairId}/`, token);
      const r = apiRepairDetailToPanel(data);
      setRepair(r);
      setTrackingInput(r.clientTrackingNumber ?? "");
      setCourierInput(r.clientCourier ?? "");
      setNotFound(false);
      setError(null);
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) setNotFound(true);
      else setError(e instanceof Error ? e.message : "Błąd ładowania.");
    }
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    void fetchRepair().finally(() => setLoading(false));
  }, [token, repairId]);

  // Polling: odśwież status naprawy co 10 sekund
  useEffect(() => {
    if (!token || !repairId) return;
    const interval = setInterval(() => {
      void fetchRepair();
    }, 10000); // 10 sekund
    return () => clearInterval(interval);
  }, [token, repairId]);

  useEffect(() => {
    if (!token || !repairId) return;
    let cancelled = false;
    setThreadLoading(true);
    setThreadError(null);
    api
      .get<RepairThreadItem[]>(`/repairs/${repairId}/messages/`, token)
      .then((data) => {
        if (!cancelled) setThread(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setThreadError(e instanceof Error ? e.message : "Nie udało się załadować wiadomości.");
      })
      .finally(() => {
        if (!cancelled) setThreadLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, repairId]);

  useEffect(() => {
    if (!token || !repairId || !repair) return;
    let cancelled = false;
    setTimelineLoading(true);
    setTimelineError(null);
    api
      .get<RepairTimelineEvent[]>(`/repairs/${repairId}/timeline/`, token)
      .then((data) => {
        if (!cancelled) setStatusTimeline(sortedStatusChanges(Array.isArray(data) ? data : []));
      })
      .catch((e) => {
        if (!cancelled) {
          setStatusTimeline([]);
          setTimelineError(e instanceof Error ? e.message : "Nie udało się załadować historii statusów.");
        }
      })
      .finally(() => {
        if (!cancelled) setTimelineLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, repairId, repair?.statusUpdatedAt]);

  if (loading) {
    return (
        <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="skeleton mb-8 h-12 w-72 rounded" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="panel-card skeleton h-64" />
            <div className="panel-card skeleton h-80" />
          </div>
          <div className="space-y-6">
            <div className="panel-card skeleton h-48" />
            <div className="panel-card skeleton h-56" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="panel-card p-8 text-center">
              <p className="text-lg font-semibold cp-heading">Nie znaleziono naprawy</p>
              <p className="mt-2 text-sm" style={{ color: "var(--ink2)" }}>Nie znaleziono naprawy o podanym numerze.</p>
              <Link href="/client/naprawy" className="mt-4 inline-block text-sm font-medium" style={{ color: "var(--red)" }}>
            ← Wróć do listy napraw
          </Link>
        </div>
      </div>
    );
  }

  if (error || !repair) {
    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="panel-card p-8 text-center">
              <p className="text-lg font-semibold cp-heading">Błąd</p>
              <p className="mt-2 text-sm" style={{ color: "var(--ink2)" }}>{error ?? "Nie udało się załadować szczegółów."}</p>
              <Link href="/client/naprawy" className="mt-4 inline-block text-sm font-medium" style={{ color: "var(--red)" }}>
            ← Wróć do listy napraw
          </Link>
        </div>
      </div>
    );
  }

  const deliveryLabel = repair.deliveryMethod === "osobiscie" ? "Osobiście w serwisie" : "Wysyłka kurierem do serwisu";
  const pickupLabel = repair.pickupMethod === "osobiscie" ? "Odbiór osobisty" : "Zwrot kurierem do domu";
  const currentStep = getStepIndex(repair.status);
  const nextAction = getNextAction(repair.status);
  const deviceTitle = [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel;

  const actionBorderColor = {
    amber: "var(--amber-b)",
    green: "var(--green-b)",
    blue: "var(--blue-b)",
    default: "var(--border)",
  }[nextAction.color];
  const actionBgColor = {
    amber: "var(--amber-l)",
    green: "var(--green-l)",
    blue: "var(--blue-l)",
    default: "var(--island2)",
  }[nextAction.color];

  return (
      <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">

      {/* Back link */}
      <Link
        href="/client/naprawy"
        className="mb-5 inline-flex items-center gap-1.5 text-base font-medium transition hover:opacity-70"
        style={{ color: "var(--ink2)" }}
      >
        ← Wróć do listy napraw
      </Link>

      {/* ── HERO CARD ── */}
      <div className="panel-card mb-6 overflow-hidden">

        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-7">
          <div className="flex items-center gap-5">
            <div
              className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl text-4xl"
              style={{ background: "var(--island3)", border: "1.5px solid var(--border)" }}
            >
              {getDeviceEmoji(repair.deviceCategory)}
            </div>
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                {repair.repairNumber}
              </p>
              <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl" style={{ color: "var(--heading)", fontFamily: "var(--font-unbounded)" }}>
                {deviceTitle}
              </h1>
              <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--ink2)" }}>
                Przyjęto {formatDate(repair.createdAt)}
                {repair.problemDescription ? ` · ${repair.problemDescription.slice(0, 50)}…` : ""}
              </p>
            </div>
          </div>
          <StatusBadge status={repair.status} labelOverride={repair.statusDisplay} large />
        </div>

        {/* ── Progress stepper ── */}
        <div className="border-t px-5 py-5 sm:px-6" style={{ borderColor: "var(--border)", background: "var(--island3)" }}>
          <div className="flex items-start">
            {REPAIR_STEPS.map((step, i) => {
              const stepDone = i < currentStep;
              const stepActive = i === currentStep;
              return (
                <div key={step.id} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="relative flex w-full items-center justify-center">
                    {i > 0 && (
                      <div
                        className="absolute right-1/2 top-1/2 h-0.5 w-full -translate-y-1/2"
                        style={{ background: stepDone || stepActive ? "var(--green)" : "var(--border)" }}
                      />
                    )}
                    <div
                      className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold"
                      style={{
                        background: stepDone ? "var(--green)" : stepActive ? "var(--red)" : "var(--island)",
                        border: stepDone ? "2px solid var(--green)" : stepActive ? "2px solid var(--red)" : "2px solid var(--border)",
                        color: stepDone || stepActive ? "#fff" : "var(--muted)",
                      }}
                    >
                      {stepDone ? "✓" : step.icon}
                    </div>
                  </div>
                  <span
                    className="hidden text-center text-[10px] font-semibold leading-tight sm:block"
                    style={{ color: stepDone ? "var(--green)" : stepActive ? "var(--ink)" : "var(--muted)" }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── "Co dalej?" strip ── */}
      <div
        className="mb-6 flex items-start gap-3 rounded-2xl border p-5"
        style={{ borderColor: actionBorderColor, background: actionBgColor }}
      >
        <span className="mt-0.5 text-2xl">{nextAction.icon}</span>
        <div>
          <p className="text-base font-bold" style={{ color: "var(--ink)" }}>{nextAction.title}</p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink2)" }}>{nextAction.body}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">

        {/* ══ LEFT COLUMN ══ */}
        <div className="space-y-6">

          {/* ── Szczegóły zgłoszenia ── */}
          <div className="panel-card overflow-hidden">
            <div className="panel-card-header flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: "var(--amber-l)", border: "1px solid var(--amber-b)" }}>
                🔧
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--heading)", fontFamily: "var(--font-unbounded)" }}>
                  Szczegóły zgłoszenia
                </h2>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Dane podane przy rejestracji urządzenia</p>
              </div>
            </div>

            <div className="grid gap-x-7 gap-y-6 p-6 sm:grid-cols-2">
              <DetailItem label="Kategoria urządzenia" value={repair.deviceCategory} />
              <DetailItem label="Marka urządzenia" value={repair.deviceBrand} />
              <DetailItem label="Model urządzenia" value={repair.deviceModel} />
              <DetailItem label="Opis problemu" value={repair.problemDescription} full />
              <DetailItem label="Data przyjęcia" value={formatDate(repair.createdAt)} />
              {repair.imei && <DetailItem label="Numer IMEI / Seryjny" value={repair.imei} mono />}
              <DetailItem label="Dostawa urządzenia" value={deliveryLabel} />
              <DetailItem label="Odbiór urządzenia" value={pickupLabel} />
              {repair.deviceTurnsOn != null && (
                <DetailItem label="Urządzenie się włącza" value={repair.deviceTurnsOn ? "Tak" : "Nie"} />
              )}
              {repair.visualConditionDescription && (
                <DetailItem label="Stan wizualny" value={repair.visualConditionDescription} full />
              )}
              {repair.hammerGlass != null && (
                <DetailItem
                  label="Folia Hammer Glass"
                  value={repair.hammerGlass === "tak" ? "Tak — proszę o ofertę przy naprawie" : "Nie — na razie nie"}
                  tag
                />
              )}
              {(repair.wantsAccessories || repair.accessoryWishlist) && (
                <DetailItem
                  label="Akcesoria"
                  value={repair.accessoryWishlist ?? "Proszę doradzić przy odbiorze"}
                  tag
                />
              )}
              {repair.clientNotes && (
                <DetailItem label="Dodatkowe uwagi" value={repair.clientNotes} full />
              )}
            </div>

            {/* Tracking number — only for courier delivery */}
            {repair.deliveryMethod === "kurier" && (
              <div className="border-t p-5" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Numer listu przewozowego i przewoźnik (opcjonalnie)
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--ink2)" }}>
                  Podaj numer śledzenia przesyłki i którym przewoźnikiem wysyłasz sprzęt — serwis sprawdzi kiedy dotrze do nas.
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="text"
                      className="min-w-[220px] flex-1 rounded-xl border bg-[var(--island)] px-4 py-3 text-sm font-mono"
                      style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                      placeholder="np. 1234567890123456"
                      value={trackingInput}
                      onChange={(e) => { setTrackingInput(e.target.value); setTrackingMessage(null); }}
                      maxLength={100}
                    />
                    <button
                      type="button"
                      disabled={trackingSaving}
                      onClick={async () => {
                        if (!token) return;
                        setTrackingSaving(true);
                        setTrackingMessage(null);
                        try {
                          const data = await api.post<ApiRepairDetail>(`/repairs/${repairId}/set-inbound-tracking/`, { tracking_number: trackingInput.trim(), courier: courierInput.trim() }, token);
                          setRepair(apiRepairDetailToPanel(data));
                          setTrackingMessage("ok");
                        } catch {
                          setTrackingMessage("err");
                        } finally {
                          setTrackingSaving(false);
                        }
                      }}
                      className="rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                      style={{ background: "var(--red)" }}
                    >
                      {trackingSaving ? "Zapisywanie…" : "Zapisz"}
                    </button>
                  </div>
                  <div>
                    <select
                      value={courierInput}
                      onChange={(e) => { setCourierInput(e.target.value); setTrackingMessage(null); }}
                      className="w-full rounded-xl border bg-[var(--island)] px-4 py-3 text-sm"
                      style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                    >
                      <option value="">— Wybierz przewoźnika (opcjonalnie) —</option>
                      <option value="inpost">InPost</option>
                      <option value="dpd">DPD</option>
                      <option value="dhl">DHL</option>
                      <option value="gls">GLS</option>
                      <option value="fedex">FedEx</option>
                      <option value="ups">UPS</option>
                    </select>
                  </div>
                </div>
                {trackingMessage === "ok" && <p className="mt-2 text-xs font-medium" style={{ color: "var(--green)" }}>✓ Zapisano pomyślnie.</p>}
                {trackingMessage === "err" && <p className="mt-2 text-xs font-medium" style={{ color: "var(--red)" }}>Nie udało się zapisać. Spróbuj ponownie.</p>}
              </div>
            )}

            {/* Courier info for outbound delivery */}
            {(repair.serviceTrackingNumber || repair.serviceCourier) && (
              <div className="border-t p-5" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Wysyłka do Ciebie
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--ink2)" }}>
                  Naprawa jest gotowa! Nasze dane do śledzenia przesyłki:
                </p>
                <div className="mt-4 space-y-3 rounded-xl bg-[rgba(34,197,94,0.08)] p-4" style={{ border: "1px solid rgba(34,197,94,0.2)" }}>
                  {repair.serviceTrackingNumber && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Numer listu przewozowego
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold" style={{ color: "var(--ink)" }}>
                        {repair.serviceTrackingNumber}
                      </p>
                    </div>
                  )}
                  {repair.serviceCourier && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Przewoźnik
                      </p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
                        {repair.serviceCourier === "inpost" && "InPost"}
                        {repair.serviceCourier === "dpd" && "DPD"}
                        {repair.serviceCourier === "dhl" && "DHL"}
                        {repair.serviceCourier === "gls" && "GLS"}
                        {repair.serviceCourier === "fedex" && "FedEx"}
                        {repair.serviceCourier === "ups" && "UPS"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Wycena ── */}
          {repair.clientVisibleQuote ? (
            <div
              className="panel-card overflow-hidden"
              style={{
                borderColor: repair.status === "wait_decision" ? "rgba(245,158,11,0.5)" : "rgba(34,197,94,0.35)",
                boxShadow:
                  repair.status === "wait_decision"
                    ? "0 0 0 1px rgba(245,158,11,0.1)"
                    : "0 0 0 1px rgba(34,197,94,0.1)",
              }}
            >
              <div className="panel-card-header flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: "var(--green-l)", border: "1px solid var(--green-b)" }}
                >
                  📋
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold" style={{ color: "var(--heading)", fontFamily: "var(--font-unbounded)" }}>
                    Twoja wycena
                  </h2>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatQuoteNumberLabel(repair.clientVisibleQuote.version)} · {repair.clientVisibleQuote.status_display}
                    {repair.clientVisibleQuote.sent_at ? ` · wysłano ${formatDateTime(repair.clientVisibleQuote.sent_at)}` : ""}
                  </p>
                </div>
                {repair.clientVisibleQuote.valid_until && (
                  <div
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
                    style={{ background: "var(--island3)", color: "var(--ink2)", border: "1px solid var(--border)" }}
                  >
                    Ważna do {formatDate(repair.clientVisibleQuote.valid_until)}
                  </div>
                )}
              </div>

              <div className="space-y-5 p-6">
                <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--border2)", background: "var(--island3)" }}>
                  <table className="w-full min-w-[560px] text-left text-[14px]">
                    <thead>
                      <tr className="border-b text-[11px] uppercase tracking-[0.08em]" style={{ borderColor: "var(--border2)", color: "var(--muted)" }}>
                        <th className="px-4 py-4 font-semibold">Pozycja</th>
                        <th className="px-4 py-4 font-semibold">Część</th>
                        <th className="px-4 py-4 text-center font-semibold">Ilość</th>
                        <th className="px-4 py-4 text-right font-semibold">Części</th>
                        <th className="px-4 py-4 text-right font-semibold">Robocizna</th>
                        <th className="px-4 py-4 text-right font-semibold">Razem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repair.clientVisibleQuote.items.map((line) => (
                        <tr key={String(line.id)} className="border-t" style={{ borderColor: "var(--border)" }}>
                          <td className="px-4 py-4 text-[14px] font-medium leading-snug" style={{ color: "var(--heading)" }}>
                            {line.description || line.item_type_display || "—"}
                          </td>
                          <td className="px-4 py-4 text-xs leading-snug" style={{ color: "var(--ink2)" }}>
                            {line.part_origin_display ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-center font-mono text-[14px] tabular-nums" style={{ color: "var(--ink)" }}>
                            {String(line.quantity)}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-[14px] tabular-nums font-semibold" style={{ color: "var(--ink)" }}>
                            {formatPrice(typeof line.parts_price === "number" ? line.parts_price : parseFloat(String(line.parts_price ?? 0)))}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-[14px] tabular-nums font-semibold" style={{ color: "var(--ink)" }}>
                            {formatPrice(typeof line.labour_price === "number" ? line.labour_price : parseFloat(String(line.labour_price ?? 0)))}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-[15px] tabular-nums font-bold" style={{ color: "var(--heading)" }}>
                            {formatPrice(typeof line.total === "number" ? line.total : parseFloat(String(line.total ?? 0)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between rounded-2xl p-5" style={{ background: "var(--island3)", border: "1px solid var(--border)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--ink2)" }}>
                    Łączna kwota brutto
                  </span>
                  <span className="font-mono text-3xl font-bold tabular-nums" style={{ color: "var(--heading)" }}>
                    {formatPrice(
                      typeof repair.clientVisibleQuote.total_amount === "number"
                        ? repair.clientVisibleQuote.total_amount
                        : parseFloat(String(repair.clientVisibleQuote.total_amount ?? 0))
                    )}
                  </span>
                </div>

                {repair.status === "wait_decision" && (
                  <div className="space-y-3 rounded-2xl border p-5" style={{ borderColor: "var(--amber-b)", background: "var(--amber-l)" }}>
                    <div>
                      <p className="text-base font-bold" style={{ color: "var(--ink)" }}>
                        Czy akceptujesz tę wycenę?
                      </p>
                      <p className="mt-1 text-sm" style={{ color: "var(--ink2)" }}>
                        Zaakceptuj, aby technik przystąpił do naprawy. Możesz też odrzucić — skontaktujemy się z Tobą.
                      </p>
                    </div>
                    {quoteRespondError && (
                      <p className="text-xs font-medium" style={{ color: "var(--red)" }}>
                        {quoteRespondError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={quoteRespondBusy}
                        onClick={async () => {
                          if (!token) return;
                          setQuoteRespondError(null);
                          setQuoteRespondBusy(true);
                          try {
                            const data = await api.post<ApiRepairDetail>(`/repairs/${repairId}/quote-respond/`, { action: "accept" }, token);
                            setRepair(apiRepairDetailToPanel(data));
                          } catch (e) {
                            setQuoteRespondError(e instanceof Error ? e.message : "Nie udało się zapisać decyzji.");
                          } finally {
                            setQuoteRespondBusy(false);
                          }
                        }}
                        className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                        style={{ background: "var(--green)" }}
                      >
                        ✓ Akceptuję wycenę
                      </button>
                      <button
                        type="button"
                        disabled={quoteRespondBusy}
                        onClick={async () => {
                          if (!token) return;
                          if (!window.confirm("Odrzucić tę wycenę? Serwis skontaktuje się z Tobą w razie pytań.")) return;
                          setQuoteRespondError(null);
                          setQuoteRespondBusy(true);
                          try {
                            const data = await api.post<ApiRepairDetail>(`/repairs/${repairId}/quote-respond/`, { action: "reject" }, token);
                            setRepair(apiRepairDetailToPanel(data));
                          } catch (e) {
                            setQuoteRespondError(e instanceof Error ? e.message : "Nie udało się zapisać decyzji.");
                          } finally {
                            setQuoteRespondBusy(false);
                          }
                        }}
                        className="rounded-xl border px-5 py-3 text-sm font-semibold transition hover:opacity-80 disabled:opacity-60"
                        style={{ borderColor: "var(--border)", color: "var(--ink)", background: "var(--island)" }}
                      >
                        Odrzucam
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* ── Historia statusów ── */}
          <div className="panel-card">
            <div className="panel-card-header flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: "var(--amber-l)", border: "1px solid var(--amber-b)" }}>
                ⏱️
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--heading)", fontFamily: "var(--font-unbounded)" }}>
                  Historia statusów
                </h2>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Chronologiczny przebieg naprawy</p>
              </div>
            </div>
            <div className="p-6">
              {timelineLoading && statusTimeline.length === 0 ? (
                <p className="py-4 text-center text-base" style={{ color: "var(--muted)" }}>Ładowanie historii…</p>
              ) : timelineError ? (
                <p className="py-4 text-sm" style={{ color: "var(--red)" }}>{timelineError}</p>
              ) : statusTimeline.length === 0 ? (
                <p className="py-4 text-center text-base" style={{ color: "var(--ink2)" }}>Brak zapisanych zmian statusu.</p>
              ) : (
                <div>
                  {statusTimeline.map((ev, i) => {
                    const isLast = i === statusTimeline.length - 1;
                    const isDoneStep = !isLast;
                    return (
                      <div key={`st-${ev.id}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                            style={{
                              background: isDoneStep ? "var(--green)" : "var(--red)",
                              color: "#fff",
                            }}
                          >
                            {isDoneStep ? "✓" : "●"}
                          </div>
                          {!isLast && (
                            <div className="my-1 w-0.5 flex-1" style={{ background: "var(--border)", minHeight: 20 }} />
                          )}
                        </div>
                        <div className={`min-w-0 flex-1 ${!isLast ? "pb-4" : "pb-0"}`}>
                          <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                            {labelForStatusChange(ev)}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                            <time dateTime={ev.created_at}>{formatDateTime(ev.created_at)}</time>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Wiadomości z serwisem ── */}
          <div className="panel-card">
            <div className="panel-card-header flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: "var(--blue-l)", border: "1px solid var(--blue-b)" }}>
                💬
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--heading)", fontFamily: "var(--font-unbounded)" }}>
                  Wiadomości z serwisem
                </h2>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Bezpośrednia komunikacja z technikiem</p>
              </div>
            </div>
            <div className="p-6">
              {/* Thread */}
              {threadLoading ? (
                <p className="py-6 text-center text-base" style={{ color: "var(--muted)" }}>Ładowanie wiadomości…</p>
              ) : threadError ? (
                <p className="py-4 text-sm" style={{ color: "var(--red)" }}>{threadError}</p>
              ) : (
                <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                  {thread.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ background: "var(--island3)" }}>
                        💬
                      </div>
                      <p className="text-base font-semibold" style={{ color: "var(--ink)" }}>Brak wiadomości</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--ink2)" }}>Napisz do nas lub zadzwoń — chętnie pomożemy.</p>
                    </div>
                  ) : (
                    thread.map((item) => {
                      if (item.kind === "note") {
                        const fromClient = item.thread_origin === "client" || item.thread_origin === "email_inbound";
                        return (
                          <div key={`note-${item.id}`} className={`flex ${fromClient ? "justify-end" : "justify-start"}`}>
                            <div
                              className="max-w-[88%] rounded-2xl px-4 py-3.5 text-[14px]"
                              style={{
                                background: fromClient ? "var(--red)" : "var(--island3)",
                                color: fromClient ? "#fff" : "var(--ink)",
                                borderBottomRightRadius: fromClient ? 4 : undefined,
                                borderBottomLeftRadius: !fromClient ? 4 : undefined,
                                border: fromClient ? "none" : "1px solid var(--border)",
                              }}
                            >
                              <div className="mb-1.5 flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold" style={{ opacity: 0.7 }}>
                                  {item.author_name || (fromClient ? "Ty" : "Serwis")}
                                </span>
                                <span className="text-[11px]" style={{ opacity: 0.6 }}>
                                  {item.created_at ? formatDateTime(item.created_at) : "—"}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{item.note}</p>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={`email-${item.id}`} className="flex justify-start">
                          <div
                            className="max-w-[88%] rounded-2xl border border-dashed px-4 py-3.5 text-[14px]"
                            style={{ borderColor: "var(--border)", background: "var(--island2)", borderBottomLeftRadius: 4 }}
                          >
                            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                              📧 E-mail wychodzący
                            </div>
                            <div className="mb-1 text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                              {item.subject || "—"}
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--ink2)" }}>
                              {item.body_snapshot}
                            </p>
                            <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                              {item.sent_by_name ? `${item.sent_by_name} · ` : ""}
                              {item.sent_at ? formatDateTime(item.sent_at) : "—"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Ref hint */}
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3" style={{ background: "var(--island3)", border: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--muted)" }}>Numer zlecenia (ref):</span>
                <code className="font-mono text-xs font-bold" style={{ color: "var(--red)", fontFamily: "'Courier New', monospace" }}>{repair.repairNumber}</code>
                <span className="text-xs" style={{ color: "var(--muted)" }}>— podaj go w korespondencji e-mail</span>
              </div>

              {/* Compose */}
              <div className="mt-4">
                <textarea
                  value={msgDraft}
                  onChange={(e) => { setMsgDraft(e.target.value); setMsgFeedback(null); }}
                  rows={4}
                  maxLength={5000}
                  placeholder="Napisz wiadomość do serwisu…"
                  className="w-full resize-y rounded-xl border bg-[var(--island)] px-4 py-3.5 text-sm"
                  style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={msgSending || !msgDraft.trim() || !token}
                    onClick={async () => {
                      if (!token || !msgDraft.trim()) return;
                      setMsgSending(true);
                      setMsgFeedback(null);
                      try {
                        await api.post(`/repairs/${repairId}/messages/`, { note: msgDraft.trim() }, token);
                        setMsgDraft("");
                        setMsgFeedback("ok");
                        const data = await api.get<RepairThreadItem[]>(`/repairs/${repairId}/messages/`, token);
                        setThread(Array.isArray(data) ? data : []);
                      } catch {
                        setMsgFeedback("err");
                      } finally {
                        setMsgSending(false);
                      }
                    }}
                    className="rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-60 transition hover:opacity-90"
                    style={{ background: "var(--red)" }}
                  >
                    {msgSending ? "Wysyłanie…" : "Wyślij wiadomość"}
                  </button>
                  {msgFeedback === "ok" && <span className="text-sm font-semibold" style={{ color: "var(--green)" }}>✓ Wysłano pomyślnie</span>}
                  {msgFeedback === "err" && <span className="text-sm font-semibold" style={{ color: "var(--red)" }}>Nie udało się wysłać</span>}
                </div>
              </div>

              {/* Quick contact */}
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="tel:883200151"
                  className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:opacity-80"
                  style={{ background: "var(--island3)", borderColor: "var(--border)", color: "var(--ink)" }}
                >
                  📞 <span>883 200 151</span>
                </a>
                <a
                  href="mailto:sklep@pro-kom.eu"
                  className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:opacity-80"
                  style={{ background: "var(--island3)", borderColor: "var(--border)", color: "var(--ink)" }}
                >
                  ✉️ <span>sklep@pro-kom.eu</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* ══ RIGHT SIDEBAR ══ */}
        <aside className="space-y-6">

          {/* ── Kosztorys ── */}
          <div className="panel-card overflow-hidden">
            <div className="panel-card-header flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{ background: "var(--red-l)", border: "1px solid var(--red-border)", color: "var(--red)" }}
              >
                zł
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--heading)", fontFamily: "var(--font-unbounded)" }}>
                  Kosztorys
                </h2>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Aktualny stan rozliczeń</p>
              </div>
            </div>
            <div className="p-6">
              {repair.priceItems.length > 0 ? (
                <>
                  <div>
                    {repair.priceItems.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4 py-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <span className="text-[14px]" style={{ color: "var(--ink2)" }}>{item.name}</span>
                        <span className="font-semibold font-mono text-[14px] tabular-nums" style={{ color: "var(--ink)" }}>{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl p-4" style={{ background: "var(--island3)", border: "1px solid var(--border)" }}>
                    <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>Łącznie brutto</span>
                    <span className="font-bold font-mono text-2xl tabular-nums" style={{ color: "var(--heading)" }}>{formatTotalPrice(repair.priceItems)}</span>
                  </div>
                </>
              ) : (
                <p className="py-2 text-center text-base" style={{ color: "var(--ink2)" }}>Brak pozycji kosztorysu</p>
              )}
              {repair.totalPrice === null && (
                <div className="mt-4 rounded-2xl border p-4 text-sm leading-relaxed" style={{ background: "var(--island3)", color: "var(--ink2)", borderColor: "var(--border)" }}>
                  💡 Cena zostanie ustalona po diagnostyce. Wszelkie zmiany uzgodnimy z Tobą przed naprawą.
                </div>
              )}
            </div>
          </div>

          {/* ── Informacje serwisowe ── */}
          <div className="panel-card min-h-[560px]">
            <div className="panel-card-header flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: "var(--red-l)", border: "1px solid var(--red-border)", color: "var(--red)" }}>
                ⚙️
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                  Serwis i kontakt
                </p>
                <h2 className="mt-1 text-sm font-bold" style={{ color: "var(--heading)", fontFamily: "var(--font-unbounded)" }}>
                  Informacje serwisowe
                </h2>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  Najważniejsze dane kontaktowe i czas naprawy w jednym miejscu.
                </p>
              </div>
            </div>

            <div className="flex min-h-[480px] flex-col gap-5 p-6">
              <div className="rounded-2xl border p-4" style={{ background: "var(--island2)", borderColor: "var(--border)" }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                      Numer zlecenia
                    </p>
                    <p className="mt-1 font-mono text-[15px] font-bold tracking-wide" style={{ color: "var(--heading)" }}>
                      {repair.repairNumber}
                    </p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: "var(--border)", color: "var(--ink2)" }}>
                    Konto klienta
                  </span>
                </div>
              </div>

              <div className="grid auto-rows-fr gap-4 md:grid-cols-2">
                <div className="h-full min-h-[112px] rounded-2xl border p-4 md:p-5" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                    Serwisant
                  </p>
                  <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--heading)" }}>
                    {typeof repair.serviceInfo.technicianName === "string" ? repair.serviceInfo.technicianName : "Do przypisania"}
                  </p>
                </div>

                <div className="h-full min-h-[112px] rounded-2xl border p-4 md:p-5" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                    Czas naprawy
                  </p>
                  <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--amber)" }}>
                    {repair.serviceInfo.estimatedTime ?? "Do ustalenia"}
                  </p>
                </div>

                <div className="h-full min-h-[112px] rounded-2xl border p-4 md:col-span-2 md:p-5" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                    Kontakt
                  </p>
                  <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--heading)" }}>
                    883 200 151
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--ink2)" }}>
                    sklep@pro-kom.eu
                  </p>
                </div>
              </div>

              {repair.serviceInfo.notes && (
                <div className="rounded-2xl border p-4 text-[13px] leading-relaxed" style={{ background: "var(--island2)", color: "var(--ink2)", borderColor: "var(--border)" }}>
                  {repair.serviceInfo.notes}
                </div>
              )}

              <div className="mt-auto flex items-start gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                <span className="mt-0.5 text-base">📍</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--heading)" }}>
                    ul. Orkana 16B, 34-700 Rabka-Zdrój
                  </p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink2)" }}>
                    Pon–Pt 9:00–17:00 · Sob 9:00–14:00
                  </p>
                </div>
              </div>
            </div>
          </div>


        </aside>
      </div>
    </div>
  );
}
