import type { RepairRequestListItem } from "@/types/repairs";
import type { GlobalSearchDevice, GlobalSearchRepair } from "@/types/search";

/** Uzupełnia listę napraw o wyniki z /search/global/ (gdy sama lista staff nie łapie np. po modelu urządzenia). */
export function globalSearchRepairToListItem(g: GlobalSearchRepair): RepairRequestListItem {
  return {
    id: g.id,
    repair_number: g.repair_number,
    client_name: g.client_name ?? "—",
    device_name: g.device_name ?? "—",
    device: g.device ?? undefined,
    status: g.status,
    status_display: g.status_display,
    created_at: g.created_at ?? new Date(0).toISOString(),
    problem_description: g.problem_description ?? null,
    repair_type: g.repair_type ?? null,
  };
}

export function mergeStaffAndGlobalRepairs(
  staff: RepairRequestListItem[],
  global: GlobalSearchRepair[],
): RepairRequestListItem[] {
  const byId = new Map<string, RepairRequestListItem>();
  for (const g of global) {
    byId.set(g.id, globalSearchRepairToListItem(g));
  }
  for (const r of staff) {
    byId.set(r.id, r);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function repairDeviceId(r: RepairRequestListItem): string | null {
  const d = r.device;
  if (typeof d === "string") return d;
  if (d && typeof d === "object" && "id" in d && typeof (d as { id: string }).id === "string") {
    return (d as { id: string }).id;
  }
  return null;
}

/** Ukrywa urządzenia, dla których mamy już wpis naprawy w wynikach (żeby nie dublować tej samej sprawy). */
export function filterDevicesWhenRepairsPresent(
  devices: GlobalSearchDevice[],
  repairs: RepairRequestListItem[],
  globalRepairs: GlobalSearchRepair[],
): GlobalSearchDevice[] {
  const withRepair = new Set<string>();
  for (const r of repairs) {
    const id = repairDeviceId(r);
    if (id) withRepair.add(id);
  }
  for (const g of globalRepairs) {
    if (g.device) withRepair.add(String(g.device));
  }
  return devices.filter((d) => !withRepair.has(d.id));
}
