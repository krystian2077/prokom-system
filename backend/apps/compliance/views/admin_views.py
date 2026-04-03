"""Widoki admina dla compliance/RODO."""

from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.compliance.models import BackupLog, ConfigAuditLog, FeatureFlag, GdprRequest, SettingValueType, SystemSetting, TermsVersion
from apps.compliance.serializers.admin import (
    BackupLogAdminSerializer,
    ConfigAuditLogAdminSerializer,
    FeatureFlagAdminSerializer,
    FeatureFlagsBulkUpdateSerializer,
    GdprRequestAdminSerializer,
    GdprRequestAdminUpdateSerializer,
    SystemSettingAdminSerializer,
    SystemSettingsBulkUpdateSerializer,
    TermsVersionAdminSerializer,
)


DEFAULT_SYSTEM_SETTINGS = [
    {
        "key": "brand.company_name",
        "category": "brand",
        "label": "Nazwa firmy",
        "description": "Wyświetlana w panelu i dokumentach systemowych.",
        "value_type": SettingValueType.STRING,
        "value_json": "PRO-KOM Serwis",
    },
    {
        "key": "brand.support_email",
        "category": "brand",
        "label": "E-mail wsparcia",
        "description": "Kontakt dla zgłoszeń i odpowiedzi systemowych.",
        "value_type": SettingValueType.STRING,
        "value_json": "kontakt@prokom.pl",
    },
    {
        "key": "operations.default_sla_hours",
        "category": "operations",
        "label": "Domyślny SLA (godziny)",
        "description": "Docelowy czas pierwszej odpowiedzi na nowe zgłoszenie.",
        "value_type": SettingValueType.INTEGER,
        "value_json": 24,
    },
    {
        "key": "operations.auto_assign_repairs",
        "category": "operations",
        "label": "Automatyczne przypisywanie napraw",
        "description": "Po włączeniu nowe naprawy mogą być przydzielane automatycznie.",
        "value_type": SettingValueType.BOOLEAN,
        "value_json": True,
    },
    {
        "key": "security.max_login_failures_15m",
        "category": "security",
        "label": "Maks. błędnych logowań / 15 min",
        "description": "Limit nieudanych logowań per konto/IP.",
        "value_type": SettingValueType.INTEGER,
        "value_json": 10,
    },
    {
        "key": "security.maintenance_mode",
        "category": "security",
        "label": "Tryb serwisowy",
        "description": "Wyświetla użytkownikom komunikat o przerwie technicznej.",
        "value_type": SettingValueType.BOOLEAN,
        "value_json": False,
    },
    {
        "key": "security.maintenance_message",
        "category": "security",
        "label": "Komunikat trybu serwisowego",
        "description": "Treść komunikatu w trybie serwisowym.",
        "value_type": SettingValueType.STRING,
        "value_json": "Trwa przerwa techniczna. Spróbuj ponownie za kilka minut.",
    },
]

DEFAULT_FEATURE_FLAGS = [
    {
        "key": "premium.dashboard_v2",
        "name": "Nowy dashboard admina",
        "description": "Nowe KPI i układ premium panelu.",
        "is_enabled": True,
        "rollout_percentage": 100,
    },
    {
        "key": "premium.smart_assignments",
        "name": "Smart Assignment",
        "description": "Inteligentne przypisywanie napraw do specjalizacji.",
        "is_enabled": False,
        "rollout_percentage": 0,
    },
    {
        "key": "premium.client_timeline",
        "name": "Timeline klienta",
        "description": "Rozszerzona oś czasu statusów i komunikacji.",
        "is_enabled": True,
        "rollout_percentage": 100,
    },
]


def _is_admin(request) -> bool:
    return getattr(request.user, "role", None) == UserRole.ADMIN


class _AdminOnly(APIView):
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not _is_admin(request):
            raise PermissionDenied("Tylko administrator.")


def _ensure_default_config_rows() -> None:
    for payload in DEFAULT_SYSTEM_SETTINGS:
        key = payload["key"]
        defaults = {k: v for k, v in payload.items() if k != "key"}
        SystemSetting.objects.get_or_create(key=key, defaults=defaults)

    for payload in DEFAULT_FEATURE_FLAGS:
        key = payload["key"]
        defaults = {k: v for k, v in payload.items() if k != "key"}
        FeatureFlag.objects.get_or_create(key=key, defaults=defaults)


def _coerce_setting_value(setting: SystemSetting, raw_value):
    if setting.value_type == SettingValueType.BOOLEAN:
        if not isinstance(raw_value, bool):
            raise ValueError("Wartość musi być typu boolean.")
        return raw_value
    if setting.value_type == SettingValueType.INTEGER:
        if isinstance(raw_value, bool) or not isinstance(raw_value, int):
            raise ValueError("Wartość musi być liczbą całkowitą.")
        return raw_value
    if setting.value_type == SettingValueType.FLOAT:
        if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)):
            raise ValueError("Wartość musi być liczbą.")
        return float(raw_value)
    if setting.value_type == SettingValueType.STRING:
        if not isinstance(raw_value, str):
            raise ValueError("Wartość musi być tekstem.")
        return raw_value.strip()
    return raw_value


