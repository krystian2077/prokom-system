"""
Renderowanie szablonu (zmienne {{...}}) i wysyłka e-mail / SMS.
E-mail: Django send_mail. SMS: stub (konfiguracja SMSAPI później).
"""
import re
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


# Dozwolone zmienne w szablonach
PLACEHOLDER_MAP = {
    "repair_number": "repair.repair_number",
    "client_name": "client.get_full_name()",
    "client_phone": "client.phone",
    "client_email": "client.email",
    "device_name": "device.get_device_name()",
    "status": "repair.get_status_display()",
    "estimated_duration": "repair.get_estimated_duration_display()",
    "estimated_completion_date": "repair.estimated_completion_date",
    "problem_description": "repair.problem_description",
    "company_name": "PRO-KOM Serwis",
}


def get_repair_context(repair):
    """Buduje słownik zmiennych dla szablonu z obiektu naprawy."""
    client = repair.client
    device = repair.device
    return {
        "repair_number": repair.repair_number,
        "client_name": client.get_full_name(),
        "client_phone": getattr(client, "phone", "") or "",
        "client_email": getattr(client, "email", "") or "",
        "device_name": device.get_device_name(),
        "status": repair.get_status_display(),
        "estimated_duration": repair.get_estimated_duration_display(),
        "estimated_completion_date": str(repair.estimated_completion_date) if repair.estimated_completion_date else "",
        "problem_description": (repair.problem_description or "")[:200],
        "company_name": "PRO-KOM Serwis",
    }


def render_template_body(text, context):
    """Zamienia {{zmienna}} na wartości z context."""
    if not text:
        return text
    result = text
    for key, value in context.items():
        result = result.replace("{{" + key + "}}", str(value or ""))
    # Usuń niezamienione zmienne (zostaw puste)
    result = re.sub(r"\{\{[^}]+\}\}", "", result)
    return result


def send_email(to_email, subject, body, fail_silently=True):
    """Wysyła e-mail (Django send_mail)."""
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@prokom.pl")
    return send_mail(
        subject,
        body,
        from_email,
        [to_email],
        fail_silently=fail_silently,
    )


def send_sms(to_phone, body):
    """
    Wysyła SMS. Na razie stub — po konfiguracji SMSAPI można podłączyć httpx.
    Zwraca True jeśli sukces, False w razie błędu.
    """
    # TODO: integracja SMSAPI (httpx post do API z tokenem)
    # return sms_api_send(to_phone, body)
    return True  # stub


def send_template_to_repair(template, repair, sent_by=None):
    """
    Renderuje szablon w kontekście naprawy, wysyła (e-mail lub SMS) i zapisuje CommunicationLog.

    Zwraca (log, success). Gdy channel=email, recipient=client.email; gdy channel=sms, recipient=client.phone.
    """
    from apps.communications.models import CommunicationLog

    context = get_repair_context(repair)
    subject = render_template_body(template.subject, context)
    body = render_template_body(template.body, context)

    if template.channel == "email":
        recipient = repair.client.email or ""
        if not recipient:
            log = CommunicationLog.objects.create(
                repair=repair,
                template=template,
                channel=template.channel,
                recipient="",
                subject=subject,
                body_snapshot=body,
                sent_by=sent_by,
                status="failed",
                error_message="Brak adresu e-mail u klienta.",
            )
            return log, False
        try:
            send_email(recipient, subject, body)
            log = CommunicationLog.objects.create(
                repair=repair,
                template=template,
                channel=template.channel,
                recipient=recipient,
                subject=subject,
                body_snapshot=body,
                sent_by=sent_by,
                status="sent",
            )
            return log, True
        except Exception as e:
            log = CommunicationLog.objects.create(
                repair=repair,
                template=template,
                channel=template.channel,
                recipient=recipient,
                subject=subject,
                body_snapshot=body,
                sent_by=sent_by,
                status="failed",
                error_message=str(e),
            )
            return log, False

    elif template.channel == "sms":
        recipient = getattr(repair.client, "phone", "") or ""
        if not recipient:
            log = CommunicationLog.objects.create(
                repair=repair,
                template=template,
                channel=template.channel,
                recipient="",
                subject="",
                body_snapshot=body,
                sent_by=sent_by,
                status="failed",
                error_message="Brak numeru telefonu u klienta.",
            )
            return log, False
        ok = send_sms(recipient, body)
        log = CommunicationLog.objects.create(
            repair=repair,
            template=template,
            channel=template.channel,
            recipient=recipient,
            subject="",
            body_snapshot=body,
            sent_by=sent_by,
            status="sent" if ok else "failed",
            error_message="" if ok else "SMS stub / błąd wysyłki",
        )
        return log, ok

    else:
        # panel / phone / internal — tylko log bez wysyłki
        log = CommunicationLog.objects.create(
            repair=repair,
            template=template,
            channel=template.channel,
            recipient="",
            subject=subject,
            body_snapshot=body,
            sent_by=sent_by,
            status="sent",
        )
        return log, True
