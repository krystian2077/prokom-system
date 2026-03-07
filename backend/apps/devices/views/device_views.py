"""Widoki API dla urządzeń klientów."""
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.devices.models import Device
from apps.devices.serializers import DeviceSerializer, DeviceListSerializer, DeviceCreateUpdateSerializer
from apps.devices.selectors import device_list, device_by_id


class DeviceViewSet(viewsets.ModelViewSet):
    """Lista, tworzenie, szczegóły i edycja urządzeń."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["client", "category", "brand"]
    search_fields = ["model_name", "serial_number", "imei", "client__first_name", "client__last_name"]
    ordering_fields = ["created_at", "category"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return DeviceListSerializer
        if self.action in ("create", "update", "partial_update"):
            return DeviceCreateUpdateSerializer
        return DeviceSerializer

    def get_queryset(self):
        return device_list(
            client_id=self.request.query_params.get("client_id"),
            category=self.request.query_params.get("category"),
            search=self.request.query_params.get("search"),
            ordering=self.request.query_params.get("ordering", "-created_at"),
        )

    def get_object(self):
        obj = device_by_id(self.kwargs["pk"])
        if obj is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Urządzenie nie istnieje.")
        return obj
