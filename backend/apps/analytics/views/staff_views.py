"""
Widok menedżerski pracownika i snapshoty statystyk (tylko admin).
Health score pracownika (Etap 4).
"""
from datetime import datetime
from django.utils import timezone
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from apps.accounts.models import User, UserRole
from apps.repairs.models import RepairRequest
from apps.repairs.selectors import staff_health_score
from apps.common.enums import RepairStatus
from apps.analytics.models import EmployeeStatsSnapshot
from apps.repairs.services.health_score import get_repair_health_score
from apps.repairs.serializers import RepairRequestListSerializer


def _is_admin(request):
    return request.user and request.user.is_authenticated and getattr(request.user, "role", None) == UserRole.ADMIN


class StaffSnapshotsView(APIView):
    """
    GET /api/v1/analytics/staff/<user_id>/snapshots/?from=YYYY-MM-DD&to=YYYY-MM-DD
    Lista snapshotów statystyk pracownika w zadanym przedziale. Tylko admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = User.objects.filter(id=user_id, role=UserRole.STAFF).first()
        if not user:
            raise NotFound("Pracownik nie znaleziony.")
        from_date = request.query_params.get("from")
        to_date = request.query_params.get("to")
        qs = EmployeeStatsSnapshot.objects.filter(employee_id=user_id).order_by("-date")
        if from_date:
            try:
                qs = qs.filter(date__gte=datetime.strptime(from_date, "%Y-%m-%d").date())
            except ValueError:
                pass
        if to_date:
            try:
                qs = qs.filter(date__lte=datetime.strptime(to_date, "%Y-%m-%d").date())
            except ValueError:
                pass
        qs = qs[:365]
        data = [
            {
                "date": str(s.date),
                "repairs_count": s.repairs_count,
                "delayed_repairs_count": s.delayed_repairs_count,
                "quotes_sent_count": s.quotes_sent_count,
                "ready_for_pickup_count": s.ready_for_pickup_count,
                "upsell_total": str(s.upsell_total),
                "profit_total": str(s.profit_total) if s.profit_total is not None else None,
            }
            for s in qs
        ]
        return Response({"employee_id": str(user_id), "snapshots": data})


class StaffManagerView(APIView):
    """
    GET /api/v1/analytics/staff/<user_id>/manager-view/
    Pełny widok menedżerski: dane pracownika, statystyki na żywo, health, ostatnie logowanie, lista napraw, ostatnie działania. Tylko admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = User.objects.filter(id=user_id).select_related("staff_profile").first()
        if not user:
            raise NotFound("Użytkownik nie znaleziony.")
        if user.role != UserRole.STAFF:
            return Response({"detail": "Nie jest pracownikiem serwisu."}, status=400)

        # Dane pracownika
        profile = getattr(user, "staff_profile", None)
        employee_data = {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.get_full_name(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "staff_profile": None,
        }
        if profile:
            employee_data["staff_profile"] = {
                "specialization": profile.specialization,
                "display_name": profile.display_name,
                "calendar_color": profile.calendar_color,
                "is_visible_in_rankings": profile.is_visible_in_rankings,
            }

        # Statystyki na żywo (jego naprawy)
        assigned = RepairRequest.objects.filter(assigned_to_id=user_id).exclude(
            status__in=[RepairStatus.CANCELLED, RepairStatus.ABANDONED, RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED]
        )
        in_progress_count = assigned.count()
        overdue_count = assigned.filter(
            estimated_completion_date__lt=timezone.now().date(),
            estimated_completion_date__isnull=False,
        ).count()
        ready_count = RepairRequest.objects.filter(assigned_to_id=user_id, status=RepairStatus.READY_FOR_PICKUP).count()
        from decimal import Decimal
        revenue_agg = RepairRequest.objects.filter(
            assigned_to_id=user_id,
            status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
        ).aggregate(s=Sum("final_cost"))
        revenue = revenue_agg["s"] or Decimal("0")

        stats = {
            "in_progress_count": in_progress_count,
            "overdue_count": overdue_count,
            "ready_for_pickup_count": ready_count,
            "revenue_total": str(revenue),
        }

        # Health: agregacja napraw przypisanych (żółte/czerwone)
        repairs_for_health = assigned.select_related("client", "device").order_by("-updated_at")[:50]
        yellow, red = 0, 0
        for rep in repairs_for_health:
            level, _ = get_repair_health_score(rep)
            if level == "yellow":
                yellow += 1
            elif level == "red":
                red += 1
        health = {"yellow_count": yellow, "red_count": red}

        # Lista jego napraw (assigned_to)
        repairs_list = (
            RepairRequest.objects.filter(assigned_to_id=user_id)
            .select_related("client", "device")
            .order_by("-updated_at")[:30]
        )
        repairs_data = RepairRequestListSerializer(repairs_list, many=True).data

        # Ostatnie działania (AuditLogEntry gdzie actor=user)
        from apps.common.models import AuditLogEntry
        audit = (
            AuditLogEntry.objects.filter(actor_id=user_id)
            .order_by("-created_at")[:20]
        )
        audit_data = [
            {"action": e.action, "target_type": e.target_type, "target_id": e.target_id, "created_at": e.created_at.isoformat()}
            for e in audit
        ]

        # Health score pracownika (jakość pracy: zielony / żółty / czerwony)
        health_score_data = staff_health_score(user_id)

        return Response({
            "employee": employee_data,
            "stats": stats,
            "health": health,
            "health_score": health_score_data,
            "repairs": repairs_data,
            "recent_audit": audit_data,
        })


class StaffHealthScoreView(APIView):
    """
    GET /api/v1/analytics/staff/<user_id>/health-score/
    Health score pracownika (zielony/żółty/czerwony) + czynniki. Tylko admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = User.objects.filter(id=user_id).first()
        if not user:
            raise NotFound("Użytkownik nie znaleziony.")
        if user.role != UserRole.STAFF:
            return Response({"detail": "Nie jest pracownikiem serwisu."}, status=400)
        data = staff_health_score(user_id)
        data["employee_id"] = str(user_id)
        data["employee_name"] = user.get_full_name()
        return Response(data)
