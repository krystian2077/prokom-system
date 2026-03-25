"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authApi, ApiError, getErrorMessageFromBody } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import { useWorkerStore } from "@/stores/workerStore";
import { Info, RotateCcw } from "lucide-react";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 20;

type DeviceBucket = "phone_tablet" | "laptop_printer" | "general";

function deviceBucket(deviceName: string): DeviceBucket {
  const n = (deviceName ?? "").toLowerCase();
  const phoneKeywords = [
    "iphone",
    "ipad",
    "ipod",
    "pixel",
    "galaxy s",
    "galaxy a",
    "galaxy note",
    "galaxy z",
    "oneplus",
    "xiaomi",
    "oppo",
    "realme",
    "huawei",
    "telefon",
    "smartfon",
    "tablet",
    "watch",
    "zegarek",
    "apple watch",
  ];
  const laptopKeywords = [
    "macbook",
    "laptop",
    "notebook",
    "dell",
    "hp ",
    "lenovo",
    "asus",
    "acer",
    "msi",
    "komputer",
    "komputer stacjonarny",
    "pc ",
    "playstation",
    "xbox",
    "nintendo",
    "drukark",
    "printer",
    "imac",
  ];
  if (phoneKeywords.some((k) => n.includes(k))) return "phone_tablet";
  if (laptopKeywords.some((k) => n.includes(k))) return "laptop_printer";
  return "general";
}

function categoryLabel(bucket: DeviceBucket): string {
  switch (bucket) {
    case "phone_tablet":
      return "Telefon / tablet";
    case "laptop_printer":
      return "Laptop / druk";
    default:
      return "Inne / ogólne";
  }
}

function suggestedTeamLabel(bucket: DeviceBucket): string {
  switch (bucket) {
    case "phone_tablet":
      return "Telefony, tablety";
    case "laptop_printer":
      return "Laptopy, drukarki";
    default:
      return "Ogólne";
  }
}

type WaitLevel = 0 | 1 | 2 | 3;

function waitingMeta(createdAt: string): { level: WaitLevel; label: string; suffix: string } {
  const t0 = new Date(createdAt).getTime();
  const hours = (Date.now() - t0) / (3600 * 1000);
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const label = h > 0 ? `${h}h ${m}min` : `${Math.max(0, m)} min`;

  if (hours < 3) return { level: 0, label, suffix: "" };
  if (hours < 12) return { level: 1, label, suffix: "" };
  if (hours < 24) return { level: 2, label, suffix: " ⚠" };
  return { level: 3, label, suffix: " ⚠⚠" };
}

function waitStyle(level: WaitLevel) {
  if (level === 0) return { color: "#fbbf24", bg: "rgba(251,191,36,.12)" };
  if (level === 1) return { color: "#fb923c", bg: "rgba(251,146,60,.14)" };
  if (level === 2) return { color: "#f97316", bg: "rgba(249,115,22,.16)" };
  return { color: "#ef4444", bg: "rgba(239,68,68,.16)" };
}

function matchesSpecialization(specialization: string | null | undefined, bucket: DeviceBucket): boolean {
  if (!specialization) return false;
  if (specialization === "general") return true;
  if (specialization === "phone_tablet") return bucket === "phone_tablet";
  if (specialization === "laptop_printer") return bucket === "laptop_printer";
  return false;
}

