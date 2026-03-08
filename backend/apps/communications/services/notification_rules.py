"""Reguły powiadomień — pobieranie aktywnych reguł dla zdarzenia."""
from apps.communications.models import NotificationRule


def get_notification_rules(event_name):
    """Zwraca listę aktywnych reguł dla danego zdarzenia."""
    return list(
        NotificationRule.objects.filter(
            event_name=event_name,
            is_active=True,
        ).select_related("template")
    )
