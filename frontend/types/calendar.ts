/** Odpowiedź GET /api/v1/calendar/month/ */
export type CalendarCategoryKey = "sla" | "delivery" | "event" | "intake" | "eta" | "parts";

export type CalendarEventDTO = {
  id: string;
  date: string;
  time?: string;
  category: CalendarCategoryKey;
  title: string;
  subtitle?: string;
  repair_id?: string;
};

export type DailySummary = {
  accepted: number;
  completed: number;
  picked_up: number;
  parts_incoming: number;
  planned_work: number;
  ready_for_pickup: number;
  distinct_repairs_with_activity: number;
};

export type CalendarMonthResponse = {
  events: CalendarEventDTO[];
  daily_summaries: Record<string, DailySummary>;
};

export const EMPTY_DAILY_SUMMARY: DailySummary = {
  accepted: 0,
  completed: 0,
  picked_up: 0,
  parts_incoming: 0,
  planned_work: 0,
  ready_for_pickup: 0,
  distinct_repairs_with_activity: 0,
};
