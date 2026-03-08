"""Zamówienie klienta — produkt pod konkretnego klienta."""
from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import BaseModel
from .product import OrderProduct
from ..enums import CustomerOrderStatus


class CustomerOrder(BaseModel):
    """Zamówienie produktu pod klienta (śledzenie od zapisu do odbioru)."""
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customer_orders",
        verbose_name=_("klient"),
    )
    contact_phone = models.CharField(_("telefon kontaktowy"), max_length=30, blank=True)
    contact_email = models.EmailField(_("e-mail kontaktowy"), blank=True)

    product = models.ForeignKey(
        OrderProduct,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customer_orders",
        verbose_name=_("produkt z katalogu"),
    )
    product_name_override = models.CharField(
        _("nazwa produktu (ręcznie)"),
        max_length=200,
        blank=True,
        help_text=_("Gdy produkt nie jest z katalogu"),
    )

    related_repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="related_customer_orders",
        verbose_name=_("powiązana naprawa"),
        help_text=_("Produkt zamawiany do tej naprawy"),
    )

    quantity = models.PositiveIntegerField(_("ilość"), default=1)
    purchase_price = models.DecimalField(
        _("cena zakupu"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0"),
    )
    sell_price = models.DecimalField(
        _("cena sprzedaży dla klienta"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0"),
    )

    supplier = models.ForeignKey(
        "inventory.Supplier",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customer_orders",
        verbose_name=_("hurtownia"),
    )

    planned_order_date = models.DateField(_("planowana data zamówienia"), null=True, blank=True)
    expected_delivery_date = models.DateField(_("przewidywana data dotarcia"), null=True, blank=True)

    status = models.CharField(
        _("status"),
        max_length=30,
        choices=CustomerOrderStatus.choices,
        default=CustomerOrderStatus.NEW,
        db_index=True,
    )

    notes = models.TextField(_("notatka"), blank=True)
    deposit_amount = models.DecimalField(
        _("zaliczka"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0"),
        blank=True,
    )
    client_notified = models.BooleanField(_("klient poinformowany"), default=False)
    picked_up_at = models.DateTimeField(_("data odbioru"), null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_customer_orders",
        verbose_name=_("dodał"),
    )

    # Flagi
    deposit_paid = models.BooleanField(_("zaliczka wpłacona"), default=False)
    urgent = models.BooleanField(_("pilne"), default=False)
    client_waiting = models.BooleanField(_("klient czeka"), default=False)
    requires_contact = models.BooleanField(_("wymaga kontaktu"), default=False)
    overdue = models.BooleanField(_("przeterminowane"), default=False)

    class Meta:
        verbose_name = _("zamówienie klienta")
        verbose_name_plural = _("zamówienia klientów")
        ordering = ["-created_at"]

    def __str__(self):
        name = self.display_product_name
        return f"{name} — {self.get_status_display()}"

    @property
    def display_product_name(self):
        if self.product:
            return self.product.name
        return self.product_name_override or _("(brak nazwy)")

    @property
    def margin(self):
        """Zysk (marża) = (sell_price - purchase_price) * quantity."""
        if self.sell_price and self.purchase_price:
            return (self.sell_price - self.purchase_price) * self.quantity
        return Decimal("0")

    @property
    def margin_percent(self):
        """Marża % = (sell_price - purchase_price) / purchase_price * 100 (dla quantity=1)."""
        if self.purchase_price and self.purchase_price > 0 and self.sell_price is not None:
            return ((self.sell_price - self.purchase_price) / self.purchase_price) * 100
        return None
