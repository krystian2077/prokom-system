"""
PRO-KOM Serwis — Selectory dashboardu staff
============================================
Kubełki widoczne na dashboardzie: moje nowe, pilne, do kontaktu, w toku, zaległe, gotowe do odbioru, bez aktualizacji, ostatnia aktywność.
"""
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from apps.repairs.models import RepairRequest, RepairStatusHistory
from apps.common.enums import RepairStatus, RepairPriority


# Statusy „w toku” (aktywne)
ACTIVE_STATUSES = [
    RepairStatus.ACCEPTED,
    RepairStatus.IN_DIAGNOSTICS,
    RepairStatus.DIAGNOSTICS_DONE,
    RepairStatus.QUOTE_PENDING,
    RepairStatus.QUOTE_SENT,
    RepairStatus.QUOTE_ACCEPTED,
    RepairStatus.WAITING_FOR_PARTS,
    RepairStatus.IN_REPAIR,
    RepairStatus.REPAIR_DONE,
    RepairStatus.IN_TESTING,
    RepairStatus.TESTING_FAILED,
    RepairStatus.TESTING_PASSED,
]

NOT_FINISHED_STATUSES = ACTIVE_STATUSES + [
    RepairStatus.NEW,
]


def _base_qs():
    return RepairRequest.objects.select_related(
        "client", "device", "assigned_to", "created_by"
    ).prefetch_related("status_history")


def staff_repairs_my_new(user_id):
    """Moje nowe zgłoszenia (przypisane do mnie, status new lub accepted)."""
    return (
        _base_qs()
        .filter(assigned_to_id=user_id, status__in=[RepairStatus.NEW, RepairStatus.ACCEPTED])
        .order_by("-created_at")
    )


def staff_repairs_my_urgent(user_id):
    """Moje pilne (przypisane, wysoki priorytet / is_urgent / same_day, nie zakończone)."""
    today = timezone.now().date()
    return (
        _base_qs()
        .filter(
            assigned_to_id=user_id,
            status__in=NOT_FINISHED_STATUSES,
        )
        .filter(
            Q(priority__in=[RepairPriority.HIGH, RepairPriority.URGENT, RepairPriority.SAME_DAY])
            | Q(is_urgent=True)
            | Q(is_same_day=True)
        )
        .order_by("-created_at")
    )


def staff_repairs_today_to_contact(user_id):
    """Do kontaktu dziś — wycena wysłana (czekamy na decyzję klienta)."""
    return (
        _base_qs()
        .filter(assigned_to_id=user_id, status=RepairStatus.QUOTE_SENT)
        .order_by("-updated_at")
    )


def staff_repairs_my_in_progress(user_id):
    """Moje w toku (bez new, accepted, quote_sent, ready, finished)."""
    in_progress_statuses = [
        RepairStatus.IN_DIAGNOSTICS,
        RepairStatus.DIAGNOSTICS_DONE,
        RepairStatus.QUOTE_PENDING,
        RepairStatus.QUOTE_ACCEPTED,
        RepairStatus.WAITING_FOR_PARTS,
        RepairStatus.IN_REPAIR,
        RepairStatus.REPAIR_DONE,
        RepairStatus.IN_TESTING,
        RepairStatus.TESTING_FAILED,
        RepairStatus.TESTING_PASSED,
    ]
    return (
        _base_qs()
        .filter(assigned_to_id=user_id, status__in=in_progress_statuses)
        .order_by("-updated_at")
    )


def staff_repairs_my_overdue(user_id):
    """Moje zaległe (termin minął, status aktywny)."""
    today = timezone.now().date()
    return (
        _base_qs()
        .filter(
            assigned_to_id=user_id,
            estimated_completion_date__lt=today,
            status__in=ACTIVE_STATUSES,
        )
        .order_by("estimated_completion_date")
    )


def staff_repairs_ready_for_pickup(user_id):
    """Moje gotowe do odbioru."""
    return (
        _base_qs()
        .filter(assigned_to_id=user_id, status=RepairStatus.READY_FOR_PICKUP)
        .order_by("-ready_for_pickup_at")
    )


def staff_repairs_without_update(user_id, days=3):
    """Moje zgłoszenia bez aktualizacji (status/notatka) od X dni."""
    since = timezone.now() - timedelta(days=days)
    # Ostatnia zmiana statusu lub cokolwiek w repair.updated_at
    qs = (
        _base_qs()
        .filter(assigned_to_id=user_id, status__in=NOT_FINISHED_STATUSES)
        .filter(updated_at__lt=since)
    )
    return qs.order_by("updated_at")


def staff_recent_activity(user_id, limit=15):
    """Ostatnie zmiany statusu wykonane przeze mnie (do timeline na dashboard)."""
    return (
        RepairStatusHistory.objects.filter(changed_by_id=user_id)
        .select_related("repair", "repair__client", "repair__device", "changed_by")
        .order_by("-created_at")[:limit]
    )


def staff_dashboard_data(user_id, *, days_without_update=3, recent_activity_limit=10):
    """
    Zbiorczy słownik dla dashboardu: listy querysetów i opcjonalnie count.
    Nie wykonuje len() na qs — to robi widok/serializer.
    """
    return {
        "my_new": staff_repairs_my_new(user_id),
        "my_urgent": staff_repairs_my_urgent(user_id),
        "today_to_contact": staff_repairs_today_to_contact(user_id),
        "my_in_progress": staff_repairs_my_in_progress(user_id),
        "my_overdue": staff_repairs_my_overdue(user_id),
        "ready_for_pickup": staff_repairs_ready_for_pickup(user_id),
        "without_update": staff_repairs_without_update(user_id, days=days_without_update),
        "recent_activity": staff_recent_activity(user_id, limit=recent_activity_limit),
    }
