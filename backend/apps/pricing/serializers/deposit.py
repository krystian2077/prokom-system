"""Serializery zaliczek."""
from rest_framework import serializers
from apps.pricing.models import Deposit


class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = [
            "id",
            "repair",
            "amount",
            "paid_at",
            "notes",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


class DepositCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = ["amount", "paid_at", "notes"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Kwota musi być większa od zera.")
        return value
