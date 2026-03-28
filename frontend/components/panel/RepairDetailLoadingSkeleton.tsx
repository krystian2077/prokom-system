"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export function RepairDetailLoadingSkeleton({ listHref, backLabel }: { listHref: string; backLabel: string }) {
  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={listHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
          >
            <ArrowLeft size={18} />
            {backLabel}
          </Link>
          <Skeleton className="h-10 w-52 rounded-2xl" />
        </div>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <Skeleton className="h-[50px] w-[50px] shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-8 w-full max-w-lg" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </section>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <Skeleton key={i} className="h-10 w-[6.5rem] rounded-2xl" />
            ))}
          </div>
        </section>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <Skeleton variant="card" className="h-44" />
            <Skeleton variant="card" className="h-36" />
          </div>
          <div className="space-y-3 lg:col-span-5">
            <Skeleton variant="card" className="min-h-[280px]" />
          </div>
        </div>
      </div>
    </main>
  );
}

/** Uproszczony szkielet (np. podgląd tylko do odczytu). */
export function RepairPreviewLoadingSkeleton() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Skeleton className="h-5 w-64" />
      <Skeleton variant="card" className="h-36" />
      <Skeleton variant="card" className="h-48" />
    </main>
  );
}
