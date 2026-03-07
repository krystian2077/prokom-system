"""
PRO-KOM Serwis — Diagnostics App — Raport diagnostyczny (wyniki, rekomendacja, ryzyko).
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class DiagnosticReport(models.Model):
    """Raport z diagnostyki naprawy (findings, rekomendacja, uwagi o ryzyku)."""
    repair = models.OneToOneField(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="diagnostic_report",
        verbose_name=_("naprawa"),
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="diagnostic_reports",
        verbose_name=_("wykonał"),
    )
    findings = models.TextField(
        _("wyniki diagnostyki"),
        blank=True,
    )
    recommendation = models.TextField(
        _("rekomendacja"),
        blank=True,
        help_text=_("Proponowane działania / wycena"),
    )
    risk_note = models.TextField(
        _("uwaga o ryzyku"),
        blank=True,
    )
    completed_at = models.DateTimeField(_("data zakończenia"), null=True, blank=True)
    created_at = models.DateTimeField(_("data utworzenia"), auto_now_add=True)
    updated_at = models.DateTimeField(_("data aktualizacji"), auto_now=True)

    class Meta:
        verbose_name = _("raport diagnostyczny")
        verbose_name_plural = _("raporty diagnostyczne")

    def __str__(self):
        return f"Diagnostyka: {self.repair.repair_number}"
