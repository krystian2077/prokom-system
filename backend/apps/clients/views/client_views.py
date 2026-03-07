"""Widoki API dla klientów."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.clients.models import Client
from apps.clients.serializers import (
    ClientSerializer,
    ClientListSerializer,
    ClientCreateUpdateSerializer,
)
from apps.clients.selectors import client_list, client_by_id


class ClientViewSet(viewsets.ModelViewSet):
    """
    Lista, tworzenie, szczegóły i edycja klientów.
    Filtry: search, is_vip, is_blacklisted.
    """
    queryset = Client.objects.filter(is_deleted=False)
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_vip", "is_blacklisted"]
    search_fields = ["first_name", "last_name", "email", "phone", "client_number"]
    ordering_fields = ["created_at", "client_number", "last_name"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ClientListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ClientCreateUpdateSerializer
        return ClientSerializer

    def get_queryset(self):
        return client_list(
            search=self.request.query_params.get("search"),
            is_vip=self.request.query_params.get("is_vip"),
            is_blacklisted=self.request.query_params.get("is_blacklisted"),
            ordering=self.request.query_params.get("ordering", "-created_at"),
        )

    def get_object(self):
        obj = client_by_id(self.kwargs["pk"])
        if obj is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Klient nie istnieje lub został usunięty.")
        return obj
