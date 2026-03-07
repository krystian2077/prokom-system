"""Widoki API wycen (powiązane z naprawą)."""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.pricing.models import Quote, QuoteItem
from apps.pricing.serializers import (
    QuoteSerializer,
    QuoteListSerializer,
    QuoteItemSerializer,
    QuoteItemCreateSerializer,
)


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
