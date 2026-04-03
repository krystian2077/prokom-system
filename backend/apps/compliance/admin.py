"""PRO-KOM Serwis — Compliance Admin."""
from django.contrib import admin
from .models import BackupLog, ConfigAuditLog, FeatureFlag, GdprRequest, SystemSetting, TermsVersion


@admin.register(TermsVersion)
class TermsVersionAdmin(admin.ModelAdmin):
    list_display = ["code", "version", "document_type", "is_active", "published_at"]
    list_filter = ["document_type", "is_active"]


@admin.register(GdprRequest)
class GdprRequestAdmin(admin.ModelAdmin):
    list_display = ["client", "request_type", "status", "requested_at", "resolved_at", "handled_by"]
    list_filter = ["request_type", "status", "requested_at"]
    search_fields = ["client__first_name", "client__last_name", "client__email"]
    readonly_fields = ["requested_at"]
    raw_id_fields = ["client", "handled_by"]
    date_hierarchy = "requested_at"


@admin.register(BackupLog)
class BackupLogAdmin(admin.ModelAdmin):
    list_display = ["backup_type", "status", "started_at", "finished_at", "triggered_by"]
    list_filter = ["backup_type", "status"]
    readonly_fields = ["started_at"]
    date_hierarchy = "started_at"


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ["key", "category", "value_type", "is_secret", "is_readonly", "updated_at", "updated_by"]
    list_filter = ["category", "value_type", "is_secret", "is_readonly"]
    search_fields = ["key", "label", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ["key", "name", "is_enabled", "rollout_percentage", "updated_at", "updated_by"]
    list_filter = ["is_enabled"]
    search_fields = ["key", "name", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ConfigAuditLog)
class ConfigAuditLogAdmin(admin.ModelAdmin):
    list_display = ["entity_type", "entity_key", "action", "changed_by", "created_at"]
    list_filter = ["entity_type", "action", "created_at"]
    search_fields = ["entity_key", "action"]
    readonly_fields = ["entity_type", "entity_key", "action", "old_value", "new_value", "metadata", "changed_by", "created_at"]

