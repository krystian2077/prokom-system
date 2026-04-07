/** Odpowiedź GET /api/v1/search/intake/?q= */
export type IntakeSearchClientLastRepair = {
  id: string;
  repair_number: string;
  status: string;
  status_display: string;
  device_name?: string | null;
};

export type IntakeSearchClientBadge = "klient_wraca" | "firma" | string;

export type IntakeSearchClient = {
  id: string;
  client_number: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  client_type: string;
  company_name?: string | null;
  nip?: string | null;
  repair_count?: number;
  device_count?: number;
  last_repair_summary?: IntakeSearchClientLastRepair | null;
  badges?: IntakeSearchClientBadge[] | null;
};

export type IntakeSearchDevice = {
  id: string;
  device_name: string;
  device_brand?: string | null;
  device_model?: string | null;
  category?: string | null;
  serial_number?: string | null;
  imei?: string | null;
  client?: string;
};

export type IntakeSearchByQueryResponse = {
  clients: IntakeSearchClient[];
  devices: IntakeSearchDevice[];
  message?: string;
};

export type IntakeSearchByClientIdResponse = {
  clients: IntakeSearchClient[];
  devices: IntakeSearchDevice[];
  message?: string;
};
