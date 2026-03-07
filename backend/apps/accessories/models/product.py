"""
PRO-KOM Serwis — Accessories — Produkty (akcesoria do sprzedaży/upsell).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel
from apps.common.enums import DeviceCategory

from .category import AccessoryCategory


class AccessoryProduct(BaseModel):
    """
    Produkt z kategorii akcesoriów (ładowarka, kabel, etui itp.).

    compatible_device_categories — lista wartości DeviceCategory (JSON),
    np. ["phone", "tablet"]. Pusta = dla wszystkich urządzeń (upsell przy każdej naprawie).
    """
    category = models.ForeignKey(
        AccessoryCategory,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name=_("kategoria"),
    )
    name = models.CharField(
        _("nazwa"),
        max_length=200,
        db_index=True,
    )
    sku = models.CharField(
        _("SKU / kod"),
        max_length=80,
        blank=True,
        db_index=True,
    )
    description = models.TextField(
        _("opis"),
        blank=True,
    )
    price = models.DecimalField(
        _("cena"),
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    image = models.ImageField(
        _("zdjęcie"),
        upload_to="accessories/%Y/%m/",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(
        _("aktywny"),
        default=True,
    )
    sort_order = models.PositiveSmallIntegerField(
        _("kolejność"),
        default=0,
    )
    # Kompatybilność: które kategorie urządzeń (phone, tablet, laptop...). JSON list.
    compatible_device_categories = models.JSONField(
        _("kategorie urządzeń"),
        default=list,
        blank=True,
        help_text=_("Lista wartości: phone, tablet, laptop, desktop, printer, console, smartwatch, data_recovery, other. Pusta = wszystkie."),
    )

    class Meta:
        verbose_name = _("produkt akcesorium")
        verbose_name_plural = _("produkty akcesoria")
        ordering = ["category", "sort_order", "name"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["category", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    def compatible_with_category(self, device_category):
        """Czy produkt jest rekomendowany dla danej kategorii urządzenia."""
        if not self.compatible_device_categories:
            return True
        return device_category in self.compatible_device_categories
