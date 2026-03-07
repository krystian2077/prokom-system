"""PRO-KOM Serwis — Inventory Admin."""
from django.contrib import admin
from .models import Supplier, Part, PurchaseOrder, PurchaseOrderItem, PartUsage


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1
    autocomplete_fields = ["part"]


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "nip", "phone", "city", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "nip", "email"]


@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "sell_price", "quantity_in_stock", "min_quantity", "supplier", "is_active"]
    list_filter = ["is_active", "category", "supplier"]
    search_fields = ["name", "code"]
    autocomplete_fields = ["supplier"]


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "supplier", "status", "ordered_at", "expected_at", "created_at"]
    list_filter = ["status", "supplier"]
    search_fields = ["order_number"]
    inlines = [PurchaseOrderItemInline]
    autocomplete_fields = ["supplier"]


@admin.register(PartUsage)
class PartUsageAdmin(admin.ModelAdmin):
    list_display = ["repair", "part", "quantity", "unit_price_used", "created_at"]
    list_filter = ["repair"]
    search_fields = ["repair__repair_number", "part__name"]
    autocomplete_fields = ["repair", "part"]
