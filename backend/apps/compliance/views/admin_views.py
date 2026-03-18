"""Widoki admina dla compliance/RODO."""

from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.compliance.models import BackupLog, GdprRequest, TermsVersion
from apps.compliance.serializers.admin import (
    BackupLogAdminSerializer,
    GdprRequestAdminSerializer,
    GdprRequestAdminUpdateSerializer,
    TermsVersionAdminSerializer,
)


def _is_admin(request) -> bool:
    return getattr(request.user, "role", None) == UserRole.ADMIN


class _AdminOnly(APIView):
    permission_classes = [IsAuthenticated]

    def dispatch(self, request, *args, **kwargs):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=status.HTTP_403_FORBIDDEN)
        return super().dispatch(request, *args, **kwargs)


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

