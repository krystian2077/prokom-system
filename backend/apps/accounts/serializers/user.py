"""Serializery użytkownika (do endpointu me)."""
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Dane bieżącego użytkownika (bez hasła, z rolami)."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "is_active",
            "is_staff",
            "email_verified",
            "date_joined",
            "last_login",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserSelfUpdateSerializer(serializers.ModelSerializer):
    """Aktualizacja własnego profilu (bez e-maila i roli)."""

    class Meta:
        model = User
        fields = ("first_name", "last_name", "phone")
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
            "phone": {"required": False, "allow_blank": True},
        }
