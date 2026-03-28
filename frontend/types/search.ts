export type GlobalSearchClientBadgesValue = "klient_wraca" | "firma" | string;

export type GlobalSearchClientLastRepairSummary = {
  id: string;
  repair_number: string;
  status: string;
  device_name?: string | null;
};

export type GlobalSearchClient = {
  id: string;
  client_number: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  client_type: string;
  client_type_display?: string;
  company_name?: string | null;
  nip?: string | null;
  visit_count?: number;
  last_visit_at?: string | null;
  repair_count?: number;
  device_count?: number;
  last_repair_summary?: GlobalSearchClientLastRepairSummary | null;
  badges?: GlobalSearchClientBadgesValue[] | null;
};

export type GlobalSearchDevice = {
  id: string;
  device_name: string;
  category?: string | null;
  serial_number?: string | null;
  imei?: string | null;
  client_name?: string | null;
  repair_count?: number;
  created_at?: string;
};

export type GlobalSearchRepair = {
  id: string;
  repair_number: string;
  status: string;
  status_display: string;
  repair_type?: string | null;
  client?: string | null;
  device?: string | null;
  client_name?: string | null;
  device_name?: string | null;
  problem_description?: string | null;
  assigned_to?: string | null;
  created_at?: string;
};

export type GlobalSearchResponse = {
  clients: GlobalSearchClient[];
  repairs: GlobalSearchRepair[];
  devices: GlobalSearchDevice[];
};

export type AdvancedSearchResponse = {
  clients: GlobalSearchClient[];
  repairs: GlobalSearchRepair[];
  devices: GlobalSearchDevice[];
};

