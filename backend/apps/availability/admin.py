"""PRO-KOM Serwis — Admin: Dostępność pracowników."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import EmployeeAvailability


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
