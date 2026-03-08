"""Wpis dostępności pracownika (dzień / przedział godzinowy)."""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import BaseModel
from .enums import AvailabilityType


class EmployeeAvailability(BaseModel):
    """
    Wpis dostępności pracownika na dany dzień (cały dzień lub przedział godzinowy).
    Moduł informacyjny — kto jest w firmie, na wyjeździe, nieobecny itd.
    """
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="availability_entries",
        verbose_name=_("pracownik"),
        limit_choices_to={"role__in": ["staff", "admin"]},
    )

    availability_type = models.CharField(
        _("typ dostępności"),
        max_length=30,
        choices=AvailabilityType.choices,
        db_index=True,
    )

    date = models.DateField(_("data"), db_index=True)

    is_all_day = models.BooleanField(
        _("cały dzień"),
        default=True,
        help_text=_("Jeśli True, wpis dotyczy całego dnia; w przeciwnym razie używane są start_time i end_time"),
    )

    start_time = models.TimeField(_("godzina rozpoczęcia"), null=True, blank=True)
    end_time = models.TimeField(_("godzina zakończenia"), null=True, blank=True)

    note = models.CharField(_("notatka"), max_length=300, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_availability_entries",
        verbose_name=_("utworzył"),
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_availability_entries",
        verbose_name=_("zaktualizował"),
    )

    is_active = models.BooleanField(_("aktywny"), default=True, db_index=True)

    class Meta:
        verbose_name = _("dostępność pracownika")
        verbose_name_plural = _("dostępności pracowników")
        ordering = ["date", "employee", "start_time"]
        indexes = [
            models.Index(fields=["date", "employee"]),
            models.Index(fields=["employee", "date"]),
        ]

    def __str__(self):
        if self.is_all_day:
            return f"{self.employee.get_full_name() or self.employee.email} — {self.get_availability_type_display()} — {self.date}"
        return f"{self.employee.get_full_name() or self.employee.email} — {self.get_availability_type_display()} — {self.date} {self.start_time}-{self.end_time}"
