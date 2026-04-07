"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  Loader2,
  Pencil,
  Printer,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { AcceptanceProtocolPreviewModal } from "@/components/panel/AcceptanceProtocolPreviewModal";
import { downloadComplaintWarrantyIntakePdf, openRepairQrLabel } from "@/lib/acceptance-pdf";
import type { RepairRequestListItem } from "@/types/repairs";

type RepairKind = "complaint" | "warranty";
type WarrantyMode = "with_parent" | "manual";

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

export default function ComplaintWarrantyIntakePage() {
  const { token, user } = useAuth();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";

  const [repairKind, setRepairKind] = useState<RepairKind>("complaint");
  const [warrantyMode, setWarrantyMode] = useState<WarrantyMode>("with_parent");

  const [refQuery, setRefQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<RepairRequestListItem[]>([]);
  const [selectedParent, setSelectedParent] = useState<RepairRequestListItem | null>(null);
  /** Gdy brak wyboru z listy — dokładny numer ref. wysyłany jako parent_repair_number */
  const [parentNumberFallback, setParentNumberFallback] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deviceCategory, setDeviceCategory] = useState("phone");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [hammerGlassChoice, setHammerGlassChoice] = useState<"yes" | "no" | null>(null);

  const [problemDescription, setProblemDescription] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; repair_number: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const needsParentBlock = repairKind === "complaint" || (repairKind === "warranty" && warrantyMode === "with_parent");
  const needsManualWarranty = repairKind === "warranty" && warrantyMode === "manual";

  const showHammerGlass = useMemo(
    () => needsManualWarranty && ["phone", "tablet", "smartwatch"].includes(deviceCategory),
    [needsManualWarranty, deviceCategory],
  );

  useEffect(() => {
    if (!showHammerGlass) setHammerGlassChoice(null);
  }, [showHammerGlass]);

  useEffect(() => {
    if (repairKind === "complaint") {
      setWarrantyMode("with_parent");
    }
  }, [repairKind]);

  const hasParentResolution = Boolean(
    selectedParent || (parentNumberFallback.trim().length > 0 && needsParentBlock),
  );

  const canSubmit = useMemo(() => {
    if (!problemDescription.trim()) return false;
    if (needsManualWarranty) {
      if (!firstName.trim() || !lastName.trim() || !phone.trim() || !deviceCategory) return false;
      if (!deviceBrand.trim() || !deviceModel.trim()) return false;
      if (showHammerGlass && hammerGlassChoice === null) return false;
      return true;
    }
    if (needsParentBlock) {
      return hasParentResolution;
    }
    return true;
  }, [
    problemDescription,
    needsManualWarranty,
    firstName,
    lastName,
    phone,
    deviceCategory,
    deviceBrand,
    deviceModel,
    showHammerGlass,
    hammerGlassChoice,
    needsParentBlock,
    hasParentResolution,
  ]);

  const runSearch = useCallback(async () => {
    const q = refQuery.trim();
    if (!token || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("search", q);
      params.set("ordering", "-created_at");
      const rows = await api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token);
      const list = Array.isArray(rows) ? rows : [];
      setSearchResults(list);
      if (list.length === 1) {
        setSelectedParent(list[0]!);
        setParentNumberFallback(list[0]!.repair_number);
      } else {
        setSelectedParent(null);
      }
    } catch (e) {
      setSearchResults([]);
      setError(e instanceof Error ? e.message : "Nie udało się wyszukać napraw.");
    } finally {
      setSearchLoading(false);
    }
  }, [refQuery, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        repair_type: repairKind,
        problem_description: problemDescription.trim(),
        send_confirmation_email: sendConfirmationEmail,
      };
      if (internalNotes.trim()) payload.internal_notes = internalNotes.trim();

      if (needsManualWarranty) {
        payload.first_name = firstName.trim();
        payload.last_name = lastName.trim();
        payload.phone = phone.trim();
        if (email.trim()) payload.email = email.trim();
        payload.device_category = deviceCategory;
        payload.device_brand_name = deviceBrand.trim();
        payload.device_model_name = deviceModel.trim() || "Do uzupełnienia";
        if (showHammerGlass && hammerGlassChoice) {
          payload.hammer_glass_interest = hammerGlassChoice;
        }
      } else {
        if (selectedParent) {
          payload.parent_repair_id = selectedParent.id;
        } else if (parentNumberFallback.trim()) {
          payload.parent_repair_number = parentNumberFallback.trim();
        }
      }

      const res = await api.post<{ id: string; repair_number: string }>(
        `/repairs/quick-complaint-warranty/`,
        payload,
        token,
      );
      setSuccess({ id: res.id, repair_number: res.repair_number });
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Nie udało się zapisać zgłoszenia.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass =
    "rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0c0d12] to-[#0a0b0f] p-5 shadow-[0_1px_0_rgba(255,255,255,.06)_inset]";
  const labelClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]";

  const pdfKind = repairKind === "warranty" ? "gwarancja" : "reklamacja";

  if (!isStaffOrAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Brak uprawnień.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 pb-16">
      <header className="relative mb-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] px-6 py-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f59e0b]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[#3b82f6]/15 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink2)]">
            <Sparkles size={14} className="text-[#fbbf24]" />
            Reklamacje i gwarancje
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--white)] md:text-3xl">Przyjęcie stacjonarne</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink2)]">
            Wybierz typ sprawy, powiąż z naprawą w systemie (numer ref.) albo — przy gwarancji — wpisz klienta ręcznie. Po zapisie
            wydrukuj potwierdzenie PDF.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="order-last space-y-6 lg:order-none lg:col-span-8">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[#fca5a5]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <section className={cardClass}>
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#f59e0b]" />
              <h2 className="text-lg font-semibold text-[var(--white)]">Typ sprawy</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRepairKind("complaint")}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                  repairKind === "complaint"
                    ? "border-[#f59e0b]/50 bg-[#f59e0b]/15 text-[var(--white)]"
                    : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)]"
                }`}
              >
                Reklamacja
              </button>
              <button
                type="button"
                onClick={() => setRepairKind("warranty")}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                  repairKind === "warranty"
                    ? "border-[#3b82f6]/50 bg-[#3b82f6]/15 text-[var(--white)]"
                    : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)]"
                }`}
              >
                Gwarancja
              </button>
            </div>
            {repairKind === "warranty" ? (
              <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                <p className={labelClass}>Tryb gwarancji</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWarrantyMode("with_parent")}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      warrantyMode === "with_parent"
                        ? "border-white/25 bg-[var(--row-active)] text-[var(--white)]"
                        : "border-[var(--border)] text-[var(--ink2)] hover:bg-[var(--row-hover)]"
                    }`}
                  >
                    Z naprawy w systemie
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarrantyMode("manual")}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      warrantyMode === "manual"
                        ? "border-white/25 bg-[var(--row-active)] text-[var(--white)]"
                        : "border-[var(--border)] text-[var(--ink2)] hover:bg-[var(--row-hover)]"
                    }`}
                  >
                    Ręcznie (bez rekordu naprawy)
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          {needsParentBlock ? (
            <section className={cardClass}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[var(--white)]">Naprawa źródłowa</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Wpisz fragment numeru ref. i szukaj albo wpisz pełny numer — backend dopasuje dokładnie{" "}
                  <span className="font-mono text-[var(--ink2)]">repair_number</span>.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className={labelClass}>Numer / wyszukaj</label>
                  <div className="relative mt-1.5">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      value={refQuery}
                      onChange={(e) => setRefQuery(e.target.value)}
                      placeholder="np. REF-… lub fragment"
                      className="w-full rounded-2xl border border-[var(--border)] bg-[#111318] py-3 pl-10 pr-4 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]/50 focus:ring-2 focus:ring-[#3b82f6]/20"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void runSearch()}
                  disabled={searchLoading || refQuery.trim().length < 2}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-5 py-3 text-sm font-semibold text-[#bfdbfe] transition hover:bg-[#3b82f6]/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Szukaj
                </button>
              </div>

              {searchResults.length > 0 ? (
                <ul className="mt-4 max-h-56 space-y-2 overflow-auto rounded-2xl border border-[var(--border)] bg-[#0a0b0f] p-2">
                  {searchResults.map((r) => {
                    const active = selectedParent?.id === r.id;
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedParent(r);
                            setParentNumberFallback(r.repair_number);
                          }}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                            active
                              ? "border-[#3b82f6]/45 bg-[#3b82f6]/12 text-[var(--white)]"
                              : "border-transparent bg-white/[0.03] text-[#d1d5db] hover:border-[var(--border)]"
                          }`}
                        >
                          <span className="font-mono font-semibold text-[#93c5fd]">{r.repair_number}</span>
                          <span className="mt-0.5 block text-xs text-[var(--ink2)]">
                            {r.client_name} · {r.device_name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <div className="mt-4">
                <label className={labelClass}>Numer naprawy (jeśli wybierzesz ręcznie, bez listy)</label>
                <input
                  value={parentNumberFallback}
                  onChange={(e) => {
                    setParentNumberFallback(e.target.value);
                    setSelectedParent(null);
                  }}
                  placeholder="Dokładny numer ref. z systemu"
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]/50"
                  autoComplete="off"
                />
              </div>
            </section>
          ) : null}

          {needsManualWarranty ? (
            <section className={cardClass}>
              <h2 className="mb-4 text-lg font-semibold text-[var(--white)]">Klient i urządzenie</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Imię</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)]"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Nazwisko</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)]"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefon</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)]"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>E-mail (opcjonalnie)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)]"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass}>Kategoria</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DEVICE_CATEGORY_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setDeviceCategory(c.value)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        deviceCategory === c.value
                          ? "border-[#3b82f6]/45 bg-[#3b82f6]/12 text-[var(--white)]"
                          : "border-[var(--border)] text-[var(--ink2)] hover:bg-[var(--row-hover)]"
                      }`}
                    >
                      <span className="mr-1">{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass}>Marka</label>
                <input
                  value={deviceBrand}
                  onChange={(e) => setDeviceBrand(e.target.value)}
                  placeholder="np. Samsung"
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)]"
                />
              </div>
              <div className="mt-4">
                <label className={labelClass}>Model</label>
                <input
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="np. Galaxy S24"
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)]"
                />
              </div>
              {showHammerGlass ? (
                <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
                  <p className="text-sm font-medium text-[#fde68a]">Folia Hammer Glass / szkło</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setHammerGlassChoice("yes")}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        hammerGlassChoice === "yes"
                          ? "border-amber-400/50 bg-amber-500/20 text-[var(--white)]"
                          : "border-[var(--border)] text-[var(--ink2)]"
                      }`}
                    >
                      Tak
                    </button>
                    <button
                      type="button"
                      onClick={() => setHammerGlassChoice("no")}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        hammerGlassChoice === "no"
                          ? "border-amber-400/50 bg-amber-500/20 text-[var(--white)]"
                          : "border-[var(--border)] text-[var(--ink2)]"
                      }`}
                    >
                      Nie
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className={cardClass}>
            <h2 className="mb-4 text-lg font-semibold text-[var(--white)]">Treść zgłoszenia</h2>
            <div>
              <label className={labelClass}>Opis problemu / zakres</label>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                rows={5}
                placeholder="Opisz reklamację lub gwarancję…"
                className="mt-1.5 w-full resize-y rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
                required
              />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Notatka wewnętrzna (opcjonalnie)</label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                className="mt-1.5 w-full resize-y rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)]"
              />
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[var(--ink2)]">
              <input
                type="checkbox"
                checked={sendConfirmationEmail}
                onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                className="rounded border-white/20 bg-[#111318]"
              />
              Wyślij e-mail potwierdzający (jeśli klient ma realny adres)
            </label>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!token || !canSubmit || submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#dc1e1e] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#dc1e1e]/25 transition hover:bg-[#b81818] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Zapisz przyjęcie
            </button>
            <Link
              href="/panel/reklamacje-gwarancje"
              className="text-sm font-medium text-[var(--ink2)] underline-offset-2 hover:text-[var(--white)] hover:underline"
            >
              Wróć do listy
            </Link>
          </div>
        </div>

        <aside className="order-first lg:order-none lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
          <div className={cardClass}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Podgląd</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[var(--muted)]">Typ</dt>
                <dd className="font-medium text-[var(--white)]">{repairKind === "complaint" ? "Reklamacja" : "Gwarancja"}</dd>
              </div>
              {repairKind === "warranty" ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Tryb</dt>
                  <dd className="text-[#d1d5db]">
                    {warrantyMode === "with_parent" ? "Powiązanie z naprawą" : "Ręczny wpis klienta"}
                  </dd>
                </div>
              ) : null}
              {needsParentBlock ? (
                <div>
                  <dt className="text-xs text-[var(--muted)]">Naprawa źródłowa</dt>
                  <dd className="font-mono text-[#93c5fd]">
                    {selectedParent?.repair_number || parentNumberFallback.trim() || "—"}
                  </dd>
                </div>
              ) : null}
              {needsManualWarranty ? (
                <>
                  <div>
                    <dt className="text-xs text-[var(--muted)]">Klient</dt>
                    <dd className="text-[#d1d5db]">
                      {[firstName, lastName].filter(Boolean).join(" ") || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--muted)]">Urządzenie</dt>
                    <dd className="text-[#d1d5db]">
                      {categoryLabel(deviceCategory)}
                      {[deviceBrand.trim(), deviceModel.trim()].filter(Boolean).join(" ")
                        ? ` · ${[deviceBrand.trim(), deviceModel.trim()].filter(Boolean).join(" ")}`
                        : ""}
                    </dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt className="text-xs text-[var(--muted)]">Opis</dt>
                <dd className="line-clamp-6 whitespace-pre-wrap text-[var(--ink2)]">{problemDescription.trim() || "—"}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </form>

      <AcceptanceProtocolPreviewModal
        open={previewOpen && !!success}
        onClose={() => setPreviewOpen(false)}
        repairId={success?.id ?? ""}
        repairNumber={success?.repair_number}
        token={token}
        variant="complaint-warranty"
      />

      {success ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[#22c55e]">
              <CheckCircle2 size={22} />
              <span className="text-sm font-semibold uppercase tracking-wide">Przyjęto</span>
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Numer zgłoszenia</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--white)]">{success.repair_number}</p>
            <p className="mt-3 text-sm text-[var(--ink2)]">
              Otwórz podgląd PDF, wydrukuj potwierdzenie lub przejdź do karty naprawy.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
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
                Drukuj etykietę QR
              </button>
              <Link
                href={`/panel/naprawy/${success.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3b82f6]/40 bg-[#3b82f6]/12 px-4 py-3 text-sm font-semibold text-[#bfdbfe] transition hover:bg-[#3b82f6]/22"
              >
                <Pencil size={18} />
                Karta naprawy
              </Link>
            </div>
            <p className="mt-4 text-center">
              <button
                type="button"
                onClick={() =>
                  void downloadComplaintWarrantyIntakePdf(success.id, success.repair_number, token, pdfKind)
                }
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
                  setPreviewOpen(false);
                  setSuccess(null);
                  setProblemDescription("");
                  setInternalNotes("");
                  setSendConfirmationEmail(false);
                  setRefQuery("");
                  setSearchResults([]);
                  setSelectedParent(null);
                  setParentNumberFallback("");
                  setFirstName("");
                  setLastName("");
                  setPhone("");
                  setEmail("");
                  setDeviceBrand("");
                  setDeviceModel("");
                  setHammerGlassChoice(null);
                  setDeviceCategory("phone");
                  setRepairKind("complaint");
                  setWarrantyMode("with_parent");
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
