/** Odpowiedź listy zadań (TaskListSerializer). */
export interface TaskListItem {
  id: string;
  title: string;
  status: string;
  status_display?: string;
  priority: string;
  priority_display?: string;
  due_date?: string | null;
  completed_at?: string | null;
  related_repair?: string | null;
  related_repair_number?: string | null;
}

/** Propozycja z GET /tasks/suggested-for-repair/ */
export interface TaskSuggestion {
  suggestion_key: string;
  title: string;
  description?: string;
  priority: string;
  reason_label: string;
}
