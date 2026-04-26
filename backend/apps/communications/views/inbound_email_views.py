"""
Webhook na przychodzące e-maile (np. SendGrid / Mailgun Inbound).
Oczekuje JSON i nagłówka X-Inbound-Secret zgodnego z EMAIL_INBOUND_WEBHOOK_SECRET.
"""
from email.utils import parseaddr
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.communications.services.inbound_processing import process_client_inbound_email


class EmailInboundWebhookView(APIView):
    """POST — przetwarza skrzynkę przychodzącą (treść w JSON)."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "public_inbound_webhook"

    def post(self, request):
        secret = getattr(settings, "EMAIL_INBOUND_WEBHOOK_SECRET", "") or ""
        if not secret:
            return Response(
                {"detail": "Webhook nie jest skonfigurowany (EMAIL_INBOUND_WEBHOOK_SECRET)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if (request.headers.get("X-Inbound-Secret") or "").strip() != secret:
            return Response({"detail": "Brak autoryzacji."}, status=status.HTTP_401_UNAUTHORIZED)

        raw_from = (request.data.get("from_email") or request.data.get("from") or "").strip()
        _, parsed = parseaddr(raw_from)
        from_email_line = parsed or raw_from
        subject = (request.data.get("subject") or "").strip()
        body_plain = (request.data.get("body_plain") or request.data.get("body") or "").strip()

        note, err = process_client_inbound_email(
            from_email_raw=from_email_line or raw_from,
            subject=subject,
            body_plain=body_plain,
        )
        if err == "missing_fields":
            return Response(
                {"detail": "Wymagane: from_email (lub from), body_plain (lub body)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if err == "no_repair_number":
            return Response(
                {"detail": "Nie znaleziono numeru naprawy (PROKOM/RMA/...) w temacie lub treści."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if err == "repair_not_found":
            return Response({"detail": "Nie znaleziono naprawy."}, status=status.HTTP_404_NOT_FOUND)
        if err == "sender_mismatch":
            return Response(
                {"detail": "Adres nadawcy nie zgadza się z adresem klienta przy tej naprawie."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {"id": note.id, "repair_id": str(note.repair_id)},
            status=status.HTTP_201_CREATED,
        )
