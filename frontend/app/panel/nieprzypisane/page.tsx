"use client";

import { Suspense } from "react";
import { UnassignedRepairsView } from "@/components/panel/UnassignedRepairsView";

export default function NieprzypisanePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
          <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-4 text-[#9ca3af]">Ładowanie…</div>
        </main>
      }
    >
      <UnassignedRepairsView basePath="/panel/nieprzypisane" />
    </Suspense>
  );
}
