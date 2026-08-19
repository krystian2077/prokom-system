"""
PRO-KOM Serwis — Publiczne zgłoszenie naprawy (formularz online)
================================================================
Znajdź lub utwórz klienta, utwórz urządzenie i zgłoszenie. Bez logowania.
Dla gościa (client_id=None): generowany claim_token, e-mail z linkami do śledzenia i przypisania.
"""
import logging
import secrets
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from apps.clients.models import Client, ClientAddress
from apps.clients.selectors import client_by_email, client_by_id
from apps.devices.models import Device, Brand, DeviceModel
from apps.common.enums import DeliveryMethod, ReturnMethod
from apps.repairs.services.repair_creation import create_repair_request

logger = logging.getLogger(__name__)


@transaction.atomic
def submit_repair_from_public_form(
    *,
    first_name,
    last_name,
    email,
    phone,
    preferred_contact="email",
    street="",
    city="",
    postal_code="",
    country="Polska",
    category,
    problem_description,
    brand_id=None,
    brand_name="",
    device_model_id=None,
    model_name="",
    serial_number="",
    imei="",
    delivery_method="in_person",
    return_method="in_person",
    delivery_street="",
    delivery_house_number="",
    delivery_city="",
    delivery_postal_code="",
    delivery_country="Polska",
    hammer_glass_interest=None,
    accessory_product_ids=None,
    accessory_choose_for_me=False,
    accessory_wishlist="",
    additional_notes="",
    requires_data_backup=False,
    device_turns_on=None,
    visual_condition_description="",
    client_id=None,
):
    """
    Tworzy zgłoszenie z formularza publicznego:
    - Jeśli podano client_id (zalogowany klient), używany jest ten klient i dane z formularza aktualizują profil.
    - W przeciwnym razie: szuka klienta po email; jeśli brak — tworzy nowego.
    - Tworzy adres wysyłkowy/zwrotu jeśli potrzeba, urządzenie i zgłoszenie (source=online).

    Zwraca: (repair, client_created: bool)
    """
    email = email.strip().lower()
    client_created = False

    if client_id:
        client = client_by_id(client_id)
        if not client:
            raise ValueError("Nie znaleziono konta klienta.")
        client.first_name = first_name.strip() or client.first_name
        client.last_name = last_name.strip() or client.last_name
        client.phone = phone.strip() or client.phone
        client.preferred_contact = preferred_contact or client.preferred_contact
        if street or city or postal_code:
            client.street = street.strip() or client.street
            client.city = city.strip() or client.city
            client.postal_code = postal_code.strip() or client.postal_code
            client.country = (country or "Polska").strip() or client.country
        client.save(update_fields=["first_name", "last_name", "phone", "preferred_contact", "street", "city", "postal_code", "country", "updated_at"])
    else:
        client = client_by_email(email)
        if client is None:
            client = Client(
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                email=email,
                phone=phone.strip(),
                preferred_contact=preferred_contact,
                street=street.strip() or "",
                city=city.strip() or "",
                postal_code=postal_code.strip() or "",
                country=(country or "Polska").strip(),
            )
            client.save()
            client_created = True
        else:
            client.first_name = first_name.strip() or client.first_name
            client.last_name = last_name.strip() or client.last_name
            client.phone = phone.strip() or client.phone
            client.preferred_contact = preferred_contact or client.preferred_contact
            if street or city or postal_code:
                client.street = street.strip() or client.street
                client.city = city.strip() or client.city
                client.postal_code = postal_code.strip() or client.postal_code
                client.country = (country or "Polska").strip() or client.country
            client.save(update_fields=["first_name", "last_name", "phone", "preferred_contact", "street", "city", "postal_code", "country", "updated_at"])

    delivery_address_id = None
    return_address_id = None
    needs_address = (delivery_street or "").strip() or (delivery_city or "").strip()
    delivery_needs_addr = delivery_method != DeliveryMethod.IN_PERSON
    return_needs_addr = return_method != ReturnMethod.IN_PERSON

    if (delivery_needs_addr or return_needs_addr) and needs_address:
        addr = ClientAddress.objects.create(
            client=client,
            label="Wysyłka",
            street=delivery_street.strip(),
            house_number=(delivery_house_number or "").strip()[:50],
            city=delivery_city.strip(),
            postal_code=delivery_postal_code.strip() or "",
            country=(delivery_country or "Polska").strip(),
        )
        if delivery_needs_addr:
            delivery_address_id = addr.id
        if return_needs_addr:
            return_address_id = addr.id

    brand = Brand.objects.filter(id=brand_id).first() if brand_id else None
    device_model = DeviceModel.objects.filter(id=device_model_id).first() if device_model_id else None

    device = Device(
        client=client,
        category=category,
        brand=brand,
        device_model=device_model,
        manual_brand=(brand_name or "").strip()[:100] if not brand else "",
        model_name=(model_name or "").strip() or (device_model.name if device_model else ""),
        serial_number=(serial_number or "").strip(),
        imei=(imei or "").strip(),
    )
    device.save()

    repair = create_repair_request(
        client_id=client.id,
        device_id=device.id,
        problem_description=problem_description.strip(),
        created_by_id=None,
        delivery_method=delivery_method,
        return_method=return_method,
        delivery_address_id=delivery_address_id,
        return_address_id=return_address_id,
        priority="normal",
        is_urgent=False,
        is_same_day=False,
        is_warranty=False,
        requires_data_backup=requires_data_backup,
        source="online",
    )

    is_guest = client_id is None
    if is_guest:
        repair.claim_token = secrets.token_urlsafe(32)
        repair.claim_token_expires_at = timezone.now() + timedelta(days=7)
        repair.save(update_fields=["claim_token", "claim_token_expires_at"])

    update_fields = []
    if hammer_glass_interest:
        repair.hammer_glass_interest = hammer_glass_interest
        update_fields.append("hammer_glass_interest")
    if additional_notes is not None:
        repair.client_notes = (additional_notes or "").strip()[:2000]
        update_fields.append("client_notes")
    if device_turns_on is not None:
        repair.device_turns_on = device_turns_on
        update_fields.append("device_turns_on")
    if visual_condition_description is not None:
        repair.visual_condition_description = (visual_condition_description or "").strip()[:2000]
        update_fields.append("visual_condition_description")
    if update_fields:
        repair.save(update_fields=update_fields)

    from apps.accessories.models import RepairAccessoryInterest
    product_ids = list(accessory_product_ids or [])
    for pid in product_ids:
        RepairAccessoryInterest.objects.create(
            repair=repair,
            product_id=pid,
            source="client",
            choose_for_me=False,
        )
    if accessory_choose_for_me or (accessory_wishlist or "").strip():
        RepairAccessoryInterest.objects.create(
            repair=repair,
            product=None,
            source="client",
            choose_for_me=True,
            note=(accessory_wishlist or "").strip()[:1000],
        )

    from apps.communications.services.send import send_repair_submission_confirmation
    send_repair_submission_confirmation(repair, fail_silently=True)

    # Powiadomienie wewnętrzne dla serwisu. on_commit — inaczej worker mógłby sięgnąć
    # po naprawę, zanim ta transakcja zostanie zatwierdzona.
    transaction.on_commit(lambda: _dispatch_staff_notification(repair))

    return repair, client_created


def _dispatch_staff_notification(repair):
    """Zleca powiadomienie serwisu; awaria brokera nie może wywrócić przyjętego zgłoszenia."""
    try:
        from apps.communications.tasks import send_new_repair_staff_notification_task

        send_new_repair_staff_notification_task.delay(str(repair.id))
    except Exception:
        logger.exception(
            "Nie udało się zlecić powiadomienia serwisu o zgłoszeniu %s",
            repair.repair_number,
        )
