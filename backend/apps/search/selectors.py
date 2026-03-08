"""
PRO-KOM Serwis — Selectory wyszukiwania premium.
Wyniki grupowane: klienci (indywidualni), firmy, naprawy, urządzenia.
Priorytetyzacja: exact match > partial match. Limity wyników.
"""
from django.db.models import Q, Count

from apps.clients.models import Client
from apps.repairs.models import RepairRequest
from apps.devices.models import Device
from apps.common.enums import RepairStatus


# Limity domyślne (do wydajności)
DEFAULT_LIMIT = 15
MAX_LIMIT = 30


def _normalize_q(q):
    """Min. 2 znaki, strip."""
    if not q or not isinstance(q, str):
        return ""
    return q.strip()[:200]


def _client_search_q(q):
    """Warunek Q dla wyszukiwania klientów (indywidualni + firmy)."""
    return (
        Q(first_name__icontains=q)
        | Q(last_name__icontains=q)
        | Q(email__icontains=q)
        | Q(phone__icontains=q)
        | Q(client_number__icontains=q)
        | Q(company_name__icontains=q)
        | Q(nip__icontains=q)
    )


def _repair_search_q(q):
    """Warunek Q dla napraw."""
    return (
        Q(repair_number__icontains=q)
        | Q(client__first_name__icontains=q)
        | Q(client__last_name__icontains=q)
        | Q(client__email__icontains=q)
        | Q(client__phone__icontains=q)
        | Q(client__company_name__icontains=q)
        | Q(client__nip__icontains=q)
        | Q(device__model_name__icontains=q)
        | Q(device__serial_number__icontains=q)
        | Q(device__imei__icontains=q)
        | Q(device__manual_device_name__icontains=q)
        | Q(device__manual_brand__icontains=q)
        | Q(device__manual_model__icontains=q)
        | Q(problem_description__icontains=q)
    )


def _device_search_q(q):
    """Warunek Q dla urządzeń."""
    return (
        Q(model_name__icontains=q)
        | Q(serial_number__icontains=q)
        | Q(imei__icontains=q)
        | Q(manual_device_name__icontains=q)
        | Q(manual_brand__icontains=q)
        | Q(manual_model__icontains=q)
        | Q(client__first_name__icontains=q)
        | Q(client__last_name__icontains=q)
        | Q(client__email__icontains=q)
        | Q(client__company_name__icontains=q)
    )


def global_search(q, *, limit=None):
    """
    Global Search: klienci (z podziałem na indywidualni/firmy w serializatorze),
    naprawy, urządzenia. Szybkie, z limitami.
    """
    q = _normalize_q(q)
    limit = min(limit or DEFAULT_LIMIT, MAX_LIMIT)
    if len(q) < 2:
        return {"clients": [], "repairs": [], "devices": []}

    clients = (
        Client.objects.filter(is_deleted=False)
        .filter(_client_search_q(q))
        .order_by("-last_visit_at", "-visit_count", "-created_at")[:limit]
    )
    repairs = (
        RepairRequest.objects.filter(_repair_search_q(q))
        .select_related("client", "device", "assigned_to")
        .order_by("-created_at")[:limit]
    )
    devices = (
        Device.objects.filter(_device_search_q(q))
        .select_related("client", "brand", "device_model")
        .annotate(_repair_count=Count("repairs"))
        .order_by("-created_at")[:limit]
    )
    return {"clients": list(clients), "repairs": list(repairs), "devices": list(devices)}


def intake_search(q, *, limit=None):
    """
    Intake Search: do flow przyjęcia naprawy. Wyniki skupione na kliencie/firmie:
    klienci z liczbą napraw, liczbą urządzeń, ostatnią naprawą, badge'ami,
    oraz urządzenia wybranego klienta (opcjonalnie, gdy client_id w request).
    """
    q = _normalize_q(q)
    limit = min(limit or DEFAULT_LIMIT, MAX_LIMIT)
    if len(q) < 2:
        return {"clients": [], "devices": []}

    clients = (
        Client.objects.filter(is_deleted=False)
        .filter(_client_search_q(q))
        .order_by("-visit_count", "-last_visit_at", "-created_at")[:limit]
    )
    # Dla każdego klienta dołączymy w serializatorze: repair_count, device_count, last_repair, badges
    return {"clients": list(clients), "devices": []}


def intake_search_devices_for_client(client_id, *, limit=50):
    """Urządzenia danego klienta — do wyboru przy intake (po wyborze klienta)."""
    return (
        Device.objects.filter(client_id=client_id)
        .select_related("brand", "device_model")
        .order_by("-created_at")[:limit]
    )


def advanced_search(
    q=None,
    *,
    type=None,
    status=None,
    repair_type=None,
    assigned_to=None,
    source=None,
    client_type=None,
    date_from=None,
    date_to=None,
    limit=None,
):
    """
    Advanced Search: dokładne filtrowanie.
    type: clients | repairs | devices | complaints | warranties
    Pozostałe parametry zależne od type (status, repair_type, assigned_to, source, client_type, date_from, date_to).
    """
    limit = min(limit or 20, MAX_LIMIT)
    result = {"clients": [], "repairs": [], "devices": []}
    q = _normalize_q(q) if q else ""

    if type == "clients" or not type:
        qs = Client.objects.filter(is_deleted=False)
        if q:
            qs = qs.filter(_client_search_q(q))
        if client_type:
            qs = qs.filter(client_type=client_type)
        result["clients"] = list(qs.order_by("-created_at")[:limit])

    if type == "repairs" or type == "complaints" or type == "warranties" or not type:
        qs = RepairRequest.objects.select_related("client", "device", "assigned_to")
        if q:
            qs = qs.filter(_repair_search_q(q))
        if type == "complaints":
            qs = qs.filter(repair_type="complaint")
        elif type == "warranties":
            qs = qs.filter(repair_type="warranty")
        elif repair_type:
            qs = qs.filter(repair_type=repair_type)
        if status:
            qs = qs.filter(status=status)
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)
        if source:
            qs = qs.filter(source=source)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        result["repairs"] = list(qs.order_by("-created_at")[:limit])

    if type == "devices" or not type:
        qs = Device.objects.select_related("client", "brand", "device_model")
        if q:
            qs = qs.filter(_device_search_q(q))
        if client_type:
            qs = qs.filter(client__client_type=client_type)
        result["devices"] = list(qs.order_by("-created_at")[:limit])

    return result
