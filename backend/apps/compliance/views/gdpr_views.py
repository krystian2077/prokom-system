"""
RODO: eksport danych osobowych (art. 15) i prawo do usunięcia (art. 17).
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class ExportMyDataView(APIView):
    """
    GET /api/v1/compliance/export-my-data/
    Zwraca dane użytkownika (klienta) w formacie JSON — prawo do przenoszenia / dostęp (RODO art. 15).
    Dostęp: zalogowany użytkownik (własne dane).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "client":
            return Response(
                {"detail": "Eksport dotyczy kont klientów."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not getattr(user, "email_verified", False):  # audit AB4
            return Response({"detail": "Najpierw potwierdź adres e-mail."}, status=status.HTTP_403_FORBIDDEN)
        client = getattr(user, "client_profile", None)
        if not client:
            return Response(
                {
                    "user": {
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "date_joined": str(user.date_joined),
                    },
                    "client_profile": None,
                    "message": "Brak powiązanego profilu klienta.",
                },
                status=status.HTTP_200_OK,
            )
        from apps.clients.models import Client
        from apps.devices.models import Device
        from apps.repairs.models import RepairRequest

        repairs = RepairRequest.objects.filter(client=client).order_by("-created_at")
        repair_list = [
            {
                "repair_number": r.repair_number,
                "status": r.get_status_display(),
                "created_at": str(r.created_at),
                "problem_description": r.problem_description or "",
                "contact_phone": r.contact_phone,
                "client_notes": r.client_notes,
                "visual_condition_description": r.visual_condition_description,
            }
            for r in repairs
        ]
        devices = Device.objects.filter(client=client).select_related("device_model").order_by("-created_at")
        device_list = [
            {
                "category": d.get_category_display(),
                "model_name": d.model_name or (d.device_model.name if d.device_model else ""),
                "serial_number": d.serial_number,
                "imei": d.imei,
                "created_at": str(d.created_at),
            }
            for d in devices
        ]
        addresses = list(
            client.addresses.values("label", "street", "house_number", "city", "postal_code", "country", "phone")
        )
        consents = list(
            client.consents.values("consent_type", "is_granted", "granted_at", "created_at")
        )
        return Response(
            {
                "user": {
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone": user.phone,
                    "date_joined": str(user.date_joined),
                },
                "client": {
                    "client_number": client.client_number,
                    "first_name": client.first_name,
                    "last_name": client.last_name,
                    "email": client.email,
                    "phone": client.phone,
                    "street": client.street,
                    "city": client.city,
                    "postal_code": client.postal_code,
                    "country": client.country,
                    "company_name": client.company_name,
                    "nip": client.nip,
                    "company_email": client.company_email,
                    "company_phone": client.company_phone,
                },
                "devices_count": devices.count(),
                "devices": device_list,
                "repairs_count": repairs.count(),
                "repairs": repair_list,
                "addresses": addresses,
                "consents": consents,
            },
            status=status.HTTP_200_OK,
        )


class RequestAccountDeletionView(APIView):
    """
    POST /api/v1/compliance/request-account-deletion/
    Żądanie usunięcia konta i danych osobowych (RODO art. 17).
    Rejestruje wniosek w GdprRequest, potem anonimizuje profil i dezaktywuje konto.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.db import transaction
        from django.utils import timezone
        from apps.compliance.models import GdprRequest
        from apps.compliance.services.anonymize import anonymize_client, anonymize_user

        user = request.user
        if user.role != "client":
            return Response(
                {"detail": "Usunięcie konta dotyczy kont klientów."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not getattr(user, "email_verified", False):  # audit AB4
            return Response({"detail": "Najpierw potwierdź adres e-mail."}, status=status.HTTP_403_FORBIDDEN)
        # Re-authenticate before an irreversible action (audit T-18).
        # Accounts created via Google have no usable password; they are already verified by Google.
        if user.has_usable_password():
            password = request.data.get("password") if isinstance(request.data, dict) else None
            if not password or not user.check_password(password):
                return Response(
                    {"detail": "Podaj aktualne hasło, aby usunąć konto."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        client = getattr(user, "client_profile", None)
        reason = (request.data.get("reason") or "").strip() if isinstance(request.data, dict) else ""
        with transaction.atomic():
            # Lock the account row: two parallel requests must not both run (review P6).
            user = type(user).objects.select_for_update().get(pk=user.pk)
            if not user.is_active:
                return Response({"detail": "Konto jest już usunięte."}, status=status.HTTP_409_CONFLICT)
            gdpr = None
            if client:
                gdpr = GdprRequest.objects.create(
                    client=client,
                    request_type="deletion",
                    status="in_progress",
                    reason=reason[:1000],
                )
                anonymize_client(client)
            anonymize_user(user)
            if gdpr:
                gdpr.status = "completed"
                gdpr.resolved_at = timezone.now()
                gdpr.handled_by = None
                gdpr.save(update_fields=["status", "resolved_at"])
        return Response(
            {"detail": "Konto zostało dezaktywowane, a dane osobowe zanonimizowane."},
            status=status.HTTP_200_OK,
        )
