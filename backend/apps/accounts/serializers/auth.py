"""Serializery logowania."""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _


class LoginSerializer(serializers.Serializer):
    """Email + hasło do logowania."""
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError(_("Podaj adres e-mail i hasło."))

        user = authenticate(self.context.get("request"), username=email, password=password)
        if not user:
            raise serializers.ValidationError(_("Nieprawidłowy e-mail lub hasło."))
        if not user.is_active:
            raise serializers.ValidationError(_("Konto jest nieaktywne."))

        attrs["user"] = user
        return attrs
