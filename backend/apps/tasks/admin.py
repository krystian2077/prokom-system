"""PRO-KOM Serwis — Admin: Zadania wewnętrzne."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Task, TaskComment


class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 0
    readonly_fields = ["author", "body", "created_at"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "title", "assigned_to", "created_by", "status", "priority",
        "due_date", "is_overdue_display", "is_archived", "created_at",
    ]
    list_filter = ["status", "priority", "is_archived"]
    search_fields = ["title", "description"]
    autocomplete_fields = [
        "created_by", "assigned_to",
        "related_repair", "related_client", "related_customer_order", "related_store_order",
    ]
    date_hierarchy = "due_date"
    list_select_related = ["created_by", "assigned_to"]
    inlines = [TaskCommentInline]

    fieldsets = (
        (None, {"fields": ("title", "description", "status", "priority")}),
        (_("Przypisanie"), {"fields": ("created_by", "assigned_to")}),
        (_("Termin"), {"fields": ("due_date", "completed_at")}),
        (_("Powiązania"), {"fields": ("related_repair", "related_client", "related_customer_order", "related_store_order")}),
        (_("Status"), {"fields": ("is_archived",)}),
    )

    def is_overdue_display(self, obj):
        return obj.is_overdue

    is_overdue_display.boolean = True
    is_overdue_display.short_description = _("Zaległe")


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ["task", "author", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["body"]
    raw_id_fields = ["task", "author"]
