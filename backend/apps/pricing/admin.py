"""PRO-KOM Serwis — Pricing Admin."""
from django.contrib import admin
from .models import LabourType, Quote, QuoteItem, QuoteVersion, QuoteDecision, Deposit


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 0
    autocomplete_fields = ["part", "labour_type"]
    fields = [
        "item_type",
        "part",
        "labour_type",
        "description",
        "part_origin",
        "quantity",
        "parts_price",
        "labour_price",
        "unit_price",
        "total",
    ]
    readonly_fields = ["unit_price", "total"]


@admin.register(LabourType)
class LabourTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "default_price", "estimated_minutes", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name"]


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ["repair", "version", "status", "total_amount", "sent_at", "created_at"]
    list_filter = ["status"]
    search_fields = ["repair__repair_number"]
    inlines = [QuoteItemInline]
    autocomplete_fields = ["repair"]


@admin.register(QuoteVersion)
class QuoteVersionAdmin(admin.ModelAdmin):
    list_display = ["quote", "version_number", "total_amount", "created_at", "created_by"]
    list_filter = ["created_at"]
    search_fields = ["quote__repair__repair_number"]
    readonly_fields = ["quote", "version_number", "total_amount", "items_snapshot", "created_at", "created_by"]


@admin.register(QuoteDecision)
class QuoteDecisionAdmin(admin.ModelAdmin):
    list_display = ["quote", "decision", "decided_at", "decided_by"]
    list_filter = ["decision"]
    search_fields = ["quote__repair__repair_number"]
    readonly_fields = ["quote", "decision", "decided_at", "decided_by", "comment"]


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ["repair", "amount", "paid_at", "created_at"]
    search_fields = ["repair__repair_number"]
    autocomplete_fields = ["repair"]
