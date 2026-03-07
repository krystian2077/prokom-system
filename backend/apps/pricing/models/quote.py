"""Wycena naprawy (wersje, pozycje: części + robocizna)."""
from decimal import Decimal
from django.db import models
from django.db.models import Sum
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import BaseModel, TimestampedModel


class QuoteStatus(models.TextChoices):
    """Status wyceny."""
    DRAFT = "draft", _("Szkic")
    SENT = "sent", _("Wysłana")
    ACCEPTED = "accepted", _("Zaakceptowana")
    REJECTED = "rejected", _("Odrzucona")
    EXPIRED = "expired", _("Wygasła")


class Quote(BaseModel):
    """Wycena do naprawy (jedna naprawa może mieć wiele wersji wyceny)."""
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="quotes",
        verbose_name=_("naprawa"),
    )
    version = models.PositiveSmallIntegerField(_("wersja"), default=1)
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=QuoteStatus.choices,
        default=QuoteStatus.DRAFT,
        db_index=True,
    )
    total_amount = models.DecimalField(
        _("suma"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Suma pozycji (aktualizowana przy zapisie)"),
    )
    sent_at = models.DateTimeField(_("wysłana"), null=True, blank=True)
    valid_until = models.DateField(_("ważna do"), null=True, blank=True)
    notes = models.TextField(_("notatki do wyceny"), blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_quotes",
        verbose_name=_("utworzone przez"),
    )

    class Meta:
        verbose_name = _("wycena")
        verbose_name_plural = _("wyceny")
        ordering = ["-created_at"]
        unique_together = [["repair", "version"]]
        indexes = [
            models.Index(fields=["repair", "status"]),
        ]

    def __str__(self):
        return f"Wycena v{self.version} — {self.repair.repair_number}"

    def recalculate_total(self):
        """Przelicza total_amount na podstawie pozycji."""
        self.total_amount = self.items.aggregate(s=Sum("total"))["s"] or Decimal("0")
        self.save(update_fields=["total_amount"])


class QuoteItemType(models.TextChoices):
    """Typ pozycji wyceny."""
    PART = "part", _("Część")
    LABOUR = "labour", _("Robocizna")
    OTHER = "other", _("Inne")


class QuoteItem(TimestampedModel):
    """Pozycja wyceny (część, robocizna lub inna)."""
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("wycena"),
    )
    item_type = models.CharField(
        _("typ"),
        max_length=20,
        choices=QuoteItemType.choices,
        db_index=True,
    )
    part = models.ForeignKey(
        "inventory.Part",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quote_items",
        verbose_name=_("część"),
    )
    labour_type = models.ForeignKey(
        "pricing.LabourType",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quote_items",
        verbose_name=_("typ robocizny"),
    )
    description = models.CharField(
        _("opis"),
        max_length=300,
        blank=True,
        help_text=_("Nazwa pozycji (np. z part/labour lub dowolny tekst)"),
    )
    quantity = models.DecimalField(_("ilość"), max_digits=10, decimal_places=2, default=Decimal("1"))
    unit_price = models.DecimalField(_("cena jedn."), max_digits=10, decimal_places=2)
    total = models.DecimalField(_("razem"), max_digits=10, decimal_places=2, editable=False)

    class Meta:
        verbose_name = _("pozycja wyceny")
        verbose_name_plural = _("pozycje wyceny")
        ordering = ["quote", "id"]

    def __str__(self):
        return f"{self.get_item_type_display()}: {self.description or (self.part.name if self.part else self.labour_type.name)} — {self.total} zł"

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        self.quote.recalculate_total()
