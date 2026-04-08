"""
PRO-KOM Serwis — Zmiana statusu naprawy
========================================
Logika biznesowa zmiany statusu + zapis do RepairStatusHistory.
"""
from django.utils import timezone
from django.db import transaction
from apps.repairs.models import RepairRequest, RepairStatusHistory
from apps.common.enums import RepairStatus


# Dozwolone przejścia statusów (uproszczone — można rozbudować o pełną maszynę stanów)
ALLOWED_TRANSITIONS = {
    RepairStatus.NEW: [RepairStatus.ACCEPTED, RepairStatus.CANCELLED],
    RepairStatus.ACCEPTED: [RepairStatus.IN_DIAGNOSTICS, RepairStatus.CANCELLED],
    RepairStatus.IN_DIAGNOSTICS: [RepairStatus.DIAGNOSTICS_DONE],
    RepairStatus.DIAGNOSTICS_DONE: [RepairStatus.QUOTE_PENDING, RepairStatus.UNREPAIRABLE],
    RepairStatus.QUOTE_PENDING: [RepairStatus.QUOTE_SENT],
    RepairStatus.QUOTE_SENT: [RepairStatus.QUOTE_ACCEPTED, RepairStatus.QUOTE_REJECTED, RepairStatus.CANCELLED],
    RepairStatus.QUOTE_ACCEPTED: [RepairStatus.WAITING_FOR_PARTS, RepairStatus.IN_REPAIR],
    RepairStatus.QUOTE_REJECTED: [RepairStatus.CANCELLED],
    RepairStatus.WAITING_FOR_PARTS: [RepairStatus.IN_REPAIR],
    RepairStatus.IN_REPAIR: [RepairStatus.REPAIR_DONE],
    RepairStatus.REPAIR_DONE: [RepairStatus.IN_TESTING],
    RepairStatus.IN_TESTING: [RepairStatus.TESTING_PASSED, RepairStatus.TESTING_FAILED],
    RepairStatus.TESTING_FAILED: [RepairStatus.IN_REPAIR],
    RepairStatus.TESTING_PASSED: [RepairStatus.READY_FOR_PICKUP],
    RepairStatus.READY_FOR_PICKUP: [RepairStatus.PICKED_UP, RepairStatus.SHIPPED, RepairStatus.ABANDONED],
    RepairStatus.SHIPPED: [RepairStatus.DELIVERED],
    RepairStatus.UNREPAIRABLE: [RepairStatus.READY_FOR_PICKUP],
}


def change_repair_status(
    repair,
    new_status,
    changed_by_id=None,
    notes="",
    *,
    skip_transition_check=False,
):
    """
    Zmienia status naprawy i zapisuje wpis w RepairStatusHistory.
    Ustawia daty (accepted_at, completed_at, ready_for_pickup_at, picked_up_at) w zależności od statusu.

    ``skip_transition_check=True`` — staff może ustawić dowolny status (pominięcie kolejności w workflow).
    Dla akcji klienta / automatycznych zostaw ``False`` (walidacja ALLOWED_TRANSITIONS).

    Zwraca zaktualizowany obiekt RepairRequest.
    """
    old_status = repair.status
    if old_status == new_status:
        return repair

    if not skip_transition_check:
        allowed = ALLOWED_TRANSITIONS.get(old_status, [])
        if new_status not in allowed:
            raise ValueError(
                f"Nieprawidłowe przejście statusu: {old_status} → {new_status}. "
                f"Dozwolone: {allowed}"
            )

    now = timezone.now()

    with transaction.atomic():
        repair.status = new_status

        if new_status == RepairStatus.ACCEPTED and not repair.accepted_at:
            repair.accepted_at = now
        elif new_status == RepairStatus.REPAIR_DONE and not repair.completed_at:
            repair.completed_at = now
        elif new_status == RepairStatus.READY_FOR_PICKUP and not repair.ready_for_pickup_at:
            repair.ready_for_pickup_at = now
        elif new_status == RepairStatus.PICKED_UP and not repair.picked_up_at:
            repair.picked_up_at = now
        elif new_status == RepairStatus.SHIPPED and not repair.picked_up_at:
            repair.picked_up_at = now  # moment zamknięcia zlecenia wysyłkowego (KPI / panel odbiorów)
        elif new_status == RepairStatus.DELIVERED and not repair.picked_up_at:
            repair.picked_up_at = now  # traktujemy dostawę jako „odbior”
        elif new_status == RepairStatus.QUOTE_SENT and not repair.quote_sent_at:
            repair.quote_sent_at = now

        repair.save(update_fields=[
            "status", "updated_at", "accepted_at", "completed_at",
            "ready_for_pickup_at", "picked_up_at", "quote_sent_at",
        ])

        RepairStatusHistory.objects.create(
            repair=repair,
            old_status=old_status,
            new_status=new_status,
            changed_by_id=changed_by_id,
            notes=notes or "",
        )

    # Powiadomienia (NotificationRule) przy wybranych zdarzeniach
    if new_status == RepairStatus.READY_FOR_PICKUP:
        from apps.communications.tasks import send_notification_for_repair_event
        from apps.communications.services.send import send_repair_completion_thank_you_email

        send_notification_for_repair_event.delay(
            str(repair.id),
            "ready_for_pickup",
            sent_by_id=changed_by_id,
        )
        send_repair_completion_thank_you_email(repair, sent_by=None, fail_silently=True)

    return repair
