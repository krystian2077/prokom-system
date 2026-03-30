"""
PRO-KOM Serwis — Selectory dashboardu staff
============================================
Kubełki widoczne na dashboardzie: moje nowe, pilne, do kontaktu, w toku, zaległe, gotowe do odbioru, bez aktualizacji, ostatnia aktywność.
Blok jakościowy: wiadomości do klientów, niezamknięte sprawy, średni czas odpowiedzi, reklamacje/gwarancje, wskaźnik reklamacyjności.
"""
from django.db.models import Q, Avg, F, DateTimeField
from django.db.models import DurationField, ExpressionWrapper
from django.db.models.functions import Coalesce
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


# Jak frontend/lib/repairListDisplay.ts — IN_REPAIR_PILL_STATUSES + etap testów po naprawie.
IN_REPAIR_KPI_STATUSES = [
    RepairStatus.ACCEPTED,
    RepairStatus.IN_DIAGNOSTICS,
    RepairStatus.DIAGNOSTICS_DONE,
    RepairStatus.QUOTE_PENDING,
    RepairStatus.QUOTE_SENT,
    RepairStatus.QUOTE_ACCEPTED,
    RepairStatus.QUOTE_REJECTED,
    RepairStatus.WAITING_FOR_PARTS,
    RepairStatus.IN_REPAIR,
    RepairStatus.REPAIR_DONE,
    RepairStatus.IN_TESTING,
    RepairStatus.TESTING_FAILED,
    RepairStatus.TESTING_PASSED,
]


def staff_repairs_my_in_progress(user_id):
    """Moje w fazie roboczej (jak pigułka „W naprawie” na liście + testy końcowe)."""
    return (
        _base_qs()
        .filter(assigned_to_id=user_id, status__in=IN_REPAIR_KPI_STATUSES)
        .order_by("-updated_at")
    )


def staff_in_repair_kpi_count(user_id: int, *, is_admin: bool = False) -> int:
    """
    Liczba napraw „w trakcie” na KPI dashboardu.
    Staff: tylko przypisane do użytkownika. Admin: cały warsztat (jak /staff/repairs/ bez filtra).
    """
    qs = _base_qs().filter(status__in=IN_REPAIR_KPI_STATUSES)
    if not is_admin:
        qs = qs.filter(assigned_to_id=user_id)
    return qs.count()


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


def pickup_panel_data(*, assigned_to_id=None):
    """
    Dane do panelu odbiorów: gotowe do odbioru, nieodebrane 3/7 dni,
    do przygotowania wysyłki zwrotnej, wydane dziś.
    assigned_to_id=None = wszystkie (admin), inaczej filtruj po pracowniku.
    """
    from apps.common.enums import ReturnMethod
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    threshold_3d = timezone.now() - timedelta(days=3)
    threshold_7d = timezone.now() - timedelta(days=7)

    base = RepairRequest.objects.select_related(
        "client", "device", "assigned_to"
    ).filter(status=RepairStatus.READY_FOR_PICKUP)
    if assigned_to_id:
        base = base.filter(assigned_to_id=assigned_to_id)

    ready = base.order_by("-ready_for_pickup_at")
    unclaimed_3d = base.filter(ready_for_pickup_at__lt=threshold_3d).order_by("ready_for_pickup_at")
    unclaimed_7d = base.filter(ready_for_pickup_at__lt=threshold_7d).order_by("ready_for_pickup_at")
    to_prepare_shipment = base.exclude(return_method=ReturnMethod.IN_PERSON).order_by("-ready_for_pickup_at")

    issued_today = (
        RepairRequest.objects.filter(status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED])
        .annotate(
            closure_at=Coalesce("picked_up_at", "completed_at", output_field=DateTimeField()),
        )
        .filter(closure_at__gte=today_start, closure_at__lt=today_end)
        .select_related("client", "device", "assigned_to")
        .order_by("-closure_at")
    )
    if assigned_to_id:
        issued_today = issued_today.filter(assigned_to_id=assigned_to_id)

    return {
        "ready_for_pickup": ready,
        "unclaimed_3_days": unclaimed_3d,
        "unclaimed_7_days": unclaimed_7d,
        "to_prepare_shipment": to_prepare_shipment,
        "issued_today": issued_today,
    }


