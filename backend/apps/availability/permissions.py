"""Uprawnienia: pracownik — własne wpisy + odczyt zespołu; admin — wszystko."""
from rest_framework.permissions import BasePermission


class IsStaffOrAdmin(BasePermission):
    """Moduł dostępności: staff i admin."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("staff", "admin")


def can_edit_availability(user, entry):
    """Czy użytkownik może edytować/usuwać ten wpis. Własny wpis lub admin."""
    if getattr(user, "role", None) == "admin":
        return True
    return entry.employee_id == user.id
