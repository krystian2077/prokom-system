"""Dostawca części."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel


class Supplier(TimestampedModel):
    """Dostawca części / materiałów."""
    name = models.CharField(_("nazwa"), max_length=200, db_index=True)
    nip = models.CharField(_("NIP"), max_length=20, blank=True)
    street = models.CharField(_("ulica"), max_length=200, blank=True)
    city = models.CharField(_("miasto"), max_length=100, blank=True)
    postal_code = models.CharField(_("kod pocztowy"), max_length=10, blank=True)
    country = models.CharField(_("kraj"), max_length=100, default="Polska", blank=True)
    phone = models.CharField(_("telefon"), max_length=30, blank=True)
    email = models.EmailField(_("e-mail"), blank=True)
    notes = models.TextField(_("notatki"), blank=True)
    is_active = models.BooleanField(_("aktywny"), default=True)

    class Meta:
        verbose_name = _("dostawca")
        verbose_name_plural = _("dostawcy")
        ordering = ["name"]

    def __str__(self):
        return self.name
