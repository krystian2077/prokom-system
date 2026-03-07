"""PRO-KOM Serwis — Compliance Admin."""
from django.contrib import admin
from .models import GdprRequest, TermsVersion, BackupLog


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
