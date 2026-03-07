"""Wysyłka wiadomości z szablonu do naprawy."""
from rest_framework import views, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.communications.models import MessageTemplate
from apps.communications.serializers import CommunicationLogSerializer
from apps.communications.services import send_template_to_repair


class SendMessageAction(views.APIView):
    """
    POST: Wyślij wiadomość z szablonu do klienta powiązanego z naprawą.
    Body: { "template_id": <id>, "repair_id": "<uuid>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        template_id = request.data.get("template_id")
        repair_id = request.data.get("repair_id")
        if not template_id or not repair_id:
            return Response(
                {"detail": "Wymagane: template_id i repair_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            template = MessageTemplate.objects.get(pk=template_id, is_active=True)
        except MessageTemplate.DoesNotExist:
            return Response(
                {"detail": "Nie znaleziono szablonu."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            from apps.repairs.models import RepairRequest
            repair = RepairRequest.objects.get(pk=repair_id)
        except RepairRequest.DoesNotExist:
            return Response(
                {"detail": "Nie znaleziono naprawy."},
                status=status.HTTP_404_NOT_FOUND,
            )
        log, success = send_template_to_repair(template, repair, sent_by=request.user)
        return Response(
            {
                "log": CommunicationLogSerializer(log).data,
                "success": success,
            },
            status=status.HTTP_201_CREATED if success else status.HTTP_200_OK,
        )
