"""Widoki typów folii Hammer Glass."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.hammer_glass.models import HammerGlassFilmType
from apps.hammer_glass.serializers import HammerGlassFilmTypeSerializer


class HammerGlassFilmTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista typów folii (Clear, Matt, Privacy) — tylko aktywne."""
    queryset = HammerGlassFilmType.objects.filter(is_active=True)
    serializer_class = HammerGlassFilmTypeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_active"]
