"""Statusy i priorytety zadań."""
from django.db import models
from django.utils.translation import gettext_lazy as _


class TaskStatus(models.TextChoices):
    """Status zadania."""
    NEW = "new", _("Nowe")
    IN_PROGRESS = "in_progress", _("W trakcie")
    WAITING = "waiting", _("Czeka")
    COMPLETED = "completed", _("Wykonane")
    CANCELLED = "cancelled", _("Anulowane")


class TaskPriority(models.TextChoices):
    """Priorytet zadania."""
    LOW = "low", _("Niski")
    STANDARD = "standard", _("Standardowy")
    IMPORTANT = "important", _("Ważny")
    URGENT = "urgent", _("Pilny")
