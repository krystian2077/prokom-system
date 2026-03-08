"""
PRO-KOM Serwis — Accessories — Pakiety (bundle) produktów.
"""
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel
from .product import AccessoryProduct


class AccessoryBundle(BaseModel):
    """Pakiet akcesoriów — zestaw produktów w jednej ofercie."""
    name = models.CharField(_("nazwa"), max_length=200, db_index=True)
    slug = models.SlugField(_("slug"), max_length=120, unique=True, blank=True)
    description = models.TextField(_("opis"), blank=True)
    is_active = models.BooleanField(_("aktywny"), default=True)
    sort_order = models.PositiveSmallIntegerField(_("kolejność"), default=0)

    class Meta:
        verbose_name = _("pakiet akcesoriów")
        verbose_name_plural = _("pakiety akcesoriów")
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def total_price(self):
        """Suma cen pozycji (quantity * (fixed_price lub product.price))."""
        total = sum(item.line_total for item in self.items.select_related("product").all())
        return total


class AccessoryBundleItem(models.Model):
    """Pozycja w pakiecie: produkt + ilość + opcjonalna cena nadpisana."""
    bundle = models.ForeignKey(
        AccessoryBundle,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("pakiet"),
    )
    product = models.ForeignKey(
        AccessoryProduct,
        on_delete=models.PROTECT,
        related_name="bundle_items",
        verbose_name=_("produkt"),
    )
    quantity = models.PositiveSmallIntegerField(_("ilość"), default=1)
    fixed_price = models.DecimalField(
        _("cena nadpisana"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Opcjonalnie: cena w pakiecie (bez nadpisywania = cena produktu)."),
    )

    class Meta:
        verbose_name = _("pozycja pakietu")
        verbose_name_plural = _("pozycje pakietu")
        ordering = ["bundle", "id"]
        unique_together = [["bundle", "product"]]

    def __str__(self):
        return f"{self.bundle.name} — {self.product.name} x {self.quantity}"

    @property
    def unit_price(self):
        return self.fixed_price if self.fixed_price is not None else self.product.price

    @property
    def line_total(self):
        return self.unit_price * self.quantity
