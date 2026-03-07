"""
PRO-KOM Serwis — Devices selectors
====================================
Logika odczytu danych urządzeń, marek i modeli.
"""
from django.db.models import Q
from apps.devices.models import Brand, DeviceModel, Device


def brand_list(*, is_active=None, ordering="name"):
    """Lista marek z opcjonalnym filtrem aktywności."""
    qs = Brand.objects.all()
    if is_active is not None:
        qs = qs.filter(is_active=is_active)
    return qs.order_by(ordering)


def device_model_list(*, brand_id=None, category=None, is_active=None, search=None, ordering="-popularity_score"):
    """Lista modeli urządzeń z filtrami."""
    qs = DeviceModel.objects.select_related("brand")

    if brand_id:
        qs = qs.filter(brand_id=brand_id)
    if category:
        qs = qs.filter(category=category)
    if is_active is not None:
        qs = qs.filter(is_active=is_active)
    if search:
        qs = qs.filter(
            Q(name__icontains=search)
            | Q(full_name__icontains=search)
            | Q(brand__name__icontains=search)
        )

    return qs.order_by(ordering)


def device_list(*, client_id=None, category=None, search=None, ordering="-created_at"):
    """Lista urządzeń z filtrami."""
    qs = Device.objects.select_related("client", "brand", "device_model")

    if client_id:
        qs = qs.filter(client_id=client_id)
    if category:
        qs = qs.filter(category=category)
    if search:
        qs = qs.filter(
            Q(model_name__icontains=search)
            | Q(serial_number__icontains=search)
            | Q(imei__icontains=search)
            | Q(client__first_name__icontains=search)
            | Q(client__last_name__icontains=search)
        )

    return qs.order_by(ordering)


def device_by_id(device_id):
    """Pobierz urządzenie po ID (UUID)."""
    return Device.objects.select_related("client", "brand", "device_model").filter(id=device_id).first()


def device_models_by_category(category):
    """Modele urządzeń dla danej kategorii (do formularzy)."""
    return DeviceModel.objects.filter(category=category, is_active=True).select_related("brand").order_by("brand__name", "name")
