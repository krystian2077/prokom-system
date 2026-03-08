"""PRO-KOM Serwis — Availability App (Dostępność zespołu)."""
from django.apps import AppConfig


class AvailabilityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.availability"
    verbose_name = "Dostępność pracowników"
