/**
 * Typy napraw w panelu klienta — zgodne z API repairs/my-summary/ i repairs/
 */
export interface RepairListItem {
  id: string;
  repair_number: string;
  client: string;
  client_name: string;
  device: string;
  device_name: string;
  status: string;
  status_display: string;
  created_at: string;
  estimated_completion_date?: string | null;
  complaint_warranty_status?: string | null;
}

export interface MySummaryResponse {
  count: number;
  by_status: Record<string, number>;
  latest_repairs: RepairListItem[];
}
