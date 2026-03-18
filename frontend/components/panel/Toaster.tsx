"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useWorkerStore } from "@/stores/workerStore";

const colorByType: Record<"success" | "error" | "info", { bg: string; border: string; text: string }> = {
  success: { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.28)", text: "#86efac" },
  error: { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#ffb4b4" },
  info: { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#bcd6ff" },
};

export function Toaster() {
  const toasts = useWorkerStore((s) => s.toasts);
  const dismissToast = useWorkerStore((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-auto fixed right-4 top-[72px] z-[500]"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const c = colorByType[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mb-3 w-full max-w-[420px] rounded-2xl border px-4 py-3"
              style={{
                background: c.bg,
                borderColor: c.border,
                color: c.text,
              }}
              onClick={() => dismissToast(t.id)}
              role="status"
            >
              <span className="text-sm font-semibold">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

