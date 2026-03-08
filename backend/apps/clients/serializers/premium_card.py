"""Serializer karty klienta premium (agregacja danych dla staff/admin)."""
from rest_framework import serializers


class ClientPremiumCardSerializer(serializers.Serializer):
    """
    Karta klienta premium: dane klienta, historia napraw, urządzenia,
    reklamacje/gwarancje, notatki, czy klient wraca.
    """
    pass  # Używamy zwykłego dict w widoku; ten moduł dla ewentualnych pól walidacji.


def build_premium_card_data(client, *, request=None):
    """
    Buduje słownik danych karty premium dla danego klienta.
    Używane w widoku GET /clients/<id>/premium-card/.
    """
    from apps.clients.serializers import ClientSerializer
    from apps.repairs.serializers import RepairRequestListSerializer
    from apps.devices.serializers import DeviceListSerializer
    from apps.clients.models import ClientNote

    repairs = client.repairs.select_related("device", "assigned_to").order_by("-created_at")
    devices = client.devices.all()  # Device has client FK with related_name="devices"
    complaints_warranties = client.repairs.filter(
        repair_type__in=["complaint", "warranty"],
    ).select_related("device", "parent_repair").order_by("-created_at")
    notes = ClientNote.objects.filter(client=client).select_related("author").order_by("-created_at")

    context = {"request": request} if request else {}
    client_data = ClientSerializer(client, context=context).data
    # Dla klienta (nie staff) ukryj internal_notes
    if request and getattr(request.user, "role", None) == "client":
        client_data.pop("internal_notes", None)

    return {
        "client": client_data,
        "repairs": RepairRequestListSerializer(repairs, many=True, context=context).data,
        "devices": DeviceListSerializer(devices, many=True, context=context).data,
        "complaints_warranties": RepairRequestListSerializer(
            complaints_warranties, many=True, context=context
        ).data,
        "notes": [
            {
                "id": str(n.id),
                "note": n.note,
                "is_important": n.is_important,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "author": n.author.get_full_name() if n.author else None,
            }
            for n in notes
        ],
        "is_returning": client.visit_count > 1,
        "visit_count": client.visit_count,
        "badge": _client_badge(client),
    }


def _client_badge(client):
    """Etykieta dla badge'a: klient wraca, stały klient, nowy, firma."""
    from apps.common.enums import ClientSegment
    if client.client_type == "business":
        return "klient biznesowy"
    if client.visit_count >= 3 or client.client_segment == ClientSegment.REGULAR:
        return "stały klient"
    if client.visit_count >= 2 or client.client_segment == ClientSegment.RETURNING:
        return "klient wraca"
    return None
