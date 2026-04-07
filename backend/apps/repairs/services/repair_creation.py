"""
PRO-KOM Serwis — Tworzenie zgłoszenia naprawy
==============================================
Logika biznesowa tworzenia nowego zgłoszenia (formularz online / przyjęcie stacjonarne).
"""
import uuid

from django.db import transaction
from apps.common.enums import ComplaintWarrantyStatus, RepairSource, RepairStatus
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
    internal_notes=None,
    estimated_cost=None,
    estimated_completion_date=None,
    visual_condition_description=None,
    skip_auto_assign=False,
    complaint_warranty_status=None,
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
        internal_notes=(internal_notes or "").strip(),
        estimated_cost=estimated_cost,
        estimated_completion_date=estimated_completion_date,
        visual_condition_description=(visual_condition_description or "").strip(),
        complaint_warranty_status=complaint_warranty_status,
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
    if not repair.assigned_to_id and not skip_auto_assign:
        from apps.repairs.services.assignment_suggest import suggest_assignment
        suggested = suggest_assignment(repair)
        if suggested:
            repair.assigned_to = suggested
            repair.save(update_fields=["assigned_to"])

    # Klient wraca: aktualizacja visit_count i segmentu (tylko dla naprawy standardowej)
    if repair_type == "standard":
        from apps.clients.services import update_client_visit_and_segment
        update_client_visit_and_segment(client_id)

    if repair.assigned_to_id:
        from apps.accounts.services.notification_service import notify_repair_assigned

        notify_repair_assigned(repair, repair.assigned_to_id)

    # Powiadom adminów o każdej nowej naprawie
    from apps.accounts.services.notification_service import notify_new_repair_to_admins

    notify_new_repair_to_admins(repair)

    return repair


def _accessories_text_from_flags(
    *,
    accessory_etui=False,
    accessory_sim=False,
    accessory_charger=False,
    accessory_cable=False,
    accessory_box=False,
):
    parts = []
    if accessory_etui:
        parts.append("Etui")
    if accessory_sim:
        parts.append("Karta SIM")
    if accessory_charger:
        parts.append("Ładowarka")
    if accessory_cable:
        parts.append("Kabel")
    if accessory_box:
        parts.append("Pudełko")
    return ", ".join(parts)


def _apply_intake_fields_to_device(device, **kwargs):
    """Uzupełnia pola urządzenia z przyjęcia stacjonarnego (nadpisuje jeśli podano)."""
    manual_brand = kwargs.get("manual_brand")
    device_color = kwargs.get("device_color")
    visual_condition = kwargs.get("visual_condition")
    device_password = kwargs.get("device_password")
    accessories_included = kwargs.get("accessories_included")
    accessory_etui = kwargs.get("accessory_etui", False)
    model_name = kwargs.get("model_name")

    updates = []
    if manual_brand is not None and str(manual_brand).strip():
        device.manual_brand = str(manual_brand).strip()[:100]
        updates.append("manual_brand")
    if model_name is not None and str(model_name).strip():
        device.model_name = str(model_name).strip()[:200]
        updates.append("model_name")
    if device_color is not None and str(device_color).strip():
        device.color = str(device_color).strip()[:64]
        updates.append("color")
    if visual_condition is not None and str(visual_condition).strip():
        device.condition_on_arrival = str(visual_condition).strip()
        updates.append("condition_on_arrival")
    if device_password is not None and str(device_password).strip():
        device.password = str(device_password).strip()[:100]
        updates.append("password")
    if accessories_included is not None and str(accessories_included).strip():
        device.accessories_included = str(accessories_included).strip()
        updates.append("accessories_included")
    device.has_case = bool(accessory_etui)
    updates.append("has_case")
    device.save(update_fields=list(dict.fromkeys(updates)))


