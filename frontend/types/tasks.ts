/** Odpowiedź listy zadań (TaskListSerializer). */
export interface TaskListItem {
  id: string;
  title: string;
  status: string;
  status_display?: string;
  priority: string;
  priority_display?: string;
  description?: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_archived?: boolean;
  related_repair?: string | null;
  related_repair_number?: string | null;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  body: string;
  author_name?: string | null;
  created_at: string;
}

/** Propozycja z GET /tasks/suggested-for-repair/ */
export interface TaskSuggestion {
  suggestion_key: string;
  title: string;
  description?: string;
  priority: string;
  reason_label: string;
}
