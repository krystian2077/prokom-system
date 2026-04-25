"""Serializery zarządzania pracownikami (admin only)."""
from rest_framework import serializers
from django.contrib.auth import get_user_model

from apps.accounts.models import StaffProfile, UserRole, StaffSpecialization

User = get_user_model()


class StaffListSerializer(serializers.ModelSerializer):
    """Wiersz listy pracowników: dane + statystyki + health (z context)."""
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    specialization_display = serializers.SerializerMethodField()
    staff_profile = serializers.SerializerMethodField()
    active_repairs_count = serializers.SerializerMethodField()
    completed_repairs_count = serializers.SerializerMethodField()
    health_score_level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "is_active",
            "last_login",
            "date_joined",
            "is_superadmin",
            "staff_profile",
            "active_repairs_count",
            "completed_repairs_count",
            "health_score_level",
            "specialization_display",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_specialization_display(self, obj):
        profile = getattr(obj, "staff_profile", None)
        if not profile or not profile.specialization:
            return None
        return dict(StaffSpecialization.choices).get(profile.specialization, profile.specialization)

    def get_staff_profile(self, obj):
        profile = getattr(obj, "staff_profile", None)
        if not profile:
            return None
        return {
            "specialization": profile.specialization,
            "specialization_display": dict(StaffSpecialization.choices).get(profile.specialization, profile.specialization) if profile.specialization else None,
            "calendar_color": profile.calendar_color,
            "display_name": profile.display_name,
            "is_visible_in_rankings": profile.is_visible_in_rankings,
            "is_available": profile.is_available,
            "accepts_shipment_repairs": profile.accepts_shipment_repairs,
        }

    def get_active_repairs_count(self, obj):
        stats = self.context.get("staff_stats") or {}
        return stats.get(str(obj.id), {}).get("active_repairs_count", 0)

    def get_completed_repairs_count(self, obj):
        stats = self.context.get("staff_stats") or {}
        return stats.get(str(obj.id), {}).get("completed_repairs_count", 0)

    def get_health_score_level(self, obj):
        stats = self.context.get("staff_stats") or {}
        return stats.get(str(obj.id), {}).get("health_score_level")


class StaffCreateSerializer(serializers.Serializer):
    """Tworzenie pracownika (admin/staff)."""
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[UserRole.ADMIN, UserRole.STAFF], default=UserRole.STAFF)
    # Pola profilu (dla staff)
    specialization = serializers.ChoiceField(choices=StaffSpecialization.choices, required=False, allow_blank=True)
    calendar_color = serializers.CharField(max_length=7, required=False, default="#3498db")
    display_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    is_visible_in_rankings = serializers.BooleanField(default=True, required=False)
    is_available = serializers.BooleanField(default=True, required=False)
    accepts_shipment_repairs = serializers.BooleanField(default=True, required=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Użytkownik z tym adresem e-mail już istnieje.")
        return value

    def create(self, validated_data):
        from django.db import transaction
        role = validated_data.get("role", UserRole.STAFF)
        password = validated_data.get("password")
        if not password and role == UserRole.STAFF:
            # Dla staff można wygenerować tymczasowe hasło
            from django.utils.crypto import get_random_string
            password = get_random_string(12)
        if not password:
            raise serializers.ValidationError({"password": "Hasło jest wymagane dla administratora."})
        profile_fields = ["specialization", "calendar_color", "display_name", "is_visible_in_rankings", "is_available", "accepts_shipment_repairs"]
        profile_data = {k: validated_data.pop(k) for k in profile_fields if k in validated_data}
        validated_data.pop("password", None)
        with transaction.atomic():
            if role == UserRole.STAFF:
                user = User.objects.create_staffuser(
                    email=validated_data["email"],
                    password=password,
                    first_name=validated_data["first_name"],
                    last_name=validated_data["last_name"],
                    phone=validated_data.get("phone", ""),
                )
                StaffProfile.objects.create(
                    user=user,
                    specialization=profile_data.get("specialization", ""),
                    calendar_color=profile_data.get("calendar_color", "#3498db"),
                    display_name=profile_data.get("display_name", ""),
                    is_visible_in_rankings=profile_data.get("is_visible_in_rankings", True),
                    is_available=profile_data.get("is_available", True),
                    accepts_shipment_repairs=profile_data.get("accepts_shipment_repairs", True),
                )
            else:
                user = User.objects.create_user(
                    email=validated_data["email"],
                    password=password,
                    first_name=validated_data["first_name"],
                    last_name=validated_data["last_name"],
                    role=UserRole.ADMIN,
                    is_staff=True,
                    phone=validated_data.get("phone", ""),
                )
            return user


class StaffUpdateSerializer(serializers.Serializer):
    """Aktualizacja pracownika (admin only)."""
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[UserRole.ADMIN, UserRole.STAFF], required=False)
    is_active = serializers.BooleanField(required=False)
    specialization = serializers.ChoiceField(choices=StaffSpecialization.choices, required=False, allow_blank=True)
    calendar_color = serializers.CharField(max_length=7, required=False)
    display_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    is_visible_in_rankings = serializers.BooleanField(required=False)
    is_available = serializers.BooleanField(required=False)
    accepts_shipment_repairs = serializers.BooleanField(required=False)

    def validate_email(self, value):
        if not value:
            return value
        user = self.instance
        if user and User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Użytkownik z tym adresem e-mail już istnieje.")
        return value
