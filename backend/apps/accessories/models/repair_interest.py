"""
Zainteresowanie klienta akcesorium przy naprawie (przed ofertą / sprzedażą).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel
from .product import AccessoryProduct


class RepairAccessoryInterest(TimestampedModel):
    """Zapisane zainteresowanie klienta produktem (np. „weź pod uwagę ładowarkę”)."""
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="accessory_interests",
        verbose_name=_("naprawa"),
    )
    product = models.ForeignKey(
        AccessoryProduct,
        on_delete=models.PROTECT,
        related_name="repair_interests",
        verbose_name=_("produkt"),
    )
    source = models.CharField(
        _("źródło"),
        max_length=30,
        choices=[
            ("staff", _("Pracownik")),
            ("client", _("Klient")),
            ("suggestion", _("Sugestia systemu")),
        ],
        default="staff",
    )
    choose_for_me = models.BooleanField(
        _("wybierz za mnie"),
        default=False,
        help_text=_("Klient prosi o dobór"),
    )
    note = models.TextField(_("notatka"), blank=True)

    class Meta:
        verbose_name = _("zainteresowanie akcesorium")
        verbose_name_plural = _("zainteresowania akcesoriami")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.repair.repair_number} — {self.product.name}"
