"""
PRO-KOM Serwis — Tworzenie powiadomień dla pracowników (Staff Notifications Center).
Wywoływane przy: przypisanie naprawy, wiadomość od klienta, notatka, wycena zaakceptowana/odrzucona, część dotarła, SLA, reklamacja itd.
"""
from django.utils import timezone

# Typy powiadomień (notification_type)
TYPE_REPAIR_ASSIGNED = "repair_assigned"
TYPE_CLIENT_MESSAGE = "client_message"
TYPE_NOTE_ADDED = "note_added"
TYPE_MENTIONED = "mentioned"
TYPE_QUOTE_ACCEPTED = "quote_accepted"
TYPE_QUOTE_REJECTED = "quote_rejected"
TYPE_PART_ARRIVED = "part_arrived"
TYPE_REPAIR_DUE_SOON = "repair_due_soon"
TYPE_SLA_EXCEEDED = "sla_exceeded"
TYPE_COMPLAINT_WARRANTY_ASSIGNED = "complaint_warranty_assigned"
TYPE_COMPLAINT_WARRANTY_AWAITING_DECISION = "complaint_warranty_awaiting_decision"
TYPE_QUICK_ACCEPT_INCOMPLETE = "quick_accept_incomplete"
TYPE_UNASSIGNED_QUEUE_NOTE = "unassigned_queue_note"


def create_staff_notification(
    *,
    user_id,
    notification_type,
    title,
    description="",
    repair_id=None,
    priority="standard",
    link="",
):
    """
    Tworzy powiadomienie dla pracownika. Ograniczenie spamu: nie duplikuj
    identycznego (user, type, repair) w ostatnich 2 minutach.
    """
    from apps.accounts.models import StaffNotification

    # Anti-spam: nie dodawaj tego samego typu dla tej samej naprawy w ostatnich 2 min
    since = timezone.now() - timezone.timedelta(minutes=2)
    exists = StaffNotification.objects.filter(
        user_id=user_id,
        notification_type=notification_type,
        repair_id=repair_id,
        created_at__gte=since,
    ).exists()
    if exists:
        return None

    notif = StaffNotification.objects.create(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        description=description,
        repair_id=repair_id,
        priority=priority,
        link=link or "",
    )
    return notif


def notify_repair_assigned(repair, assigned_to_id):
    """Wywołaj po przypisaniu naprawy do pracownika."""
    if not assigned_to_id:
        return
    from apps.accounts.models import User
    from apps.accounts.models import UserRole
    user = User.objects.filter(id=assigned_to_id, role=UserRole.STAFF).first()
    if not user:
        return
    create_staff_notification(
        user_id=assigned_to_id,
        notification_type=TYPE_REPAIR_ASSIGNED,
        title=f"Nowa naprawa przypisana do Ciebie: {repair.repair_number}",
        description=repair.problem_description[:200] if repair.problem_description else "",
        repair_id=repair.id,
        priority="standard",
        link=f"/staff/repairs/{repair.id}/",
    )


def notify_note_added(
    repair,
    note_author_id,
    assigned_to_id,
    *,
    is_internal=True,
    note_preview="",
):
    """
    - Gdy naprawa ma przypisanego pracownika i autor ≠ przypisany: powiadom przypisanego.
    - Gdy brak przypisania i notatka wewnętrzna od pracownika (nie admina): powiadom wszystkich aktywnych adminów
      (kolejka nieprzypisanych — pilne przypisanie / sugestia z panelu).
    """
    from apps.accounts.models import User, UserRole

    if assigned_to_id and assigned_to_id != note_author_id:
        create_staff_notification(
            user_id=assigned_to_id,
            notification_type=TYPE_NOTE_ADDED,
            title=f"Dodano notatkę do Twojej naprawy: {repair.repair_number}",
            description="",
            repair_id=repair.id,
            priority="low",
            link=f"/staff/repairs/{repair.id}/",
        )
        return

    if assigned_to_id:
        return

    if not is_internal:
        return

    author = User.objects.filter(pk=note_author_id).only("id", "role").first()
    if not author or getattr(author, "role", None) != UserRole.STAFF:
        return

    preview = (note_preview or "").strip()[:500]
    admins = User.objects.filter(role=UserRole.ADMIN, is_active=True).exclude(pk=note_author_id)
    title = f"Notatka przy nieprzypisanej naprawie: {repair.repair_number}"
    for admin in admins:
        create_staff_notification(
            user_id=admin.id,
            notification_type=TYPE_UNASSIGNED_QUEUE_NOTE,
            title=title,
            description=preview,
            repair_id=repair.id,
            priority="important",
            link=f"/staff/repairs/{repair.id}/",
        )


def notify_quote_accepted(repair):
    if not repair.assigned_to_id:
        return
    create_staff_notification(
        user_id=repair.assigned_to_id,
        notification_type=TYPE_QUOTE_ACCEPTED,
        title=f"Klient zaakceptował wycenę: {repair.repair_number}",
        description="",
        repair_id=repair.id,
        priority="important",
        link=f"/staff/repairs/{repair.id}/",
    )


def notify_quote_rejected(repair):
    if not repair.assigned_to_id:
        return
    create_staff_notification(
        user_id=repair.assigned_to_id,
        notification_type=TYPE_QUOTE_REJECTED,
        title=f"Klient odrzucił wycenę: {repair.repair_number}",
        description="",
        repair_id=repair.id,
        priority="important",
        link=f"/staff/repairs/{repair.id}/",
    )


def notify_client_message(repair):
    """Klient napisał wiadomość (panel / e-mail od klienta)."""
    if not repair.assigned_to_id:
        return
    create_staff_notification(
        user_id=repair.assigned_to_id,
        notification_type=TYPE_CLIENT_MESSAGE,
        title=f"Nowa wiadomość od klienta: {repair.repair_number}",
        description="",
        repair_id=repair.id,
        priority="important",
        link=f"/staff/repairs/{repair.id}/",
    )


def notify_complaint_warranty_assigned(repair, assigned_to_id):
    """Reklamacja lub gwarancja przypisana do pracownika."""
    if not assigned_to_id:
        return
    kind = "Reklamacja" if repair.repair_type == "complaint" else "Gwarancja"
    create_staff_notification(
        user_id=assigned_to_id,
        notification_type=TYPE_COMPLAINT_WARRANTY_ASSIGNED,
        title=f"{kind} przypisana do Ciebie: {repair.repair_number}",
        description="",
        repair_id=repair.id,
        priority="important",
        link=f"/staff/repairs/{repair.id}/",
    )
