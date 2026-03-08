"""PRO-KOM Serwis — Communications services."""
from .send import render_template_body, send_template_to_repair
from .notification_rules import get_notification_rules

__all__ = ["render_template_body", "send_template_to_repair", "get_notification_rules"]
