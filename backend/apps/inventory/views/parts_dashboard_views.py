"""Podsumowanie części na dashboard pracownika / admina."""
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.common.permissions import IsStaffOrAdmin
from apps.inventory.serializers import PartUsageSerializer
from apps.inventory.selectors import parts_status_dashboard


class PartsDashboardSummaryView(APIView):
    """
    GET /api/v1/inventory/parts-dashboard-summary/
    Kubełki: do zamówienia / w drodze / dotarły (PartUsage powiązane z aktywnymi naprawami).
    Admin: cały serwis. Staff: tylko moje naprawy.
    """

    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        user = request.user
        scope_all = getattr(user, "role", None) == UserRole.ADMIN
        data = parts_status_dashboard(user_id=user.id, scope_all_repairs=scope_all)
        lim = data["preview_limit"]
        ser = PartUsageSerializer

        def bucket_payload(qs):
            return {
                "count": qs.count(),
                "items": ser(qs[:lim], many=True).data,
            }

        return Response(
            {
                "to_order": bucket_payload(data["to_order"]),
                "in_transit": bucket_payload(data["in_transit"]),
                "arrived": bucket_payload(data["arrived"]),
            }
        )
