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


def _build_new_repair_html(repair_number, panel_url, rows, problem, notes, sent_at, logistics_hint=""):
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
            "logistics_hint": logistics_hint,
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
    from apps.communications.services.send import email_logistics_context

    logistics = email_logistics_context(repair)
    notes = logistics["client_notes_clean"]
    by_courier = (getattr(repair, "delivery_method", None) or "") in ("courier", "parcel_locker")
    if by_courier:
        arrival = f"Paczka kurierem do salonu {logistics['parcel_point']['loc']}"
    elif logistics["dropoff_point"]:
        arrival = f"Klient przyniesie sprzęt do salonu {logistics['dropoff_point']['loc']}"
    else:
        arrival = "Klient przyniesie sprzęt osobiście (salon nie wybrany)"
    if logistics["return_by_courier"]:
        back = "odesłanie kurierem" + (f" na adres: {logistics['return_address_display']}" if logistics["return_address_display"] else "")
    elif logistics["pickup_point"]:
        back = f"odbiór osobisty w salonie {logistics['pickup_point']['loc']}" + (" (inny niż przyjęcia)" if logistics["pickup_differs"] else "")
    else:
        back = "odbiór osobisty"
    logistics_hint = f"{arrival}; {back}."

    rows = [
        ("Numer naprawy", repair.repair_number),
        ("Klient", client_name),
        ("Telefon", (getattr(client, "phone", None) or "").strip() or "nie podano"),
        ("E-mail", (getattr(client, "email", None) or "").strip() or "nie podano"),
        ("Urządzenie", device.get_device_name() if device else "—"),
        ("Dostarczenie", repair.get_delivery_method_display() or "—"),
    ]
    if logistics["dropoff_point"]:
        rows.append(("Punkt przyjęcia", logistics["dropoff_point"]["name"]))
    elif not by_courier:
        rows.append(("Punkt przyjęcia", "nie wybrano"))
    if logistics["parcel_point"]:
        rows.append(("Paczka na adres", f"salon {logistics['parcel_point']['name']}"))
    rows.append(("Zwrot", repair.get_return_method_display() or "—"))
    if logistics["pickup_point"]:
        rows.append(("Punkt odbioru", logistics["pickup_point"]["name"]))
    if logistics["return_address_display"]:
        rows.append(("Adres odesłania", logistics["return_address_display"]))
    if turns_on is not None:
        rows.append(("Urządzenie włącza się", "Tak" if turns_on else "Nie"))

    plain_body = (
        "Nowe zgłoszenie naprawy online\n\n"
        + f"{logistics_hint}\n\n"
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
        logistics_hint=escape(logistics_hint),
    )

    subject = f"Nowe zgloszenie online — {repair.repair_number} — {client_name}"
    msg = EmailMultiAlternatives(
        subject, plain_body, settings.DEFAULT_FROM_EMAIL, recipients
    )
    msg.attach_alternative(html_body, "text/html")
    return bool(msg.send(fail_silently=fail_silently))