def _maybe_send_intake_confirmation_email(repair, send_confirmation_email):
    if not send_confirmation_email:
        return
    to_email = (repair.client.email or "").strip()
    if not to_email or "prokom.local" in to_email.lower():
        return
    from apps.communications.services.send import send_repair_submission_confirmation

    send_repair_submission_confirmation(repair, intake_stationary=True)


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
    device_brand_name=None,
    device_model_name=None,
    manual_brand=None,
    device_color=None,
    visual_condition=None,
    device_password=None,
    accessory_etui=False,
    accessory_sim=False,
    accessory_charger=False,
    accessory_cable=False,
    accessory_box=False,
    internal_notes=None,
    estimated_cost=None,
    estimated_completion_date=None,
    assigned_to_id=None,
    unassigned_explicit=False,
    send_confirmation_email=False,
    hammer_glass_interest=None,
):
    """
    Szybkie przyjęcie (prokom.md): minimalne dane, naprawa z is_incomplete=True, source=in_person.
    - client_id + device_id (istniejące urządzenie)
    - client_id + device_category, bez device_id — nowe urządzenie u istniejącego klienta
    - nowy klient: first_name, last_name, phone, device_category (email opcjonalny — placeholder jeśli brak)
    """
    from apps.common.enums import RepairSource

    accessories_included = _accessories_text_from_flags(
        accessory_etui=accessory_etui,
        accessory_sim=accessory_sim,
        accessory_charger=accessory_charger,
        accessory_cable=accessory_cable,
        accessory_box=accessory_box,
    )

    skip_auto_assign = bool(unassigned_explicit) and not assigned_to_id

    common_cr = dict(
        problem_description=problem_description,
        created_by_id=created_by_id,
        delivery_method="in_person",
        return_method="in_person",
        source=RepairSource.IN_PERSON,
        is_incomplete=True,
        internal_notes=internal_notes,
        estimated_cost=estimated_cost,
        estimated_completion_date=estimated_completion_date,
        visual_condition_description=visual_condition,
        assigned_to_id=assigned_to_id,
        skip_auto_assign=skip_auto_assign,
    )

    effective_manual_brand = (device_brand_name or manual_brand or "").strip() or None

    dev_kw = dict(
        manual_brand=effective_manual_brand,
        device_color=device_color,
        visual_condition=visual_condition,
        device_password=device_password,
        accessories_included=accessories_included,
        accessory_etui=accessory_etui,
        model_name=device_model_name,
    )

    if client_id and device_id:
        device = Device.objects.filter(id=device_id, client_id=client_id).first()
        if not device:
            raise ValueError("Urządzenie nie należy do podanego klienta.")
        _apply_intake_fields_to_device(device, **dev_kw)
        repair = create_repair_request(
            client_id=client_id,
            device_id=device_id,
            **common_cr,
        )
        if hammer_glass_interest is not None:
            repair.hammer_glass_interest = hammer_glass_interest
            repair.save(update_fields=["hammer_glass_interest"])
        _maybe_send_intake_confirmation_email(repair, send_confirmation_email)
        return repair

    if client_id and device_category and not device_id:
        client = Client.objects.filter(id=client_id).first()
        if not client:
            raise ValueError("Nie znaleziono klienta.")
        device = Device(
            client=client,
            category=device_category,
            model_name=(device_model_name or "").strip() or "Do uzupełnienia",
            manual_brand=(effective_manual_brand or "")[:100],
            color=(device_color or "").strip()[:64],
            condition_on_arrival=(visual_condition or "").strip(),
            password=(device_password or "").strip()[:100],
            accessories_included=accessories_included,
            has_case=bool(accessory_etui),
        )
        device.save()
        repair = create_repair_request(
            client_id=client.id,
            device_id=device.id,
            **common_cr,
        )
        if hammer_glass_interest is not None:
            repair.hammer_glass_interest = hammer_glass_interest
            repair.save(update_fields=["hammer_glass_interest"])
        _maybe_send_intake_confirmation_email(repair, send_confirmation_email)
        return repair

    if not all([first_name, last_name, phone]) or not device_category:
        raise ValueError(
            "Szybkie przyjęcie: podaj client_id+device_id, client_id+device_category (nowe urządzenie) "
            "albo first_name, last_name, phone i device_category (nowy klient)."
        )

    email_effective = (email or "").strip()
    if not email_effective:
        email_effective = f"anon-{uuid.uuid4().hex[:20]}@prokom.local"

    client = Client(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        email=email_effective,
    )
    client.save()

    device = Device(
        client=client,
        category=device_category,
        model_name=(device_model_name or "").strip() or "Do uzupełnienia",
        manual_brand=(effective_manual_brand or "")[:100],
        color=(device_color or "").strip()[:64],
        condition_on_arrival=(visual_condition or "").strip(),
        password=(device_password or "").strip()[:100],
        accessories_included=accessories_included,
        has_case=bool(accessory_etui),
    )
    device.save()

    repair = create_repair_request(
        client_id=client.id,
        device_id=device.id,
        **common_cr,
    )
    if hammer_glass_interest is not None:
        repair.hammer_glass_interest = hammer_glass_interest
        repair.save(update_fields=["hammer_glass_interest"])
    _maybe_send_intake_confirmation_email(repair, send_confirmation_email)
    return repair


def _resolve_parent_repair(parent_repair_id=None, parent_repair_number=None):
    """Zwraca RepairRequest lub None. Numer dopasowuje case-insensitive (dokładny numer ref)."""
    if parent_repair_id:
        r = RepairRequest.objects.filter(pk=parent_repair_id).select_related("client", "device").first()
        if not r:
            raise ValueError("Nie znaleziono naprawy nadrzędnej (id).")
        return r
    num = (parent_repair_number or "").strip()
    if num:
        r = (
            RepairRequest.objects.select_related("client", "device")
            .filter(repair_number__iexact=num)
            .first()
        )
        if not r:
            raise ValueError("Nie znaleziono naprawy o podanym numerze referencyjnym.")
        return r
    return None


