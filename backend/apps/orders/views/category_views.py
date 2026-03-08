from rest_framework import viewsets
from apps.orders.models import OrderProductCategory
from apps.orders.serializers import OrderProductCategorySerializer
from apps.orders.permissions import IsOrdersAdmin


class OrderProductCategoryViewSet(viewsets.ModelViewSet):
    """Kategorie produktów (zamówienia). Tylko admin."""
    permission_classes = [IsOrdersAdmin]
    queryset = OrderProductCategory.objects.order_by("sort_order", "name")
    serializer_class = OrderProductCategorySerializer
    filterset_fields = ["is_active"]
