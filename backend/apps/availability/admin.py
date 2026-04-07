"""PRO-KOM Serwis — Admin: Dostępność pracowników."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import EmployeeAvailability, EmployeeAbsenceRequest, WorkSession


@admin.register(EmployeeAvailability)
class EmployeeAvailabilityAdmin(admin.ModelAdmin):
    list_display = [
        "employee", "availability_type", "date", "is_all_day",
        "start_time", "end_time", "note_short", "created_by", "created_at",
    ]
    list_filter = ["availability_type", "date", "is_all_day", "is_active"]
    search_fields = ["note", "employee__email", "employee__first_name", "employee__last_name"]
    autocomplete_fields = ["employee", "created_by", "updated_by"]
    date_hierarchy = "date"
    list_select_related = ["employee", "created_by"]

    fieldsets = (
        (None, {"fields": ("employee", "availability_type", "date", "is_all_day", "start_time", "end_time", "note")}),
        (_("System"), {"fields": ("is_active", "created_by", "updated_by", "created_at", "updated_at")}),
    )
    readonly_fields = ["created_at", "updated_at"]

    def note_short(self, obj):
        return (obj.note[:40] + "…") if obj.note and len(obj.note) > 40 else (obj.note or "")

    note_short.short_description = _("Notatka")


@admin.register(EmployeeAbsenceRequest)
class EmployeeAbsenceRequestAdmin(admin.ModelAdmin):
    list_display = [
        "employee", "availability_type", "start_date", "end_date", "status", "reviewed_by", "created_at",
    ]
    list_filter = ["status", "availability_type", "start_date", "end_date"]
    search_fields = ["employee__email", "employee__first_name", "employee__last_name", "note", "review_note"]
    autocomplete_fields = ["employee", "reviewed_by"]
    date_hierarchy = "start_date"
    readonly_fields = ["created_at", "updated_at", "reviewed_at"]
    fieldsets = (
        (None, {"fields": ("employee", "availability_type", "start_date", "end_date", "note", "status")}),
        (_("Decyzja"), {"fields": ("reviewed_by", "reviewed_at", "review_note")}),
        (_("System"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(WorkSession)
class WorkSessionAdmin(admin.ModelAdmin):
    list_display = ["employee", "started_at", "ended_at", "duration_readable", "is_open"]
    list_filter = ["ended_at", "started_at"]
    search_fields = ["employee__email", "employee__first_name", "employee__last_name"]
    autocomplete_fields = ["employee"]
    date_hierarchy = "started_at"
    readonly_fields = ["created_at", "updated_at", "duration_seconds"]
    fieldsets = (
        (None, {"fields": ("employee", "started_at", "ended_at", "duration_seconds")}),
        (_("System"), {"fields": ("created_at", "updated_at")}),
    )

    def duration_readable(self, obj):
        seconds = obj.duration_seconds if obj.duration_seconds is not None else obj.elapsed_seconds
        hours, remainder = divmod(int(seconds), 3600)
        minutes, secs = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"

    duration_readable.short_description = _("Czas pracy")


