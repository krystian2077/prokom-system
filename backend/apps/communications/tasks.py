"""
PRO-KOM Serwis — Communications tasks (Celery).
Wysyłka powiadomień po zdarzeniu (np. quote_sent, ready_for_pickup).
"""
from celery import shared_task
from apps.communications.services import get_notification_rules, send_template_to_repair


@shared_task(bind=True, name="communications.send_notification_for_repair_event")
def send_notification_for_repair_event(self, repair_id, event_name, sent_by_id=None):
    """
    Pobiera reguły dla event_name i dla każdej z szablonem wysyła wiadomość (e-mail/SMS/panel)
    i zapisuje CommunicationLog.
    """
    from apps.repairs.models import RepairRequest

    repair = RepairRequest.objects.filter(id=repair_id).select_related("client", "device").first()
    if not repair:
        return {"ok": False, "error": "repair not found"}

    rules = get_notification_rules(event_name)
    logs = []
    for rule in rules:
        if not rule.template or not rule.template.is_active:
            continue
        if rule.send_email and rule.template.channel == "email":
            log, ok = send_template_to_repair(rule.template, repair, sent_by_id=sent_by_id)
            logs.append({"log_id": log.id, "channel": "email", "ok": ok})
        elif rule.send_sms and rule.template.channel == "sms":
            log, ok = send_template_to_repair(rule.template, repair, sent_by_id=sent_by_id)
            logs.append({"log_id": log.id, "channel": "sms", "ok": ok})
        elif rule.send_panel and rule.template.channel == "panel":
            log, ok = send_template_to_repair(rule.template, repair, sent_by_id=sent_by_id)
            logs.append({"log_id": log.id, "channel": "panel", "ok": ok})
    return {"ok": True, "event": event_name, "logs": logs}
