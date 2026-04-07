"""Widoki API dostępności (pracownik: własne wpisy + odczyt zespołu; admin: wszystko)."""
from calendar import monthrange
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import EmployeeAvailability, EmployeeAbsenceRequest, WorkSession
from .serializers import EmployeeAvailabilitySerializer, EmployeeAbsenceRequestSerializer, WorkSessionSerializer
from .permissions import IsStaffOrAdmin, can_edit_availability
from .enums import AbsenceRequestStatus


User = get_user_model()


def _month_bounds(month_raw: str | None):
    today = timezone.localdate()
    raw = (month_raw or "").strip()
    if raw:
        y_raw, m_raw = raw.split("-", 1)
        year = int(y_raw)
        month = int(m_raw)
        start = date(year, month, 1)
    else:
        start = date(today.year, today.month, 1)
    end = date(start.year, start.month, monthrange(start.year, start.month)[1])
    return start, end


def _employee_month_summary(employee, month_start: date, month_end: date):
    sessions = WorkSession.objects.filter(
        employee=employee,
        started_at__date__gte=month_start,
        started_at__date__lte=month_end,
    ).order_by("started_at")

    worked_by_day = {}
    for session in sessions:
        d = timezone.localtime(session.started_at).date().isoformat()
        row = worked_by_day.setdefault(
            d,
            {
                "date": d,
                "seconds": 0,
                "hours": 0.0,
                "sessions_count": 0,
                "is_open": False,
            },
        )
        seconds = session.duration_seconds if session.duration_seconds is not None else session.elapsed_seconds
        row["seconds"] += max(0, int(seconds))
        row["sessions_count"] += 1
        if session.ended_at is None:
            row["is_open"] = True

    for row in worked_by_day.values():
        row["hours"] = round(row["seconds"] / 3600, 2)

    absences_qs = EmployeeAvailability.objects.filter(
        employee=employee,
        is_active=True,
        date__gte=month_start,
        date__lte=month_end,
    ).exclude(availability_type="available").order_by("date")

    absence_by_day = {}
    for entry in absences_qs:
        key = entry.date.isoformat()
        row = absence_by_day.setdefault(
            key,
            {
                "date": key,
                "types": [],
                "notes": [],
            },
        )
        type_payload = {
            "key": entry.availability_type,
            "label": entry.get_availability_type_display(),
        }
        if type_payload not in row["types"]:
            row["types"].append(type_payload)
        note = (entry.note or "").strip()
        if note and note not in row["notes"]:
            row["notes"].append(note)

    worked_days = sorted(worked_by_day.values(), key=lambda x: x["date"])
    absence_days = sorted(absence_by_day.values(), key=lambda x: x["date"])
    total_seconds = sum(int(d["seconds"]) for d in worked_days)

    daily = []
    day = month_start
    while day <= month_end:
        key = day.isoformat()
        w = worked_by_day.get(key)
        a = absence_by_day.get(key)
        daily.append(
            {
                "date": key,
                "worked_seconds": int(w["seconds"]) if w else 0,
                "worked_hours": round((int(w["seconds"]) / 3600), 2) if w else 0.0,
                "worked": bool(w),
                "absent": bool(a),
                "absence_labels": [t["label"] for t in (a["types"] if a else [])],
            }
        )
        day += timedelta(days=1)

    return {
        "total_work_seconds": total_seconds,
        "total_work_hours": round(total_seconds / 3600, 2),
        "worked_days_count": len(worked_days),
        "absence_days_count": len(absence_days),
        "worked_days": worked_days,
        "absence_days": absence_days,
        "daily": daily,
    }



class WorkSessionActiveView(APIView):
    """GET /availability/work-sessions/me/ — aktywna sesja pracy bieżącego użytkownika."""

    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        session = WorkSession.active_for_employee(request.user)
        return Response({"active_session": WorkSessionSerializer(session).data if session else None})


class WorkSessionStartView(APIView):
    """POST /availability/work-sessions/me/start/ — rozpoczęcie pracy."""

    permission_classes = [IsStaffOrAdmin]

    def post(self, request):
        active = WorkSession.active_for_employee(request.user)
        if active:
            return Response(
                {
                    "detail": "Masz już rozpoczętą pracę.",
                    "active_session": WorkSessionSerializer(active).data,
                },
                status=409,
            )

        try:
            with transaction.atomic():
                session = WorkSession.objects.create(employee=request.user)
        except IntegrityError:
            session = WorkSession.active_for_employee(request.user)
            return Response(
                {
                    "detail": "Masz już rozpoczętą pracę.",
                    "active_session": WorkSessionSerializer(session).data if session else None,
                },
                status=409,
            )

        return Response(
            {
                "detail": "Praca została rozpoczęta.",
                "active_session": WorkSessionSerializer(session).data,
            },
            status=201,
        )


