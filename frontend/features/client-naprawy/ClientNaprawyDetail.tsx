"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/panel/StatusBadge";
import { apiRepairDetailToPanel, type ApiRepairDetail } from "@/lib/panel-api";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatPrice, formatTotalPrice, getDeviceEmoji } from "@/types/panel";
import type { Repair } from "@/types/panel";
import type { RepairThreadItem } from "@/types/repairs";

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
      <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>{label}</p>
      <p
        className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--ink)", fontFamily: mono ? "'Courier New', monospace" : undefined }}
      >
        {tag ? (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs" style={{ background: "var(--green-l)", color: "var(--green)", border: "1px solid var(--green-b)" }}>
            ✓ {value}
          </span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function InfoRow({ label, value, color, mono }: { label: string; value: string; color?: "amber" | "green"; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span
        className={`shrink-0 font-medium ${mono ? "font-mono" : ""}`}
        style={{ color: color === "amber" ? "var(--amber)" : color === "green" ? "var(--green)" : "var(--ink)", fontFamily: mono ? "'Courier New', monospace" : undefined }}
      >
        {value}
      </span>
    </div>
  );
}

export function ClientNaprawyDetail({ repairId }: { repairId: string }) {
  const { token } = useAuth();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState<"ok" | "err" | null>(null);
  const [thread, setThread] = useState<RepairThreadItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [msgDraft, setMsgDraft] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState<"ok" | "err" | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setNotFound(false);
    setError(null);
    api
      .get<ApiRepairDetail>(`/repairs/${repairId}/`, token)
      .then((data) => {
        const r = apiRepairDetailToPanel(data);
        setRepair(r);
        setTrackingInput(r.clientTrackingNumber ?? "");
      })
      .catch((e) => {
        if (e instanceof Error && e.message.includes("404")) setNotFound(true);
        else setError(e instanceof Error ? e.message : "Błąd ładowania.");
      })
      .finally(() => setLoading(false));
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
    return () => {
      cancelled = true;
    };
  }, [token, repairId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="skeleton mb-8 h-12 w-64 rounded" />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
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
          <p className="cp-heading font-semibold">Nie znaleziono naprawy</p>
          <p className="mt-2 text-sm" style={{ color: "var(--ink2)" }}>
            Nie znaleziono naprawy o podanym numerze.
          </p>
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
          <p className="cp-heading font-semibold">Błąd</p>
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero row */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/client/naprawy" className="text-sm font-medium transition hover:text-[var(--heading)]" style={{ color: "var(--ink2)" }}>
            ← Wróć do listy napraw
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ background: "var(--island3)" }}
            >
              {getDeviceEmoji(repair.deviceCategory)}
            </div>
            <div>
              <p className="cp-heading font-mono text-lg font-bold" style={{ fontFamily: "'Courier New', monospace" }}>
                {repair.repairNumber}
              </p>
              <p className="text-sm" style={{ color: "var(--ink2)" }}>
                {repair.deviceModel} – {repair.problemDescription ? `${repair.problemDescription.slice(0, 40)}…` : "Naprawa"} – Przyjęto {formatDate(repair.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <StatusBadge status={repair.status} large />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Szczegóły zgłoszenia */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "var(--amber-l)", border: "1px solid var(--amber-b)" }}>
                🔧
              </span>
              <div>
                <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Szczegóły zgłoszenia
                </h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>Dane podane przez aplikację</p>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <DetailItem label="Kategoria" value={repair.deviceCategory} />
              <DetailItem label="Urządzenie" value={repair.deviceModel} />
              <DetailItem label="Opis problemu" value={repair.problemDescription} full />
              <DetailItem label="Data przyjęcia" value={formatDate(repair.createdAt)} />
              {repair.imei && <DetailItem label="Numer IMEI" value={repair.imei} mono />}
              <DetailItem label="Dostawa urządzenia" value={deliveryLabel} />
              <DetailItem label="Odbiór urządzenia" value={pickupLabel} />
              {repair.hammerGlass != null && (
                <DetailItem
                  label="Hammer Glass"
                  value={repair.hammerGlass === "tak" ? "Tak – interesuje mnie folia" : "Nie, dziękuję"}
                  tag
                />
              )}
              <DetailItem
                label="Akcesoria"
                value={repair.accessoryWishlist ?? (repair.wantsAccessories ? "Proszę doradzić przy odbiorze" : "—")}
                tag={!!(repair.wantsAccessories || repair.accessoryWishlist)}
              />
              {repair.clientNotes && <DetailItem label="Dodatkowe uwagi" value={repair.clientNotes} full />}
              {repair.deviceTurnsOn != null && (
                <DetailItem label="Czy urządzenie się włącza" value={repair.deviceTurnsOn ? "Tak" : "Nie"} />
              )}
              {repair.visualConditionDescription && <DetailItem label="Opis stanu wizualnego" value={repair.visualConditionDescription} full />}
              {repair.deliveryMethod === "kurier" && (
                <div className="col-span-full mt-4 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                  <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Numer listu przewozowego (opcjonalnie)</p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--ink2)" }}>Jeśli wysłałeś paczkę do nas kurierem, możesz podać numer śledzenia.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      className="min-w-[200px] flex-1 rounded-lg border bg-[var(--island)] px-3 py-2 text-sm font-mono"
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
                          const data = await api.post<ApiRepairDetail>(`/repairs/${repairId}/set-inbound-tracking/`, { tracking_number: trackingInput.trim() }, token);
                          setRepair(apiRepairDetailToPanel(data));
                          setTrackingMessage("ok");
                        } catch {
                          setTrackingMessage("err");
                        } finally {
                          setTrackingSaving(false);
                        }
                      }}
                      className="rounded-lg border-0 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
                      style={{ background: "var(--red)" }}
                    >
                      {trackingSaving ? "Zapisywanie…" : "Zapisz"}
                    </button>
                  </div>
                  {trackingMessage === "ok" && <p className="mt-2 text-xs font-medium" style={{ color: "var(--green)" }}>Zapisano.</p>}
                  {trackingMessage === "err" && <p className="mt-2 text-xs font-medium" style={{ color: "var(--red)" }}>Nie udało się zapisać. Spróbuj ponownie.</p>}
                </div>
              )}
            </div>
          </div>

          {/* Postęp naprawy */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "var(--amber-l)", border: "1px solid var(--amber-b)" }}>
                ⏱️
              </span>
              <div>
                <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Postęp naprawy
                </h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>Aktualny status realizacji</p>
              </div>
            </div>
            <div className="p-5">
              {(repair.timeline?.length ? repair.timeline : []).map((step, i) => (
                <div
                  key={step.key}
                  className={`tl-step relative flex gap-4 pb-6 last:pb-0 ${step.status}`}
                  style={{
                    borderLeft: i < (repair.timeline?.length ?? 0) - 1 ? "2px solid var(--border)" : "none",
                    marginLeft: 7,
                    paddingLeft: 20,
                  }}
                >
                  <div
                    className={`tl-node absolute left-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      step.status === "done" ? "bg-[var(--green)] text-white" : step.status === "active" ? "bg-[var(--amber)] text-white ring-4 ring-[var(--amber)]/30" : "bg-[var(--island4)]"
                    }`}
                    style={step.status === "active" ? { animation: "ringPulseAmber 1.5s ease infinite" } : undefined}
                  >
                    {step.status === "done" ? "✓" : step.status === "active" ? "●" : ""}
                  </div>
                  <div className="tl-body min-w-0 flex-1">
                    <p className="cp-heading font-medium">{step.label}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                      {step.date ? formatDateTime(step.date) : "Oczekuje"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wiadomości z serwisem */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "var(--blue-l)", border: "1px solid var(--blue-b)" }}>
                💬
              </span>
              <div>
                <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Wiadomości z serwisem
                </h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>Historia komunikacji</p>
              </div>
            </div>
            <div className="p-5">
              {threadLoading ? (
                <p className="py-4 text-center text-sm" style={{ color: "var(--muted)" }}>Ładowanie wiadomości…</p>
              ) : threadError ? (
                <p className="py-4 text-center text-sm" style={{ color: "var(--red)" }}>{threadError}</p>
              ) : (
                <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                  {thread.length === 0 ? (
                    <p className="py-4 text-center text-sm" style={{ color: "var(--ink2)" }}>Brak wiadomości w wątku — napisz poniżej lub skontaktuj się telefonicznie.</p>
                  ) : (
                    thread.map((item) => {
                      if (item.kind === "note") {
                        const fromClient = item.thread_origin === "client" || item.thread_origin === "email_inbound";
                        return (
                          <div
                            key={`note-${item.id}`}
                            className="rounded-xl border p-3 text-sm"
                            style={{
                              borderColor: "var(--border)",
                              background: fromClient ? "var(--island3)" : "var(--island2)",
                            }}
                          >
                            <div className="flex flex-wrap justify-between gap-2 text-[11px]" style={{ color: "var(--muted)" }}>
                              <span>{item.author_name || (fromClient ? "Ty" : "Serwis")}</span>
                              <span>{item.created_at ? formatDateTime(item.created_at) : "—"}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap" style={{ color: "var(--ink)" }}>{item.note}</p>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`email-${item.id}`}
                          className="rounded-xl border border-dashed p-3 text-sm"
                          style={{ borderColor: "var(--border)", background: "var(--island2)" }}
                        >
                          <div className="text-[11px] font-semibold uppercase" style={{ color: "var(--muted)" }}>E-mail wychodzący</div>
                          <div className="mt-1 font-medium" style={{ color: "var(--ink)" }}>{item.subject || "—"}</div>
                          <p className="mt-2 whitespace-pre-wrap text-[13px]" style={{ color: "var(--ink2)" }}>{item.body_snapshot}</p>
                          <div className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
                            {item.sent_by_name ? `${item.sent_by_name} · ` : ""}{item.sent_at ? formatDateTime(item.sent_at) : "—"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              <p className="mt-4 text-sm" style={{ color: "var(--ink2)" }}>
                Numer zlecenia (ref):{" "}
                <code className="font-mono font-semibold" style={{ fontFamily: "'Courier New', monospace", color: "var(--red)" }}>{repair.repairNumber}</code>
                {" "}— podaj go w korespondencji e-mail.
              </p>
              <div className="mt-3">
                <textarea
                  value={msgDraft}
                  onChange={(e) => {
                    setMsgDraft(e.target.value);
                    setMsgFeedback(null);
                  }}
                  rows={3}
                  maxLength={5000}
                  placeholder="Napisz wiadomość do serwisu…"
                  className="w-full resize-y rounded-lg border bg-[var(--island)] px-3 py-2 text-sm"
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
                    className="rounded-lg border-0 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
                    style={{ background: "var(--red)" }}
                  >
                    {msgSending ? "Wysyłanie…" : "Wyślij"}
                  </button>
                  {msgFeedback === "ok" ? <span className="text-xs font-medium" style={{ color: "var(--green)" }}>Wysłano.</span> : null}
                  {msgFeedback === "err" ? <span className="text-xs font-medium" style={{ color: "var(--red)" }}>Nie udało się wysłać.</span> : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="tel:883200151"
                  className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:border-[var(--red-border)] hover:bg-[var(--red-l)]"
                  style={{ background: "var(--island3)", borderColor: "var(--border)", color: "var(--red)" }}
                >
                  <span aria-hidden>📞</span> Zadzwoń
                </a>
                <a
                  href="mailto:sklep@pro-kom.eu"
                  className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:border-[var(--red-border)] hover:bg-[var(--red-l)]"
                  style={{ background: "var(--island3)", borderColor: "var(--border)", color: "var(--red)" }}
                >
                  <span aria-hidden>✉️</span> E-mail
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          {/* Kosztorys */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                style={{ background: "var(--red-l)", border: "1px solid var(--red-border)", color: "var(--red)" }}
              >
                $
              </span>
              <div>
                <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Kosztorys
                </h2>
              </div>
            </div>
            <div className="p-5">
              {repair.priceItems.map((item) => (
                <div key={item.name} className="flex justify-between gap-4 py-2 text-sm">
                  <span style={{ color: "var(--ink)" }}>{item.name}</span>
                  <span className="cp-heading">{formatPrice(item.price)}</span>
                </div>
              ))}
              <div className="cp-heading mt-3 border-t border-[var(--border)] pt-3 font-medium">
                Łącznie: {formatTotalPrice(repair.priceItems)} brutto
              </div>
              {repair.totalPrice === null && (
                <p className="mt-3 rounded-lg bg-[var(--island3)] p-3 text-xs" style={{ color: "var(--ink2)" }}>
                  Ostateczna cena zostanie ustalona po zakończeniu diagnostyki. Wszelkie zmiany będą uzgodnione z Tobą przed przystąpieniem do naprawy.
                </p>
              )}
            </div>
          </div>

          {/* Informacje serwisowe */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "var(--island4)", border: "1px solid var(--border)" }}>
                ⚙️
              </span>
              <div>
                <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Informacje serwisowe
                </h2>
              </div>
            </div>
            <div className="p-5">
              <InfoRow label="Numer zlecenia" value={repair.repairNumber} mono />
              <InfoRow label="Przyjął" value={typeof repair.serviceInfo.technicianName === "string" ? repair.serviceInfo.technicianName : "Do przypisania"} />
              <InfoRow label="Szacowany czas" value={repair.serviceInfo.estimatedTime ?? "Do ustalenia"} color="amber" />
              <InfoRow label="Gwarancja" value={`${repair.serviceInfo.warrantyMonths} miesięcy`} color="green" />
              {repair.serviceInfo.notes && (
                <div className="mt-3 rounded-lg bg-[var(--island3)] p-3 text-xs" style={{ color: "var(--ink2)" }}>
                  {repair.serviceInfo.notes}
                </div>
              )}
              <div className="mt-4 border-t border-[var(--border)] pt-4 text-xs" style={{ color: "var(--muted)" }}>
                <p>ul. Orkana 16B, 34-700 Rabka-Zdrój</p>
                <p className="mt-1">Pon–Pt 9:00–17:00 · Sob 9:00–14:00</p>
              </div>
            </div>
          </div>

          {/* Akcje */}
          <div className="panel-card">
            <div className="panel-card-header flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "var(--red-l)", border: "1px solid var(--red-border)" }}>
                ⚡
              </span>
              <div>
                <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                  Akcje
                </h2>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-5">
              {(() => {
                const canDownloadConfirmation =
                  repair.status === "in_progress" || repair.status === "ready" || repair.status === "done";
                return (
                  <>
                    <button
                      type="button"
                      disabled={!canDownloadConfirmation}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90"
                      style={{
                        background: canDownloadConfirmation ? "var(--red)" : "var(--island3)",
                        color: canDownloadConfirmation ? "#fff" : "var(--muted)",
                      }}
                    >
                      <span aria-hidden>📄</span> Pobierz potwierdzenie
                    </button>
                    {!canDownloadConfirmation && (
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Dostępne po zaakceptowaniu wyceny i rozpoczęciu naprawy.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
