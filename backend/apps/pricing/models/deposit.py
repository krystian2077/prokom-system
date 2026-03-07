"""Zaliczka na naprawę."""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import TimestampedModel


class Deposit(TimestampedModel):
    """Zaliczka wpłacona przez klienta (na naprawę)."""
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="deposits",
        verbose_name=_("naprawa"),
    )
    amount = models.DecimalField(_("kwota"), max_digits=10, decimal_places=2)
    paid_at = models.DateTimeField(_("data wpłaty"), null=True, blank=True)
    notes = models.CharField(_("notatka"), max_length=200, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_deposits",
        verbose_name=_("utworzone przez"),
    )

    class Meta:
        verbose_name = _("zaliczka")
        verbose_name_plural = _("zaliczki")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.repair.repair_number}: {self.amount} zł"
