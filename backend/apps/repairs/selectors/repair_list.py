"""
PRO-KOM Serwis — Selectory listy i pojedynczej naprawy.
"""
from django.db.models import Q
from django.utils import timezone
from apps.repairs.models import RepairRequest
from apps.common.enums import RepairStatus, RepairPriority


def _tag_to_q(tag):
    """Mapowanie tagu systemowego na warunek Q (do filtrowania listy)."""
    t = (tag or "").strip().lower()
    if t == "pilne":
        return Q(is_urgent=True) | Q(priority__in=[RepairPriority.HIGH, RepairPriority.URGENT, RepairPriority.SAME_DAY])
    if t == "same_day":
        return Q(is_same_day=True)
    if t == "wysyłkowe":
        return Q(delivery_method__in=["courier", "post", "parcel_locker"]) | Q(return_method__in=["courier", "post", "parcel_locker"])
    if t == "reklamacja":
        return Q(repair_type="complaint")
    if t == "gwarancja":
        return Q(repair_type="warranty")
    if t == "niekompletne":
        return Q(is_incomplete=True)
    if t == "czeka_na_czesc":
        return Q(status=RepairStatus.WAITING_FOR_PARTS)
    if t == "klient_wraca":
        return Q(client__visit_count__gte=2)
    if t == "firma":
        return Q(client__client_type="business")
    if t == "apple":
        return Q(device__brand__name__icontains="Apple")
    if t == "samsung":
        return Q(device__brand__name__icontains="Samsung")
    if t == "odzyskiwanie_danych":
        return Q(device__category="data_recovery")
    return None


def repair_list(
    *,
    status=None,
    status_in=None,
    assigned_to_id=None,
    unassigned_only=False,
    client_id=None,
    priority=None,
    search=None,
    tag=None,
    tags=None,
    ordering="-created_at",
):
    """Lista zgłoszeń napraw z filtrami. tag / tags = filtry po tagach systemowych."""
    qs = RepairRequest.objects.select_related(
        "client", "device", "assigned_to", "created_by"
    ).prefetch_related("status_history", "assignments")

    if status:
        qs = qs.filter(status=status)
    if status_in:
        qs = qs.filter(status__in=status_in)
    if unassigned_only:
        qs = qs.filter(assigned_to__isnull=True)
    elif assigned_to_id:
        qs = qs.filter(assigned_to_id=assigned_to_id)
    if client_id:
        qs = qs.filter(client_id=client_id)
    if priority:
        qs = qs.filter(priority=priority)
    if search:
        qs = qs.filter(
            Q(repair_number__icontains=search)
            | Q(client__first_name__icontains=search)
            | Q(client__last_name__icontains=search)
            | Q(client__email__icontains=search)
            | Q(device__serial_number__icontains=search)
            | Q(device__imei__icontains=search)
            | Q(problem_description__icontains=search)
        )
    tag_list = list(tags or []) if tags else ([tag] if tag else [])
    for t in tag_list:
        q = _tag_to_q(t)
        if q is not None:
            qs = qs.filter(q)

    return qs.order_by(ordering)


def repair_by_id(repair_id):
    """Pobierz zgłoszenie po ID (UUID)."""
    return (
        RepairRequest.objects.select_related(
            "client", "device", "assigned_to", "created_by",
            "delivery_address", "return_address",
        )
        .prefetch_related("status_history", "assignments", "notes", "images")
        .filter(id=repair_id)
        .first()
    )


def repair_by_number(repair_number):
    """Pobierz zgłoszenie po numerze naprawy (np. REP-20260307-A4B2)."""
    return (
        RepairRequest.objects.select_related(
            "client", "device", "assigned_to", "created_by",
            "delivery_address", "return_address",
        )
        .prefetch_related("status_history", "assignments", "notes", "images")
        .filter(repair_number=repair_number)
        .first()
    )


def repairs_assigned_to_staff(user_id, *, status_in=None):
    """Naprawy przypisane do danego pracownika."""
    qs = repair_list(assigned_to_id=user_id)
    if status_in:
        qs = qs.filter(status__in=status_in)
    return qs


def repairs_ready_for_pickup():
    """Naprawy gotowe do odbioru."""
    return repair_list(status=RepairStatus.READY_FOR_PICKUP)


def repairs_waiting_for_client_decision():
    """Naprawy czekające na decyzję klienta (wycena wysłana)."""
    return repair_list(status=RepairStatus.QUOTE_SENT)


def repairs_overdue():
    """Naprawy z przekroczonym terminem."""
    today = timezone.now().date()
    return (
        RepairRequest.objects.filter(
            estimated_completion_date__lt=today,
            status__in=[
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
                RepairStatus.TESTING_PASSED,
                RepairStatus.TESTING_FAILED,
            ],
        )
        .select_related("client", "device", "assigned_to")
        .order_by("estimated_completion_date")
    )
