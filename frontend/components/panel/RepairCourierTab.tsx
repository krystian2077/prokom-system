"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Truck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairDetail } from "@/types/repairs";

interface RepairCourierTabProps {
  repair: RepairDetail;
  repairId: string;
}

const COURIER_OPTIONS = [
  { value: "inpost", label: "InPost" },
  { value: "dpd", label: "DPD" },
  { value: "dhl", label: "DHL" },
  { value: "gls", label: "GLS" },
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
];

export function RepairCourierTab({ repair, repairId }: RepairCourierTabProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Stany dla wysyłki DO klienta
  const [serviceTrackingDraft, setServiceTrackingDraft] = useState(
    repair?.service_tracking_number || ""
  );
  const [serviceCourierDraft, setServiceCourierDraft] = useState(
    repair?.service_courier || ""
  );

  const [showServiceForm, setShowServiceForm] = useState(false);

  // Mutacja do zapisu danych kuriera
  const updateCourierMutation = useMutation({
    mutationFn: async (data: { service_tracking_number?: string; service_courier?: string }) => {
      if (!token || !repairId) throw new Error("Missing token or repairId");
      return api.patch<RepairDetail>(`/repairs/${repairId}/`, data, token);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["repair", repairId], response);
      setShowServiceForm(false);
      // Reset drafty do nowych wartości
      setServiceTrackingDraft(response?.service_tracking_number || "");
      setServiceCourierDraft(response?.service_courier || "");
    },
  });

  const handleSaveService = async () => {
    if (!serviceTrackingDraft.trim() && !serviceCourierDraft.trim()) {
      return;
    }
    await updateCourierMutation.mutateAsync({
      service_tracking_number: serviceTrackingDraft.trim(),
      service_courier: serviceCourierDraft.trim(),
    });
  };

  const getCourierLabel = (code: string) => {
    return COURIER_OPTIONS.find((c) => c.value === code)?.label || code;
  };

  const clientCourierLabel = repair?.client_courier ? getCourierLabel(repair.client_courier) : null;
  const serviceCourierLabel = repair?.service_courier ? getCourierLabel(repair.service_courier) : null;

  return (
    <div className="space-y-6">
      {/* Sekcja 1: Wysyłka OD KLIENTA */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6]">
            <Package size={20} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink2)]">
              Przesyłka od klienta
            </div>
            <h3 className="mt-2 text-sm font-semibold text-[var(--white)]">
              Lista przewozowa i przewoźnik
            </h3>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-xl bg-black/20 p-4">
          {repair?.client_tracking_number || repair?.client_courier ? (
            <>
              {repair?.client_tracking_number && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink2)]">
                    Nr listu przewozowego
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-[var(--white)]">
                    {repair.client_tracking_number}
                  </p>
                </div>
              )}
              {repair?.client_courier && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink2)]">
                    Przewoźnik
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--white)]">
                    {clientCourierLabel}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--ink2)]" aria-hidden />
              <p className="text-sm text-[var(--ink2)]">
                Klient nie podał numeru listu przewozowego ani przewoźnika.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sekcja 2: Wysyłka DO KLIENTA */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Truck size={20} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink2)]">
              Wysyłka do klienta
            </div>
            <h3 className="mt-2 text-sm font-semibold text-[var(--white)]">
              Lista przewozowa i przewoźnik
            </h3>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-xl bg-black/20 p-4">
          {repair?.service_tracking_number || repair?.service_courier ? (
            <>
              {repair?.service_tracking_number && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink2)]">
                    Nr listu przewozowego
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-[var(--white)]">
                    {repair.service_tracking_number}
                  </p>
                </div>
              )}
              {repair?.service_courier && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink2)]">
                    Przewoźnik
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--white)]">
                    {serviceCourierLabel}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowServiceForm(true)}
                className="mt-2 text-xs font-semibold text-[#3b82f6] hover:text-[#2563eb]"
              >
                Edytuj
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--ink2)]" aria-hidden />
                <p className="text-sm text-[var(--ink2)]">
                  Nie dodano jeszcze numeru listu przewozowego dla wysyłki do klienta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowServiceForm(true)}
                className="self-start text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Dodaj dane kuriera
              </button>
            </div>
          )}
        </div>

        {/* Formularz do edycji / dodania */}
        {showServiceForm && (
          <div className="mt-4 space-y-4 rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-4">
            <div>
              <label htmlFor="service-tracking" className="block text-xs font-semibold uppercase tracking-wider text-emerald-200/90">
                Numer listu przewozowego
              </label>
              <input
                id="service-tracking"
                type="text"
                value={serviceTrackingDraft}
                onChange={(e) => setServiceTrackingDraft(e.target.value)}
                placeholder="np. 123456789"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2.5 text-sm text-[var(--white)] placeholder-[var(--ink2)] focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="service-courier" className="block text-xs font-semibold uppercase tracking-wider text-emerald-200/90">
                Przewoźnik
              </label>
              <select
                id="service-courier"
                value={serviceCourierDraft}
                onChange={(e) => setServiceCourierDraft(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2.5 text-sm text-[var(--white)] focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="">— Wybierz przewoźnika —</option>
                {COURIER_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowServiceForm(false);
                  setServiceTrackingDraft(repair?.service_tracking_number || "");
                  setServiceCourierDraft(repair?.service_courier || "");
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={updateCourierMutation.isPending}
                onClick={handleSaveService}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateCourierMutation.isPending ? "Zapisywanie…" : "Zapisz"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informacja o synchronizacji z panelem klienta */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Package size={16} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-sm text-[var(--ink)]">
            <p className="font-semibold text-white">Informacje widoczne dla klienta</p>
            <p className="mt-1 text-xs text-[var(--ink2)]">
              Dane kuriera (numer listu i przewoźnik) będą wyświetlone w panelu klienta, aby mógł śledzić status dostawy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

