"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairDetail } from "@/types/repairs";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairPreviewLoadingSkeleton } from "@/components/panel/RepairDetailLoadingSkeleton";

export default function PodgladNaprawyPage() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const query = useQuery({
    queryKey: ["repair", "readonly-preview", id],
    enabled: Boolean(token && id),
    queryFn: async () => {
      if (!token || !id) throw new Error("Missing token/id");
      return api.get<RepairDetail>(`/staff/repairs/${id}/`, token);
    },
  });

  if (query.isLoading) {
    return <RepairPreviewLoadingSkeleton />;
  }

  if (query.error || !query.data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <ErrorState
          error={query.error instanceof Error ? query.error : new Error("Nie udało się pobrać podglądu.")}
          onRetry={() => void query.refetch()}
          title="Błąd podglądu"
        />
      </main>
    );
  }

  const r = query.data;
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-3 text-sm text-[#cfe3ff]">
        Podgląd tylko do odczytu — ta naprawa jest przypisana do innego pracownika.
      </div>
      <div className="mt-4 rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-mono text-lg font-semibold text-white">{r.repair_number}</h1>
          <Link href="/panel/wszystkie" className="text-sm font-semibold text-[#93c5fd] hover:underline">
            Wróć do wszystkich
          </Link>
        </div>
        <div className="mt-3 text-sm text-[#e5e7eb]">{r.device_name} · {r.client.full_name}</div>
        <div className="mt-2 text-sm text-[#9ca3af]">Status: {r.status_display}</div>
        <div className="mt-4 whitespace-pre-wrap text-sm text-[#d1d5db]">{r.problem_description || "Brak opisu."}</div>
      </div>
    </main>
  );
}
