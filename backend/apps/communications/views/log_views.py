"""Widoki logu komunikacji (historia przy naprawie)."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.communications.models import CommunicationLog
from apps.communications.serializers import CommunicationLogSerializer
from apps.common.permissions import IsStaffOrAdmin


class CommunicationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Historia wysłanych wiadomości; filtrowanie po repair, channel."""
    queryset = CommunicationLog.objects.select_related("repair", "template", "sent_by").order_by("-sent_at")
    serializer_class = CommunicationLogSerializer
    permission_classes = [IsStaffOrAdmin, IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["repair", "channel", "status"]

    def get_queryset(self):
        qs = super().get_queryset()
        role = getattr(self.request.user, "role", None)
        if role == "staff":
            return qs.filter(repair__assigned_to_id=self.request.user.id)
        return qs
