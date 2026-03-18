"""
PRO-KOM Serwis — Kalendarz: endpointy do panelu pracownika/admina.

Obecny endpoint generuje wydarzenia "na potrzeby UI":
- blokady terminów pracownika (TimeslotBlock) -> kategoria `sla`
- zaplanowane wizyty (RepairVisitSchedule) -> kategoria `intake`
- gotowość do odbioru (ready_for_pickup_at) -> kategoria `delivery`
- szacowane zakończenie (estimated_completion_date) -> kategoria `eta`
"""

from __future__ import annotations

from datetime import date, timedelta

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.calendar_app.models import TimeslotBlock
from apps.common.permissions import IsStaffOrAdmin
from apps.repairs.models import RepairRequest, RepairVisitSchedule


def parse_iso_date(value: str) -> date | None:
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


class CalendarMonthEventsView(APIView):
    """
    GET /api/v1/calendar/month/?from=YYYY-MM-DD&to=YYYY-MM-DD[&employee=<uuid>]

    Zwraca listę elementów kalendarza dla pracownika (lub admina: dla wybranego pracownika),
    w postaci dopasowanej do frontendowego modułu `/panel/kalendarz`.
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        today = timezone.localdate()

        from_str = (request.query_params.get("from") or "").strip()
        to_str = (request.query_params.get("to") or "").strip()

        from_date = parse_iso_date(from_str) if from_str else None
        to_date = parse_iso_date(to_str) if to_str else None

        if not from_date or not to_date:
            # fallback: bieżący miesiąc
            from_date = date(today.year, today.month, 1)
            # dzień końca miesiąca: pierwszy dzień następnego miesiąca - 1
            if today.month == 12:
                next_month = date(today.year + 1, 1, 1)
            else:
                next_month = date(today.year, today.month + 1, 1)
            to_date = next_month - timedelta(days=1)

        if from_date > to_date:
            return Response({"detail": "`from` musi być <= `to`."}, status=400)

        user = request.user
        employee_id = request.query_params.get("employee") if getattr(user, "role", None) == "admin" else None
        employee_id = employee_id or str(user.id)

        events: list[dict] = []

        # 1) Blokady terminów -> SLA
        blocks_qs = (
            TimeslotBlock.objects.filter(
                employee_id=employee_id,
                block_date__gte=from_date,
                block_date__lte=to_date,
            )
            .only("id", "block_date", "start_time", "end_time", "reason")
            .order_by("block_date", "start_time")
        )
        for b in blocks_qs:
            title = (b.reason or "").strip() or "SLA cutoff / iPhone"
            time_range = f"{b.start_time.strftime('%H:%M')}-{b.end_time.strftime('%H:%M')}"
            events.append(
                {
                    "id": f"block-{b.id}",
                    "date": b.block_date.isoformat(),
                    "time": b.start_time.strftime("%H:%M"),
                    "category": "sla",
                    "title": title,
                    "subtitle": time_range,
                }
            )

        # 2) Zaplanowane wizyty -> Intake
        visits_qs = (
            RepairVisitSchedule.objects.select_related("repair", "repair__client", "repair__device")
            .filter(
                repair__assigned_to_id=employee_id,
                visit_date__isnull=False,
                visit_date__gte=from_date,
                visit_date__lte=to_date,
            )
            .order_by("visit_date", "visit_time")
        )
        for vs in visits_qs:
            client_name = vs.repair.client.get_full_name() if vs.repair.client_id else None
            time_value = vs.visit_time.strftime("%H:%M") if vs.visit_time else None
            events.append(
                {
                    "id": f"visit-{vs.id}",
                    "date": vs.visit_date.isoformat(),
                    "time": time_value,
                    "category": "intake",
                    "title": "Zam. naprawy",
                    "subtitle": f"{vs.repair.repair_number}" + (f" · {client_name}" if client_name else ""),
                }
            )

        # 3) Gotowość do odbioru -> Delivery
        pickups_qs = (
            RepairRequest.objects.select_related("client", "device")
            .filter(
                assigned_to_id=employee_id,
                ready_for_pickup_at__isnull=False,
                ready_for_pickup_at__date__gte=from_date,
                ready_for_pickup_at__date__lte=to_date,
            )
            .order_by("ready_for_pickup_at")
        )
        for r in pickups_qs:
            dt = r.ready_for_pickup_at
            if not dt:
                continue
            events.append(
                {
                    "id": f"pickup-{r.id}",
                    "date": dt.date().isoformat(),
                    "time": dt.strftime("%H:%M"),
                    "category": "delivery",
                    "title": "Odbiór / Dostawa",
                    "subtitle": f"{r.repair_number}",
                }
            )

        # 4) Szacowane zakończenie -> ETA
        eta_qs = (
            RepairRequest.objects.select_related("client", "device")
            .filter(
                assigned_to_id=employee_id,
                estimated_completion_date__isnull=False,
                estimated_completion_date__gte=from_date,
                estimated_completion_date__lte=to_date,
            )
            .order_by("estimated_completion_date")
        )
        for r in eta_qs:
            if not r.estimated_completion_date:
                continue
            events.append(
                {
                    "id": f"eta-{r.id}",
                    "date": r.estimated_completion_date.isoformat(),
                    "time": None,
                    "category": "eta",
                    "title": "ETA",
                    "subtitle": f"{r.repair_number}",
                }
            )

        return Response({"events": events})

