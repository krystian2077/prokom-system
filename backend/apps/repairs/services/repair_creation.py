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
    assigned_to_id=None,
    parent_repair_id=None,
    repair_type="standard",
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
    is_incomplete=False,
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
        assigned_to_id=assigned_to_id,
        parent_repair_id=parent_repair_id,
        repair_type=repair_type,
        status=RepairStatus.NEW,
        is_incomplete=is_incomplete,
    )
    repair.save()

    # Pierwszy wpis w historii statusów
    RepairStatusHistory.objects.create(
        repair=repair,
        old_status=None,
        new_status=repair.status,
        changed_by_id=created_by_id,
    )

    # Auto-przypisanie według kategorii urządzenia (prokom.md)
    if not repair.assigned_to_id:
        from apps.repairs.services.assignment_suggest import suggest_assignment
        suggested = suggest_assignment(repair)
        if suggested:
            repair.assigned_to = suggested
            repair.save(update_fields=["assigned_to"])

    return repair


@transaction.atomic
def quick_accept_repair(
    *,
    created_by_id,
    problem_description,
    client_id=None,
    first_name=None,
    last_name=None,
    phone=None,
    email=None,
    device_id=None,
    device_category=None,
    device_model_name=None,
):
    """
    Szybkie przyjęcie (prokom.md): minimalne dane, naprawa z is_incomplete=True, source=in_person.
    Albo podaj client_id + device_id (istniejące), albo dane do utworzenia klienta + category (i opcjonalnie model_name).
    """
    from apps.common.enums import RepairSource

    if client_id and device_id:
        # Istniejący klient i urządzenie — sprawdź, że urządzenie należy do klienta
        device = Device.objects.filter(id=device_id, client_id=client_id).first()
        if not device:
            raise ValueError("Urządzenie nie należy do podanego klienta.")
        return create_repair_request(
            client_id=client_id,
            device_id=device_id,
            problem_description=problem_description,
            created_by_id=created_by_id,
            delivery_method="in_person",
            return_method="in_person",
            source=RepairSource.IN_PERSON,
            is_incomplete=True,
        )
    if not all([first_name, last_name, phone, email]) or not device_category:
        raise ValueError(
            "Szybkie przyjęcie: podaj client_id+device_id albo first_name, last_name, phone, email i device_category."
        )

    # Utwórz klienta
    client = Client(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        email=email,
    )
    client.save()

    # Utwórz urządzenie (minimalne)
    device = Device(
        client=client,
        category=device_category,
        model_name=device_model_name or "Do uzupełnienia",
    )
    device.save()

    return create_repair_request(
        client_id=client.id,
        device_id=device.id,
        problem_description=problem_description,
        created_by_id=created_by_id,
        delivery_method="in_person",
        return_method="in_person",
        source=RepairSource.IN_PERSON,
        is_incomplete=True,
    )
