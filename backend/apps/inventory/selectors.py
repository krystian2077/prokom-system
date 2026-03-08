"""
PRO-KOM Serwis — Inventory selectors.
Katalog części: autocomplete, kolejka, statystyki karty części.
"""
from django.db.models import Q, Count, Avg, Min, Max

from apps.inventory.models import Part, PartUsage, Supplier


def part_autocomplete(q, *, repair_id=None, device_category=None, brand=None, limit=20):
    """
    Podpowiedzi części do dodania do naprawy.
    q — fraza (nazwa, kod, model, typ).
    repair_id — opcjonalnie: kontekst naprawy (device_category, brand z repair.device).
    """
    if not (q or "").strip():
        return Part.objects.filter(is_active=True).none()
    term = (q or "").strip()[:100]
    qs = Part.objects.filter(is_active=True).filter(
        Q(name__icontains=term)
        | Q(code__icontains=term)
        | Q(device_model_name__icontains=term)
        | Q(brand__icontains=term)
        | Q(part_type__icontains=term)
    )
    if device_category:
        qs = qs.filter(device_category=device_category)
    if brand:
        qs = qs.filter(brand__icontains=brand)
    return qs.select_related("supplier").order_by("name")[:limit]


def parts_queue(*, status=None, assigned_to=None):
    """
    Kolejka części: do zamówienia / zamówione / dotarły / niewykorzystane.
    status: ordered | arrived | used | unused
    """
    qs = PartUsage.objects.select_related(
        "repair", "part", "supplier", "repair__client", "repair__device", "added_by"
    ).order_by("-created_at")
    if status:
        qs = qs.filter(usage_status=status)
    if assigned_to:
        qs = qs.filter(repair__assigned_to_id=assigned_to)
    return qs


def part_detail_card_stats(part_id):
    """
    Statystyki do karty szczegółów części:
    usage_count, last_used_at, last_supplier, last_purchase_cost,
    most_used_supplier_id, avg_purchase_cost, min_purchase_cost, max_purchase_cost,
    recent_repair_ids (ostatnie naprawy z tą częścią).
    """
    usages = PartUsage.objects.filter(part_id=part_id).select_related("supplier", "repair").order_by("-created_at")
    count = usages.count()
    if count == 0:
        return {
            "usage_count": 0,
            "last_used_at": None,
            "last_supplier": None,
            "last_purchase_cost": None,
            "most_used_supplier_id": None,
            "avg_purchase_cost": None,
            "min_purchase_cost": None,
            "max_purchase_cost": None,
            "recent_repairs": [],
        }
    first = usages.first()
    agg = PartUsage.objects.filter(part_id=part_id).aggregate(
        avg_cost=Avg("purchase_cost"),
        min_cost=Min("purchase_cost"),
        max_cost=Max("purchase_cost"),
    )
    most_used = (
        PartUsage.objects.filter(part_id=part_id, supplier_id__isnull=False)
        .values("supplier_id")
        .annotate(c=Count("id"))
        .order_by("-c")
        .first()
    )
    recent = list(
        usages[:10].values("id", "repair_id", "created_at", "usage_status", "purchase_cost", "supplier_id")
    )
    last_supplier = first.supplier
    return {
        "usage_count": count,
        "last_used_at": first.created_at,
        "last_supplier": last_supplier,
        "last_purchase_cost": first.purchase_cost,
        "most_used_supplier_id": most_used["supplier_id"] if most_used else None,
        "avg_purchase_cost": agg["avg_cost"],
        "min_purchase_cost": agg["min_cost"],
        "max_purchase_cost": agg["max_cost"],
        "recent_usages": recent,
    }


def most_used_supplier_for_part(part_id):
    """Najczęściej wybierana hurtownia dla danej części (do podpowiedzi)."""
    r = (
        PartUsage.objects.filter(part_id=part_id, supplier_id__isnull=False)
        .values("supplier_id")
        .annotate(c=Count("id"))
        .order_by("-c")
        .first()
    )
    if not r:
        return None
    return Supplier.objects.filter(id=r["supplier_id"]).first()