class TermsVersionsAdminListView(_AdminOnly):
    """GET /api/v1/compliance/admin/terms-versions/"""

    def get(self, request):
        qs = TermsVersion.objects.all().order_by("-published_at", "-created_at")
        ser = TermsVersionAdminSerializer(qs, many=True)
        return Response({"results": ser.data, "count": len(ser.data)}, status=200)


class TermsVersionsAdminSetActiveView(_AdminOnly):
    """POST /api/v1/compliance/admin/terms-versions/<id>/set-active/"""

    def post(self, request, pk: int):
        try:
            obj = TermsVersion.objects.get(pk=pk)
        except TermsVersion.DoesNotExist:
            return Response({"detail": "Nie znaleziono dokumentu."}, status=status.HTTP_404_NOT_FOUND)

        TermsVersion.objects.all().update(is_active=False)
        obj.is_active = True
        # Nie aktualizujemy published_at automatycznie — jeśli ma zostać „opublikowane teraz”,
        # admin może w przyszłości dodać logikę po stronie backendu.
        obj.save(update_fields=["is_active"])
        ser = TermsVersionAdminSerializer(obj)
        return Response(ser.data, status=200)


class GdprRequestsAdminListView(_AdminOnly):
    """
    GET /api/v1/compliance/admin/gdpr-requests/
    Query:
      request_type=export|deletion
      status=pending|in_progress|completed|rejected
      search=fraza (imie/nazwisko/email)
    """

    def get(self, request):
        qs = (
            GdprRequest.objects.select_related("client", "handled_by")
            .all()
            .order_by("-requested_at")
        )

        request_type = (request.query_params.get("request_type") or "").strip()
        status_filter = (request.query_params.get("status") or "").strip()
        search = (request.query_params.get("search") or "").strip()

        if request_type:
            qs = qs.filter(request_type=request_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            from django.db.models import Q

            qs = qs.filter(
                Q(client__first_name__icontains=search)
                | Q(client__last_name__icontains=search)
                | Q(client__email__icontains=search)
            )

        paginator = PageNumberPagination()
        paginator.page_size = min(int(request.query_params.get("page_size", 25)), 100)
        page = paginator.paginate_queryset(qs, request, view=self)

        ser = GdprRequestAdminSerializer(page, many=True)
        return paginator.get_paginated_response(ser.data)


class GdprRequestAdminUpdateView(_AdminOnly):
    """
    PATCH /api/v1/compliance/admin/gdpr-requests/<id>/update/
    Body: { status, resolution_note? }
    """

    def patch(self, request, pk: int):
        try:
            obj = GdprRequest.objects.select_related("client").get(pk=pk)
        except GdprRequest.DoesNotExist:
            return Response({"detail": "Nie znaleziono wniosku."}, status=status.HTTP_404_NOT_FOUND)

        ser = GdprRequestAdminUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        obj.status = data["status"]
        obj.resolution_note = data.get("resolution_note", "") or ""
        obj.handled_by = request.user
        if obj.status in ("completed", "rejected"):
            obj.resolved_at = timezone.now()
        obj.save(update_fields=["status", "resolution_note", "handled_by", "resolved_at"])

        out = GdprRequestAdminSerializer(obj)
        return Response(out.data, status=200)


class BackupLogsAdminListView(_AdminOnly):
    """
    GET /api/v1/compliance/admin/backup-logs/
    Query:
      status=started|success|failed
      backup_type=database|media|full
    """

    def get(self, request):
        qs = BackupLog.objects.select_related("triggered_by").all().order_by("-started_at")

        status_filter = (request.query_params.get("status") or "").strip()
        backup_type = (request.query_params.get("backup_type") or "").strip()

        if status_filter:
            qs = qs.filter(status=status_filter)
        if backup_type:
            qs = qs.filter(backup_type=backup_type)

        paginator = PageNumberPagination()
        paginator.page_size = min(int(request.query_params.get("page_size", 25)), 100)
        page = paginator.paginate_queryset(qs, request, view=self)

        ser = BackupLogAdminSerializer(page, many=True)
        return paginator.get_paginated_response(ser.data)


class SystemSettingsAdminListView(_AdminOnly):
    """GET /api/v1/compliance/admin/system-settings/"""

    def get(self, request):
        _ensure_default_config_rows()
        qs = SystemSetting.objects.select_related("updated_by").all().order_by("category", "key")
        ser = SystemSettingAdminSerializer(qs, many=True)
        categories = sorted({row["category"] for row in ser.data})
        return Response({"results": ser.data, "count": len(ser.data), "categories": categories}, status=200)


class SystemSettingsAdminBulkUpdateView(_AdminOnly):
    """PATCH /api/v1/compliance/admin/system-settings/bulk-update/"""

    def patch(self, request):
        ser = SystemSettingsBulkUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        items = ser.validated_data["items"]
        updated_keys = []

        with transaction.atomic():
            for item in items:
                try:
                    setting = SystemSetting.objects.select_for_update().get(key=item["key"])
                except SystemSetting.DoesNotExist:
                    return Response(
                        {"detail": f"Nie znaleziono ustawienia: {item['key']}"},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                if setting.is_readonly:
                    return Response(
                        {"detail": f"Ustawienie tylko do odczytu: {setting.key}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                expected_updated_at = item.get("updated_at")
                if expected_updated_at and abs((setting.updated_at - expected_updated_at).total_seconds()) > 1:
                    return Response(
                        {"detail": f"Ustawienie {setting.key} zostało zmienione przez innego administratora."},
                        status=status.HTTP_409_CONFLICT,
                    )

                try:
                    normalized_value = _coerce_setting_value(setting, item["value"])
                except ValueError as exc:
                    return Response({"detail": f"{setting.key}: {exc}"}, status=status.HTTP_400_BAD_REQUEST)

                if setting.value_json == normalized_value:
                    continue

                old_value = setting.value_json
                setting.value_json = normalized_value
                setting.updated_by = request.user
                setting.save(update_fields=["value_json", "updated_by", "updated_at"])
                updated_keys.append(setting.key)

                ConfigAuditLog.objects.create(
                    entity_type=ConfigAuditLog.ENTITY_SETTING,
                    entity_key=setting.key,
                    action="updated",
                    old_value=None if setting.is_secret else old_value,
                    new_value=None if setting.is_secret else normalized_value,
                    metadata={"masked": setting.is_secret},
                    changed_by=request.user,
                )

        out_qs = SystemSetting.objects.select_related("updated_by").filter(key__in=updated_keys).order_by("category", "key")
        out_ser = SystemSettingAdminSerializer(out_qs, many=True)
        return Response({"updated": out_ser.data, "updated_count": len(out_ser.data)}, status=200)


class FeatureFlagsAdminListView(_AdminOnly):
    """GET /api/v1/compliance/admin/feature-flags/"""

    def get(self, request):
        _ensure_default_config_rows()
        qs = FeatureFlag.objects.select_related("updated_by").all().order_by("key")
        ser = FeatureFlagAdminSerializer(qs, many=True)
        return Response({"results": ser.data, "count": len(ser.data)}, status=200)


class FeatureFlagsAdminBulkUpdateView(_AdminOnly):
    """PATCH /api/v1/compliance/admin/feature-flags/bulk-update/"""

    def patch(self, request):
        ser = FeatureFlagsBulkUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        items = ser.validated_data["items"]
        updated_keys = []

        with transaction.atomic():
            for item in items:
                try:
                    flag = FeatureFlag.objects.select_for_update().get(key=item["key"])
                except FeatureFlag.DoesNotExist:
                    return Response(
                        {"detail": f"Nie znaleziono flagi: {item['key']}"},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                expected_updated_at = item.get("updated_at")
                if expected_updated_at and abs((flag.updated_at - expected_updated_at).total_seconds()) > 1:
                    return Response(
                        {"detail": f"Flaga {flag.key} została zmieniona przez innego administratora."},
                        status=status.HTTP_409_CONFLICT,
                    )

                old_state = {"is_enabled": flag.is_enabled, "rollout_percentage": flag.rollout_percentage}
                new_state = {
                    "is_enabled": item["is_enabled"],
                    "rollout_percentage": item["rollout_percentage"],
                }
                if old_state == new_state:
                    continue

                flag.is_enabled = new_state["is_enabled"]
                flag.rollout_percentage = new_state["rollout_percentage"]
                flag.updated_by = request.user
                flag.save(update_fields=["is_enabled", "rollout_percentage", "updated_by", "updated_at"])
                updated_keys.append(flag.key)

                ConfigAuditLog.objects.create(
                    entity_type=ConfigAuditLog.ENTITY_FEATURE_FLAG,
                    entity_key=flag.key,
                    action="updated",
                    old_value=old_state,
                    new_value=new_state,
                    metadata={},
                    changed_by=request.user,
                )

        out_qs = FeatureFlag.objects.select_related("updated_by").filter(key__in=updated_keys).order_by("key")
        out_ser = FeatureFlagAdminSerializer(out_qs, many=True)
        return Response({"updated": out_ser.data, "updated_count": len(out_ser.data)}, status=200)


class ConfigAuditLogsAdminListView(_AdminOnly):
    """
    GET /api/v1/compliance/admin/config-audit-logs/
    Query:
      entity_type=setting|feature_flag
      entity_key=partial
    """

    def get(self, request):
        qs = ConfigAuditLog.objects.select_related("changed_by").all().order_by("-created_at")

        entity_type = (request.query_params.get("entity_type") or "").strip()
        entity_key = (request.query_params.get("entity_key") or "").strip()

        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if entity_key:
            qs = qs.filter(entity_key__icontains=entity_key)

        paginator = PageNumberPagination()
        paginator.page_size = min(int(request.query_params.get("page_size", 25)), 100)
        page = paginator.paginate_queryset(qs, request, view=self)

        ser = ConfigAuditLogAdminSerializer(page, many=True)
        return paginator.get_paginated_response(ser.data)


