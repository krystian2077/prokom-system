"""Część / materiał w magazynie."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel
from .supplier import Supplier


class Part(BaseModel):
    """Część lub materiał (magazyn)."""
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="parts",
        verbose_name=_("dostawca"),
    )
    name = models.CharField(_("nazwa"), max_length=200, db_index=True)
    code = models.CharField(
        _("kod / SKU"),
        max_length=80,
        blank=True,
        db_index=True,
        help_text=_("Kod producenta lub wewnętrzny"),
    )
    purchase_price = models.DecimalField(
        _("cena zakupu"),
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    sell_price = models.DecimalField(
        _("cena sprzedaży"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_("Domyślna cena przy wycenie"),
    )
    quantity_in_stock = models.DecimalField(
        _("stan magazynowy"),
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    min_quantity = models.DecimalField(
        _("stan minimalny"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_("Próg do zamówienia / alertu"),
    )
    unit = models.CharField(_("jednostka"), max_length=20, default="szt.")
    category = models.CharField(
        _("kategoria"),
        max_length=80,
        blank=True,
        help_text=_("np. ekrany, baterie, obudowy"),
    )
    notes = models.TextField(_("notatki"), blank=True)
    is_active = models.BooleanField(_("aktywny"), default=True)

    class Meta:
        verbose_name = _("część")
        verbose_name_plural = _("części")
        ordering = ["name"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"{self.name}" + (f" ({self.code})" if self.code else "")
