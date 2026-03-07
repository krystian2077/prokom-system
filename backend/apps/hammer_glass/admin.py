"""PRO-KOM Serwis — Hammer Glass Admin."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import HammerGlassFilmType, HammerGlassProduct, RepairHammerGlassOffer


class HammerGlassProductInline(admin.TabularInline):
    model = HammerGlassProduct
    extra = 0
    show_change_link = True
    fields = ["name", "sku", "price", "is_active", "sort_order"]


@admin.register(HammerGlassFilmType)
class HammerGlassFilmTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "sort_order", "is_active", "product_count", "updated_at"]
    list_filter = ["is_active"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [HammerGlassProductInline]

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = _("produktów")


@admin.register(HammerGlassProduct)
class HammerGlassProductAdmin(admin.ModelAdmin):
    list_display = ["name", "film_type", "protection_level", "features", "price", "is_active", "sort_order"]
    list_filter = ["film_type", "protection_level", "is_active"]
    search_fields = ["name", "sku", "features"]
    list_editable = ["price", "is_active", "sort_order"]


@admin.register(RepairHammerGlassOffer)
class RepairHammerGlassOfferAdmin(admin.ModelAdmin):
    list_display = ["repair", "product", "quantity", "unit_price_snapshot", "accepted", "offered_at", "offered_by"]
    list_filter = ["accepted", "offered_at"]
    search_fields = ["repair__repair_number", "product__name"]
    readonly_fields = ["offered_at", "offered_by", "unit_price_snapshot"]
