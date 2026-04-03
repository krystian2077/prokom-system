"""Uprawnienia modułu zadań: staff tylko swoje, admin wszystko."""
from rest_framework.permissions import BasePermission


class IsStaffOrAdmin(BasePermission):
    """Dostęp: staff i admin (moduł zadań)."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("staff", "admin")


def can_edit_task(user, task):
    """Czy użytkownik może edytować zadanie.

    Admin: wszystkie.
    Staff: zadania przypisane do niego lub utworzone przez niego.
    """
    if getattr(user, "role", None) == "admin":
        return True
    if getattr(user, "role", None) != "staff":
        return False
    return task.assigned_to_id == user.id or task.created_by_id == user.id


def can_reassign_task(user, task):
    """Czy użytkownik może przepisać zadanie do innej osoby.

    Admin: zawsze.
    Staff: tylko jeśli ma prawo edycji danego zadania.
    """
    return can_edit_task(user, task)


def can_see_task(user, task):
    """Czy użytkownik może zobaczyć zadanie.

    Admin: wszystko.
    Staff: zadania przypisane do niego lub utworzone przez niego.
    """
    if getattr(user, "role", None) == "admin":
        return True
    if getattr(user, "role", None) != "staff":
        return False
    return task.assigned_to_id == user.id or task.created_by_id == user.id
