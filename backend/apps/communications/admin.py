"""PRO-KOM Serwis — Communications Admin."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import MessageTemplate, CommunicationLog, NotificationRule


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "channel", "message_type", "suggested_for_status", "is_active", "sort_order"]
    list_filter = ["channel", "message_type", "is_active"]
    search_fields = ["name", "subject", "body"]
    list_editable = ["is_active", "sort_order"]


@admin.register(NotificationRule)
class NotificationRuleAdmin(admin.ModelAdmin):
    list_display = ["event_name", "send_panel", "send_email", "send_sms", "is_active", "template"]
    list_filter = ["event_name", "is_active"]
    list_editable = ["send_panel", "send_email", "send_sms", "is_active"]
    autocomplete_fields = ["template"]


@admin.register(CommunicationLog)
class CommunicationLogAdmin(admin.ModelAdmin):
    list_display = ["repair", "channel", "recipient", "status", "sent_at", "sent_by"]
    list_filter = ["channel", "status", "sent_at"]
    search_fields = ["repair__repair_number", "recipient"]
    readonly_fields = ["repair", "template", "channel", "recipient", "subject", "body_snapshot", "sent_at", "sent_by", "status", "error_message"]
