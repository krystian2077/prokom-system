"""Widoki pakietów akcesoriów."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.accessories.models import AccessoryBundle
from apps.accessories.serializers.bundle import AccessoryBundleListSerializer, AccessoryBundleSerializer


class AccessoryBundleViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /accessories/bundles/ — lista; GET /accessories/bundles/<id>/ — szczegóły."""
    queryset = (
        AccessoryBundle.objects.filter(is_active=True)
        .prefetch_related("items__product")
        .order_by("sort_order", "name")
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active"]

    def get_serializer_class(self):
        if self.action == "list":
            return AccessoryBundleListSerializer
        return AccessoryBundleSerializer
