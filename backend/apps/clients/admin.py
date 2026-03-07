"""
PRO-KOM Serwis — Clients App — Admin
=====================================
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Client, ClientConsent, ClientNote, ClientAddress


class ClientConsentInline(admin.TabularInline):
    """Inline dla zgód klienta."""
    model = ClientConsent
    extra = 0
    readonly_fields = ["created_at", "granted_at", "withdrawn_at"]
    fields = ["consent_type", "is_granted", "granted_at", "withdrawn_at"]


class ClientNoteInline(admin.TabularInline):
    """Inline dla notatek o kliencie."""
    model = ClientNote
    extra = 1
    readonly_fields = ["created_at", "author"]
    fields = ["note", "is_important", "author", "created_at"]


class ClientAddressInline(admin.TabularInline):
    """Inline dla adresów klienta."""
    model = ClientAddress
    extra = 0
    fields = ["label", "street", "city", "postal_code", "is_default"]


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin dla modelu Client."""
    list_display = [
        "client_number",
        "full_name",
        "email",
        "phone",
        "total_repairs",
        "vip_badge",
        "created_at",
    ]
    list_filter = [
        "is_vip",
        "is_blacklisted",
        "preferred_contact",
        "accepts_marketing",
        "created_at",
    ]
    search_fields = [
        "client_number",
        "first_name",
        "last_name",
        "email",
        "phone",
    ]
    readonly_fields = [
        "id",
        "client_number",
        "total_repairs",
        "total_spent",
        "created_at",
        "updated_at",
    ]
    fieldsets = (
        ("Podstawowe informacje", {
            "fields": ("client_number", "user", "first_name", "last_name")
        }),
        ("Kontakt", {
            "fields": ("email", "phone", "preferred_contact")
        }),
        ("Adres", {
            "fields": ("street", "city", "postal_code", "country"),
            "classes": ("collapse",),
        }),
        ("Statystyki", {
            "fields": ("total_repairs", "total_spent", "is_vip", "is_blacklisted")
        }),
        ("Marketing", {
            "fields": ("accepts_marketing",)
        }),
        ("Notatki wewnętrzne", {
            "fields": ("internal_notes",),
            "classes": ("collapse",),
        }),
        ("Metadata", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
    inlines = [ClientAddressInline, ClientConsentInline, ClientNoteInline]

    def full_name(self, obj):
        """Wyświetl pełne imię i nazwisko."""
        return obj.get_full_name()
    full_name.short_description = "Imię i nazwisko"

    def vip_badge(self, obj):
        """Badge VIP."""
        if obj.is_vip:
            return format_html('<span style="color: gold;">⭐ VIP</span>')
        elif obj.is_blacklisted:
            return format_html('<span style="color: red;">⚠️ Blacklist</span>')
        return "—"
    vip_badge.short_description = "Status"


@admin.register(ClientConsent)
class ClientConsentAdmin(admin.ModelAdmin):
    """Admin dla zgód klientów."""
    list_display = [
        "client",
        "consent_type",
        "consent_status",
        "granted_at",
        "created_at",
    ]
    list_filter = [
        "consent_type",
        "is_granted",
        "created_at",
    ]
    search_fields = [
        "client__first_name",
        "client__last_name",
        "client__email",
    ]
    readonly_fields = ["created_at", "granted_at", "withdrawn_at"]

    def consent_status(self, obj):
        """Status zgody z kolorowym badge."""
        if obj.is_granted:
            return format_html('<span style="color: green;">✓ Udzielona</span>')
        return format_html('<span style="color: red;">✗ Nie udzielona</span>')
    consent_status.short_description = "Status"


@admin.register(ClientNote)
class ClientNoteAdmin(admin.ModelAdmin):
    """Admin dla notatek o klientach."""
    list_display = [
        "client",
        "short_note",
        "is_important",
        "author",
        "created_at",
    ]
    list_filter = [
        "is_important",
        "created_at",
    ]
    search_fields = [
        "client__first_name",
        "client__last_name",
        "note",
    ]
    readonly_fields = ["created_at", "author"]

    def short_note(self, obj):
        """Skrócona wersja notatki."""
        return obj.note[:100] + "..." if len(obj.note) > 100 else obj.note
    short_note.short_description = "Notatka"


@admin.register(ClientAddress)
class ClientAddressAdmin(admin.ModelAdmin):
    """Admin dla adresów klientów."""
    list_display = [
        "client",
        "label",
        "full_address",
        "is_default",
        "created_at",
    ]
    list_filter = [
        "is_default",
        "city",
        "created_at",
    ]
    search_fields = [
        "client__first_name",
        "client__last_name",
        "street",
        "city",
    ]

    def full_address(self, obj):
        """Pełny adres."""
        return f"{obj.street}, {obj.postal_code} {obj.city}"
    full_address.short_description = "Adres"

