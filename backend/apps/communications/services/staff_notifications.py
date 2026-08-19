"""
PRO-KOM Serwis — powiadomienia wewnętrzne o zgłoszeniach z formularzy publicznych.

Odrębne od maili do klienta: lecą na adresy serwisu (STAFF_NOTIFICATION_EMAILS),
żeby obsługa wiedziała o nowym zgłoszeniu bez zaglądania do panelu.
"""
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.utils.html import escape


def staff_notification_recipients():
    """Adresy serwisu, na które trafiają powiadomienia o zgłoszeniach z formularzy publicznych."""
    return [e for e in getattr(settings, "STAFF_NOTIFICATION_EMAILS", []) if e]


def _build_new_repair_html(repair_number, panel_url, rows, problem, notes, sent_at):
    """Layout spójny z mailem 'Nowe zapytanie z oferty' (inquiry_views)."""
    rows_html = "".join(
        '<tr><td style="padding:10px 0;border-bottom:1px solid #2a2a3a;">'
        '<span style="display:block;font-size:11px;text-transform:uppercase;'
        'letter-spacing:1px;color:#888;margin-bottom:3px;">' + label + "</span>"
        '<span style="font-size:15px;color:#ffffff;font-weight:600;">' + value + "</span>"
        "</td></tr>"
        for label, value in rows
    )

    notes_html = ""
    if notes:
        notes_html = (
            '<p style="margin:24px 0 12px;font-size:11px;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#dc1e1e;font-weight:700;">Uwagi klienta</p>'
            '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
            '<td style="background:#1a1a2e;border-left:3px solid #555;'
            'border-radius:0 12px 12px 0;padding:20px 24px;">'
            '<p style="margin:0;font-size:15px;color:#d0d0e0;line-height:1.7;'
            'white-space:pre-wrap;">' + notes + "</p>"
            "</td></tr></table>"
        )

    return (
        '<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"/>'
        '<meta name="viewport" content="width=device-width,initial-scale=1"/>'
        "<title>Nowe zgloszenie naprawy online</title></head>"
        '<body style="margin:0;padding:0;background-color:#0d0d14;'
        "font-family:Segoe UI,Arial,sans-serif;\">"
        '<table width="100%" cellpadding="0" cellspacing="0" '
        'style="background-color:#0d0d14;padding:32px 16px;"><tr><td align="center">'
        '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">'

        # HEADER
        '<tr><td style="background:linear-gradient(135deg,#1a0505 0%,#1c0808 50%,#0d0d14 100%);'
        'border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;'
        'border-bottom:2px solid #dc1e1e;">'
        '<div style="display:inline-block;background:#dc1e1e;border-radius:10px;'
        'padding:8px 14px;margin-bottom:16px;">'
        '<span style="color:#ffffff;font-size:13px;font-weight:800;letter-spacing:2px;'
        'text-transform:uppercase;">PRO-KOM</span></div>'
        '<h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#ffffff;'
        'letter-spacing:-0.3px;">Nowe zgloszenie naprawy</h1>'
        '<p style="margin:0;font-size:13px;color:#888;letter-spacing:0.2px;">'
        "Klient wypelnil formularz zgloszenia online</p></td></tr>"

        # BODY
        '<tr><td style="background:#13131f;padding:0 40px 32px;">'

        # Badge z numerem naprawy
        '<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 24px;"><tr>'
        '<td style="background:rgba(220,30,30,0.08);border:1px solid rgba(220,30,30,0.25);'
        'border-radius:10px;padding:14px 20px;">'
        '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
        '<td style="width:8px;background:#dc1e1e;border-radius:4px;" width="8">&nbsp;</td>'
        '<td style="padding-left:14px;">'
        '<span style="font-size:13px;color:#dc1e1e;font-weight:700;text-transform:uppercase;'
        'letter-spacing:0.8px;">' + repair_number + "</span>"
        '<span style="display:block;font-size:12px;color:#999;margin-top:2px;">'
        "Zgloszenie czeka na potwierdzenie i diagnoze</span>"
        "</td></tr></table></td></tr></table>"

        # Szczegóły
        '<p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;'
        'letter-spacing:1.5px;color:#dc1e1e;font-weight:700;">Szczegoly zgloszenia</p>'
        '<table width="100%" cellpadding="0" cellspacing="0" '
        'style="background:#1a1a2e;border-radius:12px;overflow:hidden;">'
        '<tr><td style="padding:20px 24px;">'
        '<table width="100%" cellpadding="0" cellspacing="0">' + rows_html + "</table>"
        "</td></tr></table>"

        # Opis usterki
        '<p style="margin:24px 0 12px;font-size:11px;text-transform:uppercase;'
        'letter-spacing:1.5px;color:#dc1e1e;font-weight:700;">Opis usterki</p>'
        '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
        '<td style="background:#1a1a2e;border-left:3px solid #dc1e1e;'
        'border-radius:0 12px 12px 0;padding:20px 24px;">'
        '<p style="margin:0;font-size:15px;color:#d0d0e0;line-height:1.7;'
        'white-space:pre-wrap;">' + problem + "</p>"
        "</td></tr></table>"

        + notes_html +

        # CTA
        '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">'
        '<tr><td align="center">'
        '<a href="' + panel_url + '" style="display:inline-block;'
        'background:linear-gradient(135deg,#dc1e1e,#b81818);color:#ffffff;font-size:14px;'
        'font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;'
        'letter-spacing:0.3px;">Otworz naprawe w panelu</a>'
        "</td></tr></table>"

        "</td></tr>"

        # FOOTER
        '<tr><td style="background:#0d0d14;border-top:1px solid #1e1e2e;'
        'border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">'
        '<p style="margin:0 0 4px;font-size:12px;color:#555;">'
        "Powiadomienie wewnetrzne — wyslane automatycznie przez system PRO-KOM Serwis</p>"
        '<p style="margin:0;font-size:11px;color:#444;">' + sent_at + "</p>"
        "</td></tr>"

        "</table></td></tr></table></body></html>"
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
        ("Urzadzenie", device.get_device_name() if device else "—"),
        ("Dostarczenie", repair.get_delivery_method_display() or "—"),
        ("Zwrot", repair.get_return_method_display() or "—"),
    ]
    if turns_on is not None:
        rows.append(("Urzadzenie wlacza sie", "Tak" if turns_on else "Nie"))

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
