from django.contrib import admin
from .models import DiagnosticReport


@admin.register(DiagnosticReport)
class DiagnosticReportAdmin(admin.ModelAdmin):
    list_display = ["repair", "created_by", "completed_at", "created_at"]
    list_filter = ["completed_at"]
    search_fields = ["repair__repair_number", "findings", "recommendation"]
    raw_id_fields = ["repair", "created_by"]
