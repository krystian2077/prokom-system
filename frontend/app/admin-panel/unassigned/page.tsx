"use client";

import { Suspense } from "react";
import { UnassignedRepairsView } from "@/components/panel/UnassignedRepairsView";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

export default function AdminUnassignedPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <RepairTableSkeleton rows={8} />
          </div>
        </main>
      }
    >
      <UnassignedRepairsView
        basePath="/admin-panel/unassigned"
        mode="admin"
        detailBasePath="/admin-panel/repairs"
      />
    </Suspense>
  );
}

