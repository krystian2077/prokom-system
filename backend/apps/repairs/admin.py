"""
PRO-KOM Serwis — Repairs App — Admin
=====================================
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    RepairRequest,
    RepairStatusHistory,
    RepairAssignment,
    RepairImage,
    RepairNote,
    ReminderLog,
    SatisfactionSurvey,
    RepairVisitSchedule,
    ChecklistTemplate,
    ChecklistTemplateItem,
    ChecklistRun,
    ChecklistRunItem,
    TeamThreadMessage,
)


class RepairStatusHistoryInline(admin.TabularInline):
    """Inline dla historii statusów."""
    model = RepairStatusHistory
    extra = 0
    readonly_fields = ["created_at", "old_status", "new_status", "changed_by"]
    fields = ["old_status", "new_status", "changed_by", "notes", "created_at"]
    can_delete = False


class RepairAssignmentInline(admin.TabularInline):
    """Inline dla przypisań."""
    model = RepairAssignment
    extra = 0
    readonly_fields = ["assigned_at", "assigned_by", "unassigned_at"]
    fields = ["assigned_to", "assigned_by", "is_current", "assigned_at", "unassigned_at", "notes"]


class RepairImageInline(admin.TabularInline):
    """Inline dla zdjęć naprawy."""
    model = RepairImage
    extra = 1
    readonly_fields = ["created_at", "uploaded_by"]
    fields = ["image", "caption", "image_type", "is_visible_to_client", "uploaded_by"]


class RepairNoteInline(admin.TabularInline):
    """Inline dla notatek naprawy."""
    model = RepairNote
    extra = 1
    readonly_fields = ["created_at", "author"]
    fields = ["note", "is_internal", "is_important", "author", "created_at"]


# Upsell: oferty akcesoriów i Hammer Glass przy naprawie
try:
    from apps.accessories.models import RepairAccessoryOffer
    class RepairAccessoryOfferInline(admin.TabularInline):
        model = RepairAccessoryOffer
        extra = 0
        readonly_fields = ["offered_at", "offered_by", "unit_price_snapshot"]
        fields = ["product", "quantity", "unit_price_snapshot", "accepted", "accepted_at", "offered_by", "note"]
except ImportError:
    RepairAccessoryOfferInline = None

try:
    from apps.hammer_glass.models import RepairHammerGlassOffer
    class RepairHammerGlassOfferInline(admin.TabularInline):
        model = RepairHammerGlassOffer
        extra = 0
        readonly_fields = ["offered_at", "offered_by", "unit_price_snapshot"]
        fields = ["product", "quantity", "unit_price_snapshot", "accepted", "accepted_at", "offered_by", "note"]
except ImportError:
    RepairHammerGlassOfferInline = None


@admin.register(RepairRequest)
class RepairRequestAdmin(admin.ModelAdmin):
    """Admin dla zgłoszeń napraw."""
    list_display = [
        "repair_number",
        "client_name",
        "device_name",
        "status_badge",
        "priority_badge",
        "assigned_to",
        "days_in_service",
        "created_at",
    ]
    list_filter = [
        "status",
        "priority",
        "payment_status",
        "assigned_to",
        "is_urgent",
        "is_same_day",
        "is_warranty",
        "source",
        "repair_type",
        "is_incomplete",
        "created_at",
    ]
    search_fields = [
        "repair_number",
        "client__first_name",
        "client__last_name",
        "client__email",
        "device__serial_number",
        "device__imei",
        "problem_description",
    ]
    readonly_fields = [
        "id",
        "repair_number",
        "created_at",
        "updated_at",
        "created_by",
        "accepted_at",
        "completed_at",
        "ready_for_pickup_at",
        "picked_up_at",
    ]

    fieldsets = (
        ("Informacje podstawowe", {
            "fields": ("repair_number", "client", "device", "assigned_to", "parent_repair", "repair_type", "is_incomplete")
        }),
        ("Status i priorytet", {
            "fields": ("status", "priority", "internal_status", "is_urgent", "is_same_day", "is_warranty")
        }),
        ("Opis problemu", {
            "fields": ("problem_description",)
        }),
        ("Dostawa i zwrot", {
            "fields": (
                "delivery_method",
                "return_method",
                "delivery_address",
                "return_address",
            ),
            "classes": ("collapse",),
        }),
        ("Odbior paczki", {
            "fields": (
                "package_received_at",
                "package_received_by",
                "package_ok",
                "request_number_attached",
                "package_notes",
                "package_photo",
            ),
            "classes": ("collapse",),
        }),
        ("Daty", {
            "fields": (
                "accepted_at",
                "estimated_completion_date",
                "estimated_duration_days_min",
                "estimated_duration_days_max",
                "completed_at",
                "ready_for_pickup_at",
                "picked_up_at",
            )
        }),
        ("Backup danych", {
            "fields": ("requires_data_backup", "data_backup_completed"),
            "classes": ("collapse",),
        }),
        ("Koszty i płatność", {
            "fields": ("estimated_cost", "final_cost", "payment_status"),
            "classes": ("collapse",),
        }),
        ("Notatki wewnętrzne", {
            "fields": ("internal_notes",),
            "classes": ("collapse",),
        }),
        ("Metadata", {
            "fields": ("id", "source", "created_by", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    inlines = [
        RepairStatusHistoryInline,
        RepairAssignmentInline,
        RepairImageInline,
        RepairNoteInline,
    ] + ([x for x in (RepairAccessoryOfferInline, RepairHammerGlassOfferInline) if x is not None])

    def client_name(self, obj):
        """Nazwa klienta."""
        return obj.client.get_full_name()
    client_name.short_description = "Klient"

    def device_name(self, obj):
        """Nazwa urządzenia."""
        return obj.device.get_device_name()
    device_name.short_description = "Urządzenie"

    def status_badge(self, obj):
        """Kolorowy badge statusu."""
        colors = {
            "new": "#3B82F6",  # blue
            "accepted": "#3B82F6",
            "in_diagnostics": "#8B5CF6",  # purple
            "diagnostics_done": "#8B5CF6",
            "quote_pending": "#EAB308",  # yellow
            "quote_sent": "#EAB308",
            "quote_accepted": "#22C55E",  # green
            "quote_rejected": "#EF4444",  # red
            "waiting_for_parts": "#F97316",  # orange
            "in_repair": "#6366F1",  # indigo
            "repair_done": "#22C55E",
            "in_testing": "#8B5CF6",
            "testing_passed": "#22C55E",
            "testing_failed": "#EF4444",
            "ready_for_pickup": "#22C55E",
            "picked_up": "#6B7280",  # gray
            "shipped": "#3B82F6",
            "delivered": "#6B7280",
            "cancelled": "#EF4444",
            "unrepairable": "#EF4444",
            "abandoned": "#6B7280",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Status"

    def priority_badge(self, obj):
        """Kolorowy badge priorytetu."""
        colors = {
            "low": "#6B7280",
            "normal": "#3B82F6",
            "high": "#F97316",
            "urgent": "#EF4444",
            "same_day": "#DC2626",
        }
        color = colors.get(obj.priority, "#6B7280")

        if obj.is_same_day:
            label = "⚡ SAME DAY"
        elif obj.is_urgent:
            label = f"🔥 {obj.get_priority_display()}"
        else:
            label = obj.get_priority_display()

        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            label
        )
    priority_badge.short_description = "Priorytet"

    def days_in_service(self, obj):
        """Dni w serwisie."""
        days = obj.days_in_repair
        if days == 0:
            return "—"

        # Pokoloruj jeśli przekroczone
        if obj.is_overdue:
            return format_html('<span style="color: red; font-weight: bold;">{} dni ⚠️</span>', days)

        return f"{days} dni"
    days_in_service.short_description = "Dni w serwisie"


@admin.register(RepairStatusHistory)
class RepairStatusHistoryAdmin(admin.ModelAdmin):
    """Admin dla historii statusów."""
    list_display = [
        "repair",
        "old_status_display",
        "new_status_display",
        "changed_by",
        "created_at",
    ]
    list_filter = [
        "old_status",
        "new_status",
        "created_at",
    ]
    search_fields = [
        "repair__repair_number",
        "notes",
    ]
    readonly_fields = ["created_at"]

    def old_status_display(self, obj):
        """Stary status."""
        return obj.get_old_status_display() if obj.old_status else "—"
    old_status_display.short_description = "Z"

    def new_status_display(self, obj):
        """Nowy status."""
        return obj.get_new_status_display()
    new_status_display.short_description = "Na"


@admin.register(RepairAssignment)
class RepairAssignmentAdmin(admin.ModelAdmin):
    """Admin dla przypisań."""
    list_display = [
        "repair",
        "assigned_to",
        "assigned_by",
        "is_current_badge",
        "assigned_at",
    ]
    list_filter = [
        "is_current",
        "assigned_to",
        "assigned_at",
    ]
    search_fields = [
        "repair__repair_number",
        "assigned_to__first_name",
        "assigned_to__last_name",
    ]
    readonly_fields = ["assigned_at", "unassigned_at"]

    def is_current_badge(self, obj):
        """Badge czy aktualne."""
        if obj.is_current:
            return format_html('<span style="color: green;">✓ Aktualne</span>')
        return format_html('<span style="color: gray;">Archiwalne</span>')
    is_current_badge.short_description = "Status"


@admin.register(RepairImage)
class RepairImageAdmin(admin.ModelAdmin):
    """Admin dla zdjęć napraw."""
    list_display = [
        "repair",
        "caption",
        "image_type",
        "is_visible_to_client",
        "uploaded_by",
        "created_at",
    ]
    list_filter = [
        "image_type",
        "is_visible_to_client",
        "created_at",
    ]
    search_fields = [
        "repair__repair_number",
        "caption",
    ]
    readonly_fields = ["created_at", "uploaded_by"]


@admin.register(RepairNote)
class RepairNoteAdmin(admin.ModelAdmin):
    """Admin dla notatek napraw."""
    list_display = [
        "repair",
        "short_note",
        "note_type",
        "pinned",
        "is_important",
        "author",
        "created_at",
    ]
    list_filter = [
        "is_internal",
        "note_type",
        "pinned",
        "is_important",
        "created_at",
    ]
    search_fields = [
        "repair__repair_number",
        "note",
    ]
    readonly_fields = ["created_at", "author"]

    def short_note(self, obj):
        """Skrócona notatka."""
        return obj.note[:80] + "..." if len(obj.note) > 80 else obj.note
    short_note.short_description = "Treść"

    def note_type(self, obj):
        """Typ notatki z ikoną."""
        if obj.is_internal:
            return format_html('<span style="color: orange;">🔒 Wewnętrzna</span>')
        return format_html('<span style="color: blue;">👁️ Publiczna</span>')
    note_type.short_description = "Typ"


@admin.register(SatisfactionSurvey)
class SatisfactionSurveyAdmin(admin.ModelAdmin):
    list_display = ["repair", "client", "rating", "would_recommend", "submitted_at"]
    list_filter = ["rating", "would_recommend"]
    search_fields = ["repair__repair_number", "client__first_name", "comment"]
    readonly_fields = ["submitted_at"]


@admin.register(RepairVisitSchedule)
class RepairVisitScheduleAdmin(admin.ModelAdmin):
    list_display = ["repair", "visit_date", "visit_time", "no_show", "confirmed_at"]
    list_filter = ["no_show"]
    raw_id_fields = ["repair"]


@admin.register(ReminderLog)
class ReminderLogAdmin(admin.ModelAdmin):
    list_display = ["repair", "event_name", "sent_at"]
    list_filter = ["event_name", "sent_at"]
    raw_id_fields = ["repair"]
    readonly_fields = ["sent_at"]


class ChecklistTemplateItemInline(admin.TabularInline):
    model = ChecklistTemplateItem
    extra = 1


@admin.register(ChecklistTemplate)
class ChecklistTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "device_category_code", "is_active"]
    list_filter = ["is_active"]
    inlines = [ChecklistTemplateItemInline]


class ChecklistRunItemInline(admin.TabularInline):
    model = ChecklistRunItem
    extra = 0
    raw_id_fields = ["template_item", "checked_by"]


@admin.register(ChecklistRun)
class ChecklistRunAdmin(admin.ModelAdmin):
    list_display = ["repair", "template", "status", "started_by", "started_at", "completed_at"]
    list_filter = ["status"]
    raw_id_fields = ["repair", "template", "started_by"]
    inlines = [ChecklistRunItemInline]


@admin.register(TeamThreadMessage)
class TeamThreadMessageAdmin(admin.ModelAdmin):
    list_display = ["repair", "author", "mentioned_user", "created_at"]
    search_fields = ["body", "repair__repair_number"]
    raw_id_fields = ["repair", "author", "mentioned_user"]

