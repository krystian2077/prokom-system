"""
PRO-KOM Serwis — Publiczne zgłoszenie naprawy (formularz online)
================================================================
Znajdź lub utwórz klienta, utwórz urządzenie i zgłoszenie. Bez logowania.
"""
from django.db import transaction
from apps.clients.models import Client, ClientAddress
from apps.clients.selectors import client_by_email
from apps.devices.models import Device, Brand, DeviceModel
from apps.common.enums import DeliveryMethod
from apps.repairs.services.repair_creation import create_repair_request


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
    device_model_id=None,
    model_name="",
    serial_number="",
    imei="",
    delivery_method="in_person",
    return_method="in_person",
    delivery_street="",
    delivery_city="",
    delivery_postal_code="",
    delivery_country="Polska",
):
    """
    Tworzy zgłoszenie z formularza publicznego:
    - szuka klienta po email; jeśli brak — tworzy nowego
    - tworzy adres wysyłkowy/zwrotu jeśli potrzeba
    - tworzy urządzenie
    - tworzy zgłoszenie (source=online)

    Zwraca: (repair, client_created: bool)
    """
    email = email.strip().lower()
    client = client_by_email(email)
    client_created = False

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
        # Aktualizuj dane kontaktowe jeśli się zmieniły
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

    if delivery_method != DeliveryMethod.IN_PERSON and (delivery_street or delivery_city):
        addr = ClientAddress.objects.create(
            client=client,
            label="Wysyłka",
            street=delivery_street.strip(),
            city=delivery_city.strip(),
            postal_code=delivery_postal_code.strip() or "",
            country=(delivery_country or "Polska").strip(),
        )
        delivery_address_id = addr.id
        return_address_id = addr.id  # ten sam na zwrot, chyba że dodamy osobne pola

    brand = Brand.objects.filter(id=brand_id).first() if brand_id else None
    device_model = DeviceModel.objects.filter(id=device_model_id).first() if device_model_id else None

    device = Device(
        client=client,
        category=category,
        brand=brand,
        device_model=device_model,
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
        requires_data_backup=False,
        source="online",
    )

    return repair, client_created
