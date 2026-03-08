"""Część / materiał — katalog części i magazyn."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel
from apps.common.enums import DeviceCategory
from .supplier import Supplier


class Part(BaseModel):
    """Katalog części (i opcjonalnie magazyn). Nazwa, kategoria urządzenia, marka, model, typ, wariant jakości."""
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="parts",
        verbose_name=_("dostawca domyślny"),
    )
    name = models.CharField(_("nazwa"), max_length=200, db_index=True)
    code = models.CharField(
        _("kod / SKU"),
        max_length=80,
        blank=True,
        db_index=True,
        help_text=_("Kod producenta lub wewnętrzny"),
    )
    # Katalog: do podpowiedzi i filtrowania
    device_category = models.CharField(
        _("kategoria urządzenia"),
        max_length=30,
        blank=True,
        db_index=True,
        choices=DeviceCategory.choices,
        help_text=_("np. telefon, laptop"),
    )
    brand = models.CharField(_("marka"), max_length=100, blank=True, db_index=True)
    device_model_name = models.CharField(
        _("model urządzenia"),
        max_length=150,
        blank=True,
        db_index=True,
        help_text=_("np. iPhone 13, ThinkPad T480"),
    )
    part_type = models.CharField(
        _("typ części"),
        max_length=80,
        blank=True,
        db_index=True,
        help_text=_("np. LCD, bateria, matryca, toner"),
    )
    quality_variant = models.CharField(
        _("wariant jakości"),
        max_length=40,
        blank=True,
        db_index=True,
        help_text=_("np. oryginał, zamiennik"),
    )
    # Ceny i magazyn (opcjonalne)
    purchase_price = models.DecimalField(
        _("cena zakupu (ostatnia/domyślna)"),
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
        _("kategoria wewnętrzna"),
        max_length=80,
        blank=True,
        help_text=_("np. ekrany, baterie, obudowy"),
    )
    notes = models.TextField(_("notatka wewnętrzna"), blank=True)
    is_active = models.BooleanField(_("aktywny"), default=True)

    class Meta:
        verbose_name = _("część")
        verbose_name_plural = _("części")
        ordering = ["name"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["category"]),
            models.Index(fields=["device_category", "brand", "device_model_name"]),
            models.Index(fields=["part_type", "quality_variant"]),
        ]

    def __str__(self):
        return f"{self.name}" + (f" ({self.code})" if self.code else "")
