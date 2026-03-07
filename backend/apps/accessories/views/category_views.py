"""Widoki kategorii akcesoriów."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.accessories.models import AccessoryCategory
from apps.accessories.serializers import AccessoryCategorySerializer


class AccessoryCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista kategorii akcesoriów (tylko aktywne)."""
    queryset = AccessoryCategory.objects.filter(is_active=True)
    serializer_class = AccessoryCategorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_active"]
    search_fields = ["name"]
