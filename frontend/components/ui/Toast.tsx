"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store";

export function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed right-5 top-[76px] z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              pointer-events-auto flex max-w-[320px] items-center gap-2.5 rounded-[11px] border px-4 py-3 text-[12.5px] font-bold
              shadow-[0_8px_24px_rgba(0,0,0,.4)]
              ${toast.type === "success" ? "border-[var(--gb)] text-[var(--green)]" : ""}
              ${toast.type === "error" ? "border-[var(--rb)] text-[#ff6b6b]" : ""}
              ${toast.type === "info" ? "border-[var(--bb)] text-[var(--blue)]" : ""}
              bg-[var(--s2)]
            `}
          >
            <span className="text-base">
              {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
            </span>
            <span className="flex-1">{toast.msg}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ml-1 text-[var(--ink)] opacity-50 hover:opacity-100"
              aria-label="Zamknij"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
