"""Publiczny formularz zapytania z oferty — wysyła e-mail na adres serwisu."""
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

INQUIRY_TO_EMAIL = "serwisprokomrabka@gmail.com"


class InquiryFormView(APIView):
    """POST — przyjmuje zapytanie z formularza oferty i wysyła e-mail do serwisu."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data
        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        phone = (data.get("phone") or "").strip()
        email = (data.get("email") or "").strip()
        interest = (data.get("interest") or "").strip()
        message = (data.get("message") or "").strip()

        if not email or not message:
            return Response(
                {"detail": "Pola e-mail i pytanie są wymagane."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        full_name = f"{first_name} {last_name}".strip() or "Nieznany"
        subject = f"Nowe zapytanie z oferty — {full_name}"
        body = (
            f"Imię i nazwisko: {full_name}\n"
            f"Telefon: {phone or '—'}\n"
            f"E-mail: {email}\n"
            f"Zainteresowanie: {interest or '—'}\n"
            f"\nTreść pytania:\n{message}"
        )

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@prokom.pl")
        try:
            send_mail(subject, body, from_email, [INQUIRY_TO_EMAIL], fail_silently=False)
        except Exception:
            return Response(
                {"detail": "Nie udało się wysłać wiadomości. Spróbuj ponownie później."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"detail": "Wiadomość została wysłana."}, status=status.HTTP_200_OK)
