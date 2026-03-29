"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useWorkerStore } from "@/stores/workerStore";
import {
  getSuggestedNextQuickStatus,
  normalizeStatusToQuickChangeValue,
  quickChangeOptionLabel,
} from "@/lib/repairStatusOptions";

/**
 * Pasek nad zakładkami szczegółów naprawy: sugerowany następny status + skrót do modala.
 */
export function SuggestedNextStatusStrip({
  repairId,
  currentStatus,
}: {
  repairId: string;
  currentStatus: string | null | undefined;
}) {
  const openStatusModal = useWorkerStore((s) => s.openStatusModal);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [currentStatus, repairId]);

  const currentQuick = useMemo(
    () => normalizeStatusToQuickChangeValue(currentStatus),
    [currentStatus],
  );
  const suggestedNext = useMemo(() => getSuggestedNextQuickStatus(currentQuick), [currentQuick]);

  if (!suggestedNext) return null;
  if (dismissed) return null;

  const label = quickChangeOptionLabel(suggestedNext);

  return (
    <div className="rounded-2xl border border-[#22c55e]/30 bg-gradient-to-r from-[#14532d]/35 via-[#0f1720]/90 to-[var(--s1)] px-4 py-3 shadow-[inset_0_1px_0_rgba(34,197,94,0.12)] backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#22c55e]/35 bg-[#22c55e]/15 text-[#86efac]"
            aria-hidden
          >
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86efac]/90">Sugerowany następny status</div>
            <p className="mt-1 text-sm font-semibold leading-snug text-[var(--white)]">{label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink2)]">
              Typowy kolejny krok w procesie — możesz go szybko ustawić albo otworzyć pełną zmianę statusu.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => openStatusModal(repairId, suggestedNext)}
            className="rounded-xl bg-[#22c55e] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-[#22c55e]/25 transition hover:bg-[#16a34a]"
          >
            Zastosuj sugestię
          </button>
          <button
            type="button"
            onClick={() => openStatusModal(repairId)}
            className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
          >
            Inny status…
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl border border-transparent px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--ink2)]"
          >
            Ukryj
          </button>
        </div>
      </div>
    </div>
  );
}
