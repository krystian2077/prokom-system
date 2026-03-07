"""Widoki produktów Hammer Glass."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.hammer_glass.models import HammerGlassProduct
from apps.hammer_glass.serializers import HammerGlassProductSerializer, HammerGlassProductListSerializer


class HammerGlassProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista produktów Hammer Glass (tylko aktywne)."""
    queryset = HammerGlassProduct.objects.filter(is_active=True).select_related("film_type")
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["film_type", "film_type__slug"]

    def get_serializer_class(self):
        if self.action == "list":
            return HammerGlassProductListSerializer
        return HammerGlassProductSerializer
