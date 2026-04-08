"""
Renderowanie szablonu (zmienne {{...}}) i wysyłka e-mail / SMS.
E-mail: Django send_mail / EmailMultiAlternatives (HTML). SMS: stub (konfiguracja SMSAPI później).
"""
import re
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
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
    """Wysyła e-mail zwykły (plain text)."""
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@prokom.pl")
    return send_mail(
        subject,
        body,
        from_email,
        [to_email],
        fail_silently=fail_silently,
    )


def send_email_html(to_email, subject, body_plain, html_content, fail_silently=True):
    """Wysyła e-mail w wersji plain text + HTML (klient zobaczy HTML, fallback: plain)."""
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@prokom.pl")
    msg = EmailMultiAlternatives(subject, body_plain, from_email, [to_email])
    msg.attach_alternative(html_content, "text/html")
    return msg.send(fail_silently=fail_silently)


def _format_money_pl_email(value):
    if value is None:
        return ""
    try:
        from decimal import Decimal

        d = value if isinstance(value, Decimal) else Decimal(str(value))
    except Exception:
        return str(value)
    integral, frac = f"{d:.2f}".split(".")
    try:
        integral_fmt = f"{int(integral):,}".replace(",", " ")
    except ValueError:
        integral_fmt = integral
    return f"{integral_fmt},{frac} zł"


def _phone_last4_email(phone: str) -> str:
    if not phone:
        return ""
    digits = "".join(c for c in phone if c.isdigit())
    return digits[-4:] if len(digits) >= 4 else ""


