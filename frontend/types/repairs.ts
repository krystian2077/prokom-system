export interface RepairRequestListItem {
  id: string;
  repair_number: string;
  client_name: string;
  /** Telefon klienta (główny lub firmowy zapasowy). */
  client_phone?: string | null;
  /** UUID urządzenia (lista staff zwraca FK). */
  device?: string | { id: string } | null;
  device_name: string;
  device_brand?: string | null;
  device_model?: string | null;
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
  /** Jak `status_display` — etykieta publiczna (klient + serwis). */
  public_status?: string | null;
  priority: string;
  priority_display: string;
  repair_type?: string | null;
  payment_status_display?: string | null;
  auto_tags?: string[] | null;
  waiting_for_client_days?: number | null;
  requires_attention?: boolean;
  complaint_warranty_status?: string | null;
  complaint_warranty_status_display?: string | null;
  problem_description?: string | null;
  parent_repair_number?: string | null;
  created_by_label?: string | null;
  estimated_completion_date?: string | null;
  /** Wewnętrzny plan pracy pracownika (nie to samo co termin dla klienta). */
  staff_planned_work_date?: string | null;
  estimated_duration_days_min?: number | null;
  estimated_duration_days_max?: number | null;
  /** Kwoty z API (Decimal jako string). */
  estimated_cost?: string | number | null;
  final_cost?: string | number | null;
  delivery_method?: string | null;
  return_method?: string | null;
  created_at: string;
  /** Data fizycznego przyjęcia urządzenia (null u starszych zapisów). */
  accepted_at?: string | null;
  ready_for_pickup_at?: string | null;
  picked_up_at?: string | null;
}

/** Dane klienta z API (zagnieżdżone w szczegółach naprawy). */
export interface RepairClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  client_number?: string;
}

/** Adres klienta (nested z API — GET /repairs/:id/). */
export interface ClientAddress {
  id: string;
  label?: string | null;
  street?: string;
  house_number?: string | null;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string | null;
  additional_info?: string | null;
  is_default?: boolean;
}

/** Dane urządzenia z API (zagnieżdżone w szczegółach naprawy). */
export interface RepairDevice {
  id: string;
  device_name: string;
  brand_name: string;
  device_brand?: string | null;
  device_model?: string | null;
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
  /** Obiekt adresu (API) lub legacy: sam identyfikator. */
  delivery_address?: ClientAddress | string | null;
  return_address?: ClientAddress | string | null;
  client_notes?: string | null;
  device_turns_on?: boolean | null;
  visual_condition_description?: string | null;
  hammer_glass_interest?: string | null;
  accessory_choose_for_me?: boolean;
  accessory_wishlist?: string | null;
  /** Złączone zainteresowania akcesoriami z formularza (produkty + „dobierz za mnie”). */
  accessory_selection_summary?: string | null;
  /** Tekst z pola urządzenia „dołączone akcesoria”. */
  device_accessories_included?: string | null;
  client_tracking_number?: string | null;
  is_urgent: boolean;
  is_same_day: boolean;
  is_warranty: boolean;
  requires_data_backup: boolean;
  source?: string;
  /** Etykieta źródła zgłoszenia (np. „Przyjęcie stacjonarne”) — z API. */
  source_display?: string | null;
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

/** Status zamówienia pozycji (kolejka: do zamówienia / w drodze / dotarło). */
export type PartOrderStatusValue = "to_order" | "ordered" | "arrived" | "delayed";

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

/** Wpis w scalonym wątku wiadomości (GET /repairs/:id/messages/). */
export interface RepairThreadNoteItem {
  kind: "note";
  id: number;
  note: string;
  thread_origin: string;
  is_important: boolean;
  note_type: string;
  author_name: string | null;
  created_at: string;
}

export interface RepairThreadEmailOutItem {
  kind: "email_out";
  id: string;
  subject: string;
  body_snapshot: string;
  recipient: string;
  sent_at: string;
  sent_by_name: string | null;
  status: string;
  channel: string;
  template_id: number | null;
}

export type RepairThreadItem = RepairThreadNoteItem | RepairThreadEmailOutItem;

export interface PartUsage {
  id: string;
  repair: string | null;
  repair_number?: string | null;
  repair_device_name?: string | null;
  assigned_to_name?: string | null;
  /** Pozycja z katalogu — null, gdy użyto wyłącznie nazwy własnej. */
  part: PartAutocompleteItem | null;
  /** Nazwa wpisana ręcznie (bez powiązania z katalogiem). */
  custom_part_name?: string | null;
  supplier_detail?: PartSupplierDetail | null;
  quantity: string | number;
  purchase_cost?: string | number | null;
  unit_price_used: string | number;
  total: string | number;
  usage_status: PartUsageStatusValue;
  usage_status_display: string;
  order_status?: PartOrderStatusValue;
  order_status_display?: string;
  ordered_at?: string | null;
  /** Planowana data dostawy (YYYY-MM-DD). */
  expected_arrival_date?: string | null;
  notes?: string | null;
  added_by?: string | null;
  created_at: string;
}

/** Etykieta części: katalog albo nazwa własna. */
export function partUsageDisplayName(u: {
  part?: { name?: string | null } | null;
  custom_part_name?: string | null;
}): string {
  const fromCatalog = u.part?.name?.trim();
  if (fromCatalog) return fromCatalog;
  const custom = (u.custom_part_name ?? "").trim();
  return custom || "Część";
}
