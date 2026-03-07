"""
PRO-KOM Serwis — Devices App — Admin
=====================================
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Brand, DeviceModel, Device, DeviceImage


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    """Admin dla marek."""
    list_display = ["name", "slug", "is_active", "models_count", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]

    def models_count(self, obj):
        """Liczba modeli dla marki."""
        return obj.models.count()
    models_count.short_description = "Liczba modeli"


class DeviceImageInline(admin.TabularInline):
    """Inline dla zdjęć modeli urządzeń."""
    model = DeviceImage
    extra = 1
    readonly_fields = ["created_at", "uploaded_by"]
    fields = ["image", "caption", "is_before", "uploaded_by"]


@admin.register(DeviceModel)
class DeviceModelAdmin(admin.ModelAdmin):
    """Admin dla modeli urządzeń."""
    list_display = [
        "full_model_name",
        "category",
        "release_year",
        "popularity_score",
        "is_active",
    ]
    list_filter = [
        "brand",
        "category",
        "is_active",
        "release_year",
    ]
    search_fields = [
        "name",
        "full_name",
        "brand__name",
    ]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at", "popularity_score"]
    fieldsets = (
        ("Podstawowe informacje", {
            "fields": ("brand", "category", "name", "slug", "full_name")
        }),
        ("Specyfikacja techniczna", {
            "fields": ("release_year", "processor", "ram", "storage_options"),
            "classes": ("collapse",),
        }),
        ("Zdjęcie i opis", {
            "fields": ("image", "description")
        }),
        ("Status i popularność", {
            "fields": ("is_active", "popularity_score")
        }),
        ("Metadata", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def full_model_name(self, obj):
        """Pełna nazwa modelu z marką."""
        return str(obj)
    full_model_name.short_description = "Model"


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    """Admin dla urządzeń klientów."""
    list_display = [
        "device_name",
        "client",
        "category",
        "serial_number",
        "repairs_count",
        "created_at",
    ]
    list_filter = [
        "category",
        "brand",
        "created_at",
    ]
    search_fields = [
        "client__first_name",
        "client__last_name",
        "client__email",
        "serial_number",
        "imei",
        "model_name",
    ]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
    ]
    fieldsets = (
        ("Właściciel", {
            "fields": ("client",)
        }),
        ("Typ urządzenia", {
            "fields": ("category", "brand", "device_model", "model_name")
        }),
        ("Identyfikatory", {
            "fields": ("serial_number", "imei"),
            "classes": ("collapse",),
        }),
        ("Stan przy przyjęciu", {
            "fields": (
                "condition_on_arrival",
                "has_screen_protector",
                "has_case",
                "accessories_included",
            )
        }),
        ("Bezpieczeństwo", {
            "fields": ("password",),
            "classes": ("collapse",),
        }),
        ("Notatki", {
            "fields": ("notes",),
            "classes": ("collapse",),
        }),
        ("Metadata", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
    inlines = [DeviceImageInline]

    def device_name(self, obj):
        """Nazwa urządzenia."""
        return obj.get_device_name()
    device_name.short_description = "Urządzenie"

    def repairs_count(self, obj):
        """Liczba napraw."""
        count = obj.repairs.count()
        if count > 0:
            return format_html('<span style="font-weight: bold;">{}</span>', count)
        return count
    repairs_count.short_description = "Naprawy"


@admin.register(DeviceImage)
class DeviceImageAdmin(admin.ModelAdmin):
    """Admin dla zdjęć urządzeń."""
    list_display = [
        "device",
        "caption",
        "is_before",
        "uploaded_by",
        "created_at",
    ]
    list_filter = [
        "is_before",
        "created_at",
    ]
    search_fields = [
        "device__client__first_name",
        "device__client__last_name",
        "caption",
    ]
    readonly_fields = ["created_at", "uploaded_by"]