def send_repair_submission_confirmation(repair, fail_silently=True, *, intake_stationary=False):
    """
    Wysyła e-mail potwierdzenia przyjęcia zlecenia na podany adres klienta (dla każdego zgłoszenia).
    intake_stationary=True — treść i layout pod przyjęcie w serwisie (pełne linki, instrukcja konta, śledzenie).
    """
    to_email = (getattr(repair.client, "email", None) or "").strip()
    if not to_email:
        return False
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    client_name = repair.client.get_full_name() if repair.client else ""
    device_name = repair.device.get_device_name() if repair.device else ""
    delivery_display = repair.get_delivery_method_display() if hasattr(repair, "get_delivery_method_display") else (repair.delivery_method or "")
    return_display = repair.get_return_method_display() if hasattr(repair, "get_return_method_display") else (repair.return_method or "")
    claim_url = ""
    if getattr(repair, "claim_token", None) and getattr(repair, "claim_token_expires_at", None) and repair.claim_token_expires_at and repair.claim_token_expires_at > timezone.now():
        claim_url = f"{base}/claim-repair?token={repair.claim_token}"
    hammer_glass_display = ""
    if getattr(repair, "hammer_glass_interest", None):
        hg = repair.hammer_glass_interest
        if hg == "yes":
            hammer_glass_display = (
                "Tak — klient zainteresowany folią Hammer Glass / szkłem hartowanym (wycena przy naprawie)"
            )
        elif hg == "no":
            hammer_glass_display = "Nie — brak zainteresowania w tej chwili"
        elif hg == "ask_later":
            hammer_glass_display = "Zapytam później"
        elif hg == "free_with_quote":
            hammer_glass_display = "Gratis przy wycenie"
    accessories_summary = ""
    if getattr(repair, "accessory_interests", None):
        from apps.accessories.models import RepairAccessoryInterest
        interests = list(repair.accessory_interests.all().order_by("created_at"))
        choose_for_me = [i for i in interests if i.choose_for_me and (i.note or "").strip()]
        products = [i for i in interests if not i.choose_for_me and i.product_id]
        if choose_for_me:
            accessories_summary = (choose_for_me[0].note or "").strip() or "Proszę doradzić przy odbiorze"
        elif products:
            names = [getattr(i.product, "name", str(i.product_id)) for i in products if i.product]
            accessories_summary = ", ".join(names) if names else "Tak"
        elif any(i.choose_for_me for i in interests):
            accessories_summary = "Proszę doradzić przy odbiorze"
    client_notes = (getattr(repair, "client_notes", None) or "").strip()[:2000]
    device_turns_on = getattr(repair, "device_turns_on", None)
    visual_condition_description = (getattr(repair, "visual_condition_description", None) or "").strip()[:1000]
    delivery_by_courier = (getattr(repair, "delivery_method", None) or "") in ("courier", "parcel_locker")
    addr_full = getattr(settings, "SERWIS_PRINT_ADDRESS", "") or "ul. Orkana 16B, 34-700 Rabka-Zdrój"
    service_address = {
        "name": getattr(settings, "SERWIS_PRINT_COMPANY_NAME", "PRO-KOM Serwis"),
        "street": addr_full,
        "city": "",
        "hours": getattr(settings, "SERWIS_PRINT_HOURS", "Pn–Pt 9:00–17:00"),
        "phone": getattr(settings, "SERWIS_PRINT_PHONE", "883 200 151"),
        "email": getattr(settings, "SERWIS_PRINT_EMAIL", "sklep@pro-kom.eu"),
        "website": getattr(settings, "SERWIS_PRINT_WEBSITE", "www.pro-kom.eu"),
    }
    client_phone = (getattr(repair.client, "phone", None) or "").strip()
    phone_last4 = _phone_last4_email(client_phone)
    track_url = f"{base}/track"
    track_url_with_ref = f"{base}/track?ref={repair.repair_number}"
    register_url = f"{base}/client/rejestracja"
    login_url = f"{base}/client/login"
    est_cost = _format_money_pl_email(getattr(repair, "estimated_cost", None))
    est_date = (
        repair.estimated_completion_date.strftime("%d.%m.%Y")
        if getattr(repair, "estimated_completion_date", None)
        else ""
    )
    context = {
        "client_name": client_name,
        "repair_number": repair.repair_number,
        "device_name": device_name,
        "problem_description": (repair.problem_description or "")[:1000],
        "delivery_display": delivery_display,
        "return_display": return_display,
        "claim_url": claim_url,
        "hammer_glass_display": hammer_glass_display,
        "accessories_summary": accessories_summary,
        "client_notes": client_notes,
        "device_turns_on": device_turns_on,
        "visual_condition_description": visual_condition_description,
        "delivery_by_courier": delivery_by_courier,
        "service_address": service_address,
        "intake_stationary": intake_stationary,
        "track_url": track_url,
        "track_url_with_ref": track_url_with_ref,
        "register_url": register_url,
        "login_url": login_url,
        "client_phone": client_phone,
        "client_email": to_email,
        "phone_last4": phone_last4,
        "estimated_cost_display": est_cost,
        "estimated_completion_display": est_date,
        "estimated_duration_display": repair.get_estimated_duration_display() if hasattr(repair, "get_estimated_duration_display") else "",
    }
    subject = (
        f"Potwierdzenie przyjęcia w serwisie — {repair.repair_number} | PRO-KOM Serwis"
        if intake_stationary
        else f"Zgłoszenie przyjęte — {repair.repair_number} | PRO-KOM Serwis"
    )
    if intake_stationary:
        body_plain = (
            f"Dzień dobry{f', {client_name}' if client_name else ''},\n\n"
            "Dziękujemy za wizytę w serwisie PRO-KOM. Poniżej masz potwierdzenie przyjęcia sprzętu oraz najważniejsze informacje.\n\n"
            f"NUMER ZGŁOSZENIA: {repair.repair_number}\n"
            "Zapisz go — przyda się przy kontakcie z nami i przy śledzeniu statusu.\n\n"
            f"Urządzenie: {device_name}\n"
            f"Opis / zakres: {repair.problem_description or '—'}\n"
        )
        if est_cost:
            body_plain += f"Wstępna wycena: {est_cost}\n"
        if est_date:
            body_plain += f"Szacowana data zakończenia: {est_date}\n"
        body_plain += f"Dostawa: {delivery_display}\nZwrot: {return_display}\n"
        if hammer_glass_display:
            body_plain += f"Folia Hammer Glass / szkło hartowane: {hammer_glass_display}\n"
        body_plain += (
            f"\nPANEL KLIENTA — rejestracja: {register_url}\n"
            f"Zaloguj się: {login_url}\n"
            "Użyj tego samego adresu e-mail co przy przyjęciu, aby naprawa była widoczna na koncie.\n\n"
            f"ŚLEDZENIE (bez logowania): {track_url_with_ref}\n"
            f"Potrzebujesz numeru zgłoszenia oraz ostatnich 4 cyfr telefonu ({phone_last4 or '****'}).\n\n"
        )
        if claim_url:
            body_plain += f"Przypisanie naprawy do konta (link 7 dni): {claim_url}\n\n"
        body_plain += (
            f"Kontakt: tel. {service_address['phone']}, {service_address['email']}\n"
            f"{addr_full}\n\n"
            "Z poważaniem,\nZespół PRO-KOM Serwis"
        )
    else:
        body_plain = (
            f"Dzień dobry{f', {client_name}' if client_name else ''},\n\n"
            "Przyjęliśmy Twoje zlecenie naprawy. Skontaktujemy się z Tobą w ciągu kilku godzin roboczych, "
            "by potwierdzić przyjęcie zlecenia i ustalić szczegóły.\n\n"
            f"Numer naprawy: {repair.repair_number}\n"
            "Zapisz ten numer — jest ważny. Użyj go w kontakcie z serwisem.\n\n"
            "Podsumowanie zgłoszenia:\n"
            f"- Urządzenie: {device_name}\n"
            f"- Opis problemu: {repair.problem_description or ''}\n"
            f"- Dostawa: {delivery_display}\n"
            f"- Zwrot: {return_display}\n"
        )
        if hammer_glass_display:
            body_plain += f"- Folia Hammer Glass / szkło: {hammer_glass_display}\n"
        if accessories_summary:
            body_plain += f"- Dobierz Akcesoria: {accessories_summary}\n"
        if client_notes:
            body_plain += f"- Dodatkowe uwagi: {client_notes}\n"
        if device_turns_on is not None:
            body_plain += f"- Czy urządzenie się włącza: {'Tak' if device_turns_on else 'Nie'}\n"
        if visual_condition_description:
            body_plain += f"- Stan wizualny: {visual_condition_description}\n"
        body_plain += "\n"
        if delivery_by_courier:
            body_plain += (
                "Wysyłka kurierem — nasz adres do nadania paczki:\n"
                f"{service_address['name']}\n"
                f"{service_address['street']}\n"
                f"Godziny: {service_address['hours']}\n"
                f"Tel. {service_address['phone']}\n"
                f"E-mail: {service_address['email']}\n\n"
                "Wysyłkę paczki do nas opłacasz we własnym zakresie. Po naprawie odsyłamy Ci sprzęt za darmo — zwrot do domu jest po naszej stronie.\n\n"
                "Prosimy o staranne zabezpieczenie urządzenia przed wysyłką (np. oryginalne opakowanie, wypełniacz, folia bąbelkowa). "
                "Dzięki temu sprzęt dotrze do nas bez uszkodzeń.\n"
                "Po nadaniu paczki możesz dodać numer listu przewozowego w panelu klienta — ułatwi to nam śledzenie przesyłki.\n\n"
            )
        body_plain += (
            f"Panel klienta — rejestracja: {register_url}\n"
            f"Śledzenie: {track_url_with_ref}\n\n"
        )
        if claim_url:
            body_plain += f"Chcesz przypisać tę naprawę do konta? Link (ważny 7 dni): {claim_url}\n\n"
        body_plain += "Z poważaniem,\nZespół PRO-KOM Serwis"
    try:
        html_content = render_to_string("emails/repair_submission_confirmation.html", context)
        return send_email_html(to_email, subject, body_plain, html_content, fail_silently=fail_silently)
    except Exception:
        if not fail_silently:
            raise
        return False


