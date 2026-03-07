"""PRO-KOM Serwis — Pricing Admin."""
from django.contrib import admin
from .models import LabourType, Quote, QuoteItem, Deposit


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 1
    autocomplete_fields = ["part", "labour_type"]


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


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ["repair", "amount", "paid_at", "created_at"]
    search_fields = ["repair__repair_number"]
    autocomplete_fields = ["repair"]
