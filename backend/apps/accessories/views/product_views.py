"""Widoki produktów akcesoriów."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.accessories.models import AccessoryProduct
from apps.accessories.serializers import AccessoryProductSerializer, AccessoryProductListSerializer


class AccessoryProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista produktów akcesoriów (tylko aktywne)."""
    queryset = AccessoryProduct.objects.filter(is_active=True).select_related("category")
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category", "category__slug"]

    def get_serializer_class(self):
        if self.action == "list":
            return AccessoryProductListSerializer
        return AccessoryProductSerializer
