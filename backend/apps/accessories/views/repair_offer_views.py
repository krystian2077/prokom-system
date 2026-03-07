"""Widoki ofert akcesoriów przy naprawie."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.accessories.models import RepairAccessoryOffer, AccessoryProduct
from apps.accessories.serializers import (
    RepairAccessoryOfferSerializer,
    RepairAccessoryOfferCreateSerializer,
)


class RepairAccessoryOfferViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Oferty akcesoriów powiązane z naprawą.
    Lista: ?repair=<uuid>
    Tworzenie: POST z product_id, quantity, note (w kontekście naprawy).
    """
    serializer_class = RepairAccessoryOfferSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["repair", "accepted"]

    def get_queryset(self):
        return RepairAccessoryOffer.objects.select_related(
            "repair", "product", "offered_by"
        ).order_by("-offered_at")

    @action(detail=False, methods=["post"], url_path="for-repair/(?P<repair_id>[0-9a-f-]+)")
    def for_repair(self, request, repair_id=None):
        """Dodaj ofertę akcesorium do naprawy (staff)."""
        from apps.repairs.models import RepairRequest
        ser = RepairAccessoryOfferCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            repair = RepairRequest.objects.get(pk=repair_id)
        except RepairRequest.DoesNotExist:
            return Response(
                {"detail": "Nie znaleziono naprawy."},
                status=status.HTTP_404_NOT_FOUND,
            )
        product = AccessoryProduct.objects.get(id=ser.validated_data["product_id"])
        offer = RepairAccessoryOffer.objects.create(
            repair=repair,
            product=product,
            quantity=ser.validated_data["quantity"],
            unit_price_snapshot=product.price,
            offered_by=request.user,
            note=ser.validated_data.get("note", ""),
        )
        return Response(
            RepairAccessoryOfferSerializer(offer).data,
            status=status.HTTP_201_CREATED,
        )
