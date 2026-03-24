"use client";

import { create } from "zustand";
import type { Scope } from "@/types";

interface Toast {
  id: string;
  msg: string;
  type: "success" | "error" | "info";
}

interface AppStore {
  scope: Scope;
  setScope: (s: Scope) => void;

  statusModalRepairId: string | null;
  openStatusModal: (id: string | number) => void;
  closeStatusModal: () => void;

  assignModalRepairId: number | null;
  openAssignModal: (id: number) => void;
  closeAssignModal: () => void;

  selectedRepairIds: number[];
  toggleRepair: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;

  repairFilters: Record<string, string>;
  setFilter: (k: string, v: string | undefined) => void;
  clearFilters: () => void;

  toasts: Toast[];
  addToast: (msg: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppStore>((set) => ({
  scope: "today",
  setScope: (s) => set({ scope: s }),

  statusModalRepairId: null,
  openStatusModal: (id) => set({ statusModalRepairId: String(id) }),
  closeStatusModal: () => set({ statusModalRepairId: null }),

  assignModalRepairId: null,
  openAssignModal: (id) => set({ assignModalRepairId: id }),
  closeAssignModal: () => set({ assignModalRepairId: null }),

  selectedRepairIds: [],
  toggleRepair: (id) =>
    set((s) => ({
      selectedRepairIds: s.selectedRepairIds.includes(id)
        ? s.selectedRepairIds.filter((x) => x !== id)
        : [...s.selectedRepairIds, id],
    })),
  selectAll: (ids) => set({ selectedRepairIds: ids }),
  clearSelection: () => set({ selectedRepairIds: [] }),

  repairFilters: {},
  setFilter: (k, v) =>
    set((s) => {
      const f = { ...s.repairFilters };
      if (v === undefined) delete f[k];
      else f[k] = v;
      return { repairFilters: f };
    }),
  clearFilters: () => set({ repairFilters: {} }),

  toasts: [],
  addToast: (msg, type) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
