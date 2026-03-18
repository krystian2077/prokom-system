export interface RepairRequestListItem {
  id: string;
  repair_number: string;
  client_name: string;
  device_name: string;
  assigned_to?:
    | string
    | {
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
      }
    | null;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  repair_type?: string | null;
  payment_status_display?: string | null;
  auto_tags?: string[] | null;
  waiting_for_client_days?: number | null;
  requires_attention?: boolean;
  complaint_warranty_status?: string | null;
  complaint_warranty_status_display?: string | null;
  estimated_completion_date?: string | null;
  estimated_duration_days_min?: number | null;
  estimated_duration_days_max?: number | null;
  created_at: string;
}

/** Dane klienta z API (zagnieżdżone w szczegółach naprawy). */
export interface RepairClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  client_number?: string;
}

/** Dane urządzenia z API (zagnieżdżone w szczegółach naprawy). */
export interface RepairDevice {
  id: string;
  device_name: string;
  brand_name: string;
  category: string;
  serial_number?: string;
}

export interface RepairDetail extends RepairRequestListItem {
  client: RepairClient;
  device: RepairDevice;
  problem_description: string;
  internal_status: string | null;
  internal_notes: string;
  repair_type: string;
  requires_attention: boolean;
  estimated_completion_date: string | null;
  estimated_duration_display: string | null;
  public_status: string | null;
  delivery_method: string;
  return_method: string;
  delivery_address?: string | null;
  return_address?: string | null;
  client_notes?: string | null;
  device_turns_on?: boolean | null;
  visual_condition_description?: string | null;
  client_tracking_number?: string | null;
  is_urgent: boolean;
  is_same_day: boolean;
  is_warranty: boolean;
  requires_data_backup: boolean;
  source?: string;
  assigned_to?: { id: string; email: string; first_name?: string; last_name?: string } | null;
  created_at: string;
  updated_at: string;
}

export type RepairTimelineEvent =
  | {
      type: "status_change";
      id: number;
      old_status: string | null;
      new_status: string;
      old_status_display?: string | null;
      new_status_display?: string;
      notes?: string | null;
      changed_by_name?: string | null;
      created_at: string;
    }
  | {
      type: "note";
      id: number;
      note: string;
      is_internal: boolean;
      is_important: boolean;
      author_name?: string | null;
      created_at: string;
    }
  | {
      type: "communication";
      id: number;
      channel: string;
      channel_display: string;
      recipient: string;
      subject: string;
      body_preview: string;
      sent_by_name?: string | null;
      sent_at: string;
      status: string;
    };

export type PartUsageStatusValue = "ordered" | "arrived" | "used" | "unused";

export interface PartAutocompleteItem {
  id: string;
  name: string;
  code: string;
  supplier?: string | null;
  supplier_name?: string | null;
  sell_price?: string | number | null;
  unit?: string | null;
  is_active?: boolean;
}

export interface PartSupplierDetail {
  id: string;
  name: string;
  nip?: string | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  is_active?: boolean;
}

export interface PartUsage {
  id: string;
  repair: string | null;
  part: PartAutocompleteItem;
  supplier_detail?: PartSupplierDetail | null;
  quantity: string | number;
  purchase_cost?: string | number | null;
  unit_price_used: string | number;
  total: string | number;
  usage_status: PartUsageStatusValue;
  usage_status_display: string;
  notes?: string | null;
  added_by?: string | null;
  created_at: string;
}
