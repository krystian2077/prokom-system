"""
Rejestr wniosków RODO (eksport danych, usunięcie konta).
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class GdprRequest(models.Model):
    """Wniosek klienta: eksport danych lub usunięcie konta."""
    REQUEST_TYPE = [
        ("export", _("Eksport danych")),
        ("deletion", _("Usunięcie danych / konta")),
    ]
    STATUS = [
        ("pending", _("Oczekuje")),
        ("in_progress", _("W realizacji")),
        ("completed", _("Zrealizowano")),
        ("rejected", _("Odrzucono")),
    ]
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="gdpr_requests",
        verbose_name=_("klient"),
    )
    request_type = models.CharField(
        _("typ wniosku"),
        max_length=20,
        choices=REQUEST_TYPE,
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=STATUS,
        default="pending",
    )
    reason = models.TextField(_("powód / uwagi klienta"), blank=True)
    resolution_note = models.TextField(
        _("notatka do rozstrzygnięcia"),
        blank=True,
        help_text=_("Wewnętrzna notatka przy realizacji"),
    )
    requested_at = models.DateTimeField(_("data wniosku"), auto_now_add=True)
    resolved_at = models.DateTimeField(_("data rozstrzygnięcia"), null=True, blank=True)
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gdpr_requests_handled",
        verbose_name=_("rozstrzygnął"),
    )

    class Meta:
        verbose_name = _("wniosek RODO")
        verbose_name_plural = _("wnioski RODO")
        ordering = ["-requested_at"]

    def __str__(self):
        return f"{self.get_request_type_display()} — {self.client.get_full_name()} ({self.get_status_display()})"
