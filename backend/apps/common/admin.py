from django.contrib import admin
from .models import AuditLogEntry


@admin.register(AuditLogEntry)
class AuditLogEntryAdmin(admin.ModelAdmin):
    list_display = ["action", "actor", "repair", "target_type", "created_at"]
    list_filter = ["action", "created_at"]
    search_fields = ["action", "target_type", "target_id"]
    readonly_fields = ["repair", "actor", "action", "target_type", "target_id", "change_payload", "created_at"]
    date_hierarchy = "created_at"
