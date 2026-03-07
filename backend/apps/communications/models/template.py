"""
PRO-KOM Serwis — Communications — Szablony wiadomości (e-mail, SMS).
Zmienne w treści: {{repair_number}}, {{client_name}}, {{device_name}}, {{status}}, {{estimated_duration}}, itd.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel
from apps.common.enums import CommunicationChannel, MessageType


class MessageTemplate(TimestampedModel):
    """
    Szablon wiadomości e-mail lub SMS.

    Treść może zawierać zmienne w formacie {{nazwa}}, np.:
    {{repair_number}}, {{client_name}}, {{client_phone}}, {{device_name}},
    {{status}}, {{estimated_duration}}, {{company_name}}.
    """
    name = models.CharField(
        _("nazwa szablonu"),
        max_length=150,
        db_index=True,
    )
    channel = models.CharField(
        _("kanał"),
        max_length=10,
        choices=CommunicationChannel.choices,
    )
    message_type = models.CharField(
        _("typ wiadomości"),
        max_length=20,
        choices=MessageType.choices,
        default=MessageType.INFO,
    )
    # Dla e-mail
    subject = models.CharField(
        _("temat"),
        max_length=200,
        blank=True,
        help_text=_("Tylko dla kanału e-mail; może zawierać {{zmienne}}"),
    )
    # Treść (e-mail body lub SMS)
    body = models.TextField(
        _("treść"),
        help_text=_("Zmienne: {{repair_number}}, {{client_name}}, {{device_name}}, {{status}}, {{estimated_duration}}"),
    )
    is_active = models.BooleanField(
        _("aktywny"),
        default=True,
    )
    sort_order = models.PositiveSmallIntegerField(
        _("kolejność"),
        default=0,
    )
    # Opcjonalnie: sugerowany przy statusie naprawy (np. quote_sent, ready_for_pickup)
    suggested_for_status = models.CharField(
        _("sugerowany przy statusie"),
        max_length=30,
        blank=True,
        db_index=True,
    )

    class Meta:
        verbose_name = _("szablon wiadomości")
        verbose_name_plural = _("szablony wiadomości")
        ordering = ["channel", "sort_order", "name"]
        indexes = [
            models.Index(fields=["channel", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_channel_display()})"
