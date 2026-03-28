"""
Pobiera nieprzeczytane wiadomości z skrzynki IMAP (np. Gmail) i zapisuje odpowiedzi klientów w wątku naprawy.

Wymaga w .env: INBOUND_IMAP_USER, INBOUND_IMAP_PASSWORD (hasło aplikacji Gmail).
Opcjonalnie: INBOUND_IMAP_HOST (domyślnie imap.gmail.com), INBOUND_IMAP_MAILBOX (INBOX).

Uruchomienie okresowe (cron / systemd timer / Render cron): co kilka minut.
Przykład: python manage.py poll_inbound_imap
"""
import imaplib
import logging
from typing import List

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.communications.services.imap_parse import parse_rfc822_bytes
from apps.communications.services.inbound_processing import process_client_inbound_email

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Przetwarza nieprzeczytane e-maile z IMAP i dodaje je do wątków napraw (jak webhook inbound)."

    def handle(self, *args, **options):
        user = (getattr(settings, "INBOUND_IMAP_USER", "") or "").strip()
        password = getattr(settings, "INBOUND_IMAP_PASSWORD", "") or ""
        host = (getattr(settings, "INBOUND_IMAP_HOST", "") or "imap.gmail.com").strip()
        mailbox = (getattr(settings, "INBOUND_IMAP_MAILBOX", "") or "INBOX").strip()

        if not user or not password:
            self.stdout.write(
                self.style.WARNING(
                    "Brak INBOUND_IMAP_USER lub INBOUND_IMAP_PASSWORD — pomijam (skonfiguruj .env)."
                )
            )
            return

        try:
            imap = imaplib.IMAP4_SSL(host)
            imap.login(user, password)
            imap.select(mailbox)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"IMAP login/select: {exc}"))
            raise

        status, data = imap.search(None, "UNSEEN")
        if status != "OK" or not data or not data[0]:
            imap.logout()
            self.stdout.write("Brak nieprzeczytanych wiadomości.")
            return

        ids: List[bytes] = data[0].split()
        processed = 0
        for num in ids:
            status, fetched = imap.fetch(num, "(RFC822)")
            if status != "OK" or not fetched or not isinstance(fetched[0], tuple):
                continue
            raw = fetched[0][1]
            if not isinstance(raw, (bytes, bytearray)):
                continue
            from_raw, subject, body_plain = parse_rfc822_bytes(bytes(raw))
            note, err = process_client_inbound_email(
                from_email_raw=from_raw,
                subject=subject,
                body_plain=body_plain,
            )
            if note:
                processed += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Zapisano odpowiedź: naprawa {note.repair_id}, notatka {note.id}")
                )
            else:
                logger.info(
                    "IMAP pominięto wiadomość: %s (temat: %s) — %s",
                    from_raw[:80] if from_raw else "",
                    subject[:80] if subject else "",
                    err or "?",
                )
            # Zawsze oznacz jako przeczytane, żeby nie przetwarzać w pętli
            try:
                imap.store(num, "+FLAGS", "\\Seen")
            except Exception as exc:
                logger.warning("IMAP STORE Seen failed for %s: %s", num, exc)

        imap.logout()
        self.stdout.write(self.style.SUCCESS(f"Gotowe. Utworzono wpisów: {processed} (z {len(ids)} nieprzeczytanych)."))
