"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      btn: "bg-gradient-to-br from-[var(--red)] to-[var(--red-h)] text-white shadow-[0_4px_12px_rgba(220,30,30,.3)]",
      icon: "⚠️",
    },
    warning: {
      btn: "border border-[var(--ab)] bg-[var(--al)] text-[var(--amber)]",
      icon: "⚠",
    },
    info: {
      btn: "border border-[var(--bb)] bg-[var(--bl)] text-[var(--blue)]",
      icon: "ℹ",
    },
  };

  const vs = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[1000] flex animate-[fadeUp_.2s_ease] items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[420px] max-w-[95vw] overflow-hidden rounded-[18px] border border-[var(--border2)] bg-[var(--s2)] shadow-[0_20px_60px_rgba(0,0,0,.55)]">
        <div className="flex items-start gap-3 p-5">
          <div className="mt-0.5 text-2xl">{vs.icon}</div>
          <div>
            <div className="mb-1 font-display text-[14px] font-black text-[var(--white)]">{title}</div>
            <p className="text-[12.5px] leading-relaxed text-[var(--ink2)]">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[10px] border border-[var(--border)] bg-[var(--s3)] px-4 py-2.5 text-[12.5px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--s4)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-[10px] px-4 py-2.5 text-[12.5px] font-bold transition-all hover:-translate-y-px ${vs.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "info";
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<
    ConfirmOptions & {
      isOpen: boolean;
    }
  >({ isOpen: false, title: "", description: "" });

  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...opts, isOpen: true, variant: opts.variant ?? "danger" });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        isOpen={state.isOpen}
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        variant={state.variant ?? "danger"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm musi być używany wewnątrz <ConfirmProvider>.");
  }
  return ctx;
}