def staff_recent_activity(user_id, limit=15):
    """Ostatnie zmiany statusu wykonane przeze mnie (do timeline na dashboard)."""
    return (
        RepairStatusHistory.objects.filter(changed_by_id=user_id)
        .select_related("repair", "repair__client", "repair__device", "changed_by")
        .order_by("-created_at")[:limit]
    )


FINISHED_STATUSES = [
    RepairStatus.PICKED_UP,
    RepairStatus.SHIPPED,
    RepairStatus.DELIVERED,
]

# Zgodne z widokiem „Moje naprawy” (frontend: nonArchivedStatus) — wykluczone z licznika „aktywnych”.
TERMINAL_OR_ARCHIVED_FOR_ACTIVE_COUNT = [
    RepairStatus.PICKED_UP,
    RepairStatus.SHIPPED,
    RepairStatus.DELIVERED,
    RepairStatus.CANCELLED,
    RepairStatus.UNREPAIRABLE,
    RepairStatus.ABANDONED,
]


def staff_my_active_repairs_count(user_id: int) -> int:
    """
    Jedna naprawa = jedna pozycja: przypisane do pracownika, status nie jest końcowy/zarchiwizowany.
    Nie sumuje kubełków (które nakładają się i zawyżają wynik).
    """
    return (
        RepairRequest.objects.filter(assigned_to_id=user_id)
        .exclude(status__in=TERMINAL_OR_ARCHIVED_FOR_ACTIVE_COUNT)
        .count()
    )


def staff_completed_pickups_count(user_id, dashboard_scope: str = "today") -> int:
    """
    Liczba napraw przypisanych do pracownika zakończonych wydaniem / wysyłką / dostawą,
    w oknie zgodnym z zakresem dashboardu (kalendarz lokalny).

    Za datę zamknięcia używamy picked_up_at (odbiór, wysyłka, dostawa — ustawiane przy zmianie statusu)
    lub — gdy brak — completed_at (np. starsze rekordy WYSŁANE sprzed uzupełniania picked_up_at).
    """
    scope = (dashboard_scope or "today").lower()
    today = timezone.now().date()

    qs = (
        RepairRequest.objects.filter(assigned_to_id=user_id, status__in=FINISHED_STATUSES)
        .annotate(
            closure_at=Coalesce("picked_up_at", "completed_at", output_field=DateTimeField()),
        )
        .filter(closure_at__isnull=False)
    )

    if scope == "tomorrow":
        d = today + timedelta(days=1)
        return qs.filter(closure_at__date=d).count()
    if scope == "week":
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        return qs.filter(closure_at__date__gte=monday, closure_at__date__lte=sunday).count()
    if scope == "month":
        first = today.replace(day=1)
        if today.month == 12:
            next_month_first = today.replace(year=today.year + 1, month=1, day=1)
        else:
            next_month_first = today.replace(month=today.month + 1, day=1)
        last = next_month_first - timedelta(days=1)
        return qs.filter(closure_at__date__gte=first, closure_at__date__lte=last).count()
    # "today" i nieznany zakres — bieżący dzień
    return qs.filter(closure_at__date=today).count()


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


# ---------- Blok jakościowy (N3) ----------

