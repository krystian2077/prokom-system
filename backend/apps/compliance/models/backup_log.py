"""Rejestr backupów (typ, status, ścieżka, czasy)."""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class BackupLog(models.Model):
    """Log wykonanego backupu (np. PostgreSQL → S3)."""
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="backup_logs",
        verbose_name=_("wywołany przez"),
    )
    backup_type = models.CharField(
        _("typ"),
        max_length=50,
        choices=[
            ("database", _("Baza danych")),
            ("media", _("Pliki media")),
            ("full", _("Pełny")),
        ],
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=[
            ("started", _("Rozpoczęto")),
            ("success", _("Sukces")),
            ("failed", _("Błąd")),
        ],
    )
    storage_path = models.CharField(_("ścieżka / URI"), max_length=500, blank=True)
    started_at = models.DateTimeField(_("rozpoczęto"), auto_now_add=True)
    finished_at = models.DateTimeField(_("zakończono"), null=True, blank=True)
    error_message = models.TextField(_("komunikat błędu"), blank=True)

    class Meta:
        verbose_name = _("log backupu")
        verbose_name_plural = _("logi backupów")
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.get_backup_type_display()} — {self.get_status_display()} @ {self.started_at}"
