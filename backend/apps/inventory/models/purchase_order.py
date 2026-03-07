"""Zamówienie zakupu u dostawcy."""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import BaseModel, TimestampedModel
from .supplier import Supplier
from .part import Part


class PurchaseOrderStatus(models.TextChoices):
    """Status zamówienia zakupu."""
    DRAFT = "draft", _("Szkic")
    SENT = "sent", _("Wysłane")
    CONFIRMED = "confirmed", _("Potwierdzone")
    PARTIALLY_RECEIVED = "partially_received", _("Częściowo dostarczone")
    RECEIVED = "received", _("Dostarczone")
    CANCELLED = "cancelled", _("Anulowane")


class PurchaseOrder(BaseModel):
    """Zamówienie zakupu u dostawcy."""
    order_number = models.CharField(
        _("numer zamówienia"),
        max_length=30,
        unique=True,
        editable=False,
        db_index=True,
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name=_("dostawca"),
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=PurchaseOrderStatus.choices,
        default=PurchaseOrderStatus.DRAFT,
        db_index=True,
    )
    ordered_at = models.DateTimeField(_("data zamówienia"), null=True, blank=True)
    expected_at = models.DateField(_("oczekiwana dostawa"), null=True, blank=True)
    received_at = models.DateTimeField(_("data dostawy"), null=True, blank=True)
    notes = models.TextField(_("notatki"), blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_purchase_orders",
        verbose_name=_("utworzone przez"),
    )

    class Meta:
        verbose_name = _("zamówienie zakupu")
        verbose_name_plural = _("zamówienia zakupu")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order_number} — {self.supplier.name}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self._generate_order_number()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_order_number():
        from apps.common.utils import generate_repair_number
        return generate_repair_number(prefix="PO")


class PurchaseOrderItem(TimestampedModel):
    """Pozycja zamówienia zakupu."""
    order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("zamówienie"),
    )
    part = models.ForeignKey(
        Part,
        on_delete=models.PROTECT,
        related_name="purchase_order_items",
        verbose_name=_("część"),
    )
    quantity = models.DecimalField(_("ilość"), max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(_("cena jedn."), max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _("pozycja zamówienia")
        verbose_name_plural = _("pozycje zamówienia")
        ordering = ["order", "part"]

    def __str__(self):
        return f"{self.order.order_number}: {self.part.name} x {self.quantity}"
