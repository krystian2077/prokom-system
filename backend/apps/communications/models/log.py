"""
PRO-KOM Serwis — Communications — Log wysłanych wiadomości (historia przy naprawie).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import TimestampedModel
from apps.common.enums import CommunicationChannel


class CommunicationLog(models.Model):
    """
    Wpis w historii komunikacji: wysłany e-mail lub SMS w kontekście naprawy.

    Widoczny w timeline naprawy. Zawiera snapshot treści i odbiorcę.
    """
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="communication_logs",
        verbose_name=_("naprawa"),
    )
    template = models.ForeignKey(
        "communications.MessageTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_logs",
        verbose_name=_("szablon"),
    )
    channel = models.CharField(
        _("kanał"),
        max_length=10,
        choices=CommunicationChannel.choices,
    )
    recipient = models.CharField(
        _("odbiorca"),
        max_length=200,
        help_text=_("Adres e-mail lub numer telefonu"),
    )
    subject = models.CharField(
        _("temat"),
        max_length=300,
        blank=True,
    )
    body_snapshot = models.TextField(
        _("wysłana treść"),
        help_text=_("Kopia treści w momencie wysyłki"),
    )
    sent_at = models.DateTimeField(
        _("wysłano"),
        auto_now_add=True,
    )
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_communications",
        verbose_name=_("wysłał"),
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=[
            ("sent", _("Wysłano")),
            ("failed", _("Błąd wysyłki")),
        ],
        default="sent",
    )
    error_message = models.TextField(
        _("komunikat błędu"),
        blank=True,
    )

    class Meta:
        verbose_name = _("log komunikacji")
        verbose_name_plural = _("logi komunikacji")
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["repair"]),
            models.Index(fields=["channel", "sent_at"]),
        ]

    def __str__(self):
        return f"{self.get_channel_display()} → {self.recipient} ({self.repair.repair_number})"