def send_guest_repair_confirmation(repair, fail_silently=True):
    """
    (Przestarzałe) Wysyła e-mail do gościa z linkiem do śledzenia.
    Zastąpione przez send_repair_submission_confirmation — używane dla wszystkich zgłoszeń.
    """
    from django.conf import settings
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    track_url = f"{base}/track?ref={repair.repair_number}"
    claim_url = f"{base}/claim-repair?token={repair.claim_token}" if repair.claim_token else ""
    to_email = repair.client.email or ""
    if not to_email:
        return False
    subject = f"Zgłoszenie przyjęte — {repair.repair_number} | PRO-KOM Serwis"
    body = (
        f"Dzień dobry,\n\n"
        f"Twoje zgłoszenie naprawy zostało przyjęte.\n\n"
        f"Numer zgłoszenia: {repair.repair_number}\n\n"
        f"Śledź status naprawy (bez logowania):\n{track_url}\n"
        f"Potrzebujesz numeru zgłoszenia oraz ostatnich 4 cyfr numeru telefonu podanego w zgłoszeniu.\n\n"
    )
    if claim_url:
        body += (
            f"Chcesz przypisać tę naprawę do konta w panelu klienta?\n"
            f"Kliknij link (ważny 7 dni):\n{claim_url}\n\n"
        )
    body += (
        "Załóż konto w panelu klienta, aby na stałe śledzić naprawy i zarządzać profilem:\n"
        f"{base}/client/rejestracja\n\n"
        "— PRO-KOM Serwis"
    )
    try:
        send_email(to_email, subject, body, fail_silently=fail_silently)
        return True
    except Exception:
        return False


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


