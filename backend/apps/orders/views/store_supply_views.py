from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend

from apps.orders.models import StoreSupplyOrder
from apps.orders.serializers import StoreSupplyOrderSerializer
from apps.orders.permissions import IsOrdersAdmin


class StoreSupplyOrderViewSet(viewsets.ModelViewSet):
    """Zaopatrzenie sklepu. Tylko admin."""
    permission_classes = [IsOrdersAdmin]
    queryset = StoreSupplyOrder.objects.select_related(
        "product", "supplier", "created_by"
    ).order_by("-created_at")
    serializer_class = StoreSupplyOrderSerializer
    filterset_fields = ["status", "priority", "product", "supplier"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
