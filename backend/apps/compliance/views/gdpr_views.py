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
                "problem_description": (r.problem_description or "")[:200],
            }
            for r in repairs[:100]
        ]
        devices = Device.objects.filter(client=client).order_by("-created_at")
        device_list = [
            {
                "category": d.get_category_display(),
                "model_name": d.model_name or (d.device_model.name if d.device_model else ""),
                "created_at": str(d.created_at),
            }
            for d in devices[:50]
        ]
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
                },
                "devices_count": devices.count(),
                "devices": device_list,
                "repairs_count": repairs.count(),
                "repairs": repair_list,
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
        from django.utils import timezone
        from apps.compliance.models import GdprRequest

        user = request.user
        if user.role != "client":
            return Response(
                {"detail": "Usunięcie konta dotyczy kont klientów."},
                status=status.HTTP_403_FORBIDDEN,
            )
        client = getattr(user, "client_profile", None)
        reason = (request.data.get("reason") or "").strip() if isinstance(request.data, dict) else ""
        gdpr = None
        if client:
            gdpr = GdprRequest.objects.create(
                client=client,
                request_type="deletion",
                status="in_progress",
                reason=reason,
            )
        if client:
            client.first_name = "Usunięty"
            client.last_name = "Konto"
            client.email = f"deleted-{client.id}@anon.local"
            client.phone = ""
            client.street = ""
            client.city = ""
            client.postal_code = ""
            client.country = ""
            client.internal_notes = ""
            client.user = None
            client.save()
        user.is_active = False
        user.save(update_fields=["is_active"])
        if gdpr:
            gdpr.status = "completed"
            gdpr.resolved_at = timezone.now()
            gdpr.handled_by = None
            gdpr.save(update_fields=["status", "resolved_at"])
        return Response(
            {"detail": "Konto zostało dezaktywowane, a dane osobowe zanonimizowane."},
            status=status.HTTP_200_OK,
        )
