"""Widok kolejki części (do zamówienia / zamówione / dotarły / niewykorzystane)."""
from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination

from apps.common.permissions import IsStaffOrAdmin
from apps.inventory.serializers import PartUsageSerializer
from apps.inventory.selectors import parts_queue


class PartsQueuePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class PartsQueueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Lista kolejki części (tylko list). Paginacja 50 na stronę.
    GET /api/v1/inventory/parts-queue/?status=ordered|arrived|used|unused&assigned_to=<user_id>
    """
    permission_classes = [IsStaffOrAdmin]
    serializer_class = PartUsageSerializer
    pagination_class = PartsQueuePagination
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        status = self.request.query_params.get("status")
        assigned_to = self.request.query_params.get("assigned_to")
        return parts_queue(status=status, assigned_to=assigned_to)
