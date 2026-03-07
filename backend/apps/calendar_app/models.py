"""
PRO-KOM Serwis — Kalendarz: wydarzenia i blokady terminów pracownika.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class CalendarEvent(models.Model):
    """Wydarzenie w kalendarzu (np. wizyta, odbiór)."""
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="calendar_events",
        verbose_name=_("naprawa"),
        null=True,
        blank=True,
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calendar_events",
        verbose_name=_("pracownik"),
        limit_choices_to={"role": "staff"},
    )
    event_type = models.CharField(
        _("typ"),
        max_length=30,
        choices=[
            ("visit", _("Wizyta")),
            ("pickup", _("Odbiór")),
            ("other", _("Inne")),
        ],
    )
    event_date = models.DateField(_("data"))
    start_time = models.TimeField(_("godzina rozpoczęcia"), null=True, blank=True)
    end_time = models.TimeField(_("godzina zakończenia"), null=True, blank=True)
    title = models.CharField(_("tytuł"), max_length=200)
    is_locked = models.BooleanField(_("zablokowane"), default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("wydarzenie kalendarza")
        verbose_name_plural = _("wydarzenia kalendarza")
        ordering = ["event_date", "start_time"]

    def __str__(self):
        return f"{self.title} — {self.event_date}"


class TimeslotBlock(models.Model):
    """Blokada terminu pracownika (np. urlop, spotkanie)."""
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="timeslot_blocks",
        verbose_name=_("pracownik"),
    )
    block_date = models.DateField(_("data"))
    start_time = models.TimeField(_("od godziny"))
    end_time = models.TimeField(_("do godziny"))
    reason = models.CharField(_("powód"), max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("blokada terminu")
        verbose_name_plural = _("blokady terminów")
        ordering = ["block_date", "start_time"]

    def __str__(self):
        return f"{self.employee.get_full_name()} — {self.block_date} {self.start_time}-{self.end_time}"