def client_email_is_deliverable(email: str | None) -> bool:
    """Czy na adres można wysłać prawdziwy e-mail (nie placeholder techniczny)."""
    e = (email or "").strip().lower()
    if not e or e.endswith("@prokom.local"):
        return False
    return True


def send_quote_summary_email_to_client(repair, quote, sent_by, *, fail_silently=False, is_resend=False):
    """
    Wysyła zestawienie wyceny na e-mail klienta (HTML + plain text, log CommunicationLog).
    Zwraca (success: bool, detail: str | None) — detail np. 'no_email' lub 'send_failed'.
    """
    client = repair.client
    if not client_email_is_deliverable(getattr(client, "email", None) or ""):
        return False, "no_email"

    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    panel_repairs_url = f"{base}/client/naprawy"
    panel_detail_url = f"{base}/client/naprawy/{repair.id}"
    track_url = f"{base}/track?ref={repair.repair_number}"

    device_label = repair.device.get_device_name() if getattr(repair, "device", None) else "Urządzenie"
    client_name = client.get_full_name() if client else ""

    quote_rows = []
    lines_plain = []
    for it in quote.items.all().order_by("id"):
        desc = (it.description or "Pozycja").strip()
        try:
            origin_lbl = it.get_part_origin_display()
        except Exception:
            origin_lbl = ""
        quote_rows.append(
            {
                "description": desc,
                "quantity": str(it.quantity),
                "parts": _format_money_pl_email(it.parts_price),
                "labour": _format_money_pl_email(it.labour_price),
                "line_total": _format_money_pl_email(it.total),
                "origin": origin_lbl or "—",
            }
        )
        origin_line = f"  |  {origin_lbl}" if origin_lbl else ""
        lines_plain.append(
            f"• {desc}\n"
            f"  Ilość: {it.quantity}  |  Części: {_format_money_pl_email(it.parts_price)}  |  "
            f"Robocizna: {_format_money_pl_email(it.labour_price)}  |  Razem: {_format_money_pl_email(it.total)}"
            f"{origin_line}"
        )

    total_str = _format_money_pl_email(quote.total_amount)
    intro = (
        "Przesyłamy zaktualizowane zestawienie kosztów — kwoty w panelu klienta są zgodne z poniższą tabelą."
        if is_resend
        else "Przesyłamy zestawienie kosztów naprawy — szczegóły znajdziesz także w panelu klienta."
    )
    body_plain = (
        f"Dzień dobry{f', {client_name}' if client_name else ''},\n\n"
        f"{intro}\n\n"
        f"Numer zgłoszenia: {repair.repair_number}\n"
        f"Wycena nr: {quote.version}\n"
        f"Urządzenie: {device_label}\n\n"
        "Pozycje:\n"
        + "\n".join(lines_plain)
        + f"\n\nSUMA: {total_str}\n"
    )
    if quote.valid_until:
        vu = quote.valid_until.strftime("%d.%m.%Y") if hasattr(quote.valid_until, "strftime") else str(quote.valid_until)
        body_plain += f"Ważność wyceny do: {vu}\n"
    if quote.sent_at:
        try:
            st = timezone.localtime(quote.sent_at).strftime("%d.%m.%Y %H:%M")
        except Exception:
            st = str(quote.sent_at)
        body_plain += f"Data wysłania / aktualizacji: {st}\n"
    body_plain += (
        f"\nPanel klienta (szczegóły i akceptacja): {panel_detail_url}\n"
        f"Śledzenie bez logowania: {track_url}\n"
    )

    ctx = {
        "client_name": client_name,
        "repair_number": repair.repair_number,
        "device_name": device_label,
        "quote_version": quote.version,
        "total_amount_display": total_str,
        "intro_text": intro,
        "quote_rows": quote_rows,
        "valid_until_display": "",
        "sent_at_display": "",
        "is_resend": is_resend,
        "panel_repairs_url": panel_repairs_url,
        "panel_detail_url": panel_detail_url,
        "track_url": track_url,
    }
    if quote.valid_until:
        ctx["valid_until_display"] = (
            quote.valid_until.strftime("%d.%m.%Y") if hasattr(quote.valid_until, "strftime") else str(quote.valid_until)
        )
    if quote.sent_at:
        try:
            ctx["sent_at_display"] = timezone.localtime(quote.sent_at).strftime("%d.%m.%Y %H:%M")
        except Exception:
            ctx["sent_at_display"] = str(quote.sent_at)

    html_content = render_to_string("emails/quote_summary.html", ctx)
    subject = (
        f"Zaktualizowana wycena — {repair.repair_number} | PRO-KOM Serwis"
        if is_resend
        else f"Wycena naprawy {repair.repair_number} | PRO-KOM Serwis"
    )
    _log, ok = send_freeform_email_to_repair_client(
        repair, subject, body_plain, sent_by, fail_silently=fail_silently, html_content=html_content
    )
    return (True, None) if ok else (False, "send_failed")


