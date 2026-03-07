"""Serializery ofert Hammer Glass przy naprawie."""
from rest_framework import serializers
from apps.hammer_glass.models import RepairHammerGlassOffer, HammerGlassProduct


class RepairHammerGlassOfferSerializer(serializers.ModelSerializer):
    """Oferta folii przy naprawie (odczyt)."""
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    total_price = serializers.SerializerMethodField()

    def get_total_price(self, obj):
        return obj.total_price

    class Meta:
        model = RepairHammerGlassOffer
        fields = [
            "id", "repair", "product", "product_name", "product_sku",
            "quantity", "unit_price_snapshot", "total_price",
            "offered_at", "offered_by", "accepted", "accepted_at", "note",
        ]
        read_only_fields = ["offered_at", "offered_by", "unit_price_snapshot"]


class RepairHammerGlassOfferCreateSerializer(serializers.Serializer):
    """Dodanie oferty folii do naprawy (staff)."""
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, max_value=99, default=1)
    note = serializers.CharField(required=False, allow_blank=True, max_length=200)

    def validate_product_id(self, value):
        if not HammerGlassProduct.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Produkt nie istnieje lub jest nieaktywny.")
        return value
