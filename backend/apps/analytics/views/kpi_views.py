"""
KPI i rankingi: dashboard dla admina, statystyki napraw, ranking pracowników, raporty.
"""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum, Avg, Value, DecimalField, OuterRef, Subquery, Prefetch
from django.utils import timezone
from django.db.models.functions import TruncDate
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.repairs.models import RepairRequest
from apps.accounts.models import User
from apps.accounts.models import UserRole
from apps.common.enums import RepairStatus
from apps.pricing.models import Quote, QuoteStatus


def _repair_revenue_expr():
    """Kwota przychodu dla naprawy: final_cost, a jeśli brak — ostatnia wysłana/zaakceptowana wycena."""
    quote_total_subq = Subquery(
        Quote.objects.filter(
            repair_id=OuterRef("pk"),
            status__in=[QuoteStatus.SENT, QuoteStatus.ACCEPTED],
        )
        .order_by("-sent_at", "-created_at")
        .values("total_amount")[:1],
        output_field=DecimalField(max_digits=10, decimal_places=2),
    )
    return Coalesce(
        "final_cost",
        quote_total_subq,
        Value(Decimal("0"), output_field=DecimalField(max_digits=10, decimal_places=2)),
    )


def _closed_repairs_revenue_breakdown(qs):
    """Rozbicie przychodu zamkniętych napraw na części i robociznę.

    Zasady:
    - przychód naprawy: final_cost, a gdy brak — ostatnia wycena sent/accepted,
    - split części/robocizna bierzemy z pozycji tej samej wyceny,
    - gdy final_cost różni się od sumy wyceny, skalujemy proporcjonalnie,
    - gdy brak wyceny/pozycji, całość traktujemy jako robociznę.
    """
    parts_total = Decimal("0")
    labour_total = Decimal("0")

    quote_qs = (
        Quote.objects.filter(status__in=[QuoteStatus.SENT, QuoteStatus.ACCEPTED])
        .prefetch_related("items")
        .order_by("-sent_at", "-created_at")
    )

    repairs = qs.prefetch_related(Prefetch("quotes", queryset=quote_qs, to_attr="analytics_quotes"))

    for repair in repairs:
        chosen_quote = repair.analytics_quotes[0] if getattr(repair, "analytics_quotes", None) else None
        revenue = repair.final_cost
        if revenue is None and chosen_quote is not None:
            revenue = chosen_quote.total_amount
        revenue = revenue or Decimal("0")
        if revenue <= 0:
            continue

        if not chosen_quote:
            labour_total += revenue
            continue

        quote_parts = Decimal("0")
        quote_labour = Decimal("0")
        for item in chosen_quote.items.all():
            qty = item.quantity or Decimal("0")
            quote_parts += qty * (item.parts_price or Decimal("0"))
            quote_labour += qty * (item.labour_price or Decimal("0"))

        quote_total = quote_parts + quote_labour
        if quote_total > 0:
            scale = revenue / quote_total
            parts_total += quote_parts * scale
            labour_total += quote_labour * scale
        else:
            labour_total += revenue

    return parts_total, labour_total


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
        total_revenue = qs.aggregate(s=Sum(_repair_revenue_expr()))["s"] or Decimal("0")
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
            .annotate(count=Count("id"), revenue=Sum(_repair_revenue_expr()))
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
            .annotate(count=Count("id"), revenue=Sum(_repair_revenue_expr()))
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


