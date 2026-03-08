"""
PRO-KOM Serwis — Accounts App — Django Admin
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, StaffProfile, LoginActivity, StaffNotification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Panel admina dla custom User model."""

    list_display = ["email", "first_name", "last_name", "role", "is_active", "must_change_password", "is_superadmin", "date_joined"]
    list_filter = ["role", "is_active", "is_staff", "is_superadmin"]
    search_fields = ["email", "first_name", "last_name", "phone"]
    ordering = ["-date_joined"]

    fieldsets = (
        (_("Dane logowania"), {"fields": ("email", "password")}),
        (_("Dane osobowe"), {"fields": ("first_name", "last_name", "phone")}),
        (_("Rola i uprawnienia"), {
            "fields": ("role", "is_active", "is_staff", "is_superuser", "is_superadmin", "must_change_password", "groups", "user_permissions"),
        }),
        (_("Daty"), {"fields": ("date_joined", "last_login")}),
    )

    def has_delete_permission(self, request, obj=None):
        if obj and getattr(obj, "is_superadmin", False):
            return False
        return super().has_delete_permission(request, obj)

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )

    readonly_fields = ["date_joined", "last_login"]


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    """Panel admina dla profili pracowników."""

    list_display = [
        "user", "position", "specialization", "is_available",
        "accepts_shipment_repairs", "calendar_color", "is_visible_in_rankings",
        "total_repairs", "active_repairs",
    ]
    list_filter = ["is_available", "specialization"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "position", "display_name", "login_alias"]
    raw_id_fields = ["user"]
    fieldsets = (
        (None, {"fields": ("user", "position", "bio", "avatar", "is_available")}),
        (_("Specjalizacja i kalendarz"), {
            "fields": ("specialization", "calendar_color", "display_name", "login_alias", "is_visible_in_rankings", "accepts_shipment_repairs"),
        }),
        (_("Statystyki"), {"fields": ("total_repairs", "active_repairs")}),
    )


@admin.register(LoginActivity)
class LoginActivityAdmin(admin.ModelAdmin):
    list_display = ["user", "login_status", "ip_address", "logged_in_at"]
    list_filter = ["login_status", "logged_in_at"]
    search_fields = ["user__email", "ip_address"]
    readonly_fields = ["user", "ip_address", "user_agent", "login_status", "logged_in_at"]
    date_hierarchy = "logged_in_at"


@admin.register(StaffNotification)
class StaffNotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "notification_type", "priority", "repair", "title", "status", "created_at"]
    list_filter = ["notification_type", "priority", "status"]
    search_fields = ["title", "description", "repair__repair_number"]
    raw_id_fields = ["user", "repair"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"
