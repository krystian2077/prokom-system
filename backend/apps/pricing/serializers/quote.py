"""Serializery wycen."""
from rest_framework import serializers
from apps.pricing.models import Quote, QuoteItem, QuoteDecision
from apps.inventory.serializers import PartListSerializer


class QuoteItemSerializer(serializers.ModelSerializer):
    part = PartListSerializer(read_only=True)
    labour_type_name = serializers.CharField(source="labour_type.name", read_only=True)

    class Meta:
        model = QuoteItem
        fields = [
            "id",
            "quote",
            "item_type",
            "part",
            "labour_type",
            "labour_type_name",
            "description",
            "quantity",
            "unit_price",
            "total",
            "created_at",
        ]
        read_only_fields = ["total", "created_at"]


class QuoteItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = [
            "item_type",
            "part",
            "labour_type",
            "description",
            "quantity",
            "unit_price",
        ]

    def validate(self, attrs):
        it = attrs.get("item_type")
        if it == "part" and not attrs.get("part"):
            raise serializers.ValidationError({"part": "Wybierz część dla pozycji typu część."})
        if it == "labour" and not attrs.get("labour_type"):
            raise serializers.ValidationError({"labour_type": "Wybierz typ robocizny."})
        if attrs.get("quantity") is not None and attrs["quantity"] <= 0:
            raise serializers.ValidationError({"quantity": "Ilość musi być większa od zera."})
        return attrs


class QuoteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            "id",
            "repair",
            "version",
            "status",
            "total_amount",
            "sent_at",
            "valid_until",
            "created_at",
        ]


class QuoteDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteDecision
        fields = ["decision", "decided_at", "decided_by", "comment"]


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True)
    decision = QuoteDecisionSerializer(read_only=True)

    class Meta:
        model = Quote
        fields = [
            "id",
            "repair",
            "version",
            "status",
            "total_amount",
            "sent_at",
            "valid_until",
            "notes",
            "created_by",
            "items",
            "decision",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["total_amount", "created_at", "updated_at"]
