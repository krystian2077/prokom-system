"""PRO-KOM Serwis — Tasks App (Zadania wewnętrzne)."""
from django.apps import AppConfig


class TasksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.tasks"
    verbose_name = "Zadania wewnętrzne"
