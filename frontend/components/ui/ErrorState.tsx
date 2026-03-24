"use client";

interface ErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = "Nie można załadować danych",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--rb)] bg-[var(--rl)] text-xl text-[var(--red)]">
        ⚠
      </div>
      <div className="mb-1 text-[13.5px] font-semibold text-[var(--ink)]">{title}</div>
      {error?.message && (
        <p className="mb-4 max-w-[240px] text-[11.5px] text-[var(--muted)]">{error.message}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[9px] border border-[var(--border2)] bg-[var(--s3)] px-4 py-2 text-[12px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--s4)]"
        >
          Spróbuj ponownie
        </button>
      )}
    </div>
  );
}
