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
  phone?: string;
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

export type TeamTodayStatus = "working_today" | "off_today" | "planned_off" | "unknown";

export type TeamAbsenceRange = {
  availability_type: string;
  availability_type_label: string;
  start_date: string;
  end_date: string;
  note?: string;
};

export type TeamTodayEntry = {
  id: string;
  availability_type: string;
  availability_type_display?: string;
  availability_type_label: string;
  date: string;
  is_all_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
  note?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TeamOverviewRow = StaffListItem & {
  phone?: string;
  today_status: TeamTodayStatus;
  today_status_label: string;
  today_entries: TeamTodayEntry[];
  next_absence?: TeamAbsenceRange | null;
  planned_absence_ranges: TeamAbsenceRange[];
};

export type TeamOverviewResponse = {
  date: string;
  to: string;
  results: TeamOverviewRow[];
};

export type AbsenceRequestStatus = "pending" | "approved" | "rejected";

export type TeamAbsenceRequest = {
  id: string;
  employee: string;
  employee_name: string;
  availability_type: "day_off" | "vacation";
  availability_type_display: string;
  start_date: string;
  end_date: string;
  days_count: number;
  note?: string;
  status: AbsenceRequestStatus;
  status_display: string;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  review_note?: string;
  created_at?: string;
  updated_at?: string;
};

export type TeamAbsenceRequestsResponse = TeamAbsenceRequest[];

export type AttendanceWorkedDay = {
  date: string;
  seconds: number;
  hours: number;
  sessions_count: number;
  is_open: boolean;
};

export type AttendanceAbsenceDay = {
  date: string;
  types: { key: string; label: string }[];
  notes: string[];
};

export type AttendanceDailyRow = {
  date: string;
  worked_seconds: number;
  worked_hours: number;
  worked: boolean;
  absent: boolean;
  absence_labels: string[];
};

export type AttendanceMonthSummary = {
  month: string;
  from: string;
  to: string;
  total_work_seconds: number;
  total_work_hours: number;
  worked_days_count: number;
  absence_days_count: number;
  worked_days: AttendanceWorkedDay[];
  absence_days: AttendanceAbsenceDay[];
  daily: AttendanceDailyRow[];
};

export type AdminAttendanceEmployee = {
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  total_work_seconds: number;
  total_work_hours: number;
  worked_days_count: number;
  absence_days_count: number;
  worked_days: AttendanceWorkedDay[];
  absence_days: AttendanceAbsenceDay[];
  daily: AttendanceDailyRow[];
};

export type AdminAttendanceMonthSummary = {
  month: string;
  from: string;
  to: string;
  employees: AdminAttendanceEmployee[];
};

