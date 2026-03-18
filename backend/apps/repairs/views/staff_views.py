"""Widoki API dla panelu pracownika (staff/admin)."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsStaffOrAdmin
from apps.repairs.selectors import repair_list, staff_dashboard_data
from apps.repairs.serializers import RepairRequestListSerializer, RepairRequestSerializer
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
        qs = repair_list(
            status=request.query_params.get("status"),
            status_in=request.query_params.getlist("status_in") or None,
            assigned_to_id=request.query_params.get("assigned_to"),
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

    Dashboard pracownika/admina — podstawowe kubełki:
    - my_new: moje nowe zgłoszenia
    - my_urgent: moje pilne
    - today_to_contact: dziś do kontaktu
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        data = staff_dashboard_data(request.user.id)
        buckets = {
            "my_new": RepairRequestListSerializer(data["my_new"], many=True).data,
            "my_urgent": RepairRequestListSerializer(data["my_urgent"], many=True).data,
            "today_to_contact": RepairRequestListSerializer(data["today_to_contact"], many=True).data,
        }
        return Response(buckets)