@transaction.atomic
def quick_complaint_warranty_intake(
    *,
    created_by_id,
    repair_type,
    problem_description,
    parent_repair_id=None,
    parent_repair_number=None,
    first_name=None,
    last_name=None,
    phone=None,
    email=None,
    device_category=None,
    device_brand_name=None,
    device_model_name=None,
    manual_brand=None,
    device_color=None,
    visual_condition=None,
    device_password=None,
    accessory_etui=False,
    accessory_sim=False,
    accessory_charger=False,
    accessory_cable=False,
    accessory_box=False,
    internal_notes=None,
    estimated_cost=None,
    estimated_completion_date=None,
    assigned_to_id=None,
    unassigned_explicit=False,
    send_confirmation_email=False,
    hammer_glass_interest=None,
):
    """
    Przyjęcie stacjonarne reklamacji lub gwarancji.
    - complaint: wymagana naprawa nadrzędna (id lub numer).
    - warranty: opcjonalna naprawa nadrzędna; bez niej — jak szybkie przyjęcie (nowy klient + urządzenie).
    """
    rt = (repair_type or "").strip()
    if rt not in ("complaint", "warranty"):
        raise ValueError("Typ sprawy musi być reklamacja lub gwarancja.")

    parent = _resolve_parent_repair(
        parent_repair_id=parent_repair_id,
        parent_repair_number=parent_repair_number,
    )

    if rt == "complaint" and not parent:
        raise ValueError("Reklamacja wymaga wskazania naprawy (numer lub id w systemie).")

    skip_auto_assign = bool(unassigned_explicit) and not assigned_to_id
    common_cr = dict(
        problem_description=problem_description,
        created_by_id=created_by_id,
        delivery_method="in_person",
        return_method="in_person",
        source=RepairSource.IN_PERSON,
        is_incomplete=True,
        internal_notes=internal_notes,
        estimated_cost=estimated_cost,
        estimated_completion_date=estimated_completion_date,
        assigned_to_id=assigned_to_id,
        skip_auto_assign=skip_auto_assign,
        repair_type=rt,
        parent_repair_id=parent.id if parent else None,
        is_warranty=(rt == "warranty"),
        complaint_warranty_status=ComplaintWarrantyStatus.ACCEPTED,
    )

    accessories_included = _accessories_text_from_flags(
        accessory_etui=accessory_etui,
        accessory_sim=accessory_sim,
        accessory_charger=accessory_charger,
        accessory_cable=accessory_cable,
        accessory_box=accessory_box,
    )

    effective_manual_brand = (device_brand_name or manual_brand or "").strip() or None

    dev_kw = dict(
        manual_brand=effective_manual_brand,
        device_color=device_color,
        visual_condition=visual_condition,
        device_password=device_password,
        accessories_included=accessories_included,
        accessory_etui=accessory_etui,
        model_name=device_model_name,
    )

    # --- Ścieżka z naprawą nadrzędną (reklamacja lub gwarancja z kontekstem) ---
    if parent:
        repair = create_repair_request(
            client_id=parent.client_id,
            device_id=parent.device_id,
            **common_cr,
        )
        if hammer_glass_interest is not None:
            repair.hammer_glass_interest = hammer_glass_interest
            repair.save(update_fields=["hammer_glass_interest"])
        _maybe_send_intake_confirmation_email(repair, send_confirmation_email)

        # Powiadom adminów o reklamacji/gwarancji
        from apps.accounts.services.notification_service import notify_complaint_warranty_to_admins
        notify_complaint_warranty_to_admins(repair)

        return repair

    # --- Tylko gwarancja bez parent: nowy klient + urządzenie (jak quick accept) ---
    if rt != "warranty":
        raise ValueError("Brak naprawy nadrzędnej — dozwolone tylko dla gwarancji.")

    if not all([(first_name or "").strip(), (last_name or "").strip(), (phone or "").strip(), device_category]):
        raise ValueError("Gwarancja bez naprawy w systemie: podaj imię, nazwisko, telefon i kategorię urządzenia.")

    email_effective = (email or "").strip()
    if not email_effective:
        email_effective = f"anon-{uuid.uuid4().hex[:20]}@prokom.local"

    client = Client(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        email=email_effective,
    )
    client.save()

    device = Device(
        client=client,
        category=device_category,
        model_name=(device_model_name or "").strip() or "Do uzupełnienia",
        manual_brand=(effective_manual_brand or "")[:100],
        color=(device_color or "").strip()[:64],
        condition_on_arrival=(visual_condition or "").strip(),
        password=(device_password or "").strip()[:100],
        accessories_included=accessories_included,
        has_case=bool(accessory_etui),
    )
    device.save()

    repair = create_repair_request(
        client_id=client.id,
        device_id=device.id,
        **common_cr,
    )
    if hammer_glass_interest is not None:
        repair.hammer_glass_interest = hammer_glass_interest
        repair.save(update_fields=["hammer_glass_interest"])
    _maybe_send_intake_confirmation_email(repair, send_confirmation_email)

    # Powiadom adminów o gwarancji
    from apps.accounts.services.notification_service import notify_complaint_warranty_to_admins
    notify_complaint_warranty_to_admins(repair)

    return repair
