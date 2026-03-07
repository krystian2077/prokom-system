"""PRO-KOM Serwis — Accessories Admin."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import AccessoryCategory, AccessoryProduct, RepairAccessoryOffer, RepairAccessoryInterest


class AccessoryProductInline(admin.TabularInline):
    model = AccessoryProduct
    extra = 0
    show_change_link = True
    fields = ["name", "sku", "price", "is_active", "sort_order"]


@admin.register(AccessoryCategory)
class AccessoryCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "sort_order", "is_active", "product_count", "updated_at"]
    list_filter = ["is_active"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [AccessoryProductInline]

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = _("produktów")


@admin.register(AccessoryProduct)
class AccessoryProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "sku", "price", "is_active", "sort_order"]
    list_filter = ["category", "is_active"]
    search_fields = ["name", "sku"]
    list_editable = ["price", "is_active", "sort_order"]


class RepairAccessoryOfferInline(admin.TabularInline):
    model = RepairAccessoryOffer
    extra = 0
    readonly_fields = ["offered_at", "offered_by", "unit_price_snapshot"]
    fields = ["product", "quantity", "unit_price_snapshot", "accepted", "accepted_at", "offered_by", "note"]


@admin.register(RepairAccessoryInterest)
class RepairAccessoryInterestAdmin(admin.ModelAdmin):
    list_display = ["repair", "product", "source", "choose_for_me", "created_at"]
    list_filter = ["source"]
    raw_id_fields = ["repair", "product"]


@admin.register(RepairAccessoryOffer)
class RepairAccessoryOfferAdmin(admin.ModelAdmin):
    list_display = ["repair", "product", "quantity", "unit_price_snapshot", "accepted", "offered_at", "offered_by"]
    list_filter = ["accepted", "offered_at"]
    search_fields = ["repair__repair_number", "product__name"]
    readonly_fields = ["offered_at", "offered_by", "unit_price_snapshot"]
