"""Kategoria produktów w module zamówień (ładowarki, kable, etui, itp.)."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel


class OrderProductCategory(BaseModel):
    """Kategoria produktu w katalogu zamówień."""
    name = models.CharField(_("nazwa kategorii"), max_length=100, db_index=True)
    sort_order = models.PositiveIntegerField(_("kolejność"), default=0, db_index=True)
    is_active = models.BooleanField(_("aktywna"), default=True, db_index=True)

    class Meta:
        verbose_name = _("kategoria produktów (zamówienia)")
        verbose_name_plural = _("kategorie produktów (zamówienia)")
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name