class WorkSessionEndView(APIView):
    """POST /availability/work-sessions/me/end/ — zakończenie aktywnej pracy."""

    permission_classes = [IsStaffOrAdmin]

    def post(self, request):
        session = WorkSession.active_for_employee(request.user)
        if not session:
            return Response({"detail": "Nie masz aktywnej pracy do zakończenia."}, status=409)

        session.close()
        return Response(
            {
                "detail": "Praca została zakończona.",
                "ended_session": WorkSessionSerializer(session).data,
                "active_session": None,
            }
        )


class WorkSessionMonthSummaryView(APIView):
    """GET /availability/work-sessions/me/month-summary/?month=YYYY-MM — lista obecności za miesiąc."""

    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        month_raw = (request.query_params.get("month") or "").strip()
        if month_raw:
            try:
                month_start, month_end = _month_bounds(month_raw)
            except (ValueError, TypeError):
                return Response({"detail": "Nieprawidłowy parametr month. Użyj formatu YYYY-MM."}, status=400)
        else:
            month_start, month_end = _month_bounds(None)

        summary = _employee_month_summary(request.user, month_start, month_end)

        return Response(
            {
                "month": f"{month_start.year:04d}-{month_start.month:02d}",
                "from": month_start.isoformat(),
                "to": month_end.isoformat(),
                **summary,
            }
        )


class AdminWorkSessionMonthSummaryView(APIView):
    """GET /availability/work-sessions/admin/month-summary/?month=YYYY-MM — lista obecności zespołu (admin)."""

    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        if getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Brak uprawnień."}, status=403)

        month_raw = (request.query_params.get("month") or "").strip()
        try:
            month_start, month_end = _month_bounds(month_raw or None)
        except (ValueError, TypeError):
            return Response({"detail": "Nieprawidłowy parametr month. Użyj formatu YYYY-MM."}, status=400)

        users = User.objects.filter(role__in=["staff", "admin"]).order_by("-is_active", "first_name", "last_name", "email")
        rows = []
        for employee in users:
            summary = _employee_month_summary(employee, month_start, month_end)
            rows.append(
                {
                    "employee_id": str(employee.id),
                    "full_name": employee.get_full_name(),
                    "email": employee.email,
                    "role": employee.role,
                    "is_active": bool(employee.is_active),
                    **summary,
                }
            )

        return Response(
            {
                "month": f"{month_start.year:04d}-{month_start.month:02d}",
                "from": month_start.isoformat(),
                "to": month_end.isoformat(),
                "employees": rows,
            }
        )


