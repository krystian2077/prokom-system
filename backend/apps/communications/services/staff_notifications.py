"""
PRO-KOM Tech — powiadomienia wewnętrzne o zgłoszeniach z formularzy publicznych.

Odrębne od maili do klienta: lecą na adresy serwisu (STAFF_NOTIFICATION_EMAILS),
żeby obsługa wiedziała o nowym zgłoszeniu bez zaglądania do panelu.
"""
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import escape


def staff_notification_recipients():
    """Adresy serwisu, na które trafiają powiadomienia o zgłoszeniach z formularzy publicznych."""
    return [e for e in getattr(settings, "STAFF_NOTIFICATION_EMAILS", []) if e]


def _build_new_repair_html(repair_number, panel_url, rows, problem, notes, sent_at):
    """HTML of the internal notification (PRO-KOM Tech layout, templates/emails/staff_new_repair.html).

    All text arguments must already be HTML-escaped by the caller.
    """
    return render_to_string(
        "emails/staff_new_repair.html",
        {
            "repair_number": repair_number,
            "panel_url": panel_url,
            "rows": rows,
            "problem": problem,
            "notes": notes,
            "sent_at": sent_at,
        },
    )


def send_new_repair_staff_notification(repair, fail_silently=False):
    """
    Powiadamia serwis o nowym zgłoszeniu naprawy złożonym przez publiczny formularz online.
    Osobny mail od potwierdzenia dla klienta. Zwraca True, jeśli wiadomość wyszła.
    """
    recipients = staff_notification_recipients()
    if not recipients:
        return False

    client = repair.client
    device = repair.device
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    panel_url = f"{base}/panel/repairs/{repair.id}"

    client_name = client.get_full_name() if client else "—"
    turns_on = getattr(repair, "device_turns_on", None)
    problem = (getattr(repair, "problem_description", None) or "").strip() or "—"
    notes = (getattr(repair, "client_notes", None) or "").strip()

    rows = [
        ("Numer naprawy", repair.repair_number),
        ("Klient", client_name),
        ("Telefon", (getattr(client, "phone", None) or "").strip() or "nie podano"),
        ("E-mail", (getattr(client, "email", None) or "").strip() or "nie podano"),
        ("Urządzenie", device.get_device_name() if device else "—"),
        ("Dostarczenie", repair.get_delivery_method_display() or "—"),
        ("Zwrot", repair.get_return_method_display() or "—"),
    ]
    if turns_on is not None:
        rows.append(("Urządzenie włącza się", "Tak" if turns_on else "Nie"))

    plain_body = (
        "Nowe zgloszenie naprawy online\n\n"
        + "\n".join(f"{label}: {value}" for label, value in rows)
        + f"\n\nOpis usterki:\n{problem}"
        + (f"\n\nUwagi klienta:\n{notes}" if notes else "")
        + f"\n\nPanel: {panel_url}\n"
    )

    html_body = _build_new_repair_html(
        escape(repair.repair_number),
        panel_url,
        [(escape(str(label)), escape(str(value))) for label, value in rows],
        escape(problem),
        escape(notes),
        timezone.localtime(timezone.now()).strftime("%d.%m.%Y, %H:%M"),
    )

    subject = f"Nowe zgloszenie online — {repair.repair_number} — {client_name}"
    msg = EmailMultiAlternatives(
        subject, plain_body, settings.DEFAULT_FROM_EMAIL, recipients
    )
    msg.attach_alternative(html_body, "text/html")
    return bool(msg.send(fail_silently=fail_silently))
