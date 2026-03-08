"""
PRO-KOM Serwis — Communications — Reguły powiadomień (kiedy wysyłać e-mail/panel/SMS).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class NotificationRule(models.Model):
    """
    Reguła: przy zdarzeniu event_name wysłać powiadomienie na wybrane kanały.
    Używane przez task/sygnał do automatycznej wysyłki.
    """
    event_name = models.CharField(
        _("zdarzenie"),
        max_length=50,
        db_index=True,
        help_text=_("np. quote_sent, status_ready_for_pickup, reminder_unclaimed"),
    )
    send_panel = models.BooleanField(_("wyślij do panelu klienta"), default=True)
    send_email = models.BooleanField(_("wyślij e-mail"), default=False)
    send_sms = models.BooleanField(_("wyślij SMS"), default=False)
    is_active = models.BooleanField(_("aktywna"), default=True)
    template = models.ForeignKey(
        "communications.MessageTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notification_rules",
        verbose_name=_("szablon"),
    )

    class Meta:
        verbose_name = _("reguła powiadomień")
        verbose_name_plural = _("reguły powiadomień")
        ordering = ["event_name"]

    def __str__(self):
        return f"{self.event_name} (panel={self.send_panel}, email={self.send_email}, sms={self.send_sms})"
