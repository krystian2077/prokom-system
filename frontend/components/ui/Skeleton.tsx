"use client";

interface SkeletonProps {
  className?: string;
  variant?: "line" | "circle" | "card" | "table-row";
}

export function Skeleton({ className = "", variant = "line" }: SkeletonProps) {
  const base =
    "animate-pulse rounded bg-gradient-to-r from-[var(--s3)] via-[var(--s4)] to-[var(--s3)] bg-[length:200%_100%] animate-shimmer";

  if (variant === "circle") return <div className={`${base} rounded-full ${className}`} />;
  if (variant === "card") return <div className={`${base} h-24 rounded-2xl ${className}`} />;
  if (variant === "table-row")
    return (
      <div className="flex items-center gap-3 border-b border-[var(--border)] p-3">
        <div className={`${base} h-4 w-16 rounded`} />
        <div className={`${base} h-4 flex-1 rounded`} />
        <div className={`${base} h-4 w-24 rounded`} />
        <div className={`${base} h-6 w-20 rounded-full`} />
      </div>
    );
  return <div className={`${base} h-4 rounded ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[13px] border border-[var(--border)] bg-[var(--s1)] p-[13px]">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton variant="circle" className="h-8 w-8" />
      </div>
      <Skeleton className="mb-1 h-8 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function RepairTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[15px] border border-[var(--border)] bg-[var(--s1)]">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="table-row" />
      ))}
    </div>
  );
}

/** Jedna kolumna listy odbiorów (karty napraw). */
export function PickupColumnSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-4 w-full max-w-[200px]" />
          <Skeleton className="mt-2 h-3 w-4/5 max-w-[240px]" />
        </div>
      ))}
    </div>
  );
}

/** Lista powiadomień (wiersz z ikoną + tekstem). */
export function NotificationFeedSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-white/5 bg-[#0f1117]/50 p-4">
          <Skeleton className="h-[30px] w-[30px] shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 max-w-md" />
            <Skeleton className="h-3 w-full max-w-lg" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Prosta lista pozioma (reklamacje, workload). */
export function StackedRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-[#0b0c10] p-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-2 h-3 w-full max-w-xl" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Lista zadań (checkbox + 2 linie). */
export function TaskListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-white/10 bg-[#0f1117] p-3">
          <Skeleton className="mt-1 h-4 w-4 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-[88%] max-w-md" />
            <Skeleton className="h-3 w-[55%] max-w-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lewa kolumna komunikacji — lista wątków. */
export function CommThreadListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 px-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1117]/50 p-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <Skeleton className="mt-2 h-2.5 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Karty pracowników (zespół). */
export function StaffCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <div className="flex justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-8 w-16 shrink-0 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-8 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
