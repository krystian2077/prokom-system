"""PRO-KOM Serwis — Analytics Admin."""
from django.contrib import admin
from .models import EmployeeStatsSnapshot


@admin.register(EmployeeStatsSnapshot)
class EmployeeStatsSnapshotAdmin(admin.ModelAdmin):
    list_display = ["employee", "date", "repairs_count", "delayed_repairs_count", "quotes_sent_count", "ready_for_pickup_count", "upsell_total", "profit_total"]
    list_filter = ["date"]
    raw_id_fields = ["employee"]
    date_hierarchy = "date"
