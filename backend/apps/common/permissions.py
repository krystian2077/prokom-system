"""
PRO-KOM Serwis — Wspólne klasy uprawnień
========================================
Staff/Admin pełny dostęp; klient tylko do własnych napraw.
"""
from rest_framework.permissions import BasePermission


class IsStaffOrAdmin(BasePermission):
    """Dostęp tylko dla roli staff lub admin."""
    message = "Brak uprawnień. Wymagana rola pracownika lub administratora."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("staff", "admin")


class IsAdminRole(BasePermission):
    """Dostęp tylko dla roli admin."""
    message = "Brak uprawnień. Wymagana rola administratora."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == "admin"


class IsStaffOrAdminOrReadOnly(BasePermission):
    """Staff/Admin: pełny dostęp. Inni: tylko odczyt (GET)."""
    message = "Edycja wymaga uprawnień pracownika lub administratora."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user.role in ("staff", "admin")


def get_client_for_user(user):
    """
    Dla użytkownika z rolą client zwraca powiązany Client (user.client_profile).
    Jeśli brak powiązania lub inna rola — zwraca None.
    """
    if not user or not user.is_authenticated:
        return None
    if user.role != "client":
        return None
    # Audit AB4: no client data until the e-mail is verified (the client panel sends an
    # unverified account to the verification page right after login).
    if not getattr(user, "email_verified", False):
        return None
    return getattr(user, "client_profile", None)
