"""Widoki logu komunikacji (historia przy naprawie)."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.communications.models import CommunicationLog
from apps.communications.serializers import CommunicationLogSerializer


class CommunicationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Historia wysłanych wiadomości; filtrowanie po repair, channel."""
    queryset = CommunicationLog.objects.select_related("repair", "template", "sent_by").order_by("-sent_at")
    serializer_class = CommunicationLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["repair", "channel", "status"]
