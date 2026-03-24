"use client";

/** Wskaźnik „na żywo” przy ScopeBar — PROKOM_DOKUMENTACJA_FRONTEND §8.1 */
export function LiveBadge() {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-[var(--gb)] bg-[var(--gl)] px-3 py-2">
      <span
        className="h-2 w-2 rounded-full bg-[var(--green)]"
        style={{ boxShadow: "0 0 12px rgba(34,197,94,.5)", animation: "pulse 1.6s ease-in-out infinite" }}
      />
      <span className="text-[12px] font-bold text-[var(--green)]">Live</span>
    </div>
  );
}
