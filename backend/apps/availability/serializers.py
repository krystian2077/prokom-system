"""Serializery dostępności pracowników."""

from rest_framework import serializers

from .models import EmployeeAvailability, EmployeeAbsenceRequest
from .enums import AvailabilityType


class EmployeeAvailabilitySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    availability_type_display = serializers.CharField(source="get_availability_type_display", read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeAvailability
        extra_kwargs = {"employee": {"required": False}}
        fields = [
            "id", "employee", "employee_name", "availability_type", "availability_type_display",
            "date", "is_all_day", "start_time", "end_time", "note",
            "created_by", "created_by_name", "updated_by", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_employee_name(self, obj):
        if obj.employee:
            return obj.employee.get_full_name() or obj.employee.email
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None

    def validate_employee(self, value):
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) != "admin" and value and value != request.user:
            raise serializers.ValidationError("Możesz dodawać wpisy tylko dla siebie.")
        return value

    def validate(self, data):
        request = self.context.get("request")
        if not self.instance and request and getattr(request.user, "role", None) == "admin" and not data.get("employee"):
            raise serializers.ValidationError({"employee": "Administrator musi wskazać pracownika."})
        if not data.get("is_all_day") and (not data.get("start_time") or not data.get("end_time")):
            raise serializers.ValidationError(
                {"start_time": "Dla wpisu godzinowego podaj godzinę rozpoczęcia i zakończenia."}
            )
        if not data.get("is_all_day") and data.get("start_time") and data.get("end_time"):
            if data["start_time"] >= data["end_time"]:
                raise serializers.ValidationError({"end_time": "Godzina zakończenia musi być po godzinie rozpoczęcia."})
        return data


class EmployeeAbsenceRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    availability_type_display = serializers.CharField(source="get_availability_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    days_count = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeAbsenceRequest
        extra_kwargs = {"employee": {"required": False}}
        fields = [
            "id",
            "employee",
            "employee_name",
            "availability_type",
            "availability_type_display",
            "start_date",
            "end_date",
            "days_count",
            "note",
            "status",
            "status_display",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "review_note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "reviewed_by", "reviewed_at", "created_at", "updated_at"]

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.email if obj.employee else None

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.email
        return None

    def get_days_count(self, obj):
        return (obj.end_date - obj.start_date).days + 1 if obj.start_date and obj.end_date else 0

    def validate_availability_type(self, value):
        allowed = {AvailabilityType.DAY_OFF, AvailabilityType.VACATION}
        if value not in allowed:
            raise serializers.ValidationError("Pracownik może zgłaszać tylko dzień wolny albo urlop.")
        return value

    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "Data końcowa musi być po dacie początkowej."})

        request = self.context.get("request")
        if not self.instance and request and getattr(request.user, "role", None) != "admin":
            if data.get("employee") and data["employee"] != request.user:
                raise serializers.ValidationError({"employee": "Możesz zgłaszać nieobecność tylko dla siebie."})
        if not self.instance and request and getattr(request.user, "role", None) == "admin" and not data.get("employee"):
            raise serializers.ValidationError({"employee": "Administrator musi wskazać pracownika."})
        return data

