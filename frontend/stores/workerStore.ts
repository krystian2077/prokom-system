"use client";

import { create } from "zustand";

export type DashboardScope = "today" | "tomorrow" | "week" | "month";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

export type StatusModalRepairId = string | null;

export type StatusModalResult = {
  suggested_sms?: string;
  suggested_email?: string;
};

export type RepairFilters = {
  status?: string;
  page?: number;
};

export interface WorkerState {
  dashboardScope: DashboardScope;
  setDashboardScope: (s: DashboardScope) => void;

  repairFilters: RepairFilters;
  setRepairFilter: (k: keyof RepairFilters, v: RepairFilters[keyof RepairFilters] | undefined) => void;

  statusModalRepairId: StatusModalRepairId;
  statusModalData: StatusModalResult | null;
  openStatusModal: (repairId: string) => void;
  closeStatusModal: () => void;
  setStatusModalResult: (data: StatusModalResult) => void;

  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  dismissToast: (id: string) => void;
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const useWorkerStore = create<WorkerState>((set, get) => ({
  dashboardScope: "today",
  setDashboardScope: (s) => set({ dashboardScope: s }),

  repairFilters: { status: undefined, page: 1 },
  setRepairFilter: (k, v) => set((st) => ({ repairFilters: { ...st.repairFilters, [k]: v } })),

  statusModalRepairId: null,
  statusModalData: null,
  openStatusModal: (repairId) =>
    set(() => ({
      statusModalRepairId: repairId,
      statusModalData: null,
    })),
  closeStatusModal: () =>
    set(() => ({
      statusModalRepairId: null,
      statusModalData: null,
    })),
  setStatusModalResult: (data) => set({ statusModalData: data }),

  toasts: [],
  showToast: (message, type) => {
    const id = makeId();
    set((st) => ({ toasts: [...st.toasts, { id, message, type }] }));
    window.setTimeout(() => {
      const { toasts } = get();
      if (!toasts.find((t) => t.id === id)) return;
      set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),
}));

