"""
PRO-KOM Serwis — Śledzenie naprawy bez logowania (gość) + przypisanie po tokenie / kodzie SMS
==============================================================================================
Track: GET /api/v1/repairs/track/?ref=...&phone_last4=...
Claim: POST /api/v1/repairs/claim/ Body: { "token": "..." } — wymaga auth.
RequestClaimCode: POST /api/v1/repairs/request-claim-code/ Body: { "repair_number": "..." } — wysyła SMS.
ConfirmClaimByCode: POST /api/v1/repairs/confirm-claim-by-code/ Body: { "repair_number", "code" } — przypisuje.
"""
import secrets
from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.repairs.models import RepairRequest, RepairClaimSmsCode
from apps.common.utils import get_public_repair_status
from apps.common.permissions import get_client_for_user
from apps.communications.services.send import send_sms


def _phone_last4(phone):
    if not phone:
        return ""
    digits = "".join(c for c in str(phone) if c.isdigit())
    return digits[-4:] if len(digits) >= 4 else digits


class TrackRepairView(APIView):
    """
    GET /api/v1/repairs/track/?ref=PROKOM/RMA/1/2025&phone_last4=1234
    Zwraca: repair_number, status (publiczny), accepted_at, estimated_completion_date, estimated_duration.
    """
    permission_classes = [AllowAny]
    throttle_scope = "public_track"

    def get(self, request):
        ref = (request.query_params.get("ref") or "").strip()
        phone_last4 = (request.query_params.get("phone_last4") or "").strip()
        phone_last4 = "".join(c for c in phone_last4 if c.isdigit())[-4:]

        if not ref or len(phone_last4) != 4:
            return Response(
                {"detail": "Podaj numer zgłoszenia (ref) i ostatnie 4 cyfry numeru telefonu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        repair = RepairRequest.objects.filter(repair_number=ref).select_related("client").first()
        if not repair:
            return Response(
                {"detail": "Nie znaleziono zgłoszenia lub nieprawidłowe dane."},
                status=status.HTTP_404_NOT_FOUND,
            )

        client_phone_last4 = _phone_last4(repair.client.phone)
        if client_phone_last4 != phone_last4:
            return Response(
                {"detail": "Nie znaleziono zgłoszenia lub nieprawidłowe dane."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "repair_number": repair.repair_number,
                "status": get_public_repair_status(repair.status),
                "accepted_at": repair.accepted_at.isoformat() if repair.accepted_at else None,
                "estimated_completion_date": repair.estimated_completion_date.isoformat() if repair.estimated_completion_date else None,
                "estimated_duration": repair.get_estimated_duration_display() or None,
            },
            status=status.HTTP_200_OK,
        )


class ClaimRepairByTokenView(APIView):
    """
    POST /api/v1/repairs/claim/
    Body: { "token": "..." }
    Wymaga zalogowanego klienta. Przypisuje naprawę gościnną (token ważny 7 dni) do konta. Token jednorazowy.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = (request.data.get("token") or "").strip()
        if not token:
            return Response(
                {"detail": "Podaj token przypisania."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_client = get_client_for_user(request.user)
        if not user_client:
            return Response(
                {"detail": "Brak profilu klienta. Skontaktuj się z serwisem."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        repair = RepairRequest.objects.filter(claim_token=token).select_related("client", "device").first()
        if not repair:
            return Response(
                {"detail": "Nieprawidłowy lub wykorzystany token."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if repair.claim_token_expires_at and timezone.now() >= repair.claim_token_expires_at:
            return Response(
                {"detail": "Token wygasł. Poproś o nowy link w wiadomości e-mail."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if repair.client.user_id is not None:
            return Response(
                {"detail": "Naprawa jest już przypisana do konta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        repair.client = user_client
        repair.device.client = user_client
        repair.claim_token = None
        repair.claim_token_expires_at = None
        repair.save(update_fields=["client", "claim_token", "claim_token_expires_at"])
        repair.device.save(update_fields=["client"])
        return Response(
            {"repair_number": repair.repair_number, "message": "Naprawa została przypisana do Twojego konta."},
            status=status.HTTP_200_OK,
        )


def _assign_repair_to_user_client(repair, user_client):
    """Przenosi naprawę (i urządzenie) do client_profile użytkownika, czyści claim_token."""
    repair.client = user_client
    repair.device.client = user_client
    repair.claim_token = None
    repair.claim_token_expires_at = None
    repair.save(update_fields=["client", "claim_token", "claim_token_expires_at"])
    repair.device.save(update_fields=["client"])


class RequestClaimCodeView(APIView):
    """
    POST /api/v1/repairs/request-claim-code/
    Body: { "repair_number": "..." }
    Wymaga zalogowanego klienta (zweryfikowanego). Wysyła jednorazowy kod SMS na telefon z zgłoszenia.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.accounts.models import User
        if not getattr(request.user, "email_verified", True):
            return Response(
                {"detail": "Zweryfikuj adres e-mail, aby przypisać naprawę."},
                status=status.HTTP_403_FORBIDDEN,
            )
        repair_number = (request.data.get("repair_number") or "").strip()
        if not repair_number:
            return Response(
                {"detail": "Podaj numer zgłoszenia."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        repair = RepairRequest.objects.filter(
            repair_number=repair_number,
            client__user__isnull=True,
        ).select_related("client").first()
        if not repair:
            return Response(
                {"detail": "Nie znaleziono zgłoszenia lub jest już przypisane do konta."},
                status=status.HTTP_404_NOT_FOUND,
            )
        phone = (repair.client.phone or "").strip()
        if not phone:
            return Response(
                {"detail": "W zgłoszeniu nie podano numeru telefonu."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        RepairClaimSmsCode.objects.filter(repair=repair).delete()
        code = "".join(str(secrets.randbelow(10)) for _ in range(6))
        expires_at = timezone.now() + timedelta(minutes=10)
        RepairClaimSmsCode.objects.create(repair=repair, code=code, expires_at=expires_at)
        send_sms(phone, f"Kod przypisania naprawy PRO-KOM: {code}. Ważny 10 min.")
        return Response(
            {"message": "Kod został wysłany na numer podany w zgłoszeniu."},
            status=status.HTTP_200_OK,
        )


class ConfirmClaimByCodeView(APIView):
    """
    POST /api/v1/repairs/confirm-claim-by-code/
    Body: { "repair_number": "...", "code": "123456" }
    Wymaga zalogowanego klienta. Przypisuje naprawę po poprawnym kodzie SMS.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not getattr(request.user, "email_verified", True):
            return Response(
                {"detail": "Zweryfikuj adres e-mail, aby przypisać naprawę."},
                status=status.HTTP_403_FORBIDDEN,
            )
        repair_number = (request.data.get("repair_number") or "").strip()
        code = (request.data.get("code") or "").strip().replace(" ", "")
        if not repair_number or len(code) != 6:
            return Response(
                {"detail": "Podaj numer zgłoszenia i 6-cyfrowy kod z SMS."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_client = get_client_for_user(request.user)
        if not user_client:
            return Response(
                {"detail": "Brak profilu klienta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sms_code = RepairClaimSmsCode.objects.filter(
            repair__repair_number=repair_number,
            code=code,
        ).select_related("repair", "repair__device").first()
        if not sms_code or timezone.now() >= sms_code.expires_at:
            return Response(
                {"detail": "Nieprawidłowy lub wygasły kod. Wyślij nowy."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        repair = sms_code.repair
        if repair.client.user_id is not None:
            sms_code.delete()
            return Response(
                {"detail": "Naprawa jest już przypisana do konta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _assign_repair_to_user_client(repair, user_client)
        sms_code.delete()
        return Response(
            {"repair_number": repair.repair_number, "message": "Naprawa została przypisana do Twojego konta."},
            status=status.HTTP_200_OK,
        )
