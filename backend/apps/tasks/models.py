"""Zadanie wewnętrzne i komentarze."""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import BaseModel
from .enums import TaskStatus, TaskPriority


class Task(BaseModel):
    """Zadanie wewnętrzne — tytuł, opis, przypisany, status, priorytet, termin, powiązania."""
    title = models.CharField(_("tytuł"), max_length=200, db_index=True)
    description = models.TextField(_("opis"), blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_tasks",
        verbose_name=_("utworzył"),
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
        verbose_name=_("przypisane do"),
    )

    status = models.CharField(
        _("status"),
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.NEW,
        db_index=True,
    )
    priority = models.CharField(
        _("priorytet"),
        max_length=20,
        choices=TaskPriority.choices,
        default=TaskPriority.STANDARD,
        db_index=True,
    )

    due_date = models.DateTimeField(_("termin wykonania"), null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(_("data zakończenia"), null=True, blank=True)

    related_repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="related_tasks",
        verbose_name=_("powiązana naprawa"),
    )
    related_client = models.ForeignKey(
        "clients.Client",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="related_tasks",
        verbose_name=_("powiązany klient"),
    )
    related_customer_order = models.ForeignKey(
        "orders.CustomerOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="related_tasks",
        verbose_name=_("powiązane zamówienie klienta"),
    )
    related_store_order = models.ForeignKey(
        "orders.StoreSupplyOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="related_tasks",
        verbose_name=_("powiązane zamówienie sklepowe"),
    )

    is_archived = models.BooleanField(_("zarchiwizowane"), default=False, db_index=True)

    class Meta:
        verbose_name = _("zadanie")
        verbose_name_plural = _("zadania")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["assigned_to", "status", "-due_date"]),
            models.Index(fields=["due_date", "status"]),
        ]

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        if not self.due_date or self.status in (TaskStatus.COMPLETED, TaskStatus.CANCELLED):
            return False
        from django.utils import timezone
        return timezone.now() > self.due_date

    @property
    def is_urgent(self):
        return self.priority == TaskPriority.URGENT


class TaskComment(BaseModel):
    """Komentarz / notatka w zadaniu."""
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name=_("zadanie"),
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_comments",
        verbose_name=_("autor"),
    )
    body = models.TextField(_("treść"))

    class Meta:
        verbose_name = _("komentarz do zadania")
        verbose_name_plural = _("komentarze do zadań")
        ordering = ["created_at"]

    def __str__(self):
        return f"Komentarz: {self.task.title} — {self.created_at}"
