"""
PRO-KOM Serwis — Tworzenie zgłoszenia naprawy
==============================================
Logika biznesowa tworzenia nowego zgłoszenia (formularz online / przyjęcie stacjonarne).
"""
from django.db import transaction
from apps.common.enums import RepairStatus
from apps.repairs.models import RepairRequest, RepairStatusHistory
from apps.clients.models import Client
from apps.devices.models import Device


@transaction.atomic
def create_repair_request(
    *,
    client_id,
    device_id,
    problem_description,
    created_by_id=None,
    delivery_method="in_person",
    return_method="in_person",
    delivery_address_id=None,
    return_address_id=None,
    priority="normal",
    is_urgent=False,
    is_same_day=False,
    is_warranty=False,
    requires_data_backup=False,
    source="online",
):
    """
    Tworzy nowe zgłoszenie naprawy i zapisuje początkowy wpis w historii statusów.

    Zwraca utworzony obiekt RepairRequest.
    """
    client = Client.objects.get(id=client_id)
    device = Device.objects.get(id=device_id)

    if device.client_id != client_id:
        raise ValueError("Urządzenie nie należy do podanego klienta.")

    repair = RepairRequest(
        client=client,
        device=device,
        problem_description=problem_description,
        delivery_method=delivery_method,
        return_method=return_method,
        delivery_address_id=delivery_address_id,
        return_address_id=return_address_id,
        priority=priority,
        is_urgent=is_urgent,
        is_same_day=is_same_day,
        is_warranty=is_warranty,
        requires_data_backup=requires_data_backup,
        source=source,
        created_by_id=created_by_id,
        status=RepairStatus.NEW,
    )
    repair.save()

    # Pierwszy wpis w historii statusów
    RepairStatusHistory.objects.create(
        repair=repair,
        old_status=None,
        new_status=repair.status,
        changed_by_id=created_by_id,
    )

    return repair
