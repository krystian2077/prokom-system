"use client";

import type { ReactNode } from "react";
import { Bell, Check, Mail, Sparkles, Star } from "lucide-react";

type StaffRow = {
  id: string;
  picker_label: string;
};

type CategoryOpt = { value: string; label: string; icon: string };

type IntakePreviewPanelProps = {
  categoryOptions: CategoryOpt[];
  categoryLabel: (v: string) => string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  linkedFromDb: boolean;
  deviceCategory: string;
  /** Jedno pole: marka i model (np. „Samsung Galaxy S24”) */
  deviceBrandModel: string;
  deviceColor: string;
  visualCondition: string;
  serviceType: string;
  problemDescription: string;
  accEtui: boolean;
  accSim: boolean;
  accCharger: boolean;
  accCable: boolean;
  accBox: boolean;
  estimatedCost: string;
  estimatedCompletionDate: string;
  internalNotes: string;
  sendConfirmationEmail: boolean;
  assignmentChoice: string | null;
  staffRows: StaffRow[];
  currentUserId: string | undefined;
  canSubmit: boolean;
  submitting: boolean;
  /** Telefon / tablet / smartwatch — decyzja klienta w sprawie folii / szkła */
  showHammerGlass: boolean;
  hammerGlassChoice: "yes" | "no" | null;
};

function formatPln(raw: string): string {
  const s = raw.trim().replace(",", ".");
  if (!s) return "—";
  const n = Number.parseFloat(s);
  if (Number.isNaN(n)) return raw.trim();
  return `${n.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} zł`;
}

function formatEta(isoDate: string): string {
  if (!isoDate.trim()) return "—";
  try {
    const d = new Date(isoDate + "T12:00:00");
    return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return isoDate;
  }
}

function accessoriesSummary(
  a: Pick<
    IntakePreviewPanelProps,
    "accEtui" | "accSim" | "accCharger" | "accCable" | "accBox"
  >,
): string {
  const parts: string[] = [];
  if (a.accEtui) parts.push("Etui");
  if (a.accSim) parts.push("SIM");
  if (a.accCharger) parts.push("Ładowarka");
  if (a.accCable) parts.push("Kabel");
  if (a.accBox) parts.push("Pudełko");
  return parts.length ? parts.join(", ") : "—";
}

function assignmentDisplay(
  choice: string | null,
  staffRows: StaffRow[],
  currentUserId: string | undefined,
): { line: string; sub?: string } {
  if (choice === null) {
    return { line: "Automatycznie (sugestia systemu)", sub: "Po zapisie przypiszemy wg kategorii" };
  }
  if (choice === "none") {
    return { line: "Bez przypisania", sub: "Kolejka nieprzypisanych" };
  }
  const s = staffRows.find((x) => x.id === choice);
  const me = currentUserId && choice === currentUserId;
  return {
    line: s ? `${s.picker_label}${me ? " (ja)" : ""}` : "—",
    sub: s ? undefined : undefined,
  };
}

function Row({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.06] py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</div>
      <div className={`text-sm font-semibold leading-snug text-[var(--white)] ${valueClassName ?? ""}`}>{children}</div>
    </div>
  );
}