export function UnassignedRepairsView({ basePath }: { basePath: string }) {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const addToast = useWorkerStore((s) => s.addToast);

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [postingFor, setPostingFor] = useState<string | null>(null);

  const spec = user?.staff_profile?.specialization ?? null;
  const specDisplay = user?.staff_profile?.specialization_display ?? null;

  const repairsQuery = useQuery({
    queryKey: ["repairs", "unassigned-new", refreshTick],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing auth/token");
      return api.get<RepairRequestListItem[]>(
        `/staff/repairs/?unassigned_only=1&status=new&ordering=created_at`,
        token,
      );
    },
    staleTime: 10_000,
  });

  const list = repairsQuery.data ?? [];
  const oldest = list[0] ?? null;

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${basePath}?${params.toString()}`);
  };

  async function postNote(repairId: string, body: string) {
    setPostingFor(repairId);
    try {
      await authApi.post(`/repairs/${repairId}/notes/`, { note: body, note_type: "internal" });
      addToast("✓ Powiadomienie wysłane do admina", "success");
      await queryClient.invalidateQueries({ queryKey: ["repairs", "unassigned-new"] });
      await queryClient.invalidateQueries({ queryKey: ["sidebar", "unassigned-count"] });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? getErrorMessageFromBody(e.body ?? "", "Nie udało się wysłać notatki.")
          : "Nie udało się wysłać notatki.";
      addToast(msg, "error");
    } finally {
      setPostingFor(null);
    }
  }

  function onUrgent() {
    if (!oldest) return;
    const human = new Date(oldest.created_at).toLocaleString("pl-PL");
    void postNote(
      oldest.id,
      `Proszę o pilne przypisanie — naprawa ${oldest.repair_number} czeka w kolejce od ${human}.`,
    );
  }

  function onSuggest(r: RepairRequestListItem, bucket: DeviceBucket) {
    const team = suggestedTeamLabel(bucket);
    const line =
      specDisplay != null
        ? `Sugestia przypisania: ${r.repair_number} (${team}) — pasuje do mojej specjalizacji (${specDisplay}). Proponuję przypisanie do mnie.`
        : `Sugestia przypisania: ${r.repair_number} (${team}) — proszę o rozpatrzenie przypisania do mnie.`;
    void postNote(r.id, line);
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Pracownik</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Nieprzypisane</h1>
            <p className="mt-1 text-sm text-[#9ca3af]">Kolejka zgłoszeń ze statusem „nowe”, bez przypisanego pracownika</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={16} />
                Odśwież
              </span>
            </button>
            <Link
              href="/panel/intake"
              className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
            >
              Nowe przyjęcie
            </Link>
          </div>
        </header>

        <div
          className="flex gap-3 rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(59,130,246,.35)",
            background: "rgba(59,130,246,.10)",
            color: "rgba(226,232,240,.95)",
          }}
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#60a5fa]" aria-hidden />
          <div>
            <p className="font-semibold text-white">Tryb tylko do odczytu</p>
            <p className="mt-1 text-[#cbd5e1]">
              Nie możesz samodzielnie przypisać naprawy — kolejkę obsługuje administrator. Możesz wysłać notatkę wewnętrzną do
              admina (pilne przypisanie lub sugestia wg specjalizacji).
            </p>
          </div>
        </div>

        {oldest ? (
          <div
            className="flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: "rgba(239,68,68,.45)",
              background: "rgba(239,68,68,.12)",
            }}
          >
            <div>
              <p className="text-sm font-semibold text-[#fecaca]">Najdłużej w kolejce</p>
              <p className="mt-1 font-mono text-lg text-white">{oldest.repair_number}</p>
              <p className="mt-0.5 text-sm text-[#fca5a5]">
                {oldest.device_name} · od {new Date(oldest.created_at).toLocaleString("pl-PL")}
              </p>
            </div>
            <button
              type="button"
              disabled={postingFor === oldest.id}
              onClick={onUrgent}
              className="shrink-0 rounded-xl bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b91c1c] disabled:opacity-60"
            >
              {postingFor === oldest.id ? "Wysyłanie…" : "Pilnie → Admin"}
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f1117]">
          {repairsQuery.isLoading ? (
            <div className="p-4">
              <RepairTableSkeleton rows={8} />
            </div>
          ) : repairsQuery.error ? (
            <div className="px-4 py-8">
              <ErrorState
                error={repairsQuery.error instanceof Error ? repairsQuery.error : new Error("Nie udało się pobrać listy napraw.")}
                onRetry={() => void repairsQuery.refetch()}
                title="Błąd listy nieprzypisanych"
              />
            </div>
          ) : slice.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState
                icon={EMPTY_STATES.unassigned.icon}
                title={EMPTY_STATES.unassigned.title}
                description="Brak zgłoszeń w statusie „nowe” bez przypisanego pracownika."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-4 py-3 font-semibold">Nr ref</th>
                    <th className="px-4 py-3 font-semibold">Urządzenie</th>
                    <th className="px-4 py-3 font-semibold">Klient</th>
                    <th className="px-4 py-3 font-semibold">Kategoria</th>
                    <th className="px-4 py-3 font-semibold">Oczekiwanie</th>
                    <th className="px-4 py-3 font-semibold">Sugerowany</th>
                    <th className="px-4 py-3 font-semibold text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r) => {
                    const bucket = deviceBucket(r.device_name);
                    const wait = waitingMeta(r.created_at);
                    const ws = waitStyle(wait.level);
                    const showSuggest = matchesSpecialization(spec, bucket);
                    return (
                      <tr key={r.id} className="border-b border-white/[0.06] transition hover:bg-white/[0.03]">
                        <td className="px-4 py-3 align-middle">
                          <Link href={`/panel/naprawy/${r.id}`} className="font-mono font-semibold text-[#93c5fd] hover:underline">
                            {r.repair_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-middle text-white">{r.device_name}</td>
                        <td className="px-4 py-3 align-middle text-[#e5e7eb]">{r.client_name}</td>
                        <td className="px-4 py-3 align-middle text-[#cbd5e1]">{categoryLabel(bucket)}</td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                            style={{ color: ws.color, background: ws.bg, borderColor: `${ws.color}55` }}
                          >
                            {wait.label}
                            {wait.suffix}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle text-[#9ca3af]">{suggestedTeamLabel(bucket)}</td>
                        <td className="px-4 py-3 align-middle text-right">
                          {showSuggest ? (
                            <button
                              type="button"
                              disabled={postingFor === r.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSuggest(r, bucket);
                              }}
                              className="rounded-lg border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] transition hover:bg-[#3b82f6]/25 disabled:opacity-60"
                            >
                              {postingFor === r.id ? "…" : "Sugestia"}
                            </button>
                          ) : (
                            <span className="text-xs text-[#6b7280]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!repairsQuery.isLoading && slice.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
              <p className="text-sm text-[#9ca3af]">
                Strona <span className="font-semibold text-white">{safePage}</span> / {pageCount}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  Wstecz
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                  disabled={safePage >= pageCount}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  Dalej
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="rounded-2xl border border-white/10 bg-[#0b0c10] px-4 py-4 text-sm text-[#9ca3af]">
          <p className="font-semibold text-white">Twoja specjalizacja</p>
          <p className="mt-2">
            {specDisplay ? (
              <>
                W profilu serwisowym: <span className="text-[#e5e7eb]">{specDisplay}</span>. Przycisk „Sugestia” pojawia się przy
                zgłoszeniach zgodnych z tym zakresem (oraz przy „ogólnych”, jeśli masz specjalizację ogólną).
              </>
            ) : (
              <>Brak ustawionej specjalizacji w profilu — skontaktuj się z administratorem, aby móc wysyłać dopasowane sugestie.</>
            )}
          </p>
        </footer>
      </div>
    </main>
  );
}
