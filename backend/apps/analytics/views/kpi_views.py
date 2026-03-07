"""
KPI i rankingi: dashboard dla admina, statystyki napraw, ranking pracowników, raporty.
"""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.repairs.models import RepairRequest
from apps.accounts.models import User
from apps.accounts.models import UserRole
from apps.common.enums import RepairStatus


def _staff_or_admin(request):
    if request.user.role not in ("staff", "admin"):
        return False
    return True


class KPIDashboardView(APIView):
    """
    GET /api/v1/analytics/kpi/?days=30
    Podsumowanie KPI: liczba napraw (wg statusu, źródła, priorytetu), przychód, zaległe, średni czas.
    Dostęp: staff, admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _staff_or_admin(request):
            return Response({"detail": "Brak uprawnień."}, status=403)
        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)
        qs = RepairRequest.objects.filter(created_at__gte=since)
        by_status = dict(
            qs.values_list("status").annotate(c=Count("id")).values_list("status", "c")
        )
        by_source = dict(
            qs.values_list("source").annotate(c=Count("id")).values_list("source", "c")
        )
        by_priority = dict(
            qs.values_list("priority").annotate(c=Count("id")).values_list("priority", "c")
        )
        total_revenue = qs.aggregate(s=Sum("final_cost"))["s"] or Decimal("0")
        total_estimated = qs.aggregate(s=Sum("estimated_cost"))["s"] or Decimal("0")
        overdue = RepairRequest.objects.filter(
            status__in=[
                RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS, RepairStatus.QUOTE_PENDING,
                RepairStatus.QUOTE_SENT, RepairStatus.WAITING_FOR_PARTS, RepairStatus.IN_REPAIR,
                RepairStatus.REPAIR_DONE, RepairStatus.IN_TESTING,
            ],
            estimated_completion_date__lt=timezone.now().date(),
        ).count()
        # Zakończone w okresie (do średniego czasu: accepted_at → completed_at)
        finished = qs.filter(
            status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
            completed_at__isnull=False,
            accepted_at__isnull=False,
        )
        from django.db.models import F, ExpressionWrapper, DurationField
        avg_days = finished.annotate(
            duration=ExpressionWrapper(
                F("completed_at") - F("accepted_at"),
                output_field=DurationField(),
            ),
        ).aggregate(avg=Avg("duration"))["avg"]
        avg_days_value = avg_days.total_seconds() / 86400 if avg_days else None
        return Response(
            {
                "period_days": days,
                "repairs_total": qs.count(),
                "repairs_by_status": by_status,
                "repairs_by_source": by_source,
                "repairs_by_priority": by_priority,
                "revenue_total": str(total_revenue),
                "estimated_total": str(total_estimated),
                "overdue_count": overdue,
                "completed_in_period": finished.count(),
                "average_completion_days": round(avg_days_value, 1) if avg_days_value is not None else None,
            },
            status=200,
        )


class StaffRankingView(APIView):
    """
    GET /api/v1/analytics/staff-ranking/?days=30
    Ranking pracowników: liczba zakończonych napraw, przychód (final_cost).
    Dostęp: admin (lub staff do własnego podsumowania).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ("staff", "admin"):
            return Response({"detail": "Brak uprawnień."}, status=403)
        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)
        staff_ids = list(
            User.objects.filter(role=UserRole.STAFF).values_list("id", flat=True)
        )
        completed = (
            RepairRequest.objects.filter(
                assigned_to_id__in=staff_ids,
                status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
                updated_at__gte=since,
            )
            .values("assigned_to_id")
            .annotate(count=Count("id"), revenue=Sum("final_cost"))
        )
        by_user = {r["assigned_to_id"]: r for r in completed}
        users = User.objects.filter(id__in=staff_ids)
        ranking = []
        for u in users:
            r = by_user.get(u.id) or {"count": 0, "revenue": Decimal("0")}
            ranking.append({
                "user_id": str(u.id),
                "full_name": u.get_full_name(),
                "email": u.email,
                "completed_repairs": r["count"],
                "revenue": str(r["revenue"] or "0"),
            })
        ranking.sort(key=lambda x: (x["completed_repairs"], float(x["revenue"])), reverse=True)
        return Response(
            {"period_days": days, "ranking": ranking},
            status=200,
        )


class RepairsReportView(APIView):
    """
    GET /api/v1/analytics/repairs-report/?days=30&group_by=day|week|month
    Raport napraw: liczba i przychód wg dnia/tygodnia/miesiąca.
    Dostęp: staff, admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _staff_or_admin(request):
            return Response({"detail": "Brak uprawnień."}, status=403)
        days = int(request.query_params.get("days", 30))
        group_by = request.query_params.get("group_by", "day")  # day | week | month
        since = timezone.now() - timedelta(days=days)
        qs = RepairRequest.objects.filter(created_at__gte=since)
        if group_by == "day":
            qs = qs.annotate(period=TruncDate("created_at"))
        elif group_by == "week":
            from django.db.models.functions import TruncWeek
            qs = qs.annotate(period=TruncWeek("created_at"))
        else:  # month
            from django.db.models.functions import TruncMonth
            qs = qs.annotate(period=TruncMonth("created_at"))
        rows = (
            qs.values("period")
            .annotate(count=Count("id"), revenue=Sum("final_cost"))
            .order_by("period")
        )
        report = [
            {
                "period": str(r["period"]),
                "count": r["count"],
                "revenue": str(r["revenue"] or "0"),
            }
            for r in rows
        ]
        return Response(
            {"period_days": days, "group_by": group_by, "report": report},
            status=200,
        )


class SummaryStatsView(APIView):
    """
    GET /api/v1/analytics/summary/
    Jedna liczba: naprawy w toku, zaległe, gotowe do odbioru (do widgetów na dashboard).
    Dostęp: staff, admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _staff_or_admin(request):
            return Response({"detail": "Brak uprawnień."}, status=403)
        today = timezone.now().date()
        in_progress = RepairRequest.objects.filter(
            status__in=[
                RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS, RepairStatus.DIAGNOSTICS_DONE,
                RepairStatus.QUOTE_PENDING, RepairStatus.QUOTE_SENT, RepairStatus.QUOTE_ACCEPTED,
                RepairStatus.WAITING_FOR_PARTS, RepairStatus.IN_REPAIR, RepairStatus.REPAIR_DONE,
                RepairStatus.IN_TESTING, RepairStatus.TESTING_FAILED, RepairStatus.TESTING_PASSED,
            ],
        ).count()
        overdue = RepairRequest.objects.filter(
            status__in=[
                RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS, RepairStatus.QUOTE_PENDING,
                RepairStatus.QUOTE_SENT, RepairStatus.WAITING_FOR_PARTS, RepairStatus.IN_REPAIR,
                RepairStatus.REPAIR_DONE, RepairStatus.IN_TESTING,
            ],
            estimated_completion_date__lt=today,
        ).count()
        ready_for_pickup = RepairRequest.objects.filter(
            status=RepairStatus.READY_FOR_PICKUP,
        ).count()
        waiting_for_decision = RepairRequest.objects.filter(
            status=RepairStatus.QUOTE_SENT,
        ).count()
        return Response(
            {
                "in_progress": in_progress,
                "overdue": overdue,
                "ready_for_pickup": ready_for_pickup,
                "waiting_for_decision": waiting_for_decision,
            },
            status=200,
        )
