"""Widoki API części."""
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.inventory.models import Part
from apps.inventory.serializers import PartSerializer, PartListSerializer


class PartViewSet(viewsets.ModelViewSet):
    """CRUD części. Tylko staff/admin."""
    permission_classes = [IsStaffOrAdmin]
    queryset = Part.objects.select_related("supplier").order_by("name")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active", "supplier", "category"]
    search_fields = ["name", "code", "category"]
    ordering_fields = ["name", "code", "sell_price", "quantity_in_stock", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self):
        return PartListSerializer if self.action == "list" else PartSerializer
