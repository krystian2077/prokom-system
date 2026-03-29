"""Serializery wycen."""
from decimal import Decimal

from rest_framework import serializers
from apps.pricing.models import Quote, QuoteItem, QuoteDecision
from apps.inventory.serializers import PartListSerializer


class QuoteItemSerializer(serializers.ModelSerializer):
    part = PartListSerializer(read_only=True)
    labour_type_name = serializers.CharField(source="labour_type.name", read_only=True)
    part_origin_display = serializers.CharField(source="get_part_origin_display", read_only=True)

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
            "part_origin",
            "part_origin_display",
            "quantity",
            "parts_price",
            "labour_price",
            "unit_price",
            "total",
            "created_at",
        ]
        read_only_fields = ["unit_price", "total", "created_at"]


class QuoteItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = [
            "item_type",
            "part",
            "labour_type",
            "description",
            "part_origin",
            "quantity",
            "parts_price",
            "labour_price",
        ]

    def validate(self, attrs):
        it = attrs.get("item_type")
        if it == "part" and not attrs.get("part"):
            raise serializers.ValidationError({"part": "Wybierz część dla pozycji typu część."})
        if it == "labour" and not attrs.get("labour_type"):
            raise serializers.ValidationError({"labour_type": "Wybierz typ robocizny."})
        if attrs.get("quantity") is not None and attrs["quantity"] <= 0:
            raise serializers.ValidationError({"quantity": "Ilość musi być większa od zera."})
        parts = attrs.get("parts_price")
        labour = attrs.get("labour_price")
        if parts is None:
            parts = Decimal("0")
        if labour is None:
            labour = Decimal("0")
        if parts + labour <= 0:
            raise serializers.ValidationError(
                {"non_field_errors": "Suma ceny części i robocizny musi być większa od zera."}
            )
        return attrs


class QuoteItemUpdateSerializer(serializers.ModelSerializer):
    """Aktualizacja pozycji w wycenie (tylko szkic)."""

    class Meta:
        model = QuoteItem
        fields = [
            "item_type",
            "part",
            "labour_type",
            "description",
            "part_origin",
            "quantity",
            "parts_price",
            "labour_price",
        ]

    def validate(self, attrs):
        inst = self.instance
        it = attrs.get("item_type", inst.item_type if inst else None)
        part = attrs.get("part", inst.part if inst else None)
        labour_type = attrs.get("labour_type", inst.labour_type if inst else None)
        if it == "part" and not part:
            raise serializers.ValidationError({"part": "Wybierz część dla pozycji typu część."})
        if it == "labour" and not labour_type:
            raise serializers.ValidationError({"labour_type": "Wybierz typ robocizny."})
        qty = attrs.get("quantity", inst.quantity if inst else None)
        if qty is not None and qty <= 0:
            raise serializers.ValidationError({"quantity": "Ilość musi być większa od zera."})
        parts = attrs.get("parts_price", inst.parts_price if inst else None)
        labour = attrs.get("labour_price", inst.labour_price if inst else None)
        if parts is None:
            parts = Decimal("0")
        if labour is None:
            labour = Decimal("0")
        if parts + labour <= 0:
            raise serializers.ValidationError(
                {"non_field_errors": "Suma ceny części i robocizny musi być większa od zera."}
            )
        return attrs


class QuoteDraftUpdateSerializer(serializers.ModelSerializer):
    """Notatki i ważność — tylko wycena w szkicu."""

    class Meta:
        model = Quote
        fields = ["notes", "valid_until"]


class QuoteListSerializer(serializers.ModelSerializer):
    """Lista wycen w panelu — skrót + podsumowanie części (OEM/zamiennik)."""

    part_origin_summary = serializers.SerializerMethodField()
    items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quote
        fields = [
            "id",
            "repair",
            "version",
            "status",
            "total_amount",
            "sent_at",
            "last_client_email_sent_at",
            "items_count",
            "part_origin_summary",
            "valid_until",
            "created_at",
        ]

    def get_part_origin_summary(self, obj):
        from apps.pricing.models import PartOrigin

        items = list(obj.items.all())
        if not items:
            return "—"
        distinct = {getattr(it, "part_origin", None) for it in items}
        distinct.discard(None)
        distinct.discard("")
        if not distinct:
            return "—"
        labels = [dict(PartOrigin.choices).get(o, str(o)) for o in sorted(distinct, key=str)]
        if len(labels) == 1:
            return labels[0]
        return " · ".join(labels)


class QuoteDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteDecision
        fields = ["decision", "decided_at", "decided_by", "comment"]


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True)
    decision = QuoteDecisionSerializer(read_only=True)
    # Wersja przydzielana wyłącznie w QuoteViewSet.perform_create — inaczej domyślne modelu (1)
    # trafia do validated_data i powoduje kolizję unique (repair, version).
    version = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quote
        fields = [
            "id",
            "repair",
            "version",
            "status",
            "total_amount",
            "sent_at",
            "last_client_email_sent_at",
            "valid_until",
            "notes",
            "created_by",
            "items",
            "decision",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "version",
            "total_amount",
            "sent_at",
            "last_client_email_sent_at",
            "created_by",
            "created_at",
            "updated_at",
        ]


class ClientQuoteItemSerializer(serializers.ModelSerializer):
    """Pozycja wyceny widoczna dla klienta (bez FK wewnętrznych)."""

    part_origin_display = serializers.CharField(source="get_part_origin_display", read_only=True)
    item_type_display = serializers.CharField(source="get_item_type_display", read_only=True)

    class Meta:
        model = QuoteItem
        fields = [
            "id",
            "item_type",
            "item_type_display",
            "description",
            "part_origin",
            "part_origin_display",
            "quantity",
            "parts_price",
            "labour_price",
            "unit_price",
            "total",
        ]


class ClientVisibleQuoteSerializer(serializers.ModelSerializer):
    """Wycena wysłana / rozstrzygnięta — skrót dla panelu klienta (bez notatek wewnętrznych)."""

    items = ClientQuoteItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Quote
        fields = [
            "id",
            "version",
            "status",
            "status_display",
            "total_amount",
            "sent_at",
            "valid_until",
            "items",
        ]
