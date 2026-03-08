"""PRO-KOM Serwis — Admin: Zamówienia klientów i zaopatrzenie sklepu (tylko admin)."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import OrderProductCategory, OrderProduct, CustomerOrder, StoreSupplyOrder


@admin.register(OrderProductCategory)
class OrderProductCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "sort_order", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name"]
    list_editable = ["sort_order", "is_active"]


@admin.register(OrderProduct)
class OrderProductAdmin(admin.ModelAdmin):
    list_display = ["name", "ean", "category", "brand", "product_type", "is_active", "created_at"]
    list_filter = ["is_active", "category", "brand", "product_type"]
    search_fields = ["name", "ean", "brand", "product_type", "notes"]
    list_editable = ["is_active"]


@admin.register(CustomerOrder)
class CustomerOrderAdmin(admin.ModelAdmin):
    list_display = [
        "display_product_short",
        "client",
        "quantity",
        "purchase_price",
        "sell_price",
        "margin_display",
        "supplier",
        "status",
        "related_repair",
        "expected_delivery_date",
        "client_notified",
        "urgent",
        "created_at",
    ]
    list_filter = [
        "status",
        "urgent",
        "client_notified",
        "deposit_paid",
        "requires_contact",
        "overdue",
        "supplier",
    ]
    search_fields = [
        "product_name_override",
        "product__name",
        "contact_phone",
        "contact_email",
        "client__first_name",
        "client__last_name",
        "client__email",
    ]
    autocomplete_fields = ["client", "product", "supplier", "created_by", "related_repair"]
    date_hierarchy = "created_at"
    list_select_related = ["client", "product", "supplier", "related_repair"]

    fieldsets = (
        (_("Klient"), {"fields": ("client", "contact_phone", "contact_email")}),
        (_("Produkt"), {"fields": ("product", "product_name_override", "quantity", "related_repair")}),
        (_("Ceny"), {"fields": ("purchase_price", "sell_price", "deposit_amount", "deposit_paid")}),
        (_("Dostawa"), {"fields": ("supplier", "planned_order_date", "expected_delivery_date")}),
        (_("Status"), {"fields": ("status", "client_notified", "picked_up_at")}),
        (_("Flagi"), {"fields": ("urgent", "client_waiting", "requires_contact", "overdue")}),
        (_("Notatka"), {"fields": ("notes",)}),
        (_("System"), {"fields": ("created_by",)}),
    )

    def display_product_short(self, obj):
        return obj.display_product_name[:50] + ("…" if len(obj.display_product_name) > 50 else "")

    display_product_short.short_description = _("Produkt")

    def margin_display(self, obj):
        return obj.margin

    margin_display.short_description = _("Zysk")


@admin.register(StoreSupplyOrder)
class StoreSupplyOrderAdmin(admin.ModelAdmin):
    list_display = [
        "display_product_short",
        "quantity",
        "supplier",
        "estimated_cost",
        "priority",
        "status",
        "created_by",
        "created_at",
    ]
    list_filter = ["status", "priority", "supplier"]
    search_fields = ["product__name", "product_name_manual", "notes"]

    def display_product_short(self, obj):
        name = obj.display_product_name[:50]
        return name + ("…" if len(obj.display_product_name) > 50 else "")

    display_product_short.short_description = _("Produkt")

    autocomplete_fields = ["product", "supplier", "created_by"]
    date_hierarchy = "created_at"
    list_select_related = ["product", "supplier", "created_by"]

    fieldsets = (
        (None, {"fields": ("product", "product_name_manual", "quantity", "supplier", "estimated_cost")}),
        (_("Status"), {"fields": ("priority", "status", "notes")}),
        (_("System"), {"fields": ("created_by",)}),
    )
