"""Uprawnienia modułu zadań: staff tylko swoje, admin wszystko."""
from rest_framework.permissions import BasePermission


class IsStaffOrAdmin(BasePermission):
    """Dostęp: staff i admin (moduł zadań)."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("staff", "admin")


def can_edit_task(user, task):
    """Czy użytkownik może edytować zadanie (zmieniać przypisanie, pełna edycja). Tylko admin."""
    return getattr(user, "role", None) == "admin"


def can_reassign_task(user, task):
    """Czy użytkownik może przepisać zadanie do innej osoby. Tylko admin."""
    return getattr(user, "role", None) == "admin"


def can_see_task(user, task):
    """Czy użytkownik może zobaczyć zadanie. Admin — wszystko; staff — tylko przypisane do niego."""
    if getattr(user, "role", None) == "admin":
        return True
    return task.assigned_to_id == user.id
