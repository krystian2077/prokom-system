"""Widoki API dla modeli urządzeń."""
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.devices.models import DeviceModel
from apps.devices.serializers import DeviceModelSerializer, DeviceModelListSerializer
from apps.devices.selectors import device_model_list


class DeviceModelViewSet(viewsets.ModelViewSet):
    """Lista i szczegóły modeli urządzeń."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["brand", "category", "is_active"]
    search_fields = ["name", "full_name", "brand__name"]
    ordering_fields = ["name", "popularity_score", "release_year"]
    ordering = ["-popularity_score"]

    def get_serializer_class(self):
        if self.action == "list":
            return DeviceModelListSerializer
        return DeviceModelSerializer

    def get_queryset(self):
        brand_id = self.request.query_params.get("brand")
        category = self.request.query_params.get("category")
        is_active = self.request.query_params.get("is_active")
        search = self.request.query_params.get("search")
        return device_model_list(
            brand_id=brand_id,
            category=category,
            is_active=bool(is_active) if is_active is not None else None,
            search=search,
            ordering=self.request.query_params.get("ordering", "-popularity_score"),
        )
