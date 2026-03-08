"""
PRO-KOM Serwis — Repairs selectors
====================================
Logika odczytu danych zgłoszeń napraw.
"""
from .repair_list import (
    repair_list,
    repair_by_id,
    repair_by_number,
    repairs_assigned_to_staff,
    repairs_ready_for_pickup,
    repairs_waiting_for_client_decision,
    repairs_overdue,
)
from .staff_dashboard import (
    staff_dashboard_data,
    staff_dashboard_quality_metrics,
    staff_health_score,
    pickup_panel_data,
    staff_repairs_my_new,
    staff_repairs_my_urgent,
    staff_repairs_today_to_contact,
    staff_repairs_my_in_progress,
    staff_repairs_my_overdue,
    staff_repairs_ready_for_pickup as staff_repairs_ready_for_pickup_qs,
    staff_repairs_without_update,
    staff_recent_activity,
)

__all__ = [
    "repair_list",
    "repair_by_id",
    "repair_by_number",
    "repairs_assigned_to_staff",
    "repairs_ready_for_pickup",
    "repairs_waiting_for_client_decision",
    "repairs_overdue",
    "staff_dashboard_data",
    "staff_dashboard_quality_metrics",
    "staff_health_score",
    "pickup_panel_data",
    "staff_repairs_my_new",
    "staff_repairs_my_urgent",
    "staff_repairs_today_to_contact",
    "staff_repairs_my_in_progress",
    "staff_repairs_my_overdue",
    "staff_repairs_ready_for_pickup_qs",
    "staff_repairs_without_update",
    "staff_recent_activity",
]
