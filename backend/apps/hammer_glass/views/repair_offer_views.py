"""Widoki ofert Hammer Glass przy naprawie."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.hammer_glass.models import RepairHammerGlassOffer, HammerGlassProduct
from apps.hammer_glass.serializers import (
    RepairHammerGlassOfferSerializer,
    RepairHammerGlassOfferCreateSerializer,
)


class RepairHammerGlassOfferViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Oferty Hammer Glass powiązane z naprawą.
    Lista: ?repair=<uuid>
    Tworzenie: POST for-repair/<repair_id>/ z product_id, quantity, note.
    """
    serializer_class = RepairHammerGlassOfferSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["repair", "accepted"]

    def get_queryset(self):
        return RepairHammerGlassOffer.objects.select_related(
            "repair", "product", "offered_by"
        ).order_by("-offered_at")

    @action(detail=False, methods=["post"], url_path="for-repair/(?P<repair_id>[0-9a-f-]+)")
    def for_repair(self, request, repair_id=None):
        """Dodaj ofertę folii do naprawy (staff)."""
        from apps.repairs.models import RepairRequest
        ser = RepairHammerGlassOfferCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            repair = RepairRequest.objects.get(pk=repair_id)
        except RepairRequest.DoesNotExist:
            return Response(
                {"detail": "Nie znaleziono naprawy."},
                status=status.HTTP_404_NOT_FOUND,
            )
        product = HammerGlassProduct.objects.get(id=ser.validated_data["product_id"])
        offer = RepairHammerGlassOffer.objects.create(
            repair=repair,
            product=product,
            quantity=ser.validated_data["quantity"],
            unit_price_snapshot=product.price,
            offered_by=request.user,
            note=ser.validated_data.get("note", ""),
        )
        return Response(
            RepairHammerGlassOfferSerializer(offer).data,
            status=status.HTTP_201_CREATED,
        )
