"""PRO-KOM Serwis — Inventory Admin."""
from django.contrib import admin
from .models import Supplier, Part, PurchaseOrder, PurchaseOrderItem, PartUsage


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1
    autocomplete_fields = ["part"]


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "nip", "phone", "email", "city", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "nip", "email"]
    list_editable = ["is_active"]


@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = [
        "name", "code", "device_category", "brand", "device_model_name",
        "part_type", "quality_variant", "sell_price", "quantity_in_stock", "min_quantity", "supplier", "is_active",
    ]
    list_filter = ["is_active", "category", "supplier", "device_category", "part_type", "quality_variant"]
    search_fields = ["name", "code", "brand", "device_model_name", "part_type"]
    autocomplete_fields = ["supplier"]
    list_editable = ["is_active"]


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "supplier", "status", "ordered_at", "expected_at", "created_at"]
    list_filter = ["status", "supplier"]
    search_fields = ["order_number"]
    inlines = [PurchaseOrderItemInline]
    autocomplete_fields = ["supplier"]


@admin.register(PartUsage)
class PartUsageAdmin(admin.ModelAdmin):
    list_display = [
        "repair", "part", "supplier", "quantity", "purchase_cost", "unit_price_used",
        "usage_status", "added_by", "created_at",
    ]
    list_filter = ["usage_status", "repair"]
    search_fields = ["repair__repair_number", "part__name", "part__code"]
    autocomplete_fields = ["repair", "part", "supplier", "added_by"]
