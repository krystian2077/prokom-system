"""Widoki API dla marek."""
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.devices.models import Brand
from apps.devices.serializers import BrandSerializer, BrandListSerializer
from apps.devices.selectors import brand_list


class BrandViewSet(viewsets.ModelViewSet):
    """Lista i szczegóły marek (read-only dla listy, pełna edycja w adminie)."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "slug"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action == "list":
            return BrandListSerializer
        return BrandSerializer

    def get_queryset(self):
        return brand_list(
            is_active=self.request.query_params.get("is_active"),
            ordering=self.request.query_params.get("ordering", "name"),
        )
