"""
Wersje regulaminu / dokumentów (do powiązania z zgodami klienta).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class TermsVersion(models.Model):
    """Wersja dokumentu (regulamin, polityka prywatności)."""
    code = models.CharField(
        _("kod"),
        max_length=50,
        db_index=True,
        help_text=_("np. REGULAMIN_2024"),
    )
    version = models.CharField(
        _("wersja"),
        max_length=30,
    )
    document_type = models.CharField(
        _("typ dokumentu"),
        max_length=50,
        choices=[
            ("terms", _("Regulamin")),
            ("privacy", _("Polityka prywatności")),
            ("other", _("Inny")),
        ],
    )
    is_active = models.BooleanField(_("aktywna"), default=True)
    published_at = models.DateTimeField(_("data publikacji"), null=True, blank=True)
    created_at = models.DateTimeField(_("data utworzenia"), auto_now_add=True)

    class Meta:
        verbose_name = _("wersja dokumentu")
        verbose_name_plural = _("wersje dokumentów")
        ordering = ["-published_at", "-created_at"]
        unique_together = [["code", "version"]]

    def __str__(self):
        return f"{self.code} v{self.version}"
