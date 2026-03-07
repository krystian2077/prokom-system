"""
PRO-KOM Serwis — Accessories — Oferta akcesorium przy naprawie (upsell).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import TimestampedModel

from .product import AccessoryProduct


class RepairAccessoryOffer(TimestampedModel):
    """
    Oferta sprzedaży akcesorium przy naprawie (upsell).

    Staff oferuje klientowi produkt; po akceptacji ustawiamy accepted=True
    i accepted_at. unit_price_snapshot = cena w momencie oferty.
    """
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="accessory_offers",
        verbose_name=_("naprawa"),
    )
    product = models.ForeignKey(
        AccessoryProduct,
        on_delete=models.PROTECT,
        related_name="repair_offers",
        verbose_name=_("produkt"),
    )
    quantity = models.PositiveSmallIntegerField(
        _("ilość"),
        default=1,
    )
    unit_price_snapshot = models.DecimalField(
        _("cena jedn. w momencie oferty"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Kopia ceny produktu w chwili oferty"),
    )
    offered_at = models.DateTimeField(
        _("data oferty"),
        auto_now_add=True,
    )
    offered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="accessory_offers_made",
        verbose_name=_("oferował"),
    )
    accepted = models.BooleanField(
        _("zaakceptowane przez klienta"),
        default=False,
    )
    accepted_at = models.DateTimeField(
        _("data akceptacji"),
        null=True,
        blank=True,
    )
    note = models.CharField(
        _("notatka"),
        max_length=200,
        blank=True,
    )

    class Meta:
        verbose_name = _("oferta akcesorium przy naprawie")
        verbose_name_plural = _("oferty akcesoriów przy naprawach")
        ordering = ["-offered_at"]
        indexes = [
            models.Index(fields=["repair"]),
            models.Index(fields=["accepted"]),
        ]

    def __str__(self):
        status = "✓" if self.accepted else "—"
        return f"{status} {self.repair.repair_number} — {self.product.name} x{self.quantity}"

    @property
    def total_price(self):
        return self.unit_price_snapshot * self.quantity
