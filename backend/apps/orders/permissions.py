"""Moduł zamówień — tylko administrator."""
from rest_framework.permissions import BasePermission


class IsOrdersAdmin(BasePermission):
    """Dostęp tylko dla roli admin (staff nie widzi modułu zamówień)."""
    message = "Moduł zamówień jest dostępny tylko dla administratora."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, "role", None) == "admin"
