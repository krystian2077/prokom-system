"""
PRO-KOM Serwis — Przypisanie naprawy do pracownika
====================================================
Szybka akcja: przypisz do siebie lub do innego staff.
"""
from django.utils import timezone
from django.db import transaction
from apps.repairs.models import RepairRequest, RepairAssignment


@transaction.atomic
def assign_repair(repair, assigned_to_id, assigned_by_id, notes=""):
    """
    Przypisuje naprawę do pracownika.
    Kończy bieżące przypisanie (is_current=False, unassigned_at) i tworzy nowe.
    """
    now = timezone.now()
    RepairAssignment.objects.filter(repair=repair, is_current=True).update(
        is_current=False, unassigned_at=now
    )
    repair.assigned_to_id = assigned_to_id
    repair.save(update_fields=["assigned_to", "updated_at"])
    RepairAssignment.objects.create(
        repair=repair,
        assigned_to_id=assigned_to_id,
        assigned_by_id=assigned_by_id,
        notes=notes or "",
        is_current=True,
    )
    return repair
