"""Widoki API wycen (powiązane z naprawą)."""
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.pricing.models import Quote, QuoteItem, QuoteStatus
from apps.pricing.serializers import (
    QuoteSerializer,
    QuoteListSerializer,
    QuoteItemSerializer,
    QuoteItemCreateSerializer,
)
from apps.pricing.services import create_quote_version_snapshot


class QuoteViewSet(viewsets.ModelViewSet):
    """CRUD wycen. Filtrowanie po repair. Tylko staff/admin."""
    permission_classes = [IsStaffOrAdmin]
    serializer_class = QuoteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["repair", "status"]

    def get_queryset(self):
        return Quote.objects.select_related("repair", "created_by").prefetch_related("items", "items__part", "items__labour_type").order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "list":
            return QuoteListSerializer
        return QuoteSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="items")
    def add_item(self, request, pk=None):
        """POST /api/v1/pricing/quotes/<id>/items/ — dodaj pozycję do wyceny."""
        quote = self.get_object()
        ser = QuoteItemCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        QuoteItem.objects.create(quote=quote, **ser.validated_data)
        return Response(QuoteSerializer(quote).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="send")
    def send_quote(self, request, pk=None):
        """POST /api/v1/pricing/quotes/<id>/send/ — oznacz wycenę jako wysłaną i utwórz snapshot wersji."""
        quote = self.get_object()
        if quote.status != QuoteStatus.DRAFT:
            return Response(
                {"detail": "Można wysłać tylko wycenę w statusie szkic."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        quote.status = QuoteStatus.SENT
        quote.sent_at = timezone.now()
        quote.save(update_fields=["status", "sent_at"])
        create_quote_version_snapshot(quote, created_by_id=request.user.id)
        # Ustaw status naprawy na "wycena wysłana" i wywołaj powiadomienia (NotificationRule)
        from apps.common.enums import RepairStatus
        from apps.repairs.services import change_repair_status
        repair = quote.repair
        if repair.status != RepairStatus.QUOTE_SENT:
            change_repair_status(
                repair,
                new_status=RepairStatus.QUOTE_SENT,
                changed_by_id=request.user.id,
                notes="Wycena wysłana do klienta.",
            )
        from apps.communications.tasks import send_notification_for_repair_event
        send_notification_for_repair_event.delay(
            str(repair.id),
            "quote_sent",
            sent_by_id=request.user.id,
        )
        return Response(QuoteSerializer(quote).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="versions")
    def list_versions(self, request, pk=None):
        """GET /api/v1/pricing/quotes/<id>/versions/ — historia wersji wyceny (snapshots)."""
        quote = self.get_object()
        versions = quote.versions.select_related("created_by").order_by("-version_number")
        data = [
            {
                "id": v.id,
                "version_number": v.version_number,
                "total_amount": str(v.total_amount),
                "items_snapshot": v.items_snapshot,
                "created_at": v.created_at,
                "created_by_id": str(v.created_by_id) if v.created_by_id else None,
                "created_by_email": v.created_by.email if v.created_by else None,
            }
            for v in versions
        ]
        return Response(data)
