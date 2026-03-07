"""
PRO-KOM Serwis — Hammer Glass — Typy folii.
Clear, Matt, Privacy, Smartwatch, Tablet (zgodnie z ulotką).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class HammerGlassFilmType(models.Model):
    """Typ folii Hammer Glass: Clear, Matt, Privacy, Smartwatch, Tablet."""
    name = models.CharField(
        _("nazwa"),
        max_length=50,
        unique=True,
        db_index=True,
    )
    slug = models.SlugField(
        _("slug"),
        max_length=50,
        unique=True,
    )
    description = models.TextField(
        _("opis"),
        blank=True,
    )
    sort_order = models.PositiveSmallIntegerField(
        _("kolejność"),
        default=0,
    )
    is_active = models.BooleanField(
        _("aktywny"),
        default=True,
    )
    created_at = models.DateTimeField(_("data utworzenia"), auto_now_add=True)
    updated_at = models.DateTimeField(_("data aktualizacji"), auto_now=True)

    class Meta:
        verbose_name = _("typ folii Hammer Glass")
        verbose_name_plural = _("typy folii Hammer Glass")
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name
