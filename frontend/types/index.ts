/**
 * Typy domenowe panelu staff/admin — PROKOM_DOKUMENTACJA_FRONTEND.md §3
 * Struktura odpowiedzi API: Swagger /api/docs/
 */

export type UserRole = "admin" | "staff" | "client";
export type DeviceCategory =
  | "phone"
  | "tablet"
  | "laptop"
  | "desktop"
  | "printer"
  | "console"
  | "smartwatch"
  | "other";
export type RepairStatus =
  | "new"
  | "diagnosis"
  | "waiting_for_quote_approval"
  | "in_progress"
  | "waiting_for_parts"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled";
export type RepairPriority = "low" | "normal" | "high" | "urgent";
export type DeliveryMethod = "in_person" | "courier" | "parcel_locker";
export type ReturnMethod = "in_person" | "courier" | "parcel_locker";
export type PaymentStatus = "unpaid" | "deposit_paid" | "paid";
export type NoteType = "client" | "internal" | "system" | "team";
export type TaskStatus = "open" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type PartStatus = "pending" | "ordered" | "in_transit" | "arrived" | "used";
export type Scope = "today" | "tomorrow" | "week" | "month";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
}

export interface StaffProfile {
  user: User;
  phone?: string;
  avatar_color?: string;
  specializations: DeviceCategory[];
  is_available: boolean;
  availability_note?: string;
}

export interface Client {
  id: number;
  client_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone: string;
  is_company: boolean;
  company_name?: string;
  nip?: string;
  notes?: string;
  is_premium: boolean;
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
}
export interface DeviceModel {
  id: number;
  brand: Brand;
  name: string;
  category: DeviceCategory;
}
export interface Device {
  id: number;
  client: number;
  brand: Brand;
  model: DeviceModel;
  serial_number?: string;
  imei?: string;
  color?: string;
  storage?: string;
}

export interface RepairRequest {
  id: number;
  repair_number: string;
  client: Client;
  device: Device;
  status: RepairStatus;
  priority: RepairPriority;
  delivery_method: DeliveryMethod;
  return_method: ReturnMethod;
  payment_status: PaymentStatus;
  fault_description: string;
  service_type?: string;
  internal_notes?: string;
  estimated_cost?: string;
  final_cost?: number;
  estimated_completion?: string;
  assigned_to?: User;
  is_warranty: boolean;
  is_complaint: boolean;
  created_at: string;
  updated_at: string;
  sla_overdue?: boolean;
  days_waiting?: number;
}

export interface RepairListItem {
  id: number;
  repair_number: string;
  client_name: string;
  client_phone: string;
  device_label: string;
  device_category: DeviceCategory;
  status: RepairStatus;
  priority: RepairPriority;
  payment_status: PaymentStatus;
  assigned_to?: { id: number; full_name: string; initials: string; avatar_color?: string };
  is_warranty: boolean;
  is_complaint: boolean;
  estimated_completion?: string;
  created_at: string;
  sla_overdue: boolean;
  days_waiting: number;
}

export interface RepairNote {
  id: number;
  repair: number;
  author: User;
  content: string;
  note_type: NoteType;
  is_read: boolean;
  created_at: string;
}

export interface TimelineEvent {
  id: number;
  type: "status_change" | "note" | "assignment" | "image" | "checklist" | "quote";
  timestamp: string;
  actor_name: string;
  description: string;
  old_status?: RepairStatus;
  new_status?: RepairStatus;
}

export interface Quote {
  id: number;
  repair: number;
  created_by: User;
  status: "draft" | "sent" | "accepted" | "rejected";
  total_amount: number;
  notes?: string;
  created_at: string;
  items: QuoteItem[];
  client_decision_at?: string;
}
export interface QuoteItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CostSummary {
  parts_cost: number;
  labour_cost: number;
  revenue: number;
  profit: number;
}

export interface Supplier {
  id: number;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
}
export interface Part {
  id: number;
  name: string;
  sku?: string;
  supplier: Supplier;
  unit_price: number;
  quantity_in_stock: number;
  category: DeviceCategory;
}
export interface PartUsage {
  id: number;
  repair: number;
  part: Part;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: PartStatus;
  ordered_at?: string;
  arrived_at?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: User;
  created_by: User;
  related_repair?: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  comments: TaskComment[];
}
export interface TaskComment {
  id: number;
  author: User;
  content: string;
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  event_type: "repair_eta" | "pickup" | "part_arrival" | "task" | "availability" | "sla";
  date: string;
  repair?: number;
  assigned_to?: number;
  color: "red" | "green" | "blue" | "amber" | "purple" | "gray";
}

export interface StaffNotification {
  id: number;
  type: string;
  title: string;
  description: string;
  related_repair?: number;
  is_read: boolean;
  created_at: string;
}

export interface DashboardKPI {
  total_active: number;
  total_ready: number;
  total_unassigned: number;
  revenue_30d: number;
  complaints_open: number;
  avg_repair_days: number;
}

export interface StaffKPI {
  user: User;
  repairs_completed: number;
  avg_repair_days: number;
  complaint_rate: number;
  health_score: number;
  revenue: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SearchResults {
  repairs: RepairListItem[];
  clients: Client[];
  parts?: Part[];
}
