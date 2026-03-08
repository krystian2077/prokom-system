"""Widoki API dostępności (pracownik: własne wpisy + odczyt zespołu; admin: wszystko)."""
from datetime import date, timedelta
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import EmployeeAvailability
from .serializers import EmployeeAvailabilitySerializer
from .permissions import IsStaffOrAdmin, can_edit_availability


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
