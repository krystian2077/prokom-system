"""Serializery ankiety satysfakcji."""
from rest_framework import serializers
from apps.repairs.models import SatisfactionSurvey


class SatisfactionSurveySubmitSerializer(serializers.ModelSerializer):
    """Wysłanie ankiety po naprawie (klient)."""
    class Meta:
        model = SatisfactionSurvey
        fields = ["repair", "rating", "would_recommend", "comment"]

    def validate_repair(self, value):
        from apps.repairs.models import RepairRequest
        if not isinstance(value, RepairRequest):
            try:
                value = RepairRequest.objects.get(pk=value)
            except (RepairRequest.DoesNotExist, TypeError, ValueError):
                raise serializers.ValidationError("Nie znaleziono naprawy.")
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("Wymagane zalogowanie.")
        if getattr(request.user, "role", None) != "client":
            raise serializers.ValidationError("Tylko klient może wypełnić ankietę.")
        from apps.common.enums import RepairStatus
        if value.status not in (RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED):
            raise serializers.ValidationError("Ankietę można wypełnić po odebraniu naprawy.")
        if SatisfactionSurvey.objects.filter(repair=value).exists():
            raise serializers.ValidationError("Ankieta dla tej naprawy została już wysłana.")
        client = getattr(request.user, "client_profile", None)
        if not client or value.client_id != client.id:
            raise serializers.ValidationError("To nie Twoja naprawa.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        client = request.user.client_profile
        return SatisfactionSurvey.objects.create(
            client=client,
            **validated_data,
        )
