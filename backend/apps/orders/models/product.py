"""Produkt w katalogu zamówień (do podpowiedzi i historii)."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel
from .category import OrderProductCategory


class OrderProduct(BaseModel):
    """Produkt w katalogu zamówień — nazwa, kategoria, marka, typ; historia w zamówieniach."""
    category = models.ForeignKey(
        OrderProductCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        verbose_name=_("kategoria"),
    )
    name = models.CharField(_("nazwa"), max_length=200, db_index=True)
    ean = models.CharField(
        _("EAN"),
        max_length=20,
        blank=True,
        db_index=True,
        help_text=_("Opcjonalnie; do wyszukiwania i unikania duplikatów"),
    )
    brand = models.CharField(_("marka"), max_length=100, blank=True, db_index=True)
    product_type = models.CharField(
        _("typ produktu"),
        max_length=80,
        blank=True,
        db_index=True,
        help_text=_("np. ładowarka, kabel, etui, szkło"),
    )
    notes = models.TextField(_("notatka"), blank=True)
    is_active = models.BooleanField(_("aktywny"), default=True, db_index=True)

    class Meta:
        verbose_name = _("produkt (zamówienia)")
        verbose_name_plural = _("produkty (zamówienia)")
        ordering = ["name"]

    def __str__(self):
        return self.name
