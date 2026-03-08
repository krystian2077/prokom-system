/**
 * Typy auth — zgodne z API /api/v1/accounts/login/ i /me/
 */
export type UserRole = "admin" | "staff" | "client";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_staff: boolean;
  date_joined?: string;
  last_login?: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}
