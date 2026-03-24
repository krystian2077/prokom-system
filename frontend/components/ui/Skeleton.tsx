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
