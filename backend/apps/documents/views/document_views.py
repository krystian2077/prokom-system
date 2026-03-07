"""Widoki generowania dokumentów (PDF, QR)."""
from django.http import HttpResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.repairs.models import RepairRequest
from apps.documents.services import build_acceptance_protocol_pdf, build_repair_qr_image


class AcceptanceProtocolPDFView(APIView):
    """
    GET /api/v1/documents/repair/<repair_id>/acceptance-protocol/
    Zwraca PDF protokołu przyjęcia (do wydruku A4).
    Dostęp: staff/admin lub klient będący właścicielem naprawy.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, repair_id):
        try:
            repair = RepairRequest.objects.select_related("client", "device").get(pk=repair_id)
        except RepairRequest.DoesNotExist:
            return Response({"detail": "Nie znaleziono naprawy."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role not in ("staff", "admin"):
            if not getattr(repair.client, "user_id", None) or repair.client.user_id != request.user.id:
                return Response({"detail": "Brak uprawnień."}, status=status.HTTP_403_FORBIDDEN)
        pdf_bytes = build_acceptance_protocol_pdf(repair, request=request)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="protokol-przyjecia-{repair.repair_number}.pdf"'
        return response


class RepairQRView(APIView):
    """
    GET /api/v1/documents/repair/<repair_id>/qr/?url=<encoded_url>
    Zwraca obrazek PNG z kodem QR (np. link do statusu naprawy).
    Opcjonalny query: url=... (jeśli brak, generuje placeholder tekst).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, repair_id):
        try:
            repair = RepairRequest.objects.get(pk=repair_id)
        except RepairRequest.DoesNotExist:
            return Response({"detail": "Nie znaleziono naprawy."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role not in ("staff", "admin"):
            if not getattr(repair.client, "user_id", None) or repair.client.user_id != request.user.id:
                return Response({"detail": "Brak uprawnień."}, status=status.HTTP_403_FORBIDDEN)
        url = request.query_params.get("url") or f"Naprawa {repair.repair_number}"
        qr_bytes = build_repair_qr_image(url, size_px=200)
        return HttpResponse(qr_bytes, content_type="image/png")
