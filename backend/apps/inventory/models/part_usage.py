"""Użycie części w naprawie (powiązanie naprawa–część + cena sprzedaży)."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel
from .part import Part


class PartUsage(TimestampedModel):
    """Użycie części w konkretnej naprawie (do wyceny i rozliczenia)."""
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="part_usages",
        verbose_name=_("naprawa"),
    )
    part = models.ForeignKey(
        Part,
        on_delete=models.PROTECT,
        related_name="usages",
        verbose_name=_("część"),
    )
    quantity = models.DecimalField(_("ilość"), max_digits=10, decimal_places=2)
    unit_price_used = models.DecimalField(
        _("cena jedn. zastosowana"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Cena po której sprzedano (może różnić się od ceny katalogowej)"),
    )
    notes = models.CharField(_("notatka"), max_length=200, blank=True)

    class Meta:
        verbose_name = _("użycie części")
        verbose_name_plural = _("użycia części")
        ordering = ["repair", "part"]

    def __str__(self):
        return f"{self.repair.repair_number}: {self.part.name} x {self.quantity}"

    @property
    def total(self):
        return self.quantity * self.unit_price_used
