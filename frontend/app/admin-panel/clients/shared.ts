import type { CSSProperties } from "react";

export type AdminClientAddress = {
  id: string;
  label: string;
  street: string;
  house_number?: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
  additional_info?: string;
  is_default?: boolean;
};

export type AdminClientListItem = {
  id: string;
  client_number?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  client_type?: "individual" | "business" | string;
  client_type_display?: string;
  client_segment?: "new" | "returning" | "regular" | "premium" | "business" | string;
  client_segment_display?: string;
  visit_count?: number;
  total_repairs?: number;
  last_visit_at?: string | null;
  company_name?: string | null;
  nip?: string | null;
  contact_person?: string | null;
  is_vip?: boolean;
  is_blacklisted?: boolean;
  created_at?: string;
};

export type AdminClientDetail = AdminClientListItem & {
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  preferred_contact?: "phone" | "email" | "sms" | "panel" | string;
  accepts_marketing?: boolean;
  internal_notes?: string | null;
  total_spent?: string | number | null;
  updated_at?: string;
  addresses?: AdminClientAddress[];
  company_email?: string | null;
  company_phone?: string | null;
};

export type ClientRepairSummary = {
  id: string;
  repair_number: string;
  repair_type?: string;
  status: string;
  status_display?: string;
  device_name?: string | null;
  created_at?: string;
  accepted_at?: string | null;
  estimated_completion_date?: string | null;
  final_cost?: string | number | null;
};

export type ClientDeviceSummary = {
  id: string;
  device_name?: string;
  brand_name?: string | null;
  category?: string;
  serial_number?: string | null;
  created_at?: string;
};

export type ClientNoteSummary = {
  id: string;
  note: string;
  is_important?: boolean;
  created_at?: string;
  author?: string | null;
};

export type PremiumClientResponse = {
  client: AdminClientDetail;
  repairs: ClientRepairSummary[];
  devices: ClientDeviceSummary[];
  notes: ClientNoteSummary[];
  is_returning?: boolean;
  visit_count?: number;
  badge?: string | null;
};

export const CLIENT_TYPE_OPTIONS = [
  { value: "individual", label: "Osoba prywatna" },
  { value: "business", label: "Firma" },
] as const;

export const CLIENT_SEGMENT_OPTIONS = [
  { value: "new", label: "Nowy klient" },
  { value: "returning", label: "Klient powracający" },
  { value: "regular", label: "Klient stały" },
  { value: "premium", label: "Klient premium" },
  { value: "business", label: "Klient biznesowy" },
] as const;

export const CONTACT_PREFERENCE_OPTIONS = [
  { value: "phone", label: "Telefon" },
  { value: "email", label: "E-mail" },
  { value: "sms", label: "SMS" },
  { value: "panel", label: "Panel klienta" },
] as const;

export function getClientDisplayName(client: Pick<AdminClientListItem, "client_type" | "company_name" | "full_name">): string {
  if (client.client_type === "business") return client.company_name || client.full_name || "—";
  return client.full_name || client.company_name || "—";
}

export function getClientInitials(client: Pick<AdminClientListItem, "client_type" | "company_name" | "full_name">): string {
  const base = getClientDisplayName(client).trim();
  if (!base) return "?";
  const clean = base.replace(/\s+/g, " ");
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function formatMoney(value?: string | number | null): string {
  if (value == null || value === "") return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 2,
  }).format(num);
}

export function getClientBadgeStyle(client: AdminClientListItem): { label: string; styles: CSSProperties } | null {
  if (client.is_blacklisted) {
    return {
      label: "Na czarnej liście",
      styles: { background: "rgba(248,113,113,.14)", border: "1px solid rgba(248,113,113,.30)", color: "#fca5a5" },
    };
  }
  if (client.client_type === "business") {
    return {
      label: client.client_type_display || "Firma",
      styles: { background: "rgba(59,130,246,.14)", border: "1px solid rgba(59,130,246,.28)", color: "#93c5fd" },
    };
  }
  if (client.is_vip || client.client_segment === "premium") {
    return {
      label: "VIP",
      styles: { background: "rgba(245,158,11,.16)", border: "1px solid rgba(245,158,11,.30)", color: "#fdba74" },
    };
  }
  if (client.client_segment === "regular") {
    return {
      label: "Stały",
      styles: { background: "rgba(34,197,94,.14)", border: "1px solid rgba(34,197,94,.28)", color: "#86efac" },
    };
  }
  if (client.client_segment === "returning") {
    return {
      label: "Wraca",
      styles: { background: "rgba(168,85,247,.14)", border: "1px solid rgba(168,85,247,.28)", color: "#d8b4fe" },
    };
  }
  return {
    label: client.client_segment_display || "Nowy",
    styles: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#cbd5e1" },
  };
}

export function getRepairTone(status?: string): { bg: string; border: string; text: string } {
  const s = (status ?? "").toLowerCase();
  if (["ready_for_pickup", "done", "completed", "picked_up", "delivered"].includes(s)) {
    return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#86efac" };
  }
  if (["waiting_for_parts", "quote_pending"].includes(s)) {
    return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#fdba74" };
  }
  if (["cancelled", "unrepairable", "abandoned"].includes(s)) {
    return { bg: "rgba(248,113,113,.14)", border: "rgba(248,113,113,.30)", text: "#fca5a5" };
  }
  return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#93c5fd" };
}

export function normalizeText(value: string | undefined | null): string {
  return (value ?? "").trim();
}

