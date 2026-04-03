"""
PRO-KOM Serwis — Kalendarz: endpointy do panelu pracownika/admina.

Endpoint generuje wydarzenia dla UI:
- blokady terminów pracownika (TimeslotBlock) -> kategoria `sla`
- zaplanowane wizyty (RepairVisitSchedule) -> kategoria `intake`
- gotowość do odbioru (ready_for_pickup_at) -> kategoria `delivery`
- szacowane zakończenie (estimated_completion_date) -> kategoria `eta`
- planowana dostawa części (PartUsage.expected_arrival_date) -> kategoria `parts`

daily_summaries (per dzień, strefa czasowa jak w Django TIME_ZONE / USE_TZ):
- accepted: liczba napraw z przyjęciem (accepted_at) tego dnia
- completed: liczba napraw zakończonych (completed_at) tego dnia
- picked_up: liczba napraw odebranych przez klienta (picked_up_at) tego dnia
- parts_incoming: liczba pozycji części oczekiwanych na dostawę (PartUsage, status zamówione, jeszcze nie dotarło)
- planned_work: naprawy z planowanym dniem pracy (staff_planned_work_date) = ten dzień
- ready_for_pickup: naprawy z gotowością do odbioru (ready_for_pickup_at) tego dnia
- distinct_repairs_with_activity: unikalne naprawy (UUID), które mają dowolną powyższą aktywność
  lub wizytę / planowany termin oddania / wydarzenie częściowego tego dnia (bez blokad SLA bez naprawy)
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from uuid import UUID

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.calendar_app.models import TimeslotBlock
from apps.common.permissions import IsStaffOrAdmin
from apps.inventory.models.part_usage import PartUsage, PartUsageStatus
from apps.repairs.models import RepairRequest, RepairVisitSchedule


User = get_user_model()

CALENDAR_CATEGORIES = {"sla", "delivery", "event", "intake", "eta", "parts"}


def parse_iso_date(value: str) -> date | None:
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def _daterange(from_d: date, to_d: date):
    d = from_d
    while d <= to_d:
        yield d
        d += timedelta(days=1)


def _empty_summary() -> dict:
    return {
        "accepted": 0,
        "completed": 0,
        "picked_up": 0,
        "parts_incoming": 0,
        "planned_work": 0,
        "ready_for_pickup": 0,
        "distinct_repairs_with_activity": 0,
    }


def _add_repair_day(
    day_repairs: dict[str, set[UUID]],
    day: date | None,
    repair_id,
) -> None:
    if not day or not repair_id:
        return
    key = day.isoformat()
    try:
        rid = repair_id if isinstance(repair_id, UUID) else UUID(str(repair_id))
    except (ValueError, TypeError):
        return
    day_repairs[key].add(rid)


def _user_display_name(user) -> str:
    full_name = (user.get_full_name() or "").strip()
    return full_name or user.email


def _user_color(user) -> str:
    profile = getattr(user, "staff_profile", None)
    if profile and getattr(profile, "calendar_color", None):
        return profile.calendar_color
    return "#64748b"


def _event_matches_query(event_payload: dict, q_norm: str) -> bool:
    if not q_norm:
        return True
    text = " ".join(
        [
            str(event_payload.get("title") or ""),
            str(event_payload.get("subtitle") or ""),
            str(event_payload.get("employee_name") or ""),
            str(event_payload.get("source_type") or ""),
        ]
    ).lower()
    return q_norm in text


class CalendarMonthEventsView(APIView):
    """
    GET /api/v1/calendar/month/?from=YYYY-MM-DD&to=YYYY-MM-DD
      [&scope=mine|team][&employee=<uuid>|all][&category=sla,eta,...][&q=fraza]

    Zwraca { events, daily_summaries, summary, workload_by_employee }.
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        today = timezone.localdate()

        from_str = (request.query_params.get("from") or "").strip()
        to_str = (request.query_params.get("to") or "").strip()

        from_date = parse_iso_date(from_str) if from_str else None
        to_date = parse_iso_date(to_str) if to_str else None

        if not from_date or not to_date:
            from_date = date(today.year, today.month, 1)
            if today.month == 12:
                next_month = date(today.year + 1, 1, 1)
            else:
                next_month = date(today.year, today.month + 1, 1)
            to_date = next_month - timedelta(days=1)

        if from_date > to_date:
            return Response({"detail": "`from` musi być <= `to`."}, status=400)

        user = request.user
        is_admin = getattr(user, "role", None) == UserRole.ADMIN

        scope = (request.query_params.get("scope") or "").strip().lower()
        if not is_admin:
            scope = "mine"
        if scope not in {"mine", "team"}:
            scope = "team" if is_admin else "mine"

        employee_raw = (request.query_params.get("employee") or "").strip()
        selected_employee_ids: list[str] | None
        if scope == "mine":
            selected_employee_ids = [str(user.id)]
        elif employee_raw and employee_raw.lower() not in {"all", "team"}:
            selected_employee_ids = [employee_raw]
        else:
            selected_employee_ids = None

        category_raw = (request.query_params.get("category") or "").strip().lower()
        allowed_categories = {
            c.strip() for c in category_raw.split(",") if c.strip() in CALENDAR_CATEGORIES
        }

        q_norm = (request.query_params.get("q") or "").strip().lower()

        if selected_employee_ids is None:
            people_qs = User.objects.filter(
                role__in=[UserRole.ADMIN, UserRole.STAFF],
            ).select_related("staff_profile")
        else:
            people_qs = User.objects.filter(id__in=selected_employee_ids).select_related("staff_profile")

        users_by_id = {str(u.id): u for u in people_qs}
        employee_ids_filter = list(users_by_id.keys())

        if not employee_ids_filter:
            return Response(
                {
                    "events": [],
                    "daily_summaries": {d.isoformat(): _empty_summary() for d in _daterange(from_date, to_date)},
                    "summary": {
                        "total_events": 0,
                        "days_with_events": 0,
                        "today_events": 0,
                        "tomorrow_events": 0,
                        "by_category": {c: 0 for c in sorted(CALENDAR_CATEGORIES)},
                    },
                    "workload_by_employee": [],
                }
            )

        daily_summaries: dict[str, dict] = {d.isoformat(): _empty_summary() for d in _daterange(from_date, to_date)}
        day_repairs: dict[str, set[UUID]] = defaultdict(set)
        days_with_events: set[str] = set()
        by_category: dict[str, int] = {c: 0 for c in sorted(CALENDAR_CATEGORIES)}
        workload: dict[str, dict] = defaultdict(
            lambda: {
                "total_events": 0,
                "accepted": 0,
                "completed": 0,
                "picked_up": 0,
                "parts_incoming": 0,
                "planned_work": 0,
                "ready_for_pickup": 0,
            }
        )

        events: list[dict] = []

        def add_event(payload: dict) -> None:
            if allowed_categories and payload["category"] not in allowed_categories:
                return
            if not _event_matches_query(payload, q_norm):
                return
            events.append(payload)
            by_category[payload["category"]] += 1
            days_with_events.add(payload["date"])
            eid = payload.get("employee_id")
            if eid:
                workload[str(eid)]["total_events"] += 1

        # 1) Blokady terminów -> SLA (bez repair_id)
        blocks_qs = (
            TimeslotBlock.objects.filter(
                employee_id__in=employee_ids_filter,
                block_date__gte=from_date,
                block_date__lte=to_date,
            )
            .select_related("employee", "employee__staff_profile")
            .order_by("block_date", "start_time")
        )
        for b in blocks_qs:
            employee_id = str(b.employee_id)
            employee_obj = users_by_id.get(employee_id)
            title = (b.reason or "").strip() or "SLA cutoff / iPhone"
            time_range = f"{b.start_time.strftime('%H:%M')}-{b.end_time.strftime('%H:%M')}"
            add_event(
                {
                    "id": f"block-{b.id}",
                    "date": b.block_date.isoformat(),
                    "time": b.start_time.strftime("%H:%M"),
                    "category": "sla",
                    "title": title,
                    "subtitle": time_range,
                    "source_type": "timeslot_block",
                    "priority": "high",
                    "employee_id": employee_id,
                    "employee_name": _user_display_name(employee_obj or b.employee),
                    "employee_color": _user_color(employee_obj or b.employee),
                }
            )

        # 2) Zaplanowane wizyty -> Intake
        visits_qs = (
            RepairVisitSchedule.objects.select_related(
                "repair",
                "repair__client",
                "repair__device",
                "repair__assigned_to",
                "repair__assigned_to__staff_profile",
            )
            .filter(
                repair__assigned_to_id__in=employee_ids_filter,
                visit_date__isnull=False,
                visit_date__gte=from_date,
                visit_date__lte=to_date,
            )
            .order_by("visit_date", "visit_time")
        )
        for vs in visits_qs:
            client_name = vs.repair.client.get_full_name() if vs.repair.client_id else None
            time_value = vs.visit_time.strftime("%H:%M") if vs.visit_time else None
            vd = vs.visit_date
            if vd:
                _add_repair_day(day_repairs, vd, vs.repair_id)
            assigned = vs.repair.assigned_to
            assigned_id = str(vs.repair.assigned_to_id) if vs.repair.assigned_to_id else None
            add_event(
                {
                    "id": f"visit-{vs.id}",
                    "date": vs.visit_date.isoformat(),
                    "time": time_value,
                    "category": "intake",
                    "title": "Zam. naprawy",
                    "subtitle": f"{vs.repair.repair_number}" + (f" · {client_name}" if client_name else ""),
                    "repair_id": str(vs.repair_id),
                    "source_type": "visit_schedule",
                    "priority": "medium",
                    "employee_id": assigned_id,
                    "employee_name": _user_display_name(users_by_id.get(assigned_id) or assigned) if assigned_id and assigned else None,
                    "employee_color": _user_color(users_by_id.get(assigned_id) or assigned) if assigned_id and assigned else None,
                }
            )

        # 3) Gotowość do odbioru -> Delivery
        pickups_qs = (
            RepairRequest.objects.select_related("client", "device", "assigned_to", "assigned_to__staff_profile")
            .filter(
                assigned_to_id__in=employee_ids_filter,
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
            pday = dt.date()
            k = pday.isoformat()
            if k in daily_summaries:
                daily_summaries[k]["ready_for_pickup"] += 1
            if r.assigned_to_id:
                workload[str(r.assigned_to_id)]["ready_for_pickup"] += 1
            _add_repair_day(day_repairs, pday, r.id)
            assigned_id = str(r.assigned_to_id) if r.assigned_to_id else None
            add_event(
                {
                    "id": f"pickup-{r.id}",
                    "date": pday.isoformat(),
                    "time": dt.strftime("%H:%M"),
                    "category": "delivery",
                    "title": "Odbiór / Dostawa",
                    "subtitle": f"{r.repair_number}",
                    "repair_id": str(r.id),
                    "source_type": "ready_for_pickup",
                    "priority": "high",
                    "employee_id": assigned_id,
                    "employee_name": _user_display_name(users_by_id.get(assigned_id) or r.assigned_to) if assigned_id and r.assigned_to else None,
                    "employee_color": _user_color(users_by_id.get(assigned_id) or r.assigned_to) if assigned_id and r.assigned_to else None,
                }
            )

        # 4) Planowany termin oddania
        eta_qs = (
            RepairRequest.objects.select_related("client", "device", "assigned_to", "assigned_to__staff_profile")
            .filter(
                assigned_to_id__in=employee_ids_filter,
                estimated_completion_date__isnull=False,
                estimated_completion_date__gte=from_date,
                estimated_completion_date__lte=to_date,
            )
            .order_by("estimated_completion_date")
        )
        for r in eta_qs:
            if not r.estimated_completion_date:
                continue
            ed = r.estimated_completion_date
            _add_repair_day(day_repairs, ed, r.id)
            assigned_id = str(r.assigned_to_id) if r.assigned_to_id else None
            add_event(
                {
                    "id": f"eta-{r.id}",
                    "date": ed.isoformat(),
                    "time": None,
                    "category": "eta",
                    "title": "Planowany termin oddania",
                    "subtitle": f"{r.repair_number}",
                    "repair_id": str(r.id),
                    "source_type": "estimated_completion",
                    "priority": "medium",
                    "employee_id": assigned_id,
                    "employee_name": _user_display_name(users_by_id.get(assigned_id) or r.assigned_to) if assigned_id and r.assigned_to else None,
                    "employee_color": _user_color(users_by_id.get(assigned_id) or r.assigned_to) if assigned_id and r.assigned_to else None,
                }
            )

        # 5) Planowana dostawa części -> parts (jeszcze w drodze)
        parts_qs = (
            PartUsage.objects.select_related("repair", "part", "repair__assigned_to", "repair__assigned_to__staff_profile")
            .filter(
                repair__assigned_to_id__in=employee_ids_filter,
                expected_arrival_date__isnull=False,
                expected_arrival_date__gte=from_date,
                expected_arrival_date__lte=to_date,
                usage_status=PartUsageStatus.ORDERED,
            )
            .order_by("expected_arrival_date", "repair_id")
        )
        for pu in parts_qs:
            part_label = pu.part.name if pu.part_id else (pu.custom_part_name or "Część")
            ed = pu.expected_arrival_date
            if not ed:
                continue
            k = ed.isoformat()
            if k in daily_summaries:
                daily_summaries[k]["parts_incoming"] += 1
            if pu.repair.assigned_to_id:
                workload[str(pu.repair.assigned_to_id)]["parts_incoming"] += 1
            _add_repair_day(day_repairs, ed, pu.repair_id)
            assigned_id = str(pu.repair.assigned_to_id) if pu.repair.assigned_to_id else None
            add_event(
                {
                    "id": f"part-{pu.id}",
                    "date": ed.isoformat(),
                    "time": None,
                    "category": "parts",
                    "title": "Dostawa części",
                    "subtitle": f"{pu.repair.repair_number} · {part_label}",
                    "repair_id": str(pu.repair_id),
                    "source_type": "parts_expected_arrival",
                    "priority": "medium",
                    "employee_id": assigned_id,
                    "employee_name": _user_display_name(users_by_id.get(assigned_id) or pu.repair.assigned_to) if assigned_id and pu.repair.assigned_to else None,
                    "employee_color": _user_color(users_by_id.get(assigned_id) or pu.repair.assigned_to) if assigned_id and pu.repair.assigned_to else None,
                }
            )

        # Agregaty z RepairRequest (accepted / completed / picked_up / planned_work)
        base_rr = RepairRequest.objects.filter(assigned_to_id__in=employee_ids_filter)

        if q_norm:
            q_filter = Q(repair_number__icontains=q_norm) | Q(client__first_name__icontains=q_norm) | Q(client__last_name__icontains=q_norm)
            base_rr = base_rr.filter(q_filter)

        for r in base_rr.filter(
            accepted_at__isnull=False,
            accepted_at__date__gte=from_date,
            accepted_at__date__lte=to_date,
        ).only("id", "accepted_at"):
            ad = r.accepted_at.date() if r.accepted_at else None
            if ad and ad.isoformat() in daily_summaries:
                daily_summaries[ad.isoformat()]["accepted"] += 1
            if r.assigned_to_id:
                workload[str(r.assigned_to_id)]["accepted"] += 1
            _add_repair_day(day_repairs, ad, r.id)

        for r in base_rr.filter(
            completed_at__isnull=False,
            completed_at__date__gte=from_date,
            completed_at__date__lte=to_date,
        ).only("id", "completed_at"):
            cd = r.completed_at.date() if r.completed_at else None
            if cd and cd.isoformat() in daily_summaries:
                daily_summaries[cd.isoformat()]["completed"] += 1
            if r.assigned_to_id:
                workload[str(r.assigned_to_id)]["completed"] += 1
            _add_repair_day(day_repairs, cd, r.id)

        for r in base_rr.filter(
            picked_up_at__isnull=False,
            picked_up_at__date__gte=from_date,
            picked_up_at__date__lte=to_date,
        ).only("id", "picked_up_at"):
            pd = r.picked_up_at.date() if r.picked_up_at else None
            if pd and pd.isoformat() in daily_summaries:
                daily_summaries[pd.isoformat()]["picked_up"] += 1
            if r.assigned_to_id:
                workload[str(r.assigned_to_id)]["picked_up"] += 1
            _add_repair_day(day_repairs, pd, r.id)

        for r in base_rr.filter(
            staff_planned_work_date__isnull=False,
            staff_planned_work_date__gte=from_date,
            staff_planned_work_date__lte=to_date,
        ).only("id", "staff_planned_work_date"):
            wd = r.staff_planned_work_date
            if wd and wd.isoformat() in daily_summaries:
                daily_summaries[wd.isoformat()]["planned_work"] += 1
            if r.assigned_to_id:
                workload[str(r.assigned_to_id)]["planned_work"] += 1
            _add_repair_day(day_repairs, wd, r.id)

        for day_iso, s in daily_summaries.items():
            s["distinct_repairs_with_activity"] = len(day_repairs.get(day_iso, set()))

        today_iso = today.isoformat()
        tomorrow_iso = (today + timedelta(days=1)).isoformat()
        summary = {
            "total_events": len(events),
            "days_with_events": len(days_with_events),
            "today_events": sum(1 for e in events if e["date"] == today_iso),
            "tomorrow_events": sum(1 for e in events if e["date"] == tomorrow_iso),
            "by_category": by_category,
        }

        workload_rows = []
        for employee_id in sorted(workload.keys(), key=lambda e: workload[e]["total_events"], reverse=True):
            user_obj = users_by_id.get(employee_id)
            if user_obj is None:
                continue
            workload_rows.append(
                {
                    "employee_id": employee_id,
                    "employee_name": _user_display_name(user_obj),
                    "employee_color": _user_color(user_obj),
                    **workload[employee_id],
                }
            )

        events.sort(key=lambda e: (e["date"], e.get("time") or "99:99", e.get("title") or ""))

        return Response(
            {
                "events": events,
                "daily_summaries": daily_summaries,
                "summary": summary,
                "workload_by_employee": workload_rows,
            }
        )
