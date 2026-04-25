"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileDown,
  Loader2,
  Mail,
  Pencil,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import { AcceptanceProtocolPreviewModal } from "@/components/panel/AcceptanceProtocolPreviewModal";
import { downloadAcceptanceProtocolPdf, openRepairQrLabel } from "@/lib/acceptance-pdf";
import { IntakePreviewPanel } from "@/components/panel/intake/IntakePreviewPanel";
import { deviceCategoryToBucket, isStaffSuggestedForCategory } from "@/lib/intake-assignment";
import DatePickerInput from "@/components/ui/DatePickerInput";
import type { IntakeSearchClient, IntakeSearchDevice } from "@/types/intake";

type AssignableStaffRow = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  picker_label: string;
  active_repairs_count?: number;
  specialization?: string | null;
};

const DEVICE_CATEGORY_OPTIONS: Array<{ value: string; label: string; icon: string }> = [
  { value: "phone", label: "Telefon", icon: "📱" },
  { value: "laptop", label: "Laptop", icon: "💻" },
  { value: "tablet", label: "Tablet", icon: "📟" },
  { value: "desktop", label: "Komputer", icon: "🖥" },
  { value: "printer", label: "Drukarka", icon: "🖨" },
  { value: "console", label: "Konsola", icon: "🎮" },
  { value: "smartwatch", label: "Smartwatch", icon: "⌚" },
  { value: "data_recovery", label: "Odzyskiwanie danych", icon: "💾" },
  { value: "other", label: "Inne", icon: "🧩" },
];

