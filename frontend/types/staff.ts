import type { UserRole } from "@/types/auth";

export type StaffHealthLevel = "green" | "yellow" | "red" | null;

export type StaffProfile = {
  specialization?: string | null;
  specialization_display?: string | null;
  calendar_color?: string | null;
  display_name?: string | null;
  is_visible_in_rankings?: boolean;
  is_available?: boolean;
  accepts_shipment_repairs?: boolean;
};

export type StaffListItem = {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: UserRole | string;
  role_display?: string;
  is_active: boolean;
  last_login?: string | null;
  date_joined?: string | null;
  is_superadmin?: boolean;
  staff_profile?: StaffProfile | null;
  active_repairs_count?: number;
  completed_repairs_count?: number;
  health_score_level?: StaffHealthLevel;
};

