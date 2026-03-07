"""Widoki szablonów wiadomości."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.communications.models import MessageTemplate
from apps.communications.serializers import MessageTemplateSerializer, MessageTemplateListSerializer


class MessageTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista i szczegóły szablonów (tylko aktywne w list)."""
    queryset = MessageTemplate.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["channel", "message_type", "suggested_for_status", "is_active"]

    def get_queryset(self):
        qs = MessageTemplate.objects.all()
        if self.action == "list" and self.request.query_params.get("active_only", "1") == "1":
            qs = qs.filter(is_active=True)
        return qs.order_by("channel", "sort_order", "name")

    def get_serializer_class(self):
        if self.action == "list":
            return MessageTemplateListSerializer
        return MessageTemplateSerializer
