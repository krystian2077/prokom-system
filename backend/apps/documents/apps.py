"""PRO-KOM Serwis — Documents App."""
from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.documents"
    verbose_name = "Dokumenty i wydruki"
