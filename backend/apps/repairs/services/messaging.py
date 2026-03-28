"""Scalanie wątku wiadomości (notatki + logi e-mail) i efekty uboczne przy wiadomościach."""
from __future__ import annotations

from django.utils import timezone

from apps.common.enums import CommunicationChannel
from apps.repairs.models import RepairNoteThreadOrigin, RepairRequest


def merge_repair_thread_items(repair: RepairRequest, *, for_client: bool, thread_origin: str | None = None):
    """
    Zwraca listę słowników posortowanych rosnąco po czasie (do wyświetlenia jak czat).
    thread_origin: opcjonalny filtr tylko na notatki (np. 'client').
    """
    from apps.communications.models import CommunicationLog

    notes_qs = repair.notes.filter(is_internal=False)
    if thread_origin:
        notes_qs = notes_qs.filter(thread_origin=thread_origin)

    items = []
    for n in notes_qs.select_related("author"):
        items.append(
            {
                "kind": "note",
                "id": n.id,
                "note": n.note,
                "thread_origin": n.thread_origin,
                "is_important": n.is_important,
                "note_type": n.note_type,
                "author_name": n.author.get_full_name() if n.author else None,
                "created_at": n.created_at,
            }
        )

    logs_qs = repair.communication_logs.filter(channel=CommunicationChannel.EMAIL)
    if for_client:
        logs_qs = logs_qs.filter(status="sent")
    for log in logs_qs.select_related("sent_by", "template"):
        items.append(
            {
                "kind": "email_out",
                "id": str(log.id),
                "subject": log.subject,
                "body_snapshot": log.body_snapshot,
                "recipient": log.recipient,
                "sent_at": log.sent_at,
                "sent_by_name": log.sent_by.get_full_name() if log.sent_by else None,
                "status": log.status,
                "channel": log.channel,
                "template_id": log.template_id,
            }
        )

    items.sort(key=lambda x: x.get("created_at") or x.get("sent_at"))
    return items


def apply_client_message_timestamps(repair: RepairRequest) -> None:
    now = timezone.now()
    repair.last_client_message_at = now
    repair.last_activity_at = now
    repair.requires_attention = True
    repair.updated_at = now
    repair.save(update_fields=["last_client_message_at", "last_activity_at", "requires_attention", "updated_at"])


def apply_staff_public_reply_timestamps(repair: RepairRequest) -> None:
    now = timezone.now()
    repair.last_staff_reply_at = now
    repair.last_activity_at = now
    repair.requires_attention = False
    repair.updated_at = now
    repair.save(update_fields=["last_staff_reply_at", "last_activity_at", "requires_attention", "updated_at"])


def repair_has_inbound_client_activity(repair: RepairRequest) -> bool:
    """Czy była wiadomość od klienta (panel lub e-mail przychodzący) w widocznym wątku."""
    return repair.notes.filter(
        is_internal=False,
        thread_origin__in=[RepairNoteThreadOrigin.CLIENT, RepairNoteThreadOrigin.EMAIL_INBOUND],
    ).exists()
