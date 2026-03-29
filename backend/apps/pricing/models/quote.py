"""Wycena naprawy (wersje, pozycje: części + robocizna)."""
from decimal import Decimal
from django.db import models
from django.db.models import Sum
from django.utils import timezone
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
    last_client_email_sent_at = models.DateTimeField(
        _("ostatnia kopia wyceny na e-mail klienta"),
        null=True,
        blank=True,
        help_text=_("Ustawiane przy udanej wysyłce e-maila z podsumowaniem wyceny."),
    )
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


class PartOrigin(models.TextChoices):
    """Oryginał vs zamiennik (dla pozycji z częścią)."""
    ORIGINAL = "original", _("Oryginalna (OEM)")
    AFTERMARKET = "aftermarket", _("Zamiennik")


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
    part_origin = models.CharField(
        _("część oryginalna / zamiennik"),
        max_length=20,
        choices=PartOrigin.choices,
        default=PartOrigin.AFTERMARKET,
        db_index=True,
    )
    quantity = models.DecimalField(_("ilość"), max_digits=10, decimal_places=2, default=Decimal("1"))
    parts_price = models.DecimalField(
        _("cena części (jedn.)"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0"),
    )
    labour_price = models.DecimalField(
        _("cena robocizny (jedn.)"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0"),
    )
    unit_price = models.DecimalField(
        _("cena jedn. (suma)"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Części + robocizna na jednostkę; używane razem z ilością do kwoty pozycji."),
    )
    total = models.DecimalField(_("razem"), max_digits=10, decimal_places=2, editable=False)

    class Meta:
        verbose_name = _("pozycja wyceny")
        verbose_name_plural = _("pozycje wyceny")
        ordering = ["quote", "id"]

    def __str__(self):
        return f"{self.get_item_type_display()}: {self.description or (self.part.name if self.part else self.labour_type.name)} — {self.total} zł"

    def save(self, *args, **kwargs):
        p = self.parts_price if self.parts_price is not None else Decimal("0")
        l = self.labour_price if self.labour_price is not None else Decimal("0")
        self.unit_price = p + l
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        self.quote.recalculate_total()


class QuoteVersion(TimestampedModel):
    """Snapshot wersji wyceny (historia: kto, kiedy, jaka suma i pozycje)."""
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name="versions",
        verbose_name=_("wycena"),
    )
    version_number = models.PositiveSmallIntegerField(_("numer wersji"))
    total_amount = models.DecimalField(
        _("suma"),
        max_digits=10,
        decimal_places=2,
        default=Decimal("0"),
    )
    items_snapshot = models.JSONField(
        _("snapshot pozycji"),
        default=list,
        help_text=_("Lista dict: item_type, description, quantity, unit_price, total"),
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_quote_versions",
        verbose_name=_("utworzone przez"),
    )

    class Meta:
        verbose_name = _("wersja wyceny")
        verbose_name_plural = _("wersje wyceny")
        ordering = ["quote", "-version_number"]
        unique_together = [["quote", "version_number"]]

    def __str__(self):
        return f"Wycena {self.quote_id} v{self.version_number}"


class QuoteDecision(models.Model):
    """Decyzja klienta: akceptacja lub odrzucenie wyceny (jedna na wycenę)."""
    quote = models.OneToOneField(
        Quote,
        on_delete=models.CASCADE,
        related_name="decision",
        verbose_name=_("wycena"),
    )
    decision = models.CharField(
        _("decyzja"),
        max_length=20,
        choices=[("accepted", _("Zaakceptowano")), ("rejected", _("Odrzucono"))],
    )
    decided_at = models.DateTimeField(_("data decyzji"), default=timezone.now)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quote_decisions",
        verbose_name=_("zdecydował (klient)"),
    )
    comment = models.TextField(_("komentarz"), blank=True)

    class Meta:
        verbose_name = _("decyzja wyceny")
        verbose_name_plural = _("decyzje wycen")

    def __str__(self):
        return f"{self.get_decision_display()} — {self.quote}"
