"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Printer, X } from "lucide-react";
import { fetchAcceptanceProtocolPdf, fetchComplaintWarrantyIntakePdf } from "@/lib/acceptance-pdf";

type AcceptanceProtocolPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  repairId: string;
  repairNumber?: string;
  token: string | null;
  /** Domyślnie protokół przyjęcia; `complaint-warranty` — PDF reklamacji/gwarancji. */
  variant?: "acceptance" | "complaint-warranty";
};

/**
 * Podgląd PDF (protokół przyjęcia lub potwierdzenie reklamacji/gwarancji) w iframe + druk.
 */
export function AcceptanceProtocolPreviewModal({
  open,
  onClose,
  repairId,
  repairNumber,
  token,
  variant = "acceptance",
}: AcceptanceProtocolPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !repairId) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setBlobUrl(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const fetchPdf =
      variant === "complaint-warranty" ? fetchComplaintWarrantyIntakePdf : fetchAcceptanceProtocolPdf;

    void fetchPdf(repairId, token)
      .then((blob) => {
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        objectUrlRef.current = u;
        setBlobUrl(u);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Nie udało się wczytać PDF.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [open, repairId, token, variant]);

  const handlePrint = () => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.focus();
    w.print();
  };

  if (!open) return null;

  /** z-[400]: nad PanelTopbar (z-110) i dropdownem wyszukiwarki (z-300), żeby pasek akcji był klikalny */
  const modal = (
    <div
      className="fixed inset-0 z-[400] flex flex-col bg-black/85 pt-[env(safe-area-inset-top)] backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="pdf-preview-title"
    >
      <div className="flex min-h-0 flex-1 flex-col px-2 pb-[env(safe-area-inset-bottom)] pt-2 sm:px-4 sm:pb-4 sm:pt-4">
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--s1)] shadow-2xl">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p
                id="pdf-preview-title"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]"
              >
                {variant === "complaint-warranty"
                  ? "Podgląd wydruku — reklamacja / gwarancja"
                  : "Podgląd wydruku — protokół przyjęcia"}
              </p>
              {repairNumber ? (
                <p className="mt-0.5 truncate font-mono text-sm font-semibold text-[var(--white)]">{repairNumber}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!blobUrl || !!error}
                className="inline-flex items-center gap-2 rounded-xl bg-[#dc1e1e] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#dc1e1e]/25 transition hover:bg-[#b81818] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Drukuj
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[var(--row-hover)] px-3 py-2.5 text-sm font-medium text-[#d1d5db] transition hover:bg-[var(--row-active)]"
              >
                <X className="h-4 w-4" />
                Zamknij
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 bg-[#1a1a1a]">
            {loading ? (
              <div className="flex h-full min-h-[40vh] items-center justify-center gap-2 text-sm text-[var(--ink2)]">
                <Loader2 className="h-5 w-5 animate-spin" />
                Wczytywanie podglądu…
              </div>
            ) : null}
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-300">
                {error}
              </div>
            ) : null}
            {blobUrl && !error ? (
              <iframe
                ref={iframeRef}
                title={variant === "complaint-warranty" ? "Podgląd PDF reklamacja/gwarancja" : "Podgląd protokołu przyjęcia PDF"}
                src={blobUrl}
                className="h-full min-h-[40vh] w-full border-0 bg-white"
              />
            ) : null}
          </div>

          <p className="shrink-0 border-t border-[var(--border)] px-3 py-2 text-center text-[11px] text-[var(--muted)] sm:px-4">
            Jeśli podgląd jest pusty, użyj „Pobierz PDF” lub otwórz ponownie z karty naprawy.
          </p>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
