"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RepairDetail } from "@/types/repairs";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStore } from "@/stores/workerStore";
import { WorkerStatusChangeModal } from "@/components/panel/WorkerStatusChangeModal";
import { useEffect } from "react";

export function WorkerStatusModalRoot() {
  const qc = useQueryClient();
  const { token } = useAuth();
  const repairId = useWorkerStore((s) => s.statusModalRepairId);
  const closeStatusModal = useWorkerStore((s) => s.closeStatusModal);
  const showToast = useWorkerStore((s) => s.addToast);

  const enabled = Boolean(repairId && token);

  const { data, error } = useQuery({
    queryKey: ["repair", "status-modal", repairId],
    queryFn: async () => {
      if (!repairId) throw new Error("Missing repairId");
      return api.get<RepairDetail>(`/staff/repairs/${repairId}/`, token);
    },
    enabled,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!error) return;
    showToast(error instanceof Error ? error.message : "Nie udało się pobrać naprawy.", "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  if (!repairId) return null;

  return (
    <WorkerStatusChangeModal
      open={Boolean(repairId)}
      repairId={repairId}
      repairNumber={data?.repair_number}
      currentStatus={data?.status}
      onClose={closeStatusModal}
      onStatusSaved={() => {
        void qc.invalidateQueries({ queryKey: ["repair", repairId] });
        void qc.invalidateQueries({ queryKey: ["repair", "status-modal", repairId] });
        showToast("✓ Status zmieniony", "success");
      }}
    />
  );
}