export function IntakePreviewPanel({
  categoryOptions,
  categoryLabel,
  firstName,
  lastName,
  phone,
  email,
  linkedFromDb,
  deviceCategory,
  deviceBrandModel,
  deviceColor,
  visualCondition,
  serviceType,
  problemDescription,
  accEtui,
  accSim,
  accCharger,
  accCable,
  accBox,
  estimatedCost,
  estimatedCompletionDate,
  internalNotes,
  sendConfirmationEmail,
  assignmentChoice,
  staffRows,
  currentUserId,
  canSubmit,
  submitting,
  showHammerGlass,
  hammerGlassChoice,
}: IntakePreviewPanelProps) {
  const catOpt = categoryOptions.find((c) => c.value === deviceCategory);
  const clientName = [firstName, lastName].filter(Boolean).join(" ").trim() || "—";
  const dm = deviceBrandModel.trim();
  const deviceSubtitle = deviceColor.trim() ? ` · ${deviceColor.trim()}` : "";
  const deviceLine = dm ? `${dm}${deviceSubtitle}` : deviceSubtitle ? `—${deviceSubtitle}` : "—";
  const scopeBlock = [serviceType.trim(), problemDescription.trim()].filter(Boolean).join(" — ") || "—";
  const assign = assignmentDisplay(assignmentChoice, staffRows, currentUserId);
  const notesShort =
    internalNotes.trim().length > 120 ? `${internalNotes.trim().slice(0, 120)}…` : internalNotes.trim() || "—";

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-[#0a0b0e] shadow-[0_24px_64px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.05)]">
      <div
        className="border-b border-white/[0.07] bg-gradient-to-br from-[#12131a] via-[#0c0d12] to-[#08090c] px-5 py-5"
        style={{ backgroundImage: "radial-gradient(ellipse 120% 80% at 100% -20%, rgba(220,30,30,.12), transparent 50%)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink2)]">Podgląd zgłoszenia</p>
            <p className="mt-3 font-mono text-[1.65rem] font-bold leading-none tracking-tight text-[var(--white)]">PRO-KOM</p>
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">Numer nadamy po zapisie</p>
          </div>
          <div className="rounded-2xl border border-[#fbbf24]/25 bg-[#fbbf24]/[0.07] px-3 py-2 text-right">
            <Sparkles className="mx-auto mb-1 h-4 w-4 text-[#fbbf24]" />
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a8a29e]">Live</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <Row label="Klient">
          <div>
            <span className="inline-flex flex-wrap items-center gap-2">
              <span>{clientName}</span>
              {linkedFromDb ? (
                <Star className="inline h-3.5 w-3.5 shrink-0 fill-[#fbbf24] text-[#fbbf24]" aria-hidden />
              ) : null}
              {linkedFromDb ? (
                <span className="rounded-full border border-[#fbbf24]/30 bg-[#fbbf24]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fde68a]">
                  Z bazy
                </span>
              ) : null}
            </span>
            <p className="mt-1.5 text-xs font-normal text-[var(--ink2)]">
              {phone || "—"}
              {email ? ` · ${email}` : ""}
            </p>
          </div>
        </Row>

        <div className="mt-2">
          <Row label="Urządzenie">{deviceLine}</Row>
        </div>

        <Row label="Kategoria">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#3b82f6]/35 bg-[#3b82f6]/12 px-3 py-1 text-[13px] font-semibold text-[#bfdbfe]">
            <span className="text-base leading-none">{catOpt?.icon ?? "🧩"}</span>
            {categoryLabel(deviceCategory)}
          </span>
        </Row>

        <Row label="Usługa / zakres">
          <span className="whitespace-pre-wrap font-medium text-[#e5e7eb]">{scopeBlock}</span>
        </Row>

        {visualCondition.trim() ? (
          <Row label="Stan wizualny">
            <span className="font-normal text-[#d1d5db]">{visualCondition.trim()}</span>
          </Row>
        ) : null}

        <Row label="Akcesoria">{accessoriesSummary({ accEtui, accSim, accCharger, accCable, accBox })}</Row>

        {showHammerGlass ? (
          <Row label="Folia Hammer Glass / szkło hartowane">
            {hammerGlassChoice === "yes" ? (
              <span className="text-[#86efac]">Tak — klient zainteresowany (wycena przy naprawie)</span>
            ) : hammerGlassChoice === "no" ? (
              <span className="text-[var(--ink2)]">Nie — brak zainteresowania</span>
            ) : (
              <span className="text-amber-300/90">Wybierz Tak lub Nie</span>
            )}
          </Row>
        ) : null}

        <Row label="Priorytet">
          <span className="text-[#e5e7eb]">Standardowy</span>
        </Row>

        <Row label="Termin (ETA)" valueClassName="!text-[#fbbf24]">
          {formatEta(estimatedCompletionDate)}
        </Row>

        <Row label="Wstępna wycena">{formatPln(estimatedCost)}</Row>

        <Row label="E-mail potwierdzenie">
          {sendConfirmationEmail && email.trim() ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#4ade80]">
              <Check className="h-4 w-4 shrink-0" /> Zostanie wysłany
            </span>
          ) : sendConfirmationEmail ? (
            <span className="text-amber-300/90">Zaznaczono — brak adresu e-mail</span>
          ) : (
            <span className="text-[var(--ink2)]">Nie</span>
          )}
        </Row>

        <Row label="Przypisany">
          <span className={assign.line.includes("Automatycznie") ? "text-[#86efac]" : "text-[#93c5fd]"}>{assign.line}</span>
          {assign.sub ? <span className="mt-0.5 block text-xs font-normal text-[var(--ink2)]">{assign.sub}</span> : null}
        </Row>

        {internalNotes.trim() ? (
          <Row label="Notatka wewn.">
            <span className="font-normal text-[#a1a1aa]">{notesShort}</span>
          </Row>
        ) : null}
      </div>

      <div className="border-t border-white/[0.06] bg-[#060708]/90 px-5 py-4">
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#dc1e1e] py-3.5 text-sm font-bold text-white shadow-[0_8px_28px_rgba(220,30,30,.35)] transition hover:bg-[#b81818] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? (
            "Przyjmuję…"
          ) : (
            <>
              <Check className="h-4 w-4" />
              Przyjmij zgłoszenie
            </>
          )}
        </button>
      </div>

      <div className="flex items-start gap-2 border-t border-white/[0.06] bg-[#111318]/80 px-4 py-3 text-[11px] leading-snug text-[var(--ink2)]">
        <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
        <span>
          Po zapisaniu pracownik przypisany do naprawy otrzyma powiadomienie w systemie
          {sendConfirmationEmail && email.trim() ? (
            <span className="inline-flex items-center gap-1">
              {" "}
              · <Mail className="h-3 w-3 shrink-0 text-[#60a5fa]" aria-hidden />
              <span>klient może dostać e-mail</span>
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
