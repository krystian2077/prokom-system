from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.orders.models import CustomerOrder
from apps.orders.serializers import CustomerOrderSerializer
from apps.orders.permissions import IsOrdersAdmin
from apps.orders.enums import CustomerOrderStatus


class CustomerOrderViewSet(viewsets.ModelViewSet):
    """Zamówienia klientów. Tylko admin. Akcja requires_action = lista wymagająca reakcji."""
    permission_classes = [IsOrdersAdmin]
    queryset = CustomerOrder.objects.select_related(
        "client", "product", "supplier", "created_by"
    ).order_by("-created_at")
    serializer_class = CustomerOrderSerializer
    filterset_fields = ["status", "client", "supplier", "urgent", "client_notified"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, url_path="requires-action")
    def requires_action(self, request):
        """
        Zamówienia wymagające reakcji:
        - dotarło / gotowe do odbioru, a klient niepoinformowany
        - przeterminowane (overdue)
        """
        qs = self.get_queryset().exclude(status=CustomerOrderStatus.CANCELLED)
        needs_notify = qs.filter(
            status__in=[CustomerOrderStatus.ARRIVED, CustomerOrderStatus.READY_FOR_PICKUP],
            client_notified=False,
        )
        overdue = qs.filter(overdue=True)
        combined_ids = set(needs_notify.values_list("id", flat=True)) | set(
            overdue.values_list("id", flat=True)
        )
        combined = self.get_queryset().filter(id__in=combined_ids).order_by("-created_at")[:50]
        return Response(CustomerOrderSerializer(combined, many=True).data)