def send_repair_completion_thank_you_email(repair, sent_by=None, *, fail_silently=True):
    """
    Wysyła automatyczny e-mail z podziękowaniem po zakończeniu naprawy (status gotowe do odbioru).
    Zwraca (success: bool, detail: str | None) — detail np. 'no_email' lub 'send_failed'.
    """
    client = getattr(repair, "client", None)
    if not client_email_is_deliverable(getattr(client, "email", None) or ""):
        return False, "no_email"

    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    panel_detail_url = f"{base}/client/naprawy/{repair.id}"
    track_url = f"{base}/track?ref={repair.repair_number}"

    client_name = client.get_full_name() if client else ""
    device_label = repair.device.get_device_name() if getattr(repair, "device", None) else "Urządzenie"
    completed_at = getattr(repair, "ready_for_pickup_at", None) or getattr(repair, "completed_at", None)
    completed_at_display = ""
    if completed_at:
        try:
            completed_at_display = timezone.localtime(completed_at).strftime("%d.%m.%Y %H:%M")
        except Exception:
            completed_at_display = str(completed_at)

    subject = f"Dziękujemy za zaufanie — {repair.repair_number} | PRO-KOM Serwis"
    body_plain = (
        f"Dzień dobry{f', {client_name}' if client_name else ''},\n\n"
        "Dziękujemy za zaufanie i skorzystanie z usług PRO-KOM Serwis.\n"
        "Twoja naprawa została zakończona, a urządzenie jest gotowe do odbioru.\n\n"
        f"Numer zgłoszenia: {repair.repair_number}\n"
        f"Urządzenie: {device_label}\n"
    )
    if completed_at_display:
        body_plain += f"Data zakończenia: {completed_at_display}\n"
    body_plain += (
        f"\nPanel klienta: {panel_detail_url}\n"
        f"Śledzenie bez logowania: {track_url}\n\n"
        "Dziękujemy za wybór naszego serwisu.\n"
        "Zespół PRO-KOM Serwis"
    )

    ctx = {
        "client_name": client_name,
        "repair_number": repair.repair_number,
        "device_name": device_label,
        "completed_at_display": completed_at_display,
        "panel_detail_url": panel_detail_url,
        "track_url": track_url,
    }
    html_content = render_to_string("emails/repair_completion_thank_you.html", ctx)
    _log, ok = send_freeform_email_to_repair_client(
        repair,
        subject,
        body_plain,
        sent_by,
        fail_silently=fail_silently,
        html_content=html_content,
    )
    return (True, None) if ok else (False, "send_failed")


