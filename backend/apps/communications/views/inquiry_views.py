"""Publiczny formularz zapytania z oferty — wysyla e-mail na adres serwisu."""
import logging
import re
from datetime import datetime
from urllib.parse import quote
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import escape
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

# Zapasowy adres, gdyby STAFF_NOTIFICATION_EMAILS byla pusta
INQUIRY_TO_EMAIL = "serwisprokomrabka@gmail.com"


def _build_inquiry_html(full_name, phone, email, interest, message, sent_at):
    """HTML of the contact-form inquiry (PRO-KOM Tech layout, templates/emails/staff_inquiry.html).

    Client-provided values are escaped here, so they cannot inject HTML or links into the e-mail.
    """
    phone_digits = re.sub(r"[^\d+]", "", phone or "")
    reply_subject = quote("Re: Zapytanie ze strony PRO-KOM Tech")
    return render_to_string(
        "emails/staff_inquiry.html",
        {
            "full_name": escape(full_name),
            "phone": escape(phone),
            "phone_href": escape(phone_digits),
            "phone_tel": escape(f"tel:{phone_digits}") if phone_digits else "",
            "email": escape(email),
            "reply_href": escape(f"mailto:{quote(email, safe='@')}?subject={reply_subject}"),
            "interest": escape(interest),
            "message": escape(message),
            "sent_at": sent_at,
        },
    )


class InquiryFormView(APIView):
    """POST — przyjmuje zapytanie z formularza oferty i wysyla e-mail do serwisu."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "public_inquiry"

    def post(self, request):
        try:
            data = request.data
            first_name = (data.get("first_name") or "").strip()
            last_name = (data.get("last_name") or "").strip()
            phone = (data.get("phone") or "").strip()
            email = (data.get("email") or "").strip()
            interest = (data.get("interest") or "").strip()
            message = (data.get("message") or "").strip()

            if not email or not message:
                return Response(
                    {"detail": "Pola e-mail i pytanie sa wymagane."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            full_name = f"{first_name} {last_name}".strip() or "Nieznany"
            sent_at = datetime.now().strftime("%d.%m.%Y, %H:%M")
            subject = f"Nowe zapytanie z oferty - {full_name}"

            plain_body = (
                f"Imie i nazwisko: {full_name}\n"
                f"Telefon: {phone or 'nie podano'}\n"
                f"E-mail: {email}\n"
                f"Zainteresowanie: {interest or '-'}\n"
                f"\nTresc pytania:\n{message}"
            )

            html_body = _build_inquiry_html(full_name, phone, email, interest, message, sent_at)
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@prokom.pl")

            from apps.communications.services.staff_notifications import (
                staff_notification_recipients,
            )

            recipients = staff_notification_recipients() or [INQUIRY_TO_EMAIL]
            msg = EmailMultiAlternatives(subject, plain_body, from_email, recipients)
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=True)

            return Response({"detail": "Wiadomosc zostala wyslana."}, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.exception("InquiryFormView error: %s", exc)
            return Response(
                {"detail": "Nie udalo sie wyslac wiadomosci. Sprobuj ponownie pozniej."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
