"""
PRO-KOM Serwis — Analytics — Modele
====================================
Snapshoty statystyk pracowników (dzienne agregacje).
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class EmployeeStatsSnapshot(models.Model):
    """
    Dzienny snapshot statystyk pracownika (agregacja za jeden dzień).
    Wypełniany przez task Celery (np. o północy za poprzedni dzień).
    """
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stats_snapshots",
        verbose_name=_("pracownik"),
    )
    date = models.DateField(_("data"), db_index=True)
    repairs_count = models.PositiveIntegerField(_("liczba napraw (przypisanych/zakończonych)"), default=0)
    delayed_repairs_count = models.PositiveIntegerField(_("zaległe naprawy"), default=0)
    quotes_sent_count = models.PositiveIntegerField(_("wysłane wyceny"), default=0)
    ready_for_pickup_count = models.PositiveIntegerField(_("gotowe do odbioru"), default=0)
    upsell_total = models.DecimalField(
        _("suma upsell (akcesoria/HG)"),
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    profit_total = models.DecimalField(
        _("zysk (opcjonalnie)"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("snapshot statystyk pracownika")
        verbose_name_plural = _("snapshoty statystyk pracowników")
        ordering = ["-date", "employee"]
        unique_together = [["employee", "date"]]
        indexes = [
            models.Index(fields=["employee", "date"]),
        ]

    def __str__(self):
        return f"{self.employee.get_full_name()} — {self.date}"
