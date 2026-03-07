"""Typy robocizny (cennik robocizny)."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel


class LabourType(TimestampedModel):
    """Typ robocizny (np. wymiana ekranu, diagnostyka)."""
    name = models.CharField(_("nazwa"), max_length=200, db_index=True)
    default_price = models.DecimalField(
        _("domyślna cena"),
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    estimated_minutes = models.PositiveIntegerField(
        _("szacowany czas [min]"),
        null=True,
        blank=True,
        help_text=_("Do szacowanej daty zakończenia naprawy"),
    )
    description = models.TextField(_("opis"), blank=True)
    is_active = models.BooleanField(_("aktywny"), default=True)

    class Meta:
        verbose_name = _("typ robocizny")
        verbose_name_plural = _("typy robocizny")
        ordering = ["name"]

    def __str__(self):
        return self.name
