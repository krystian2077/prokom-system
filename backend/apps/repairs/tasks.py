"""
PRO-KOM Serwis — Repairs tasks (Celery).
Smart reminders: przypomnienia o wycenie, nieodebranych, wizytach, szybkim przyjęciu.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from apps.repairs.models import RepairRequest, RepairVisitSchedule, ReminderLog
from apps.common.enums import RepairStatus


# Zdarzenia dla NotificationRule
EVENT_REMINDER_NO_QUOTE = "reminder_no_quote"
EVENT_REMINDER_UNCLAIMED = "reminder_unclaimed"
EVENT_REMINDER_SCHEDULED_VISIT = "reminder_scheduled_visit"
EVENT_REMINDER_QUICK_ACCEPT_INCOMPLETE = "reminder_quick_accept_incomplete"


def _already_sent_recently(repair_id, event_name, within_minutes):
    """Czy dla tej naprawy wysłano już to zdarzenie w ostatnich within_minutes minut."""
    since = timezone.now() - timedelta(minutes=within_minutes)
    return ReminderLog.objects.filter(
        repair_id=repair_id,
        event_name=event_name,
        sent_at__gte=since,
    ).exists()


@shared_task(bind=True, name="repairs.send_smart_reminders")
def send_smart_reminders(self):
    """
    Wywoływany przez beat (np. codziennie 8:00 lub co godzinę).
    Dla każdego typu: wybiera naprawy spełniające warunek, pomija te z ostatnim logiem w oknie,
    wywołuje send_notification_for_repair_event i zapisuje ReminderLog.
    """
    from apps.communications.tasks import send_notification_for_repair_event

    now = timezone.now()
    results = {"reminder_no_quote": 0, "reminder_unclaimed": 0, "reminder_scheduled_visit": 0, "reminder_quick_accept_incomplete": 0}

    # 1) Do wyceny starsze niż 24h (QUOTE_PENDING)
    cutoff_24h = now - timedelta(hours=24)
    for repair in RepairRequest.objects.filter(
        status=RepairStatus.QUOTE_PENDING,
        updated_at__lt=cutoff_24h,
    ).exclude(status=RepairStatus.CANCELLED):
        if _already_sent_recently(repair.id, EVENT_REMINDER_NO_QUOTE, 24 * 60):
            continue
        send_notification_for_repair_event.delay(str(repair.id), EVENT_REMINDER_NO_QUOTE, sent_by_id=None)
        ReminderLog.objects.create(repair=repair, event_name=EVENT_REMINDER_NO_QUOTE)
        results["reminder_no_quote"] += 1

    # 2) Gotowe do odbioru 3+ dni
    cutoff_3d = now - timedelta(days=3)
    for repair in RepairRequest.objects.filter(
        status=RepairStatus.READY_FOR_PICKUP,
        ready_for_pickup_at__lt=cutoff_3d,
    ):
        if _already_sent_recently(repair.id, EVENT_REMINDER_UNCLAIMED, 24 * 60):
            continue
        send_notification_for_repair_event.delay(str(repair.id), EVENT_REMINDER_UNCLAIMED, sent_by_id=None)
        ReminderLog.objects.create(repair=repair, event_name=EVENT_REMINDER_UNCLAIMED)
        results["reminder_unclaimed"] += 1

    # 3) Umówiona wizyta na dziś
    today = now.date()
    for schedule in RepairVisitSchedule.objects.filter(visit_date=today).select_related("repair"):
        repair = schedule.repair
        if repair.status in (RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.CANCELLED):
            continue
        if _already_sent_recently(repair.id, EVENT_REMINDER_SCHEDULED_VISIT, 24 * 60):
            continue
        send_notification_for_repair_event.delay(str(repair.id), EVENT_REMINDER_SCHEDULED_VISIT, sent_by_id=None)
        ReminderLog.objects.create(repair=repair, event_name=EVENT_REMINDER_SCHEDULED_VISIT)
        results["reminder_scheduled_visit"] += 1

    # 4) Szybkie przyjęcie nieuzupełnione 2h
    cutoff_2h = now - timedelta(hours=2)
    for repair in RepairRequest.objects.filter(
        is_incomplete=True,
        created_at__lt=cutoff_2h,
    ).exclude(status=RepairStatus.CANCELLED):
        if _already_sent_recently(repair.id, EVENT_REMINDER_QUICK_ACCEPT_INCOMPLETE, 2 * 60):
            continue
        send_notification_for_repair_event.delay(str(repair.id), EVENT_REMINDER_QUICK_ACCEPT_INCOMPLETE, sent_by_id=None)
        ReminderLog.objects.create(repair=repair, event_name=EVENT_REMINDER_QUICK_ACCEPT_INCOMPLETE)
        results["reminder_quick_accept_incomplete"] += 1

    return {"ok": True, "sent": results}
