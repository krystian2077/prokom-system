"""Widoki API dostawców."""
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.inventory.models import Supplier
from apps.inventory.serializers import SupplierSerializer, SupplierListSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    """CRUD dostawców. Tylko staff/admin."""
    permission_classes = [IsStaffOrAdmin]
    queryset = Supplier.objects.all().order_by("name")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "nip", "city", "email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self):
        return SupplierListSerializer if self.action == "list" else SupplierSerializer
