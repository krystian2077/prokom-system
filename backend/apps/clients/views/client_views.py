"""Widoki API dla klientów."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.clients.models import Client
from apps.common.permissions import IsStaffOrAdmin
from apps.clients.serializers import (
    ClientSerializer,
    ClientListSerializer,
    ClientCreateUpdateSerializer,
)
from apps.clients.serializers.premium_card import build_premium_card_data
from apps.clients.selectors import client_list, client_by_id, client_search


class ClientViewSet(viewsets.ModelViewSet):
    """
    Lista, tworzenie, szczegóły i edycja klientów.
    Filtry: search, is_vip, is_blacklisted, client_type, client_segment.
    """
    permission_classes = [IsStaffOrAdmin]
    queryset = Client.objects.all()  # type: ignore[attr-defined]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_vip", "is_blacklisted", "client_type", "client_segment"]
    search_fields = [
        "first_name", "last_name", "email", "phone", "client_number", "company_name",
    ]
    ordering_fields = ["created_at", "client_number", "last_name", "visit_count", "last_visit_at"]
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
            client_type=self.request.query_params.get("client_type"),
            client_segment=self.request.query_params.get("client_segment"),
            ordering=self.request.query_params.get("ordering", "-created_at"),
        )

    def get_object(self):
        obj = client_by_id(self.kwargs["pk"])
        if obj is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Klient nie istnieje lub został usunięty.")
        return obj

    def destroy(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != "admin":
            raise PermissionDenied("Tylko administrator może usuwać klientów.")
        client = self.get_object()
        client.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="premium-card")
    def premium_card(self, request, pk=None):
        """
        GET /api/v1/clients/<id>/premium-card/
        Karta klienta premium: dane klienta, historia napraw, urządzenia,
        reklamacje/gwarancje, notatki, badge (klient wraca / stały).
        Dostęp: staff, admin.
        """
        client = self.get_object()
        data = build_premium_card_data(client, request=request)
        return Response(data, status=200)

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """
        GET /api/v1/clients/search/?q=...
        Wyszukiwanie klientów po telefonie, nazwisku, e-mailu (do „klient wraca”).
        Zwraca krótką listę dopasowań. Dostęp: staff, admin.
        """
        q = request.query_params.get("q", "").strip()
        limit = min(int(request.query_params.get("limit", 20)), 50)
        clients = client_search(q, limit=limit)
        return Response(
            ClientListSerializer(clients, many=True).data,
            status=200,
        )
