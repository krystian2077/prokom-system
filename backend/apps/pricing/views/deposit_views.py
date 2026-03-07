"""Widoki API zaliczek (powiązane z naprawą)."""
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.pricing.models import Deposit
from apps.pricing.serializers import DepositSerializer, DepositCreateSerializer


class DepositViewSet(viewsets.ModelViewSet):
    """CRUD zaliczek. Filtrowanie po repair. Tylko staff/admin."""
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["repair"]

    def get_queryset(self):
        return Deposit.objects.select_related("repair", "created_by").order_by("-created_at")

    def get_serializer_class(self):
        return DepositCreateSerializer if self.action in ("create", "update", "partial_update") else DepositSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
