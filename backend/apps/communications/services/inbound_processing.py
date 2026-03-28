"""
Wspólna logika: odpowiedź klienta e-mailem → wpis w wątku naprawy (RepairNote email_inbound).
Używane przez webhook HTTP oraz polling IMAP (np. Gmail).
"""
from __future__ import annotations

import re
from email.utils import parseaddr
from typing import Optional, Tuple

from apps.accounts.services.notification_service import notify_client_message
from apps.repairs.models import RepairNote, RepairNoteThreadOrigin, RepairRequest
from apps.repairs.services.messaging import apply_client_message_timestamps

REPAIR_NUMBER_IN_TEXT = re.compile(r"(PROKOM/RMA/\d+/\d{4})")


def normalize_from_address(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        return ""
    _, addr = parseaddr(raw)
    return (addr or raw).strip().lower()


def process_client_inbound_email(
    *, from_email_raw: str, subject: str, body_plain: str
) -> Tuple[Optional[RepairNote], Optional[str]]:
    """
    Próbuje dopasować odpowiedź do naprawy i utworzyć publiczną notatkę.

    Zwraca (RepairNote, None) przy sukcesie lub (None, kod_błędu):
    missing_fields, no_repair_number, repair_not_found, sender_mismatch
    """
    from_email = normalize_from_address(from_email_raw)
    subject = (subject or "").strip()
    body_plain = (body_plain or "").strip()

    if not from_email or not body_plain:
        return None, "missing_fields"

    haystack = f"{subject}\n{body_plain}"
    m = REPAIR_NUMBER_IN_TEXT.search(haystack)
    if not m:
        return None, "no_repair_number"

    repair_number = m.group(1)
    repair = RepairRequest.objects.filter(repair_number=repair_number).select_related("client").first()
    if not repair:
        return None, "repair_not_found"

    client_email = (repair.client.email or "").strip().lower()
    if not client_email or from_email != client_email:
        return None, "sender_mismatch"

    note_text = f"E-mail od {from_email}:\nTemat: {subject or '—'}\n\n{body_plain}"
    note = RepairNote.objects.create(
        repair=repair,
        author=None,
        note=note_text[:5000],
        is_internal=False,
        is_important=False,
        note_type=RepairNote.NOTE_TYPE_CLIENT_CONTACT,
        pinned=False,
        thread_origin=RepairNoteThreadOrigin.EMAIL_INBOUND,
    )
    apply_client_message_timestamps(repair)
    notify_client_message(repair)
    return note, None
