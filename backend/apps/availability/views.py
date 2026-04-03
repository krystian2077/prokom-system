"""Widoki API dostępności (pracownik: własne wpisy + odczyt zespołu; admin: wszystko)."""
from datetime import date, timedelta
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import EmployeeAvailability, EmployeeAbsenceRequest
from .serializers import EmployeeAvailabilitySerializer, EmployeeAbsenceRequestSerializer
from .permissions import IsStaffOrAdmin, can_edit_availability
from .enums import AbsenceRequestStatus



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

