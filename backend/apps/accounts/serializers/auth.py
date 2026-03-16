"""Serializery logowania i rejestracji."""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


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
            raise serializers.ValidationError(_("Nieprawidłowy e-mail lub hasło."))

        attrs["user"] = user
        return attrs


class ClientRegisterSerializer(serializers.Serializer):
    """Rejestracja klienta — email, hasło, dane osobowe."""
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8, style={"input_type": "password"})
    first_name = serializers.CharField(max_length=150, required=True, trim_whitespace=True)
    last_name = serializers.CharField(max_length=150, required=True, trim_whitespace=True)
    phone = serializers.CharField(max_length=20, required=True, trim_whitespace=True)
    street = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    postal_code = serializers.CharField(max_length=10, required=False, allow_blank=True, default="")

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(_("Konto z tym adresem e-mail już istnieje. Zaloguj się."))
        return email

    def validate_phone(self, value):
        if value:
            from apps.common.validators import validate_polish_phone
            try:
                validate_polish_phone(value)
            except Exception as e:
                raise serializers.ValidationError(str(e))
        return value.strip()
