"""Widoki API typów robocizny."""
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.pricing.models import LabourType
from apps.pricing.serializers import LabourTypeSerializer, LabourTypeListSerializer


class LabourTypeViewSet(viewsets.ModelViewSet):
    """CRUD typów robocizny. Tylko staff/admin."""
    permission_classes = [IsStaffOrAdmin]
    queryset = LabourType.objects.all().order_by("name")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "default_price", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self):
        return LabourTypeListSerializer if self.action == "list" else LabourTypeSerializer
