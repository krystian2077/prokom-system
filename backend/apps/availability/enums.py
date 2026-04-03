"""Typy dostępności pracownika."""
from django.db import models
from django.utils.translation import gettext_lazy as _


class AvailabilityType(models.TextChoices):
    """Typ wpisu dostępności."""
    AVAILABLE = "available", _("Dostępny")
    SERVICE_TRIP = "service_trip", _("Wyjazd serwisowy")
    INSTALLATION = "installation", _("Montaż")
    TEMPORARILY_UNAVAILABLE = "temporarily_unavailable", _("Niedostępny czasowo")
    DAY_OFF = "day_off", _("Dzień wolny")
    VACATION = "vacation", _("Urlop")
    SICK_LEAVE = "sick_leave", _("Chorobowe")


class AbsenceRequestStatus(models.TextChoices):
    """Status zgłoszenia nieobecności."""
    PENDING = "pending", _("Oczekuje")
    APPROVED = "approved", _("Zaakceptowane")
    REJECTED = "rejected", _("Odrzucone")

