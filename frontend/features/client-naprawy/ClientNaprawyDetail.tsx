"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { apiRepairDetailToPanel, type ApiRepairDetail } from "@/lib/panel-api";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatQuoteNumberLabel } from "@/lib/quoteLabels";
import { repairStatusPublicLabel } from "@/lib/repairStatusPublic";
import { formatPrice, formatTotalPrice } from "@/types/panel";
import type { Repair } from "@/types/panel";
import type { RepairThreadItem, RepairTimelineEvent } from "@/types/repairs";
import { line } from "@/config/prokom";
import { IconArrow, IconCheck, IconPhoneCall, IconSearch, IconWrench } from "@/components/tech/icons";
import { IconAlert, IconMail, IconShield } from "@/components/tech/account/account-icons";
import { AuthAlert } from "@/components/tech/account/AuthParts";
import { DeviceBadge, EmptyState, ErrorCard, Panel, Skel, StatusPill } from "@/components/tech/account/AccountUi";
import { ServiceContact } from "@/components/tech/account/ServiceContact";

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
    <div className={`t-ck-detail${full ? " t-ck-detail--full" : ""}`}>
      <dt>{label}</dt>
      <dd className={mono ? "t-ck-ref" : undefined}>
        {tag ? (
          <span className="t-ck-pill t-ck-pill--ready t-ck-pill--tag">
            <IconCheck size={13} strokeWidth={3} />
            {value}
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

const REPAIR_STEPS = [
  { id: "received", label: "Przyjęte" },
  { id: "diagnostic", label: "Diagnostyka" },
  { id: "quote", label: "Wycena" },
  { id: "repair", label: "Naprawa" },
  { id: "ready", label: "Do odbioru" },
  { id: "done", label: "Wydane" },
];

const COURIERS: Record<string, string> = { inpost: "InPost", dpd: "DPD", dhl: "DHL", gls: "GLS", fedex: "FedEx", ups: "UPS" };

function toNumber(v: unknown): number {
  return typeof v === "number" ? v : parseFloat(String(v ?? 0));
}

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
      <div className="t-ck-page" aria-busy="true">
        <Skel w={180} h={14} />
        <div className="t-ck-card t-ck-hero t-ck-hero--skel">
          <Skel w={72} h={72} r={20} />
          <div className="t-ck-stack">
            <Skel w={140} h={12} />
            <Skel w="60%" h={28} />
            <Skel w="40%" h={14} />
          </div>
        </div>
        <div className="t-ck-detailgrid">
          <div className="t-ck-stack">
            <Skel h={260} r={28} />
            <Skel h={320} r={28} />
          </div>
          <div className="t-ck-stack">
            <Skel h={200} r={28} />
            <Skel h={240} r={28} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="t-ck-page t-ck-page--narrow">
        <div className="t-ck-card t-ck-error">
          <p className="t-ck-error__title">Nie znaleziono naprawy</p>
          <p className="t-ck-error__text">Nie znaleziono naprawy o podanym numerze.</p>
          <Link href="/client/naprawy" className="t-pbtn t-pbtn--outline t-pbtn--m">
            Wróć do listy napraw
          </Link>
        </div>
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="t-ck-page t-ck-page--narrow">
        <ErrorCard title="Błąd" message={error ?? "Nie udało się załadować szczegółów."} back={{ href: "/client/naprawy", label: "Wróć do listy napraw" }} />
      </div>
    );
  }

  const deliveryLabel = repair.deliveryMethod === "osobiscie" ? "Osobiście w serwisie" : "Wysyłka kurierem do serwisu";
  const pickupLabel = repair.pickupMethod === "osobiscie" ? "Odbiór osobisty" : "Zwrot kurierem do domu";
  const currentStep = getStepIndex(repair.status);
  const nextAction = getNextAction(repair.status);
  const deviceTitle = [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel;
  const actionIcon = {
    amber: <IconAlert size={20} />,
    green: <IconCheck size={20} strokeWidth={2.6} />,
    blue: <IconWrench size={19} strokeWidth={2.2} />,
    default: <IconSearch size={19} />,
  }[nextAction.color];
  const quote = repair.clientVisibleQuote;

  return (
    <div className="t-ck-page">
      <Link href="/client/naprawy" className="t-ck-back t-ck-back--top">
        <IconArrow size={14} className="t-ck-back__ico" />
        Wróć do listy napraw
      </Link>

      {/* Hero: device, number, status and progress */}
      <section className="t-ck-card t-ck-hero">
        <div className="t-ck-hero__top">
          <DeviceBadge category={repair.deviceCategory} size="l" />
          <div className="t-ck-hero__text">
            <p className="t-ck-ref">{repair.repairNumber}</p>
            <h1 className="t-ck-hero__title">{deviceTitle}</h1>
            <p className="t-ck-hero__meta">
              Przyjęto {formatDate(repair.createdAt)}
              {repair.problemDescription ? ` · ${repair.problemDescription.slice(0, 50)}…` : ""}
            </p>
          </div>
          <StatusPill status={repair.status} label={repair.statusDisplay} large />
        </div>
        <ol className="t-ck-steps" aria-label="Etapy naprawy">
          {REPAIR_STEPS.map((step, i) => {
            const state = i < currentStep ? "done" : i === currentStep ? "now" : "next";
            return (
              <li key={step.id} className={`is-${state}`} aria-current={state === "now" ? "step" : undefined}>
                <span className="t-ck-steps__bar" aria-hidden="true" />
                <span className="t-ck-steps__lbl">
                  <span className="t-ck-steps__dot" aria-hidden="true">
                    {state === "done" ? <IconCheck size={11} strokeWidth={3.6} /> : null}
                  </span>
                  <span className="t-ck-steps__txt">{step.label}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="t-ck-steps__now" aria-hidden="true">
          Etap {currentStep + 1} z {REPAIR_STEPS.length}: <strong>{REPAIR_STEPS[currentStep]?.label}</strong>
        </p>
      </section>

      {/* "Co dalej?" */}
      <div className={`t-ck-next t-ck-next--${nextAction.color}`}>
        <span className="t-ck-next__ico" aria-hidden="true">
          {actionIcon}
        </span>
        <div>
          <p className="t-ck-next__title">{nextAction.title}</p>
          <p className="t-ck-next__body">{nextAction.body}</p>
        </div>
      </div>

      <div className="t-ck-detailgrid">
        <div className="t-ck-stack t-ck-stack--l">
          {/* Szczegóły zgłoszenia */}
          <Panel title="Szczegóły zgłoszenia" desc="Dane podane przy rejestracji urządzenia" icon={<IconWrench size={18} strokeWidth={2.2} />}>
            <dl className="t-ck-details">
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
              {repair.requiresDataBackup && (
                <div className="t-ck-detail t-ck-detail--full">
                  <dt>Kopia zapasowa danych</dt>
                  <dd>
                    <span className="t-ck-infobox">
                      <IconShield size={17} />
                      Tak — poprosiłem/am o wykonanie backupu danych
                    </span>
                  </dd>
                </div>
              )}
              {repair.clientNotes && (
                <DetailItem label="Dodatkowe uwagi" value={repair.clientNotes} full />
              )}
            </dl>

            {/* Tracking number — only for courier delivery */}
            {repair.deliveryMethod === "kurier" && (
              <div className="t-ck-subsection">
                <p className="t-ck-k">Numer listu przewozowego i przewoźnik (opcjonalnie)</p>
                <p className="t-ck-note">
                  Podaj numer śledzenia przesyłki i którym przewoźnikiem wysyłasz sprzęt — serwis sprawdzi kiedy dotrze do nas.
                </p>
                <div className="t-ck-tracking">
                  <div className="t-ck-field">
                    <label htmlFor="inbound-tracking">Numer listu przewozowego</label>
                    <input
                      id="inbound-tracking"
                      type="text"
                      className="t-ck-mono"
                      placeholder="np. 1234567890123456"
                      value={trackingInput}
                      onChange={(e) => { setTrackingInput(e.target.value); setTrackingMessage(null); }}
                      maxLength={100}
                    />
                  </div>
                  <div className="t-ck-field">
                    <label htmlFor="inbound-courier">Przewoźnik</label>
                    <select
                      id="inbound-courier"
                      value={courierInput}
                      onChange={(e) => { setCourierInput(e.target.value); setTrackingMessage(null); }}
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
                    className="t-pbtn t-pbtn--acc t-pbtn--m t-ck-tracking__btn"
                  >
                    {trackingSaving ? "Zapisywanie…" : "Zapisz"}
                  </button>
                </div>
                {trackingMessage === "ok" && <AuthAlert tone="ok">Zapisano pomyślnie.</AuthAlert>}
                {trackingMessage === "err" && <AuthAlert>Nie udało się zapisać. Spróbuj ponownie.</AuthAlert>}
              </div>
            )}

            {/* Courier info for outbound delivery */}
            {(repair.serviceTrackingNumber || repair.serviceCourier) && (
              <div className="t-ck-subsection">
                <p className="t-ck-k">Wysyłka do Ciebie</p>
                <p className="t-ck-note">Naprawa jest gotowa! Nasze dane do śledzenia przesyłki:</p>
                <dl className="t-ck-okbox">
                  {repair.serviceTrackingNumber && (
                    <div>
                      <dt>Numer listu przewozowego</dt>
                      <dd className="t-ck-ref">{repair.serviceTrackingNumber}</dd>
                    </div>
                  )}
                  {repair.serviceCourier && (
                    <div>
                      <dt>Przewoźnik</dt>
                      <dd>{COURIERS[repair.serviceCourier] ?? ""}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </Panel>

          {/* Wycena */}
          {quote ? (
            <Panel
              title="Twoja wycena"
              tone={repair.status === "wait_decision" ? "wait" : "ok"}
              icon={<IconCheck size={18} strokeWidth={2.4} />}
              desc={
                <>
                  {formatQuoteNumberLabel(quote.version)} · {quote.status_display}
                  {quote.sent_at ? ` · wysłano ${formatDateTime(quote.sent_at)}` : ""}
                </>
              }
              action={quote.valid_until ? <span className="t-ck-chip">Ważna do {formatDate(quote.valid_until)}</span> : undefined}
            >
              <ul className="t-ck-qcards">
                {quote.items.map((item) => (
                  <li key={`m-${String(item.id)}`}>
                    <p className="t-ck-qcards__name">{item.description || item.item_type_display || "Pozycja"}</p>
                    <p className="t-ck-note">{item.part_origin_display ?? "Bez części"}</p>
                    <p className="t-ck-qcards__nums">
                      <span>Ilość: <strong>{String(item.quantity)}</strong></span>
                      <span>Części: <strong>{formatPrice(toNumber(item.parts_price))}</strong></span>
                      <span>Robocizna: <strong>{formatPrice(toNumber(item.labour_price))}</strong></span>
                    </p>
                    <p className="t-ck-qcards__total">{formatPrice(toNumber(item.total))}</p>
                  </li>
                ))}
              </ul>
              <div className="t-ck-qtable">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Pozycja</th>
                      <th scope="col">Część</th>
                      <th scope="col" className="is-c">Ilość</th>
                      <th scope="col" className="is-r">Części</th>
                      <th scope="col" className="is-r">Robocizna</th>
                      <th scope="col" className="is-r">Razem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item) => (
                      <tr key={String(item.id)}>
                        <td className="is-strong">{item.description || item.item_type_display || "—"}</td>
                        <td className="is-muted">{item.part_origin_display ?? "—"}</td>
                        <td className="is-c is-num">{String(item.quantity)}</td>
                        <td className="is-r is-num">{formatPrice(toNumber(item.parts_price))}</td>
                        <td className="is-r is-num">{formatPrice(toNumber(item.labour_price))}</td>
                        <td className="is-r is-num is-strong">{formatPrice(toNumber(item.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="t-ck-total">
                <span>Łączna kwota brutto</span>
                <strong>{formatPrice(toNumber(quote.total_amount))}</strong>
              </div>

              {repair.status === "wait_decision" && (
                <div className="t-ck-decide">
                  <div>
                    <p className="t-ck-decide__title">Czy akceptujesz tę wycenę?</p>
                    <p className="t-ck-note">Zaakceptuj, aby technik przystąpił do naprawy. Możesz też odrzucić — skontaktujemy się z Tobą.</p>
                  </div>
                  {quoteRespondError && <AuthAlert>{quoteRespondError}</AuthAlert>}
                  <div className="t-btnrow">
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
                      className="t-pbtn t-pbtn--ok t-pbtn--m"
                    >
                      <IconCheck size={16} strokeWidth={2.8} />
                      Akceptuję wycenę
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
                      className="t-pbtn t-pbtn--outline t-pbtn--m"
                    >
                      Odrzucam
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          ) : null}

          {/* Historia statusów */}
          <Panel title="Historia statusów" desc="Chronologiczny przebieg naprawy" icon={<IconArrow size={17} />}>
            {timelineLoading && statusTimeline.length === 0 ? (
              <p className="t-ck-note t-ck-center">Ładowanie historii…</p>
            ) : timelineError ? (
              <AuthAlert>{timelineError}</AuthAlert>
            ) : statusTimeline.length === 0 ? (
              <p className="t-ck-note t-ck-center">Brak zapisanych zmian statusu.</p>
            ) : (
              <ol className="t-ck-timeline">
                {statusTimeline.map((ev, i) => {
                  const isLast = i === statusTimeline.length - 1;
                  return (
                    <li key={`st-${ev.id}`} className={isLast ? "is-now" : "is-done"}>
                      <span className="t-ck-timeline__dot" aria-hidden="true">
                        {isLast ? <i /> : <IconCheck size={12} strokeWidth={3.4} />}
                      </span>
                      <div>
                        <p className="t-ck-timeline__label">{labelForStatusChange(ev)}</p>
                        <p className="t-ck-timeline__time">
                          <time dateTime={ev.created_at}>{formatDateTime(ev.created_at)}</time>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          {/* Wiadomości z serwisem */}
          <Panel title="Wiadomości z serwisem" desc="Bezpośrednia komunikacja z technikiem" icon={<IconMail size={18} />}>
            {threadLoading ? (
              <p className="t-ck-note t-ck-center">Ładowanie wiadomości…</p>
            ) : threadError ? (
              <AuthAlert>{threadError}</AuthAlert>
            ) : (
              <div className="t-ck-thread">
                {thread.length === 0 ? (
                  <EmptyState icon={<IconMail size={22} />} title="Brak wiadomości" text="Napisz do nas lub zadzwoń — chętnie pomożemy." />
                ) : (
                  thread.map((item) => {
                    if (item.kind === "note") {
                      const fromClient = item.thread_origin === "client" || item.thread_origin === "email_inbound";
                      return (
                        <div key={`note-${item.id}`} className={`t-ck-msg${fromClient ? " t-ck-msg--me" : ""}`}>
                          <div className="t-ck-msg__bubble">
                            <div className="t-ck-msg__head">
                              <span>{item.author_name || (fromClient ? "Ty" : "Serwis")}</span>
                              <span>{item.created_at ? formatDateTime(item.created_at) : "—"}</span>
                            </div>
                            <p>{item.note}</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={`email-${item.id}`} className="t-ck-msg t-ck-msg--mail">
                        <div className="t-ck-msg__bubble">
                          <div className="t-ck-msg__kind">
                            <IconMail size={14} />
                            E-mail wychodzący
                          </div>
                          <p className="t-ck-msg__subject">{item.subject || "—"}</p>
                          <p>{item.body_snapshot}</p>
                          <div className="t-ck-msg__head">
                            <span>
                              {item.sent_by_name ? `${item.sent_by_name} · ` : ""}
                              {item.sent_at ? formatDateTime(item.sent_at) : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <p className="t-ck-refhint">
              <span>Numer zlecenia (ref):</span>
              <code className="t-ck-ref">{repair.repairNumber}</code>
              <span>— podaj go w korespondencji e-mail</span>
            </p>

            <div className="t-ck-compose">
              <div className="t-ck-field">
                <label htmlFor="msg-draft" className="t-ck-sr">Wiadomość do serwisu</label>
                <textarea
                  id="msg-draft"
                  value={msgDraft}
                  onChange={(e) => { setMsgDraft(e.target.value); setMsgFeedback(null); }}
                  rows={4}
                  maxLength={5000}
                  placeholder="Napisz wiadomość do serwisu…"
                />
              </div>
              <div className="t-ck-compose__foot">
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
                  className="t-pbtn t-pbtn--acc t-pbtn--m"
                >
                  {msgSending ? "Wysyłanie…" : "Wyślij wiadomość"}
                </button>
                {msgFeedback === "ok" && (
                  <span className="t-ck-okline" role="status">
                    <i aria-hidden="true" />
                    Wysłano pomyślnie
                  </span>
                )}
                {msgFeedback === "err" && (
                  <span className="t-ck-errline" role="alert">
                    Nie udało się wysłać
                  </span>
                )}
              </div>
            </div>

            <div className="t-ck-quick">
              <a href={`tel:${line.phone.replace(/\s/g, "")}`} className="t-pbtn t-pbtn--outline t-pbtn--m">
                <IconPhoneCall size={16} />
                {line.phoneDisplay}
              </a>
              <a href={`mailto:${line.email}`} className="t-pbtn t-pbtn--outline t-pbtn--m">
                <IconMail size={16} />
                {line.email}
              </a>
            </div>
          </Panel>
        </div>

        <aside className="t-ck-stack t-ck-stack--l">
          {/* Kosztorys */}
          <Panel title="Kosztorys" desc="Aktualny stan rozliczeń" icon={<span className="t-ck-zl">zł</span>}>
            {repair.priceItems.length > 0 ? (
              <>
                <dl className="t-ck-kvs">
                  {repair.priceItems.map((item) => (
                    <div key={item.name} className="t-ck-kv">
                      <dt>{item.name}</dt>
                      <dd className="t-ck-num">{formatPrice(item.price)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="t-ck-total t-ck-total--s">
                  <span>Łącznie brutto</span>
                  <strong>{formatTotalPrice(repair.priceItems)}</strong>
                </div>
              </>
            ) : (
              <p className="t-ck-note t-ck-center">Brak pozycji kosztorysu</p>
            )}
            {repair.totalPrice === null && (
              <p className="t-ck-infobox t-ck-infobox--block">Cena zostanie ustalona po diagnostyce. Wszelkie zmiany uzgodnimy z Tobą przed naprawą.</p>
            )}
          </Panel>

          {/* Informacje serwisowe */}
          <Panel title="Informacje serwisowe" desc="Najważniejsze dane kontaktowe i czas naprawy w jednym miejscu." icon={<IconShield size={18} />}>
            <div className="t-ck-stack">
              <div className="t-ck-numbox">
                <div>
                  <span className="t-ck-k">Numer zlecenia</span>
                  <p className="t-ck-ref t-ck-ref--l">{repair.repairNumber}</p>
                </div>
                <span className="t-ck-chip">Konto klienta</span>
              </div>
              <dl className="t-ck-tiles">
                <div>
                  <dt>Serwisant</dt>
                  <dd>{typeof repair.serviceInfo.technicianName === "string" ? repair.serviceInfo.technicianName : "Do przypisania"}</dd>
                </div>
                <div>
                  <dt>Czas naprawy</dt>
                  <dd>{repair.serviceInfo.estimatedTime ?? "Do ustalenia"}</dd>
                </div>
              </dl>
              {repair.serviceInfo.notes && <p className="t-ck-infobox t-ck-infobox--block">{repair.serviceInfo.notes}</p>}
              <ServiceContact compact />
            </div>
          </Panel>
        </aside>
      </div>

      {repair.status === "wait_decision" && (
        <div className="t-ck-decidebar">
          <div className="t-ck-decidebar__in">
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
                  setQuoteRespondError(e instanceof Error ? e.message : "Nie udalo sie zapisac decyzji.");
                } finally {
                  setQuoteRespondBusy(false);
                }
              }}
              className="t-pbtn t-pbtn--ok"
            >
              <IconCheck size={16} strokeWidth={2.8} />
              Akceptuję
            </button>
            <button
              type="button"
              disabled={quoteRespondBusy}
              onClick={async () => {
                if (!token) return;
                setQuoteRespondError(null);
                setQuoteRespondBusy(true);
                try {
                  const data = await api.post<ApiRepairDetail>(`/repairs/${repairId}/quote-respond/`, { action: "reject" }, token);
                  setRepair(apiRepairDetailToPanel(data));
                } catch (e) {
                  setQuoteRespondError(e instanceof Error ? e.message : "Nie udalo sie zapisac decyzji.");
                } finally {
                  setQuoteRespondBusy(false);
                }
              }}
              className="t-pbtn t-pbtn--outline"
            >
              Odrzucam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
