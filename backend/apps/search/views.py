"""
PRO-KOM Serwis — Widoki wyszukiwania premium.
Global Search, Intake Search, Advanced Search. Tylko staff/admin.
"""
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsStaffOrAdmin
from apps.clients.models import Client
from apps.repairs.models import RepairRequest
from apps.devices.models import Device
from .selectors import global_search, intake_search, intake_search_devices_for_client, advanced_search
from .serializers import (
    GlobalSearchClientSerializer,
    GlobalSearchRepairSerializer,
    GlobalSearchDeviceSerializer,
    IntakeSearchClientSerializer,
    IntakeSearchDeviceSerializer,
)


def _enrich_clients_for_intake(clients):
    """Dodaje repair_count, device_count, last_repair do listy klientów (do intake)."""
    if not clients:
        return
    ids = [c.id for c in clients]
    repair_counts = dict(
        RepairRequest.objects.filter(client_id__in=ids).values("client_id").annotate(c=Count("id")).values_list("client_id", "c")
    )
    device_counts = dict(
        Device.objects.filter(client_id__in=ids).values("client_id").annotate(c=Count("id")).values_list("client_id", "c")
    )
    last_repairs = (
        RepairRequest.objects.filter(client_id__in=ids)
        .select_related("device")
        .order_by("client_id", "-created_at")
    )
    by_client = {}
    for r in last_repairs:
        if r.client_id not in by_client:
            by_client[r.client_id] = r
    for c in clients:
        c._repair_count = repair_counts.get(c.id, 0)
        c._device_count = device_counts.get(c.id, 0)
        c._last_repair = by_client.get(c.id)


def _enrich_clients_for_global(clients):
    """Opcjonalne wzbogacenie dla global (counts + last_repair)."""
    if not clients:
        return
    ids = [c.id for c in clients]
    repair_counts = dict(
        RepairRequest.objects.filter(client_id__in=ids).values("client_id").annotate(c=Count("id")).values_list("client_id", "c")
    )
    device_counts = dict(
        Device.objects.filter(client_id__in=ids).values("client_id").annotate(c=Count("id")).values_list("client_id", "c")
    )
    last_repairs = (
        RepairRequest.objects.filter(client_id__in=ids)
        .select_related("device")
        .order_by("client_id", "-created_at")
    )
    by_client = {}
    for r in last_repairs:
        if r.client_id not in by_client:
            by_client[r.client_id] = r
    for c in clients:
        c._repair_count = repair_counts.get(c.id, 0)
        c._device_count = device_counts.get(c.id, 0)
        c._last_repair = by_client.get(c.id)


class GlobalSearchAPIView(APIView):
    """
    GET /api/v1/search/global/?q=...
    Global Search: klienci (indywidualni + firmy), naprawy, urządzenia.
    Wyniki grupowane. Staff/admin. Min. 2 znaki. Limit wyników (domyślnie 15).
    """
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        limit = min(int(request.query_params.get("limit", 15)), 30)
        if len(q) < 2:
            return Response({
                "clients": [],
                "repairs": [],
                "devices": [],
                "message": "Podaj parametr q (min. 2 znaki).",
            })
        data = global_search(q, limit=limit)
        _enrich_clients_for_global(data["clients"])
        # Rozdziel klientów na indywidualni i firmy (frontend może grupować)
        clients_data = GlobalSearchClientSerializer(data["clients"], many=True).data
        return Response({
            "clients": clients_data,
            "repairs": GlobalSearchRepairSerializer(data["repairs"], many=True).data,
            "devices": GlobalSearchDeviceSerializer(data["devices"], many=True).data,
        })


class IntakeSearchAPIView(APIView):
    """
    GET /api/v1/search/intake/?q=...
    Intake Search: klienci/firmy do flow przyjęcia naprawy.
    Zwraca klientów z: repair_count, device_count, last_repair_summary, badges.
    GET /api/v1/search/intake/?client_id=<uuid> — urządzenia wybranego klienta (do wyboru urządzenia).
    """
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        client_id = request.query_params.get("client_id")
        if client_id:
            devices = intake_search_devices_for_client(client_id)
            return Response({
                "clients": [],
                "devices": IntakeSearchDeviceSerializer(devices, many=True).data,
            })
        q = (request.query_params.get("q") or "").strip()
        limit = min(int(request.query_params.get("limit", 15)), 30)
        if len(q) < 2:
            return Response({
                "clients": [],
                "devices": [],
                "message": "Podaj parametr q (min. 2 znaki) lub client_id.",
            })
        data = intake_search(q, limit=limit)
        _enrich_clients_for_intake(data["clients"])
        return Response({
            "clients": IntakeSearchClientSerializer(data["clients"], many=True).data,
            "devices": [],
        })


class AdvancedSearchAPIView(APIView):
    """
    GET /api/v1/search/advanced/?q=...&type=...&status=...&repair_type=...&assigned_to=...&source=...&client_type=...&date_from=...&date_to=...
    type: clients | repairs | devices | complaints | warranties (opcjonalnie, bez type = wszystkie)
    """
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        search_type = request.query_params.get("type")
        status = request.query_params.get("status")
        repair_type = request.query_params.get("repair_type")
        assigned_to = request.query_params.get("assigned_to")
        source = request.query_params.get("source")
        client_type = request.query_params.get("client_type")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        limit = min(int(request.query_params.get("limit", 20)), 30)
        data = advanced_search(
            q=q or None,
            type=search_type,
            status=status,
            repair_type=repair_type,
            assigned_to=assigned_to,
            source=source,
            client_type=client_type,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
        )
        _enrich_clients_for_global(data["clients"])
        return Response({
            "clients": GlobalSearchClientSerializer(data["clients"], many=True).data,
            "repairs": GlobalSearchRepairSerializer(data["repairs"], many=True).data,
            "devices": GlobalSearchDeviceSerializer(data["devices"], many=True).data,
        })
