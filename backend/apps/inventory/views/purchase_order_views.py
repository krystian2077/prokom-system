"""Widoki API zamówień zakupu."""
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.inventory.models import PurchaseOrder
from apps.inventory.serializers import PurchaseOrderSerializer, PurchaseOrderListSerializer


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """CRUD zamówień zakupu. Tylko staff/admin."""
    permission_classes = [IsStaffOrAdmin]
    queryset = PurchaseOrder.objects.select_related("supplier", "created_by").prefetch_related("items", "items__part").order_by("-created_at")
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["supplier", "status"]
    ordering_fields = ["created_at", "ordered_at", "order_number"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        return PurchaseOrderListSerializer if self.action == "list" else PurchaseOrderSerializer
