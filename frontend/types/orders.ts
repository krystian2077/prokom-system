export type OrdersDashboardResponse = {
  customer_orders_by_status: Record<string, number>;
  store_supply_by_status: Record<string, number>;
  requires_action_count: number;
  to_order_today_count: number;
  total_profit: string;
  uncollected_count: number;
  linked_to_repair_count: number;
};

export type CustomerOrder = {
  id: string;
  client: string | null;
  contact_phone: string;
  contact_email: string;
  product: string | null;
  product_name_manual: string;
  product_name: string;
  quantity: number;
  purchase_price: string;
  sell_price: string;
  margin: string;
  margin_percent: number | null;
  supplier: string | null;
  planned_order_date: string | null;
  expected_delivery_date: string | null;
  status: string;
  status_display: string;
  notes: string;
  deposit_amount: string;
  client_notified: boolean;
  picked_up_at: string | null;
  related_repair: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deposit_paid: boolean;
  urgent: boolean;
  client_waiting: boolean;
  requires_contact: boolean;
  overdue: boolean;
  product_name_override?: string;
};

export type StoreSupplyOrder = {
  id: string;
  product: string | null;
  product_name_manual: string;
  product_name: string;
  quantity: number;
  supplier: string | null;
  estimated_cost: string | null;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrdersToOrderTodayResponse = {
  customer_orders: CustomerOrder[];
  store_supply_orders: StoreSupplyOrder[];
};

export type OrdersBySupplierResponse = {
  by_supplier: Array<{
    supplier: { id: string; name: string };
    customer_order_count: number;
    store_supply_count: number;
    total_estimated_cost: string;
    customer_orders: CustomerOrder[];
    store_supply_orders: StoreSupplyOrder[];
  }>;
};

