"""
PRO-KOM Serwis — Hammer Glass — Produkty (folie).
Folie dopasowane do modeli urządzeń / kategorii (ulotka 12.2025, MOXIE).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel

from .film_type import HammerGlassFilmType


class ProtectionLevel(models.TextChoices):
    """Poziom ochrony folii (z ulotki)."""
    HIGH = "wysoka", _("wysoka")
    VERY_HIGH = "bardzo_wysoka", _("bardzo wysoka")
    PREMIUM = "premium", _("premium")


class HammerGlassProduct(BaseModel):
    """
    Produkt Hammer Glass (folia) — Active Shield, Cristal Shield, Watch Armour itd.

    compatible_device_categories — lista wartości DeviceCategory (JSON),
    np. ["phone", "tablet", "smartwatch"]. Pusta = wszystkie.
    """
    film_type = models.ForeignKey(
        HammerGlassFilmType,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name=_("typ folii"),
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
    # Z ulotki: poziom ochrony (wysoka / bardzo wysoka / premium)
    protection_level = models.CharField(
        _("poziom ochrony"),
        max_length=20,
        choices=ProtectionLevel.choices,
        blank=True,
        db_index=True,
    )
    # Z ulotki: cechy (np. "regeneracja mikrorys", "ochrona prywatności")
    features = models.CharField(
        _("cechy"),
        max_length=200,
        blank=True,
    )
    image = models.ImageField(
        _("zdjęcie"),
        upload_to="hammer_glass/%Y/%m/",
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
    compatible_device_categories = models.JSONField(
        _("kategorie urządzeń"),
        default=list,
        blank=True,
        help_text=_("Lista: phone, tablet, smartwatch, laptop, other. Pusta = wszystkie."),
    )

    class Meta:
        verbose_name = _("produkt Hammer Glass")
        verbose_name_plural = _("produkty Hammer Glass")
        ordering = ["film_type", "sort_order", "name"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["film_type", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.film_type.name})"

    def compatible_with_category(self, device_category):
        """Czy folia jest rekomendowana dla danej kategorii urządzenia."""
        if not self.compatible_device_categories:
            return True
        return device_category in self.compatible_device_categories
