"""Użycie części w naprawie (powiązanie naprawa–część + cena + hurtownia + status)."""
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel
from .part import Part
from .supplier import Supplier
from .purchase_order import PurchaseOrder


class PartOrderStatus(models.TextChoices):
    """Status pozycji w kolejce części (do zamówienia / zamówione / dotarło)."""
    TO_ORDER = "to_order", _("Do zamówienia")
    ORDERED = "ordered", _("Zamówione")
    ARRIVED = "arrived", _("Dotarło")
    DELAYED = "delayed", _("Opóźnione")


class PartUsageStatus(models.TextChoices):
    """Status części w naprawie: zamówiona / dotarła / użyta / niewykorzystana."""
    ORDERED = "ordered", _("Zamówiona")
    ARRIVED = "arrived", _("Dotarła")
    USED = "used", _("Użyta w naprawie")
    UNUSED = "unused", _("Niewykorzystana")


class PartUsage(TimestampedModel):
    """Użycie części w konkretnej naprawie (do wyceny, kosztów i kolejki)."""
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
        null=True,
        blank=True,
        help_text=_("Pozycja z katalogu — albo puste, gdy używana jest wyłącznie nazwa własna."),
    )
    custom_part_name = models.CharField(
        _("nazwa własna (bez katalogu)"),
        max_length=200,
        blank=True,
        default="",
        help_text=_("Gdy brak pozycji w katalogu: dowolna nazwa wpisana w naprawie."),
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="part_usages",
        verbose_name=_("hurtownia"),
    )
    quantity = models.DecimalField(_("ilość"), max_digits=10, decimal_places=2)
    purchase_cost = models.DecimalField(
        _("koszt zakupu (jedn.)"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Cena za którą kupiono"),
    )
    unit_price_used = models.DecimalField(
        _("cena jedn. zastosowana"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Cena po której sprzedano klientowi"),
    )
    notes = models.CharField(_("notatka"), max_length=200, blank=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="added_part_usages",
        verbose_name=_("dodał"),
    )
    # Status części w naprawie
    usage_status = models.CharField(
        _("status części"),
        max_length=20,
        choices=PartUsageStatus.choices,
        default=PartUsageStatus.ORDERED,
        db_index=True,
    )
    # Kolejka części do zamówienia (kompatybilność)
    order_status = models.CharField(
        _("status zamówienia"),
        max_length=20,
        choices=PartOrderStatus.choices,
        default=PartOrderStatus.TO_ORDER,
        blank=True,
        db_index=True,
    )
    ordered_at = models.DateTimeField(_("data zamówienia"), null=True, blank=True)
    ordered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ordered_parts",
        verbose_name=_("zamawiający"),
    )
    expected_arrival_date = models.DateField(
        _("planowana data dostawy"),
        null=True,
        blank=True,
        help_text=_("Kiedy część ma dotrzeć do serwisu (orientacyjnie)"),
    )
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="part_usages",
        verbose_name=_("zamówienie zakupu"),
    )
    blocks_repair = models.BooleanField(
        _("blokuje naprawę"),
        default=True,
        help_text=_("Czy brak tej części blokuje realizację naprawy"),
    )

    class Meta:
        verbose_name = _("użycie części")
        verbose_name_plural = _("użycia części")
        ordering = ["repair", "id"]
        constraints = [
            models.CheckConstraint(
                check=(
                    Q(part__isnull=False) & Q(custom_part_name="")
                )
                | (Q(part__isnull=True) & ~Q(custom_part_name="")),
                name="inventory_partusage_part_xor_custom_name",
            ),
        ]

    def __str__(self):
        label = self.part.name if self.part_id else (self.custom_part_name or "?")
        return f"{self.repair.repair_number}: {label} x {self.quantity}"

    @property
    def total(self):
        return self.quantity * self.unit_price_used
