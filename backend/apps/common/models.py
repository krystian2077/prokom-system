"""
PRO-KOM Serwis — Common App — Models
=====================================
Bazowe klasy, mixiny i wspólne modele.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class TimestampedModel(models.Model):
    """
    Abstrakcyjna klasa bazowa dodająca pola created_at i updated_at.
    Wszystkie modele biznesowe powinny z niej dziedziczyć.
    """
    created_at = models.DateTimeField(
        _("data utworzenia"),
        auto_now_add=True,
        db_index=True
    )
    updated_at = models.DateTimeField(
        _("data aktualizacji"),
        auto_now=True
    )

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """
    Abstrakcyjna klasa bazowa z UUID jako primary key.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimestampedModel):
    """
    Główna klasa bazowa łącząca UUID i timestampy.
    Większość modeli biznesowych powinna dziedziczyć z tej klasy.
    """
    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """
    Abstrakcyjna klasa do soft delete.
    Zamiast usuwać rekordy fizycznie, oznaczamy je jako usunięte.
    """
    is_deleted = models.BooleanField(
        _("usunięty"),
        default=False,
        db_index=True
    )
    deleted_at = models.DateTimeField(
        _("data usunięcia"),
        null=True,
        blank=True
    )

    class Meta:
        abstract = True

    def soft_delete(self):
        """Oznacz rekord jako usunięty."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def restore(self):
        """Przywróć usunięty rekord."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at"])


class AuditLogEntry(models.Model):
    """Wpis audytu (akcja użytkownika na obiekcie)."""
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="audit_log_entries",
        verbose_name=_("naprawa"),
        null=True,
        blank=True,
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_log_entries",
        verbose_name=_("użytkownik"),
    )
    action = models.CharField(_("akcja"), max_length=80)
    target_type = models.CharField(_("typ obiektu"), max_length=50, blank=True)
    target_id = models.CharField(_("id obiektu"), max_length=100, blank=True)
    change_payload = models.JSONField(_("zmiany"), default=dict, blank=True)
    created_at = models.DateTimeField(_("data"), auto_now_add=True)

    class Meta:
        verbose_name = _("wpis audytu")
        verbose_name_plural = _("wpisy audytu")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} — {self.actor} @ {self.created_at}"

