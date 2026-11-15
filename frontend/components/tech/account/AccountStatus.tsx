import type { ReactNode } from "react";

/** Quiet loading / redirect state of the client account (Tech skin). */
export function AccountStatus({ children }: { children: ReactNode }) {
  return (
    <div className="t-ui t-container t-ck t-ck-status" role="status" aria-live="polite">
      <span className="t-ck-status__spin" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
