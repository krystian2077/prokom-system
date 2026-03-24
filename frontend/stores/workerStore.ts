"use client";

/**
 * Kompatybilność wsteczna — nowy stan panelu: @/store (useStore).
 */
export { useStore as useWorkerStore } from "@/store";
export type { Scope as DashboardScope } from "@/types";
