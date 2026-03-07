from django.contrib import admin
from .models import CalendarEvent, TimeslotBlock


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ["title", "employee", "event_type", "event_date", "start_time", "repair", "is_locked"]
    list_filter = ["event_type", "event_date"]
    raw_id_fields = ["repair", "employee"]


@admin.register(TimeslotBlock)
class TimeslotBlockAdmin(admin.ModelAdmin):
    list_display = ["employee", "block_date", "start_time", "end_time", "reason"]
    list_filter = ["block_date"]
