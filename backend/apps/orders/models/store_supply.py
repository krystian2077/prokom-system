"""Zamówienie zaopatrzenia sklepu (braki, uzupełnienie)."""
from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import BaseModel
from .product import OrderProduct
from ..enums import StoreSupplyStatus, SupplyPriority


class StoreSupplyOrder(BaseModel):
    """Pozycja zaopatrzenia sklepu — produkt do zamówienia / zamówiony / dotarł."""
    product = models.ForeignKey(
        OrderProduct,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="store_supply_orders",
        verbose_name=_("produkt z katalogu"),
    )
    product_name_manual = models.CharField(
        _("nazwa produktu (ręcznie)"),
        max_length=200,
        blank=True,
        help_text=_("Gdy produkt nie jest z katalogu"),
    )
    quantity = models.PositiveIntegerField(_("ilość"), default=1)

    supplier = models.ForeignKey(
        "inventory.Supplier",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="store_supply_orders",
        verbose_name=_("hurtownia"),
    )

    estimated_cost = models.DecimalField(
        _("szacowany koszt"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    priority = models.CharField(
        _("priorytet"),
        max_length=20,
        choices=SupplyPriority.choices,
        default=SupplyPriority.STANDARD,
        db_index=True,
    )

    status = models.CharField(
        _("status"),
        max_length=30,
        choices=StoreSupplyStatus.choices,
        default=StoreSupplyStatus.TO_ORDER,
        db_index=True,
    )

    notes = models.TextField(_("notatka"), blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_store_supply_orders",
        verbose_name=_("dodał"),
    )

    class Meta:
        verbose_name = _("zaopatrzenie sklepu")
        verbose_name_plural = _("zaopatrzenie sklepu")
        ordering = ["-created_at"]

    def __str__(self):
        name = self.display_product_name
        return f"{name} x {self.quantity} — {self.get_status_display()}"

    @property
    def display_product_name(self):
        if self.product:
            return self.product.name
        return self.product_name_manual or _("(brak nazwy)")