function categoryLabel(value: string): string {
  return DEVICE_CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

function clientDisplayName(c: IntakeSearchClient): string {
  if (c.client_type === "business" && c.company_name?.trim()) {
    return c.company_name.trim();
  }
  return c.full_name?.trim() || `${c.first_name} ${c.last_name}`.trim() || c.client_number;
}

export default function IntakePage() {
  const { token, user } = useAuth();
  const p = usePanelBasePath();
  const modelRef = useRef<HTMLInputElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const [clientQuery, setClientQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<IntakeSearchClient[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const [linkedClientId, setLinkedClientId] = useState<string | null>(null);
  const [devices, setDevices] = useState<IntakeSearchDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  /** null = nie wybrano trybu urządzenia; "new" = nowe; uuid = istniejące */
  const [deviceChoice, setDeviceChoice] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [deviceCategory, setDeviceCategory] = useState("phone");
  const [serviceType, setServiceType] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceColor, setDeviceColor] = useState("");
  const [visualCondition, setVisualCondition] = useState("");
  const [devicePassword, setDevicePassword] = useState("");
  const [accEtui, setAccEtui] = useState(false);
  const [accSim, setAccSim] = useState(false);
  const [accCharger, setAccCharger] = useState(false);
  const [accCable, setAccCable] = useState(false);
  const [accBox, setAccBox] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(false);
  /** null = sugestia systemu; "none" = nie przypisuj; uuid = konkretny pracownik */
  const [assignmentChoice, setAssignmentChoice] = useState<string | null>(null);
  const [staffRows, setStaffRows] = useState<AssignableStaffRow[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [problemDescription, setProblemDescription] = useState("");
  /** Folia Hammer Glass / szkło — tylko telefon, tablet, smartwatch */
  const [hammerGlassChoice, setHammerGlassChoice] = useState<"yes" | "no" | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; repair_number: string } | null>(null);
  const [acceptancePreviewOpen, setAcceptancePreviewOpen] = useState(false);

  useEffect(() => {
    const q = clientQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = window.setTimeout(async () => {
      if (!token) return;
      setSearchLoading(true);
      try {
        const res = await api.get<{ clients: IntakeSearchClient[] }>(
          `/search/intake/?q=${encodeURIComponent(q)}&limit=15`,
          token,
        );
        setSearchResults(res.clients ?? []);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 320);
    return () => window.clearTimeout(t);
  }, [clientQuery, token]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setStaffLoading(true);
    api
      .get<AssignableStaffRow[]>("/accounts/staff/assignable-for-repairs/?include_self=1", token)
      .then((rows) => {
        if (!cancelled) setStaffRows(rows ?? []);
      })
      .catch(() => {
        if (!cancelled) setStaffRows([]);
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loadDevices = useCallback(
    async (clientId: string) => {
      if (!token) return;
      setDevicesLoading(true);
      try {
        const res = await api.get<{ devices: IntakeSearchDevice[] }>(
          `/search/intake/?client_id=${encodeURIComponent(clientId)}`,
          token,
        );
        setDevices(res.devices ?? []);
      } catch {
        setDevices([]);
      } finally {
        setDevicesLoading(false);
      }
    },
    [token],
  );

  const selectClientFromSearch = (c: IntakeSearchClient) => {
    setLinkedClientId(c.id);
    setFirstName(c.first_name ?? "");
    setLastName(c.last_name ?? "");
    setPhone((c.phone ?? "").trim());
    setEmail((c.email ?? "").trim());
    setClientQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setDeviceChoice(null);
    void loadDevices(c.id);
  };

  const clearLinkedClient = () => {
    setLinkedClientId(null);
    setDevices([]);
    setDeviceChoice(null);
  };

  useEffect(() => {
    if (linkedClientId && !devicesLoading && devices.length === 0) {
      setDeviceChoice("new");
    }
  }, [linkedClientId, devicesLoading, devices.length]);

  useEffect(() => {
    if (!linkedClientId) return;
    if (deviceChoice && deviceChoice !== "new") {
      const d = devices.find((x) => x.id === deviceChoice);
      if (d?.category) setDeviceCategory(d.category);
    }
  }, [linkedClientId, deviceChoice, devices]);

  const problemBlock = useMemo(() => {
    const parts = [serviceType.trim() ? `Zakres usługi: ${serviceType.trim()}` : "", problemDescription.trim()].filter(
      Boolean,
    );
    return parts.join("\n\n");
  }, [serviceType, problemDescription]);

  const effectiveDeviceCategory = useMemo(() => {
    if (linkedClientId && deviceChoice && deviceChoice !== "new") {
      const d = devices.find((x) => x.id === deviceChoice);
      return (d?.category || deviceCategory || "phone").trim();
    }
    return deviceCategory;
  }, [linkedClientId, deviceChoice, devices, deviceCategory]);

  const showHammerGlass = useMemo(
    () => ["phone", "tablet", "smartwatch"].includes(effectiveDeviceCategory),
    [effectiveDeviceCategory],
  );

  useEffect(() => {
    if (!showHammerGlass) setHammerGlassChoice(null);
  }, [showHammerGlass]);

  const canSubmit = useMemo(() => {
    if (!problemBlock.trim()) return false;
    if (showHammerGlass && hammerGlassChoice === null) return false;
    if (linkedClientId) {
      if (!deviceChoice) return false;
      if (deviceChoice === "new") {
        return Boolean(deviceCategory && deviceBrand.trim() && deviceModel.trim());
      }
      return true;
    }
    return Boolean(
      firstName.trim() && lastName.trim() && phone.trim() && deviceCategory && deviceBrand.trim() && deviceModel.trim() && problemDescription.trim(),
    );
  }, [
    problemBlock,
    showHammerGlass,
    hammerGlassChoice,
    linkedClientId,
    deviceChoice,
    deviceCategory,
    deviceBrand,
    deviceModel,
    firstName,
    lastName,
    phone,
    problemDescription,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const normalizedBrand = deviceBrand.trim();
      const shouldSendBrand = normalizedBrand !== "" && normalizedBrand.toLowerCase() !== "inna marka";

      let payload: Record<string, unknown> = {
        problem_description: problemBlock,
        device_color: deviceColor.trim(),
        visual_condition: visualCondition.trim(),
        device_password: devicePassword.trim(),
        accessory_etui: accEtui,
        accessory_sim: accSim,
        accessory_charger: accCharger,
        accessory_cable: accCable,
        accessory_box: accBox,
        internal_notes: internalNotes.trim(),
        send_confirmation_email: sendConfirmationEmail,
      };

      const costRaw = estimatedCost.trim().replace(",", ".");
      if (costRaw) {
        const n = Number.parseFloat(costRaw);
        if (!Number.isNaN(n)) payload.estimated_cost = n;
      }
      if (estimatedCompletionDate.trim()) {
        payload.estimated_completion_date = estimatedCompletionDate.trim();
      }
      if (assignmentChoice === "none") {
        payload.unassigned_explicit = true;
      } else if (assignmentChoice) {
        payload.assigned_to_id = assignmentChoice;
      }

      if (showHammerGlass && hammerGlassChoice) {
        payload.hammer_glass_interest = hammerGlassChoice;
      }

      if (linkedClientId && deviceChoice && deviceChoice !== "new") {
        payload = {
          ...payload,
          client_id: linkedClientId,
          device_id: deviceChoice,
        };
        if (shouldSendBrand) {
          payload.manual_brand = normalizedBrand;
          payload.device_brand_name = normalizedBrand;
        }
        if (deviceModel.trim()) {
          payload.device_model_name = deviceModel.trim();
        }
      } else if (linkedClientId && deviceChoice === "new") {
        payload = {
          ...payload,
          client_id: linkedClientId,
          device_category: deviceCategory,
          manual_brand: shouldSendBrand ? normalizedBrand : "",
          device_brand_name: shouldSendBrand ? normalizedBrand : "",
          device_model_name: deviceModel.trim() || "Do uzupełnienia",
        };
      } else {
        payload = {
          ...payload,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          device_category: deviceCategory,
          manual_brand: shouldSendBrand ? normalizedBrand : "",
          device_brand_name: shouldSendBrand ? normalizedBrand : "",
          device_model_name: deviceModel.trim() || "Do uzupełnienia",
        };
      }

      const res = await api.post<{ id: string; repair_number: string }>(`/repairs/quick-accept/`, payload, token);
      setSuccess({ id: res.id, repair_number: res.repair_number });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Nie udało się przyjąć zgłoszenia.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass =
    "rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0c0d12] to-[#0a0b0f] p-5 shadow-[0_1px_0_rgba(255,255,255,.06)_inset]";

  const labelClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 pb-16">
      <header className="relative mb-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] px-6 py-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#dc1e1e]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[#3b82f6]/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink2)]">
              <Sparkles size={14} className="text-[#fbbf24]" />
              Przyjęcie stacjonarne
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--white)] md:text-3xl">Profesjonalne przyjęcie sprzętu</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink2)]">
              Wyszukaj klienta w bazie lub wpisz dane ręcznie. Wybierz urządzenie z historii albo zarejestruj nowe — jeden przewijany
              formularz, szybki zapis i protokół PDF.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="order-last space-y-6 lg:order-none lg:col-span-8">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[#fca5a5]">{error}</div>
          )}

          {/* Klient */}
          <section className={cardClass}>
            <div className="mb-4 flex items-center gap-2">
              <UserRound size={18} className="text-[#3b82f6]" />
              <h2 className="text-lg font-semibold text-[var(--white)]">Klient</h2>
            </div>

            <div ref={searchWrapRef} className="relative mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Wyszukaj w bazie</div>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={clientQuery}
                  onChange={(e) => {
                    setClientQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => clientQuery.trim().length >= 2 && setSearchOpen(true)}
                  placeholder="Min. 2 znaki: imię, nazwisko, telefon, e-mail, firma…"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#111318] py-3 pl-10 pr-4 text-sm text-[var(--white)] outline-none ring-[#3b82f6]/0 transition focus:border-[#3b82f6]/50 focus:ring-2 focus:ring-[#3b82f6]/20"
                  autoComplete="off"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--ink2)]" />
                )}
              </div>
              {searchOpen && clientQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-2xl border border-[var(--border)] bg-[#111318] py-1 shadow-xl">
                  {searchResults.length === 0 && !searchLoading ? (
                    <div className="px-4 py-3 text-sm text-[var(--ink2)]">Brak wyników.</div>
                  ) : (
                    searchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectClientFromSearch(c)}
                        className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left text-sm transition hover:bg-white/[0.06]"
                      >
                        <span className="font-semibold text-[var(--white)]">{clientDisplayName(c)}</span>
                        <span className="text-xs text-[var(--ink2)]">
                          {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                        </span>
                        <span className="flex flex-wrap gap-1.5">
                          {(c.badges ?? []).map((b) => (
                            <span
                              key={b}
                              className="rounded-full border border-[var(--border)] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#d1d5db]"
                            >
                              {b === "firma" ? "Firma" : b === "klient_wraca" ? "Klient wraca" : b}
                            </span>
                          ))}
                          {typeof c.repair_count === "number" ? (
                            <span className="text-[10px] text-[var(--muted)]">{c.repair_count} napraw</span>
                          ) : null}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {linkedClientId ? (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#22c55e]/25 bg-[#22c55e]/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-[#bbf7d0]">
                  <CheckCircle2 size={18} />
                  <span>
                    Powiązano z bazą: <span className="font-semibold text-[var(--white)]">{firstName} {lastName}</span>
                    {devices.length > 0 ? ` · ${devices.length} urządzeń w profilu` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearLinkedClient}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[var(--row-hover)] px-3 py-1.5 text-xs font-semibold text-[#e5e7eb] transition hover:bg-[var(--row-active)]"
                >
                  <RotateCcw size={14} />
                  Odłącz i wpisz ręcznie
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className={labelClass}>Imię</div>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45 focus:ring-2 focus:ring-[#3b82f6]/15"
                  disabled={Boolean(linkedClientId)}
                />
              </div>
              <div>
                <div className={labelClass}>Nazwisko</div>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45 focus:ring-2 focus:ring-[#3b82f6]/15"
                  disabled={Boolean(linkedClientId)}
                />
              </div>
              <div>
                <div className={labelClass}>Telefon</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45 focus:ring-2 focus:ring-[#3b82f6]/15"
                  disabled={Boolean(linkedClientId)}
                />
              </div>
              <div>
                <div className={labelClass}>E-mail {!linkedClientId ? <span className="text-[var(--muted)]">(zalecany)</span> : null}</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45 focus:ring-2 focus:ring-[#3b82f6]/15"
                  disabled={Boolean(linkedClientId)}
                />
              </div>
            </div>
            {!linkedClientId ? (
              <p className="mt-3 text-xs text-[var(--muted)]">
                Nowy klient bez adresu e-mail otrzyma techniczny placeholder w systemie — uzupełnij e-mail, jeśli klient go poda.
              </p>
            ) : null}
          </section>

          {/* Urządzenie */}
          <section className={cardClass}>
            <div className="mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-[#a78bfa]" />
              <h2 className="text-lg font-semibold text-[var(--white)]">Urządzenie</h2>
            </div>

            {linkedClientId ? (
              <div className="mb-5 space-y-3">
                <div className={labelClass}>Wybór z profilu lub nowe</div>
                {devicesLoading ? (
                  <p className="text-sm text-[var(--ink2)]">Ładuję urządzenia…</p>
                ) : (
                  <div className="space-y-2">
                    {devices.map((d) => (
                      <label
                        key={d.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                          deviceChoice === d.id
                            ? "border-[#3b82f6]/50 bg-[#3b82f6]/10"
                            : "border-[var(--border)] bg-[#111318]/80 hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="deviceChoice"
                          className="mt-1"
                          checked={deviceChoice === d.id}
                          onChange={() => {
                            setDeviceChoice(d.id);
                            setDeviceBrand((d.device_brand || "").trim());
                            setDeviceModel((d.device_model || "").trim());
                          }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-[var(--white)]">{d.device_name}</div>
                          <div className="text-xs text-[var(--ink2)]">
                            {categoryLabel(d.category ?? "other")}
                            {d.serial_number ? ` · SN ${d.serial_number}` : ""}
                            {d.imei ? ` · IMEI ${d.imei}` : ""}
                          </div>
                        </div>
                      </label>
                    ))}
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        deviceChoice === "new"
                          ? "border-[#dc1e1e]/45 bg-[#dc1e1e]/10"
                          : "border-[var(--border)] bg-[#111318]/80 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deviceChoice"
                        checked={deviceChoice === "new"}
                        onChange={() => {
                          setDeviceChoice("new");
                          setDeviceBrand("");
                          setDeviceModel("");
                          setTimeout(() => modelRef.current?.focus(), 100);
                        }}
                      />
                      <span className="text-sm font-semibold text-[var(--white)]">Nowe urządzenie (inny sprzęt niż w profilu)</span>
                    </label>
                  </div>
                )}
              </div>
            ) : null}

            {(!linkedClientId || deviceChoice === "new") && (
              <>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Kategoria</div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {DEVICE_CATEGORY_OPTIONS.map((c) => (
                    <motion.button
                      key={c.value}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => {
                        setDeviceCategory(c.value);
                        setTimeout(() => modelRef.current?.focus(), 120);
                      }}
                      className={`rounded-xl border p-2.5 text-center transition ${
                        deviceCategory === c.value
                          ? "border-[#3b82f6] bg-[#3b82f6]/12 shadow-[0_0_0_1px_rgba(59,130,246,.35)]"
                          : "border-[var(--border)] bg-[#111318] hover:border-white/20"
                      }`}
                    >
                      <div className="mb-0.5 text-lg">{c.icon}</div>
                      <div className={`text-[10px] font-semibold ${deviceCategory === c.value ? "text-[#93c5fd]" : "text-[var(--ink2)]"}`}>
                        {c.label}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {linkedClientId && deviceChoice && deviceChoice !== "new" ? (
              <p className="mt-4 text-xs text-[var(--muted)]">
                Wybrano urządzenie z profilu — poniżej możesz uzupełnić stan, akcesoria i przypisanie do tego przyjęcia.
              </p>
            ) : null}

            {(!linkedClientId || deviceChoice) && (
              <div className="mt-6 space-y-5 border-t border-[var(--border)] pt-6">
                <h3 className="text-sm font-semibold text-[var(--white)]">Szczegóły sprzętu</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className={labelClass}>Marka urządzenia</div>
                    <input
                      value={deviceBrand}
                      onChange={(e) => setDeviceBrand(e.target.value)}
                      placeholder="np. Apple, Samsung, Lenovo…"
                      className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
                    />
                  </div>
                  <div>
                    <div className={labelClass}>Model urządzenia</div>
                  <input
                    ref={modelRef}
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="np. iPhone 15 Pro, Galaxy S24, Latitude 5520…"
                    className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
                  />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className={labelClass}>Kolor</div>
                    <input
                      value={deviceColor}
                      onChange={(e) => setDeviceColor(e.target.value)}
                      placeholder="np. czarny, Midnight…"
                      className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
                    />
                  </div>
                  <div>
                    <div className={labelClass}>Hasło / PIN</div>
                    <input
                      value={devicePassword}
                      onChange={(e) => setDevicePassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                      placeholder="Jeśli klient podał dostęp"
                      className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
                    />
                  </div>
                </div>
                <div>
                  <div className={labelClass}>Stan wizualny</div>
                  <textarea
                    value={visualCondition}
                    onChange={(e) => setVisualCondition(e.target.value)}
                    rows={3}
                    placeholder="Rysy, pęknięcia, ślady użytkowania…"
                    className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
                  />
                </div>

                <div>
                  <div className={labelClass}>Akcesoria przy sprzęcie</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        [accEtui, setAccEtui, "Etui / case"],
                        [accSim, setAccSim, "Karta SIM"],
                        [accCharger, setAccCharger, "Ładowarka"],
                        [accCable, setAccCable, "Kabel"],
                        [accBox, setAccBox, "Pudełko"],
                      ] as const
                    ).map(([checked, setV, lab]) => (
                      <label
                        key={lab}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                          checked ? "border-[#3b82f6]/45 bg-[#3b82f6]/10" : "border-[var(--border)] bg-[#111318]/80 hover:border-white/18"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#111318] text-[#3b82f6] focus:ring-[#3b82f6]/40"
                          checked={checked}
                          onChange={(e) => setV(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-[#e5e7eb]">{lab}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {showHammerGlass ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-4">
                    <div className={labelClass}>Folia Hammer Glass / szkło hartowane</div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--ink2)]">
                      Przy telefonie, tablecie i smartwatchu zaproponuj klientowi ochronę wyświetlacza — zaznacz decyzję (wpis trafi do
                      potwierdzenia PDF, e-maila i panelu klienta).
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 transition ${
                          hammerGlassChoice === "yes"
                            ? "border-[#22c55e]/55 bg-[#22c55e]/12"
                            : "border-[var(--border)] bg-[#111318]/80 hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="hammer-glass"
                          className="h-4 w-4 border-white/20 bg-[#111318] text-[#22c55e] focus:ring-[#22c55e]/40"
                          checked={hammerGlassChoice === "yes"}
                          onChange={() => setHammerGlassChoice("yes")}
                        />
                        <span className="text-sm font-medium text-[#e5e7eb]">Tak — klient zainteresowany</span>
                      </label>
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 transition ${
                          hammerGlassChoice === "no"
                            ? "border-white/25 bg-white/[0.06]"
                            : "border-[var(--border)] bg-[#111318]/80 hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="hammer-glass"
                          className="h-4 w-4 border-white/20 bg-[#111318] text-[var(--muted)] focus:ring-white/20"
                          checked={hammerGlassChoice === "no"}
                          onChange={() => setHammerGlassChoice("no")}
                        />
                        <span className="text-sm font-medium text-[#e5e7eb]">Nie</span>
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {/* Zakres, wycena, notatki */}
          <section className={cardClass}>
            <h2 className="mb-4 text-lg font-semibold text-[var(--white)]">Typ usługi / zakres naprawy i ustalenia</h2>
            <div>
              <div className={labelClass}>Typ usługi / zakres naprawy</div>
              <input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Np. wymiana wyświetlacza OLED, diagnostyka…"
                className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
              />
            </div>
            <div className="mt-4">
              <div className={labelClass}>Opis problemu (dla klienta / zgłoszenia)</div>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
                rows={5}
                placeholder="Objawy, historia, oczekiwania klienta…"
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className={labelClass}>Wstępna wycena (PLN)</div>
                <input
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  inputMode="decimal"
                  placeholder="np. 350 lub 350,00"
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
                />
              </div>
              <div>
                <div className={labelClass}>Termin realizacji (planowana data)</div>
                <DatePickerInput
                  value={estimatedCompletionDate}
                  onChange={setEstimatedCompletionDate}
                  placeholder="Wybierz datę realizacji"
                  minDate={new Date()}
                />
              </div>
            </div>
            <div className="mt-4">
              <div className={labelClass}>Notatka wewnętrzna</div>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={4}
                placeholder="Widoczne tylko dla zespołu…"
                className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)] outline-none transition focus:border-[#3b82f6]/45"
              />
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-[#111318]/60 px-4 py-3 transition hover:border-white/18">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#111318] text-[#3b82f6] focus:ring-[#3b82f6]/40"
                checked={sendConfirmationEmail}
                onChange={(e) => setSendConfirmationEmail(e.target.checked)}
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--white)]">
                  <Mail size={16} className="text-[#60a5fa]" />
                  Wyślij e-mail z potwierdzeniem przyjęcia
                </span>
                <span className="mt-0.5 block text-xs text-[var(--ink2)]">
                  {email ? `Na adres: ${email}` : "Wymaga podanego adresu e-mail klienta (nie wysyłamy na adresy techniczne)."}
                </span>
              </span>
            </label>
          </section>

          {/* Przypisanie */}
          <section className={cardClass}>
            <div className="mb-2 flex items-center gap-2">
              <Users size={18} className="text-[#22c55e]" />
              <h2 className="text-lg font-semibold text-[var(--white)]">Przypisanie pracownika</h2>
            </div>
            <p className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#22c55e]">
              <Wrench size={14} />
              Sugestia systemu — kategoria:{" "}
              <span className="normal-case text-[#d1fae5]">
                {deviceCategoryToBucket(deviceCategory) === "phone_tablet"
                  ? "Telefon / tablet / smartwatch"
                  : deviceCategoryToBucket(deviceCategory) === "laptop_printer"
                    ? "Laptop / komputer / drukarka"
                    : "Inne / ogólne"}
              </span>
            </p>

            {staffLoading ? (
              <p className="text-sm text-[var(--ink2)]">Ładuję listę pracowników…</p>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setAssignmentChoice(null)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    assignmentChoice === null
                      ? "border-[#22c55e]/50 bg-[#22c55e]/12"
                      : "border-[var(--border)] bg-[#111318]/80 hover:border-white/20"
                  }`}
                >
                  <div className="text-sm font-semibold text-[var(--white)]">Automatycznie (sugestia systemu)</div>
                  <div className="mt-0.5 text-xs text-[var(--ink2)]">Przypisanie według kategorii urządzenia i dostępności</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentChoice("none")}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    assignmentChoice === "none"
                      ? "border-amber-500/45 bg-amber-500/10"
                      : "border-[var(--border)] bg-[#111318]/80 hover:border-white/20"
                  }`}
                >
                  <div className="text-sm font-semibold text-[var(--white)]">Nie przypisuj</div>
                  <div className="mt-0.5 text-xs text-[var(--ink2)]">Kolejka nieprzypisanych — przypisanie później</div>
                </button>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {staffRows.map((s) => {
                    const suggested = isStaffSuggestedForCategory(s.specialization, deviceCategory);
                    const isMe = user?.id === s.id;
                    const active = typeof s.active_repairs_count === "number" ? s.active_repairs_count : 0;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setAssignmentChoice(s.id)}
                        className={`rounded-2xl border px-3 py-3 text-left transition ${
                          assignmentChoice === s.id
                            ? suggested
                              ? "border-[#22c55e]/55 bg-[#22c55e]/12"
                              : "border-[#3b82f6]/45 bg-[#3b82f6]/10"
                            : "border-[var(--border)] bg-[#111318]/80 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[var(--white)]">
                            {s.picker_label}
                            {isMe ? <span className="text-[#93c5fd]"> (ja)</span> : null}
                          </span>
                          {suggested ? (
                            <span className="shrink-0 rounded-full border border-[#22c55e]/35 bg-[#22c55e]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#86efac]">
                              Sugerowany
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-[var(--ink2)]">
                          {active} napraw · {suggested ? "dopasowanie do kategorii" : "inna specjalizacja"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="inline-flex min-w-[200px] items-center justify-center rounded-2xl bg-[#dc1e1e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#dc1e1e]/20 transition hover:bg-[#b81818] disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
            >
              {submitting ? "Przyjmuję…" : "Przyjmij zgłoszenie"}
            </button>
          </div>
        </div>

        <aside className="order-first lg:order-none lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
          <IntakePreviewPanel
            categoryOptions={DEVICE_CATEGORY_OPTIONS}
            categoryLabel={categoryLabel}
            firstName={firstName}
            lastName={lastName}
            phone={phone}
            email={email}
            linkedFromDb={Boolean(linkedClientId)}
            deviceCategory={deviceCategory}
            deviceBrand={deviceBrand}
            deviceModel={deviceModel}
            deviceColor={deviceColor}
            visualCondition={visualCondition}
            serviceType={serviceType}
            problemDescription={problemDescription}
            accEtui={accEtui}
            accSim={accSim}
            accCharger={accCharger}
            accCable={accCable}
            accBox={accBox}
            estimatedCost={estimatedCost}
            estimatedCompletionDate={estimatedCompletionDate}
            internalNotes={internalNotes}
            sendConfirmationEmail={sendConfirmationEmail}
            assignmentChoice={assignmentChoice}
            staffRows={staffRows}
            currentUserId={user?.id}
            canSubmit={canSubmit}
            submitting={submitting}
            showHammerGlass={showHammerGlass}
            hammerGlassChoice={hammerGlassChoice}
          />
        </aside>
      </form>

      <AcceptanceProtocolPreviewModal
        open={acceptancePreviewOpen && !!success}
        onClose={() => setAcceptancePreviewOpen(false)}
        repairId={success?.id ?? ""}
        repairNumber={success?.repair_number}
        token={token}
      />

      {success ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[#22c55e]">
              <CheckCircle2 size={22} />
              <span className="text-sm font-semibold uppercase tracking-wide">Naprawa przyjęta</span>
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Numer przyjęcia</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--white)]">{success.repair_number}</p>
            <p className="mt-3 text-sm text-[var(--ink2)]">
              Wydrukuj potwierdzenie i etykietę albo przejdź do karty naprawy, aby uzupełnić lub zmienić dane.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setAcceptancePreviewOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[var(--row-hover)] px-4 py-3 text-sm font-semibold text-[var(--white)] transition hover:bg-[var(--row-active)]"
              >
                <Printer size={18} />
                Podgląd wydruku / druk
              </button>
              <button
                type="button"
                onClick={() => void openRepairQrLabel(success.id, success.repair_number, token)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#a855f7]/35 bg-[#a855f7]/12 px-4 py-3 text-sm font-semibold text-[#e9d5ff] transition hover:bg-[#a855f7]/20"
              >
                <QrCode size={18} />
                Drukuj etykietę
              </button>
              <Link
                href={p.repairDetailPath(success.id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3b82f6]/40 bg-[#3b82f6]/12 px-4 py-3 text-sm font-semibold text-[#bfdbfe] transition hover:bg-[#3b82f6]/22"
              >
                <Pencil size={18} />
                Edytuj dane (karta naprawy)
              </Link>
            </div>
            <p className="mt-4 text-center">
              <button
                type="button"
                onClick={() => void downloadAcceptanceProtocolPdf(success.id, success.repair_number, token)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink2)] underline-offset-2 hover:text-[#d1d5db] hover:underline"
              >
                <FileDown size={14} />
                Pobierz PDF na dysk
              </button>
            </p>
            <div className="mt-5 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => {
                  setAcceptancePreviewOpen(false);
                  setSuccess(null);
                  setProblemDescription("");
                  setServiceType("");
                  setDeviceBrand("");
                  setDeviceModel("");
                  setDeviceColor("");
                  setVisualCondition("");
                  setDevicePassword("");
                  setAccEtui(false);
                  setAccSim(false);
                  setAccCharger(false);
                  setAccCable(false);
                  setAccBox(false);
                  setEstimatedCost("");
                  setEstimatedCompletionDate("");
                  setInternalNotes("");
                  setSendConfirmationEmail(false);
                  setAssignmentChoice(null);
                  setHammerGlassChoice(null);
                  clearLinkedClient();
                  setDeviceCategory("phone");
                  setDeviceChoice(null);
                  setFirstName("");
                  setLastName("");
                  setPhone("");
                  setEmail("");
                }}
                className="text-sm text-[var(--ink2)] hover:text-[var(--white)]"
              >
                Kolejne przyjęcie
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
