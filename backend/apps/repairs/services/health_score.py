"""
PRO-KOM Serwis — Health score naprawy (prokom.md).
Reguły w kodzie: brak wyceny 24h, brak odpowiedzi, gotowe 3+ dni, brak aktualizacji 2 dni, szybkie przyjęcie nieuzupełnione 2h.
"""
from django.utils import timezone
from datetime import timedelta

from apps.repairs.models import RepairRequest
from apps.common.enums import RepairStatus


def get_repair_health_score(repair):
    """
    Zwraca (level, issues): level in ('green', 'yellow', 'red'), issues — lista stringów.
    """
    if not repair:
        return "green", []
    issues = []
    now = timezone.now()

    # Brak wyceny 24h (nowe / w diagnozie / diagnoza zakończona, bez wysłanej wyceny)
    if repair.status in (RepairStatus.NEW, RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS, RepairStatus.DIAGNOSTICS_DONE):
        if repair.status != RepairStatus.QUOTE_SENT and repair.status != RepairStatus.QUOTE_ACCEPTED:
            created = repair.created_at
            if (now - created).total_seconds() > 24 * 3600:
                issues.append("Brak wyceny ponad 24h")

    # Wycena wysłana — brak odpowiedzi klienta 24h
    if repair.status == RepairStatus.QUOTE_SENT:
        last_quote = repair.quotes.filter(status="sent").order_by("-sent_at").first()
        if last_quote and last_quote.sent_at:
            if (now - last_quote.sent_at).total_seconds() > 24 * 3600:
                issues.append("Brak odpowiedzi klienta na wycenę ponad 24h")

    # Gotowe do odbioru 3+ dni
    if repair.status == RepairStatus.READY_FOR_PICKUP and repair.ready_for_pickup_at:
        if (now - repair.ready_for_pickup_at).days >= 3:
            issues.append("Urządzenie gotowe do odbioru od 3+ dni")

    # Brak aktualizacji 2 dni (ostatni wpis w status_history)
    last_status_change = repair.status_history.order_by("-created_at").first()
    if last_status_change:
        if (now - last_status_change.created_at).days >= 2:
            if repair.status not in (RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.CANCELLED):
                issues.append("Brak aktualizacji od 2 dni")

    # Szybkie przyjęcie nieuzupełnione 2h
    if repair.is_incomplete and repair.created_at:
        if (now - repair.created_at).total_seconds() > 2 * 3600:
            issues.append("Szybkie przyjęcie nieuzupełnione od 2h")

    # Zaległa (overdue)
    if repair.estimated_completion_date and repair.status not in (
        RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.CANCELLED, RepairStatus.READY_FOR_PICKUP
    ):
        if now.date() > repair.estimated_completion_date:
            issues.append("Termin realizacji przekroczony")

    if not issues:
        return "green", []
    if any("24h" in i or "2 dni" in i or "2h" in i for i in issues) and len(issues) <= 1:
        return "yellow", issues
    return "red", issues