def staff_dashboard_quality_metrics(user_id):
    """
    KPI jakościowe pracownika: wiadomości do klientów, niezamknięte sprawy,
    średni czas odpowiedzi, reklamacje/gwarancje do moich napraw, wskaźnik reklamacyjności,
    sprawy po SLA, bez aktualizacji.
    """
    from apps.communications.models import CommunicationLog

    my_repairs_qs = RepairRequest.objects.filter(assigned_to_id=user_id)
    not_finished = my_repairs_qs.exclude(
        status__in=[
            RepairStatus.CANCELLED, RepairStatus.ABANDONED,
            RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED,
        ]
    )
    open_repairs_count = not_finished.count()

    # Wiadomości do klientów (wysłane przeze mnie w ramach moich napraw)
    messages_to_clients = CommunicationLog.objects.filter(
        repair__assigned_to_id=user_id,
        sent_by_id=user_id,
    ).count()

    # Średni czas odpowiedzi: last_staff_reply_at - last_client_message_at (w godzinach)
    avg_response = (
        RepairRequest.objects.filter(
            assigned_to_id=user_id,
            last_client_message_at__isnull=False,
            last_staff_reply_at__isnull=False,
        )
        .annotate(
            response_time=ExpressionWrapper(
                F("last_staff_reply_at") - F("last_client_message_at"),
                output_field=DurationField(),
            ),
        )
        .aggregate(avg=Avg("response_time"))["avg"]
    )
    average_response_time_hours = (
        round(avg_response.total_seconds() / 3600, 1) if avg_response else None
    )

    # Reklamacje do moich napraw (child repairs typu complaint gdzie parent jest mój)
    complaints_to_my_repairs = RepairRequest.objects.filter(
        parent_repair__assigned_to_id=user_id,
        repair_type="complaint",
    ).count()
    # Gwarancje do moich napraw
    warranties_to_my_repairs = RepairRequest.objects.filter(
        parent_repair__assigned_to_id=user_id,
        repair_type="warranty",
    ).count()

    # Zakończone naprawy (standard) przypisane do mnie (mianownik wskaźnika reklamacyjności)
    completed_standard = my_repairs_qs.filter(
        repair_type="standard",
        status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
    ).count()
    reclamation_rate = (
        round(complaints_to_my_repairs / completed_standard, 2)
        if completed_standard and completed_standard > 0
        else None
    )

    # Zaległe (po SLA) — count
    over_sla_count = staff_repairs_my_overdue(user_id).count()
    # Bez aktualizacji — count
    without_update_count = staff_repairs_without_update(user_id, days=3).count()

    return {
        "messages_to_clients_count": messages_to_clients,
        "open_repairs_count": open_repairs_count,
        "average_response_time_hours": average_response_time_hours,
        "complaints_to_my_repairs_count": complaints_to_my_repairs,
        "warranties_to_my_repairs_count": warranties_to_my_repairs,
        "reclamation_rate": reclamation_rate,
        "over_sla_count": over_sla_count,
        "without_update_count": without_update_count,
    }


def staff_health_score(user_id):
    """
    Health score pracownika: zielony / żółty / czerwony na podstawie jakości pracy.
    Zwraca level i opcjonalnie factors (przyczyny).
    """
    q = staff_dashboard_quality_metrics(user_id)
    over_sla = q.get("over_sla_count") or 0
    without_update = q.get("without_update_count") or 0
    reclamation = q.get("reclamation_rate") or 0
    avg_response = q.get("average_response_time_hours")
    complaints = q.get("complaints_to_my_repairs_count") or 0

    factors = []
    # Czerwony: poważne problemy
    if over_sla >= 3:
        factors.append("zaległe_sprawy_3+")
    if without_update >= 5:
        factors.append("brak_aktualizacji_5+")
    if reclamation and reclamation >= 0.15:
        factors.append("wysoka_reklamacyjnosc")
    # Żółty: wymaga uwagi
    if over_sla >= 1:
        factors.append("zaległe_sprawy")
    if without_update >= 2:
        factors.append("brak_aktualizacji")
    if avg_response is not None and avg_response > 24:
        factors.append("dlugi_czas_odpowiedzi")
    if reclamation and reclamation >= 0.05:
        factors.append("reklamacje")
    if complaints >= 2:
        factors.append("reklamacje_do_napraw")

    if any(f in factors for f in ("zaległe_sprawy_3+", "brak_aktualizacji_5+", "wysoka_reklamacyjnosc")):
        level = "red"
    elif factors:
        level = "yellow"
    else:
        level = "green"

    return {
        "level": level,
        "factors": factors,
        "metrics": q,
    }
