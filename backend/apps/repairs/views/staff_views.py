"""Widoki API dla panelu pracownika (staff/admin)."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsStaffOrAdmin
from apps.repairs.selectors import (
    repair_list,
    staff_dashboard_data,
    staff_dashboard_quality_metrics,
    staff_health_score,
)
from apps.repairs.serializers import RepairRequestListSerializer, RepairRequestSerializer
from apps.repairs.serializers.staff_dashboard import RecentActivityEntrySerializer
from apps.repairs.models import RepairRequest


class StaffRepairsListView(APIView):
    """
    GET /api/v1/staff/repairs/

    Lista zgłoszeń napraw widocznych dla pracownika/admina.
    Na start zwracamy całą listę z istniejącego selektora `repair_list`,
    z możliwością filtrów przez query params (status, assigned_to itd.).
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        unassigned_flag = request.query_params.get("unassigned_only", "").lower() in ("1", "true", "yes")
        qs = repair_list(
            status=request.query_params.get("status"),
            status_in=request.query_params.getlist("status_in") or None,
            assigned_to_id=request.query_params.get("assigned_to"),
            unassigned_only=unassigned_flag,
            client_id=request.query_params.get("client"),
            search=request.query_params.get("search"),
            tags=request.query_params.getlist("tags") or request.query_params.getlist("tag") or None,
            ordering=request.query_params.get("ordering", "-created_at"),
        )
        serializer = RepairRequestListSerializer(qs, many=True)
        return Response(serializer.data)


class StaffRepairDetailView(APIView):
    """
    GET /api/v1/staff/repairs/<uuid:pk>/

    Szczegóły pojedynczej naprawy dla panelu pracownika/admina.
    Zwraca pełny `RepairRequestSerializer` (łącznie z polami wewnętrznymi).
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request, pk):
        try:
            repair = (
                RepairRequest.objects.select_related(
                    "client",
                    "device",
                    "assigned_to",
                    "created_by",
                    "delivery_address",
                    "return_address",
                )
                .prefetch_related("status_history", "notes", "images")
                .get(pk=pk)
            )
        except RepairRequest.DoesNotExist:
            return Response({"detail": "Naprawa nie istnieje."}, status=404)

        serializer = RepairRequestSerializer(repair, context={"request": request})
        return Response(serializer.data)


class StaffDashboardView(APIView):
    """
    GET /api/v1/staff/dashboard/

    Dashboard pracownika/admina — te same kubełki co GET /api/v1/repairs/dashboard/.
    Query: days_without_update (int, domyślnie 3), recent_limit (int, domyślnie 10).
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        user_id = request.user.id
        days = int(request.query_params.get("days_without_update", 3))
        limit = int(request.query_params.get("recent_limit", 10))
        data = staff_dashboard_data(user_id, days_without_update=days, recent_activity_limit=limit)
        quality = staff_dashboard_quality_metrics(user_id)
        health = staff_health_score(user_id)
        quality["health_score"] = {"level": health["level"], "factors": health["factors"]}

        list_serializer = RepairRequestListSerializer
        return Response(
            {
                "my_new": list_serializer(data["my_new"], many=True).data,
                "my_urgent": list_serializer(data["my_urgent"], many=True).data,
                "today_to_contact": list_serializer(data["today_to_contact"], many=True).data,
                "my_in_progress": list_serializer(data["my_in_progress"], many=True).data,
                "my_overdue": list_serializer(data["my_overdue"], many=True).data,
                "ready_for_pickup": list_serializer(data["ready_for_pickup"], many=True).data,
                "without_update": list_serializer(data["without_update"], many=True).data,
                "recent_activity": RecentActivityEntrySerializer(data["recent_activity"], many=True).data,
                "quality": quality,
            }
        )