class HealthOverviewView(APIView):
    """
    GET /api/v1/analytics/health-overview/
    Lista napraw z żółtym/czerwonym health score (wymagają uwagi). Dostęp: staff, admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _staff_or_admin(request):
            return Response({"detail": "Brak uprawnień."}, status=403)
        from apps.repairs.services.health_score import get_repair_health_score
        from apps.repairs.serializers import RepairRequestListSerializer

        open_statuses = [
            RepairStatus.NEW, RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS,
            RepairStatus.DIAGNOSTICS_DONE, RepairStatus.QUOTE_PENDING, RepairStatus.QUOTE_SENT,
            RepairStatus.QUOTE_ACCEPTED, RepairStatus.WAITING_FOR_PARTS, RepairStatus.IN_REPAIR,
            RepairStatus.REPAIR_DONE, RepairStatus.IN_TESTING, RepairStatus.TESTING_PASSED,
            RepairStatus.TESTING_FAILED, RepairStatus.READY_FOR_PICKUP,
        ]
        qs = (
            RepairRequest.objects.filter(status__in=open_statuses)
            .select_related("client", "device", "assigned_to")
            .order_by("-updated_at")[:200]
        )
        yellow = []
        red = []
        for repair in qs:
            level, issues = get_repair_health_score(repair)
            if level == "yellow":
                yellow.append({"repair": RepairRequestListSerializer(repair).data, "issues": issues})
            elif level == "red":
                red.append({"repair": RepairRequestListSerializer(repair).data, "issues": issues})
        return Response({
            "yellow_count": len(yellow),
            "red_count": len(red),
            "yellow": yellow[:50],
            "red": red[:50],
        })


def _is_admin(request):
    return getattr(request.user, "role", None) == UserRole.ADMIN


class AdminDashboardView(APIView):
    """
    GET /api/v1/analytics/admin-dashboard/?days=30&assigned_to=<uuid>
    Rozbudowany dashboard: KPI, tabele dynamiczne, wykresy.
    Dostęp: admin oraz staff (staff widzi tylko własny zakres danych).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_admin = _is_admin(request)
        is_staff = getattr(request.user, "role", None) == UserRole.STAFF
        if not (is_admin or is_staff):
            return Response({"detail": "Tylko administrator."}, status=403)
        days = int(request.query_params.get("days", 30))
        assigned_to = request.query_params.get("assigned_to") if is_admin else str(request.user.id)
        since = timezone.now() - timedelta(days=days)
        today = timezone.now().date()

        base_qs = RepairRequest.objects.filter(created_at__gte=since)
        if assigned_to:
            base_qs = base_qs.filter(assigned_to_id=assigned_to)

        # ---------- KPI ----------
        all_open = RepairRequest.objects.exclude(
            status__in=[
                RepairStatus.CANCELLED, RepairStatus.ABANDONED,
                RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED,
            ]
        )
        if assigned_to:
            all_open = all_open.filter(assigned_to_id=assigned_to)
        new_count = RepairRequest.objects.filter(status=RepairStatus.NEW)
        if assigned_to:
            new_count = new_count.filter(assigned_to_id=assigned_to)
        new_count = new_count.count()
        in_progress_statuses = [
            RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS, RepairStatus.DIAGNOSTICS_DONE,
            RepairStatus.QUOTE_PENDING, RepairStatus.QUOTE_SENT, RepairStatus.QUOTE_ACCEPTED,
            RepairStatus.WAITING_FOR_PARTS, RepairStatus.IN_REPAIR, RepairStatus.REPAIR_DONE,
            RepairStatus.IN_TESTING, RepairStatus.TESTING_FAILED, RepairStatus.TESTING_PASSED,
        ]
        in_progress_qs = RepairRequest.objects.filter(status__in=in_progress_statuses)
        if assigned_to:
            in_progress_qs = in_progress_qs.filter(assigned_to_id=assigned_to)
        in_progress_count = in_progress_qs.count()
        ready_qs = RepairRequest.objects.filter(status=RepairStatus.READY_FOR_PICKUP)
        if assigned_to:
            ready_qs = ready_qs.filter(assigned_to_id=assigned_to)
        ready_for_pickup_count = ready_qs.count()
        overdue_qs = RepairRequest.objects.filter(
            status__in=in_progress_statuses,
            estimated_completion_date__lt=today,
            estimated_completion_date__isnull=False,
        )
        if assigned_to:
            overdue_qs = overdue_qs.filter(assigned_to_id=assigned_to)
        overdue_count = overdue_qs.count()
        # Nieodebrane: gotowe do odbioru dłużej niż 7 dni
        unclaimed_threshold = timezone.now() - timedelta(days=7)
        unclaimed_qs = RepairRequest.objects.filter(
            status=RepairStatus.READY_FOR_PICKUP,
            ready_for_pickup_at__lt=unclaimed_threshold,
        )
        if assigned_to:
            unclaimed_qs = unclaimed_qs.filter(assigned_to_id=assigned_to)
        unclaimed_count = unclaimed_qs.count()
        revenue_agg = base_qs.filter(
            status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
        ).aggregate(s=Sum(_repair_revenue_expr()))
        revenue_total = revenue_agg["s"] or Decimal("0")
        closed_qs = base_qs.filter(status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED])
        revenue_parts_total, revenue_labour_total = _closed_repairs_revenue_breakdown(closed_qs)
        quote_value_agg = base_qs.filter(
            status__in=[RepairStatus.QUOTE_SENT, RepairStatus.QUOTE_ACCEPTED],
        ).aggregate(s=Sum("estimated_cost"))
        quote_value_total = quote_value_agg["s"] or Decimal("0")
        complaints_count = base_qs.filter(repair_type="complaint").count()
        warranties_count = base_qs.filter(repair_type="warranty").count()

        kpi = {
            "new_count": new_count,
            "in_progress_count": in_progress_count,
            "ready_for_pickup_count": ready_for_pickup_count,
            "overdue_count": overdue_count,
            "unclaimed_count": unclaimed_count,
            "revenue_total": str(revenue_total),
            "revenue_parts_total": str(revenue_parts_total),
            "revenue_labour_total": str(revenue_labour_total),
            "quote_value_total": str(quote_value_total),
            "complaints_count": complaints_count,
            "warranties_count": warranties_count,
        }

        # ---------- Tabele (listy napraw / ranking) ----------
        from apps.repairs.serializers import RepairRequestListSerializer

        most_overdue = (
            overdue_qs.select_related("client", "device", "assigned_to")
            .order_by("estimated_completion_date")[:20]
        )
        no_quote_repairs = (
            RepairRequest.objects.filter(
                status__in=[
                    RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS,
                    RepairStatus.DIAGNOSTICS_DONE, RepairStatus.QUOTE_PENDING,
                ],
                repair_type="standard",
            )
            .select_related("client", "device", "assigned_to")
            .order_by("created_at")[:20]
        )
        if assigned_to:
            no_quote_repairs = (
                RepairRequest.objects.filter(
                    status__in=[
                        RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS,
                        RepairStatus.DIAGNOSTICS_DONE, RepairStatus.QUOTE_PENDING,
                    ],
                    repair_type="standard",
                    assigned_to_id=assigned_to,
                )
                .select_related("client", "device", "assigned_to")
                .order_by("created_at")[:20]
            )
        unclaimed_repairs = (
            unclaimed_qs.select_related("client", "device", "assigned_to")
            .order_by("ready_for_pickup_at")[:20]
        )
        active_complaints = (
            RepairRequest.objects.filter(repair_type="complaint")
            .exclude(
                status__in=[RepairStatus.CANCELLED, RepairStatus.ABANDONED],
                complaint_warranty_status="closed",
            )
            .select_related("client", "device", "assigned_to", "parent_repair")
            .order_by("-updated_at")[:20]
        )
        active_warranties = (
            RepairRequest.objects.filter(repair_type="warranty")
            .exclude(
                status__in=[RepairStatus.CANCELLED, RepairStatus.ABANDONED],
                complaint_warranty_status="closed",
            )
            .select_related("client", "device", "assigned_to", "parent_repair")
            .order_by("-updated_at")[:20]
        )

        tables = {
            "most_overdue": RepairRequestListSerializer(most_overdue, many=True).data,
            "no_quote_repairs": RepairRequestListSerializer(no_quote_repairs, many=True).data,
            "unclaimed_repairs": RepairRequestListSerializer(unclaimed_repairs, many=True).data,
            "active_complaints": RepairRequestListSerializer(active_complaints, many=True).data,
            "active_warranties": RepairRequestListSerializer(active_warranties, many=True).data,
        }

        # Top pracownicy (w okresie)
        staff_ids = [request.user.id] if is_staff and not is_admin else list(User.objects.filter(role=UserRole.STAFF).values_list("id", flat=True))
        completed = (
            RepairRequest.objects.filter(
                assigned_to_id__in=staff_ids,
                status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
                updated_at__gte=since,
            )
            .values("assigned_to_id")
            .annotate(count=Count("id"), revenue=Sum(_repair_revenue_expr()))
        )
        by_user = {r["assigned_to_id"]: r for r in completed}
        top_staff = []
        for uid in staff_ids:
            u = User.objects.filter(id=uid).first()
            if not u:
                continue
            r = by_user.get(uid) or {"count": 0, "revenue": Decimal("0")}
            top_staff.append({
                "user_id": str(uid),
                "full_name": u.get_full_name(),
                "email": getattr(u, "email", ""),
                "completed_repairs": r["count"],
                "revenue": str(r["revenue"] or "0"),
            })
        top_staff.sort(key=lambda x: (x["completed_repairs"], float(x["revenue"])), reverse=True)
        tables["top_staff"] = top_staff[:15]

        # Dodatkowe KPI: zakończone w okresie i średni czas realizacji
        completed_in_period = base_qs.filter(
            status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
        ).count()
        finished_qs = base_qs.filter(
            status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
            completed_at__isnull=False,
            accepted_at__isnull=False,
        )
        from django.db.models import F, ExpressionWrapper, DurationField
        avg_duration = finished_qs.annotate(
            dur=ExpressionWrapper(F("completed_at") - F("accepted_at"), output_field=DurationField())
        ).aggregate(avg=Avg("dur"))["avg"]
        avg_completion_days = round(avg_duration.total_seconds() / 86400, 1) if avg_duration else None
        kpi["completed_count"] = completed_in_period
        kpi["avg_completion_days"] = avg_completion_days

        # ---------- Wykresy ----------
        qs_chart = RepairRequest.objects.filter(created_at__gte=since)
        if assigned_to:
            qs_chart = qs_chart.filter(assigned_to_id=assigned_to)
        by_status = dict(
            qs_chart.values_list("status").annotate(c=Count("id")).values_list("status", "c")
        )
        repairs_over_time = list(
            qs_chart.annotate(period=TruncDate("created_at"))
            .values("period")
            .annotate(count=Count("id"), revenue=Sum(_repair_revenue_expr()))
            .order_by("period")
        )

        # Źródła zgłoszeń
        by_source = dict(
            qs_chart.values_list("source").annotate(c=Count("id")).values_list("source", "c")
        )

        # Priorytety
        by_priority = dict(
            qs_chart.values_list("priority").annotate(c=Count("id")).values_list("priority", "c")
        )

        # Kategorie urządzeń
        by_category = dict(
            qs_chart.values("device__category")
            .annotate(c=Count("id"))
            .values_list("device__category", "c")
        )

        # ── Marki & Modele: CAŁY system (all-time) + licznik okresu ──
        # qs_all ignoruje filtr daty — pokazuje wszystkie marki w systemie
        from collections import defaultdict

        qs_all = RepairRequest.objects.all()
        if assigned_to:
            qs_all = qs_all.filter(assigned_to_id=assigned_to)

        brand_map: dict = defaultdict(
            lambda: {"total": 0, "period": 0, "revenue": Decimal("0"), "models": defaultdict(int)}
        )

        # FK brand — all time
        for r in qs_all.exclude(device__brand__isnull=True).values(
            "device__brand__name"
        ).annotate(count=Count("id"), rev=Sum("final_cost")):
            k = (r["device__brand__name"] or "").strip()
            if k:
                brand_map[k]["total"] += r["count"]
                brand_map[k]["revenue"] += r["rev"] or Decimal("0")

        # manual_brand — all time
        for r in qs_all.filter(device__brand__isnull=True).exclude(device__manual_brand="").values(
            "device__manual_brand"
        ).annotate(count=Count("id"), rev=Sum("final_cost")):
            k = (r["device__manual_brand"] or "").strip()
            if k:
                brand_map[k]["total"] += r["count"]
                brand_map[k]["revenue"] += r["rev"] or Decimal("0")

        # FK brand — okres
        for r in qs_chart.exclude(device__brand__isnull=True).values(
            "device__brand__name"
        ).annotate(count=Count("id")):
            k = (r["device__brand__name"] or "").strip()
            if k:
                brand_map[k]["period"] += r["count"]

        # manual_brand — okres
        for r in qs_chart.filter(device__brand__isnull=True).exclude(device__manual_brand="").values(
            "device__manual_brand"
        ).annotate(count=Count("id")):
            k = (r["device__manual_brand"] or "").strip()
            if k:
                brand_map[k]["period"] += r["count"]

        # Modele per marka — FK device_model (all time)
        for r in qs_all.exclude(device__device_model__isnull=True).values(
            "device__brand__name", "device__device_model__name"
        ).annotate(count=Count("id")):
            b = (r["device__brand__name"] or "Inne").strip()
            m = (r["device__device_model__name"] or "").strip()
            if b and m:
                brand_map[b]["models"][m] += r["count"]

        # Modele per marka — model_name (text)
        for r in qs_all.filter(device__device_model__isnull=True).exclude(device__model_name="").values(
            "device__brand__name", "device__model_name"
        ).annotate(count=Count("id")):
            b = (r["device__brand__name"] or "Inne").strip()
            m = (r["device__model_name"] or "").strip()
            if m:
                brand_map[b]["models"][m] += r["count"]

        # Modele per marka — manual_model
        for r in qs_all.filter(device__device_model__isnull=True, device__model_name="").exclude(
            device__manual_model=""
        ).values("device__manual_brand", "device__manual_model").annotate(count=Count("id")):
            b = (r["device__manual_brand"] or "Inne").strip()
            m = (r["device__manual_model"] or "").strip()
            if m:
                brand_map[b]["models"][m] += r["count"]

        top_brands = sorted(
            [
                {
                    "name": k,
                    "total": v["total"],
                    "period": v["period"],
                    "revenue": str(v["revenue"]),
                    "top_models": sorted(
                        [{"name": mk, "count": mc} for mk, mc in v["models"].items()],
                        key=lambda x: x["count"], reverse=True,
                    )[:5],
                }
                for k, v in brand_map.items() if v["total"] > 0
            ],
            key=lambda x: x["total"], reverse=True,
        )[:15]

        # ── Top modele (flat) — all time ──
        model_map: dict = defaultdict(lambda: {"total": 0, "period": 0, "brand": ""})

        for r in qs_all.exclude(device__device_model__isnull=True).values(
            "device__device_model__name", "device__brand__name"
        ).annotate(count=Count("id")):
            k = (r["device__device_model__name"] or "").strip()
            if k:
                model_map[k]["total"] += r["count"]
                if not model_map[k]["brand"] and r.get("device__brand__name"):
                    model_map[k]["brand"] = r["device__brand__name"]

        for r in qs_all.filter(device__device_model__isnull=True).exclude(device__model_name="").values(
            "device__model_name", "device__brand__name"
        ).annotate(count=Count("id")):
            k = (r["device__model_name"] or "").strip()
            if k:
                model_map[k]["total"] += r["count"]
                if not model_map[k]["brand"] and r.get("device__brand__name"):
                    model_map[k]["brand"] = r["device__brand__name"]

        for r in qs_all.filter(device__device_model__isnull=True, device__model_name="").exclude(
            device__manual_model=""
        ).values("device__manual_model", "device__manual_brand").annotate(count=Count("id")):
            k = (r["device__manual_model"] or "").strip()
            if k:
                model_map[k]["total"] += r["count"]
                if not model_map[k]["brand"] and r.get("device__manual_brand"):
                    model_map[k]["brand"] = r["device__manual_brand"]

        # Licznik okresu dla modeli
        for r in qs_chart.exclude(device__device_model__isnull=True).values(
            "device__device_model__name"
        ).annotate(count=Count("id")):
            k = (r["device__device_model__name"] or "").strip()
            if k:
                model_map[k]["period"] += r["count"]

        for r in qs_chart.filter(device__device_model__isnull=True).exclude(device__model_name="").values(
            "device__model_name"
        ).annotate(count=Count("id")):
            k = (r["device__model_name"] or "").strip()
            if k:
                model_map[k]["period"] += r["count"]

        for r in qs_chart.filter(device__device_model__isnull=True, device__model_name="").exclude(
            device__manual_model=""
        ).values("device__manual_model").annotate(count=Count("id")):
            k = (r["device__manual_model"] or "").strip()
            if k:
                model_map[k]["period"] += r["count"]

        top_models = sorted(
            [
                {"model": k, "brand": v["brand"], "total": v["total"], "period": v["period"]}
                for k, v in model_map.items() if v["total"] > 0
            ],
            key=lambda x: x["total"], reverse=True,
        )[:20]

        charts = {
            "repairs_by_status": by_status,
            "repairs_over_time": [
                {"period": str(r["period"]), "count": r["count"], "revenue": str(r["revenue"] or "0")}
                for r in repairs_over_time
            ],
            "repairs_by_source": by_source,
            "repairs_by_priority": by_priority,
            "repairs_by_category": {k: v for k, v in by_category.items() if k},
            "top_brands": top_brands,
            "top_models": top_models,
        }

        return Response(
            {
                "period_days": days,
                "kpi": kpi,
                "tables": tables,
                "charts": charts,
            },
            status=200,
        )