def _outbound_client_email_footer(repair):
    """Stopka ułatwiająca dopasowanie odpowiedzi klienta (numer w temacie wątku)."""
    rn = repair.repair_number
    return (
        f"\n\n---\n"
        f"Odpowiadając na tę wiadomość, zachowaj w temacie numer zgłoszenia: {rn}\n"
        f"(wtedy odpowiedź zostanie zapisana w panelu serwisu przy tej naprawie.)"
    )


def _outbound_client_email_footer_html(repair):
    rn = repair.repair_number
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:28px;'
        f'border-top:1px solid #e5e5e5;padding-top:18px;"><tr><td style="font-size:12px;line-height:1.55;color:#737373;">'
        f"Odpowiadając na tę wiadomość, zachowaj w temacie numer zgłoszenia: "
        f'<strong style="color:#404040;">{rn}</strong> — wtedy odpowiedź trafi do wątku tej naprawy w serwisie.'
        f"</td></tr></table>"
    )


def send_freeform_email_to_repair_client(repair, subject, body_plain, sent_by, *, fail_silently=True, html_content=None):
    """
    Dowolny e-mail do klienta naprawy; zapisuje CommunicationLog (bez szablonu).
    Treść wysłana = body_plain + krótka stopka z numerem zgłoszenia (pod odbiór odpowiedzi przez webhook).
    Gdy podasz html_content — wysyłka multipart/alternative (HTML + plain).
    Zwraca (log, success).
    """
    from apps.communications.models import CommunicationLog
    from apps.common.enums import CommunicationChannel

    recipient = (repair.client.email or "").strip()
    full_subject = f"[{repair.repair_number}] {subject}".strip()
    body_with_footer = (body_plain or "").rstrip() + _outbound_client_email_footer(repair)
    if not recipient:
        log = CommunicationLog.objects.create(
            repair=repair,
            template=None,
            channel=CommunicationChannel.EMAIL,
            recipient="",
            subject=full_subject,
            body_snapshot=body_with_footer,
            sent_by=sent_by,
            status="failed",
            error_message="Brak adresu e-mail u klienta.",
        )
        return log, False
    try:
        if html_content:
            html_full = (html_content or "").rstrip() + _outbound_client_email_footer_html(repair)
            send_email_html(recipient, full_subject, body_with_footer, html_full, fail_silently=fail_silently)
        else:
            send_email(recipient, full_subject, body_with_footer, fail_silently=fail_silently)
        log = CommunicationLog.objects.create(
            repair=repair,
            template=None,
            channel=CommunicationChannel.EMAIL,
            recipient=recipient,
            subject=full_subject,
            body_snapshot=body_with_footer,
            sent_by=sent_by,
            status="sent",
        )
        return log, True
    except Exception as e:
        log = CommunicationLog.objects.create(
            repair=repair,
            template=None,
            channel=CommunicationChannel.EMAIL,
            recipient=recipient,
            subject=full_subject,
            body_snapshot=body_with_footer,
            sent_by=sent_by,
            status="failed",
            error_message=str(e),
        )
        return log, False
