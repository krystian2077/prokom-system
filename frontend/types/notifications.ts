export type StaffNotificationStatusValue = "unread" | "read" | "archived" | (string & {});

export type StaffNotificationPriorityValue = "low" | "standard" | "important" | "urgent" | (string & {});

export type StaffNotificationItem = {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  notification_type: string;
  priority: StaffNotificationPriorityValue | string;
  repair: string | null;
  repair_id: string | null;
  repair_number: string | null;
  title: string;
  description: string;
  status: StaffNotificationStatusValue | string;
  link?: string | null;
  created_at: string;
};

export type RequiresActionResponse<T> = {
  items: T[];
  count: number;
};

