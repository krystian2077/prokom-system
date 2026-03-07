"""
PRO-KOM Serwis — Accessories — Kategorie akcesoriów.
Ładowarki, kable, etui, słuchawki itp.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class AccessoryCategory(models.Model):
    """Kategoria akcesoriów (np. Ładowarki, Kable, Etui)."""
    name = models.CharField(
        _("nazwa"),
        max_length=100,
        unique=True,
        db_index=True,
    )
    slug = models.SlugField(
        _("slug"),
        max_length=100,
        unique=True,
    )
    description = models.TextField(
        _("opis"),
        blank=True,
    )
    sort_order = models.PositiveSmallIntegerField(
        _("kolejność"),
        default=0,
        help_text=_("Im mniejsza liczba, tym wyżej na liście"),
    )
    is_active = models.BooleanField(
        _("aktywna"),
        default=True,
    )
    created_at = models.DateTimeField(_("data utworzenia"), auto_now_add=True)
    updated_at = models.DateTimeField(_("data aktualizacji"), auto_now=True)

    class Meta:
        verbose_name = _("kategoria akcesoriów")
        verbose_name_plural = _("kategorie akcesoriów")
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name