class EmployeeAvailabilityViewSet(viewsets.ModelViewSet):
    """
    Wpisy dostępności pracowników.
    Staff: dodaje/edytuje/usuwa tylko swoje wpisy; widzi dostępność całego zespołu (lista).
    Admin: pełna edycja dowolnego wpisu, filtry.
    """
    permission_classes = [IsStaffOrAdmin]
    serializer_class = EmployeeAvailabilitySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["employee", "availability_type", "date", "is_active"]

    def get_queryset(self):
        return EmployeeAvailability.objects.select_related(
            "employee", "created_by", "updated_by"
        ).filter(is_active=True).order_by("-date", "employee", "start_time")

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, "role", None) != "admin":
            serializer.save(created_by=user, employee=user)
        else:
            serializer.save(created_by=user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        if not can_edit_availability(request.user, obj):
            return Response({"detail": "Możesz edytować tylko własne wpisy dostępności."}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if not can_edit_availability(request.user, obj):
            return Response({"detail": "Możesz usuwać tylko własne wpisy."}, status=403)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, url_path="team-today")
    def team_today(self, request):
        """GET /availability/team-today/ — dostępność zespołu na dziś (do dashboardu)."""
        today = date.today()
        qs = EmployeeAvailability.objects.filter(
            date=today, is_active=True
        ).select_related("employee").order_by("employee", "start_time")
        items = EmployeeAvailabilitySerializer(qs, many=True).data
        return Response({"date": str(today), "entries": items})

    @action(detail=False, url_path="today")
    def today(self, request):
        """GET /availability/today/ — wpisy na dziś (z filtrem employee= optional)."""
        today = date.today()
        qs = self.get_queryset().filter(date=today)
        return Response(EmployeeAvailabilitySerializer(qs, many=True).data)

    @action(detail=False, url_path="tomorrow")
    def tomorrow(self, request):
        """GET /availability/tomorrow/"""
        tomorrow = date.today() + timedelta(days=1)
        qs = self.get_queryset().filter(date=tomorrow)
        return Response(EmployeeAvailabilitySerializer(qs, many=True).data)

    @action(detail=False, url_path="week")
    def week(self, request):
        """GET /availability/week/ — wpisy na bieżący tydzień."""
        today = date.today()
        week_end = today + timedelta(days=7)
        qs = self.get_queryset().filter(date__gte=today, date__lt=week_end)
        return Response(EmployeeAvailabilitySerializer(qs, many=True).data)

    @action(detail=False, url_path="check")
    def check(self, request):
        """
        GET /availability/check/?employee=<uuid>&date=YYYY-MM-DD
        Sprawdzenie dostępności pracownika na dany dzień (do ostrzeżenia przy przypisywaniu naprawy/zadania).
        Zwraca listę wpisów (np. niedostępność) — jeśli niepusta, frontend może pokazać ostrzeżenie.
        """
        employee_id = request.query_params.get("employee")
        date_str = request.query_params.get("date")
        if not employee_id:
            return Response({"entries": [], "message": "Podaj employee."}, status=400)
        try:
            check_date = date.fromisoformat(date_str) if date_str else date.today()
        except ValueError:
            return Response({"entries": [], "message": "Nieprawidłowa data."}, status=400)
        qs = self.get_queryset().filter(employee_id=employee_id, date=check_date)
        entries = EmployeeAvailabilitySerializer(qs, many=True).data
        has_unavailability = any(e.get("availability_type") != "available" for e in entries)
        return Response({
            "employee_id": employee_id,
            "date": str(check_date),
            "entries": entries,
            "has_unavailability": has_unavailability,
        })


class EmployeeAbsenceRequestViewSet(viewsets.ModelViewSet):
    """Zgłoszenia nieobecności pracowników (urlop / dzień wolny)."""

    permission_classes = [IsStaffOrAdmin]
    serializer_class = EmployeeAbsenceRequestSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["employee", "availability_type", "status", "start_date", "end_date"]

    def get_queryset(self):
        qs = EmployeeAbsenceRequest.objects.select_related("employee", "reviewed_by").order_by("-created_at")
        user = self.request.user
        if getattr(user, "role", None) != "admin":
            qs = qs.filter(employee=user)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        mine = self.request.query_params.get("mine")
        if mine and getattr(user, "role", None) == "admin":
            employee_id = self.request.query_params.get("employee") or str(user.id)
            qs = qs.filter(employee_id=employee_id)
        if self.request.query_params.get("pending") in ("1", "true", "yes"):
            qs = qs.filter(status=AbsenceRequestStatus.PENDING)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, "role", None) != "admin":
            serializer.save(employee=user)
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        from apps.accounts.services.notification_service import notify_absence_request_created

        request_obj = EmployeeAbsenceRequest.objects.select_related("employee").get(pk=response.data["id"])
        notify_absence_request_created(request_obj)
        return response

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        if getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Brak uprawnień."}, status=403)
        obj = self.get_object()
        if obj.status != AbsenceRequestStatus.PENDING:
            return Response({"detail": "To zgłoszenie zostało już rozpatrzone."}, status=400)
        obj.status = AbsenceRequestStatus.APPROVED
        obj.reviewed_by = request.user
        obj.reviewed_at = timezone.now()
        obj.review_note = (request.data.get("review_note") or "").strip()
        obj.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note", "updated_at"])

        for day_offset in range((obj.end_date - obj.start_date).days + 1):
            current_date = obj.start_date + timedelta(days=day_offset)
            EmployeeAvailability.objects.update_or_create(
                employee=obj.employee,
                date=current_date,
                availability_type=obj.availability_type,
                defaults={
                    "is_all_day": True,
                    "start_time": None,
                    "end_time": None,
                    "note": obj.note,
                    "created_by": request.user,
                    "updated_by": request.user,
                    "is_active": True,
                },
            )

        from apps.accounts.services.notification_service import notify_absence_request_decision
        notify_absence_request_decision(obj, approved=True)
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        if getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Brak uprawnień."}, status=403)
        obj = self.get_object()
        if obj.status != AbsenceRequestStatus.PENDING:
            return Response({"detail": "To zgłoszenie zostało już rozpatrzone."}, status=400)
        obj.status = AbsenceRequestStatus.REJECTED
        obj.reviewed_by = request.user
        obj.reviewed_at = timezone.now()
        obj.review_note = (request.data.get("review_note") or "").strip()
        obj.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note", "updated_at"])

        from apps.accounts.services.notification_service import notify_absence_request_decision
        notify_absence_request_decision(obj, approved=False)
        return Response(self.get_serializer(obj).data)

