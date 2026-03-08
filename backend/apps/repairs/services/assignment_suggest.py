"""
PRO-KOM Serwis — Sugestia przypisania serwisanta według kategorii urządzenia.
"""
from apps.accounts.models import User, StaffProfile
from apps.accounts.models import StaffSpecialization
from apps.common.enums import DeviceCategory


# Mapowanie kategoria urządzenia → specjalizacja (prokom.md)
CATEGORY_TO_SPECIALIZATION = {
    DeviceCategory.PHONE: StaffSpecialization.PHONE_TABLET,
    DeviceCategory.TABLET: StaffSpecialization.PHONE_TABLET,
    DeviceCategory.SMARTWATCH: StaffSpecialization.PHONE_TABLET,
    DeviceCategory.DATA_RECOVERY: StaffSpecialization.PHONE_TABLET,
    DeviceCategory.LAPTOP: StaffSpecialization.LAPTOP_PRINTER,
    DeviceCategory.DESKTOP: StaffSpecialization.LAPTOP_PRINTER,
    DeviceCategory.PRINTER: StaffSpecialization.LAPTOP_PRINTER,
    DeviceCategory.CONSOLE: StaffSpecialization.LAPTOP_PRINTER,
    DeviceCategory.OTHER: StaffSpecialization.GENERAL,
}


def suggest_assignment(repair):
    """
    Zwraca sugerowanego pracownika (User) na podstawie kategorii urządzenia naprawy.
    Szuka staff z pasującą specjalizacją i is_available=True.
    Zwraca jednego User lub None.
    """
    if not repair or not repair.device:
        return None
    category = repair.device.category
    spec = CATEGORY_TO_SPECIALIZATION.get(category, StaffSpecialization.GENERAL)
    profile = (
        StaffProfile.objects.filter(
            specialization=spec,
            is_available=True,
            user__is_active=True,
        )
        .select_related("user")
        .first()
    )
    if profile:
        return profile.user
    # Fallback: dowolny dostępny staff ze specjalizacją general
    profile = (
        StaffProfile.objects.filter(
            specialization=StaffSpecialization.GENERAL,
            is_available=True,
            user__is_active=True,
        )
        .select_related("user")
        .first()
    )
    return profile.user if profile else None
