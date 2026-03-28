"""Widoki API dla panelu pracownika (staff/admin)."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import UserRole
from apps.common.permissions import IsStaffOrAdmin
from apps.repairs.selectors import (
    repair_list,
    staff_completed_pickups_count,
    staff_dashboard_data,
    staff_dashboard_quality_metrics,
    staff_health_score,
    staff_in_repair_kpi_count,
    staff_my_active_repairs_count,
)
from apps.repairs.serializers import RepairRequestListSerializer, RepairRequestSerializer
from apps.repairs.serializers.staff_dashboard import RecentActivityEntrySerializer
from apps.repairs.models import RepairNote, RepairNoteThreadOrigin, RepairRequest
from apps.communications.models import CommunicationLog


class StaffRepairsListView(APIView):
    """
    GET /api/v1/staff/repairs/

    Lista zgłoszeń napraw widocznych dla pracownika/admina.
    Na start zwracamy całą listę z istniejącego selektora `repair_list`,
    z możliwością filtrów przez query params (status, assigned_to itd.).
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        unassigned_flag = request.query_params.get("unassigned_only", "").lower() in ("1", "true", "yes")
        repair_types_raw = (request.query_params.get("repair_types") or "").strip()
        repair_type_in = [x.strip() for x in repair_types_raw.split(",") if x.strip()] if repair_types_raw else None
        cws_in_raw = (request.query_params.get("complaint_warranty_status_in") or "").strip()
        complaint_warranty_status_in = (
            [x.strip() for x in cws_in_raw.split(",") if x.strip()] if cws_in_raw else None
        )
        is_complaint = request.query_params.get("is_complaint", "").lower() in ("1", "true", "yes")
        repair_type_single = request.query_params.get("repair_type")
        if is_complaint and not repair_type_single and not repair_type_in:
            repair_type_single = "complaint"

        qs = repair_list(
            status=request.query_params.get("status"),
            status_in=request.query_params.getlist("status_in") or None,
            assigned_to_id=request.query_params.get("assigned_to"),
            unassigned_only=unassigned_flag,
            client_id=request.query_params.get("client"),
            search=request.query_params.get("search"),
            tags=request.query_params.getlist("tags") or request.query_params.getlist("tag") or None,
            ordering=request.query_params.get("ordering", "-created_at"),
            repair_type=repair_type_single if not repair_type_in else None,
            repair_type_in=repair_type_in,
            complaint_warranty_status=request.query_params.get("complaint_warranty_status"),
            complaint_warranty_status_in=complaint_warranty_status_in,
        )
        serializer = RepairRequestListSerializer(qs, many=True)
        return Response(serializer.data)


class StaffRepairDetailView(APIView):
    """
    GET /api/v1/staff/repairs/<uuid:pk>/

    Szczegóły pojedynczej naprawy dla panelu pracownika/admina.
    Zwraca pełny `RepairRequestSerializer` (łącznie z polami wewnętrznymi).
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request, pk):
        try:
            repair = (
                RepairRequest.objects.select_related(
                    "client",
                    "device",
                    "assigned_to",
                    "created_by",
                    "delivery_address",
                    "return_address",
                )
                .prefetch_related(
                    "status_history",
                    "notes",
                    "images",
                    "accessory_interests",
                    "accessory_interests__product",
                )
                .get(pk=pk)
            )
        except RepairRequest.DoesNotExist:
            return Response({"detail": "Naprawa nie istnieje."}, status=404)

        serializer = RepairRequestSerializer(repair, context={"request": request})
        return Response(serializer.data)


class StaffDashboardView(APIView):
    """
    GET /api/v1/staff/dashboard/

    Dashboard pracownika/admina — te same kubełki co GET /api/v1/repairs/dashboard/.
    Query: days_without_update (int, domyślnie 3, min. 1), recent_limit (int, domyślnie 10),
    dashboard_scope (today|tomorrow|week|month) — okno KPI „zakończonych” (picked_up_at).
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        user_id = request.user.id
        days = max(1, int(request.query_params.get("days_without_update", 3)))
        limit = int(request.query_params.get("recent_limit", 10))
        dashboard_scope = (request.query_params.get("dashboard_scope") or "today").strip()
        data = staff_dashboard_data(user_id, days_without_update=days, recent_activity_limit=limit)
        quality = staff_dashboard_quality_metrics(user_id)
        health = staff_health_score(user_id)
        quality["health_score"] = {"level": health["level"], "factors": health["factors"]}
        completed_pickups_count = staff_completed_pickups_count(user_id, dashboard_scope)
        my_active_count = staff_my_active_repairs_count(user_id)
        is_admin = getattr(request.user, "role", None) == UserRole.ADMIN
        in_repair_kpi_count = staff_in_repair_kpi_count(user_id, is_admin=is_admin)

        list_serializer = RepairRequestListSerializer
        return Response(
            {
                "my_new": list_serializer(data["my_new"], many=True).data,
                "my_urgent": list_serializer(data["my_urgent"], many=True).data,
                "today_to_contact": list_serializer(data["today_to_contact"], many=True).data,
                "my_in_progress": list_serializer(data["my_in_progress"], many=True).data,
                "my_overdue": list_serializer(data["my_overdue"], many=True).data,
                "ready_for_pickup": list_serializer(data["ready_for_pickup"], many=True).data,
                "without_update": list_serializer(data["without_update"], many=True).data,
                "recent_activity": RecentActivityEntrySerializer(data["recent_activity"], many=True).data,
                "completed_pickups_count": completed_pickups_count,
                "my_active_count": my_active_count,
                "in_repair_kpi_count": in_repair_kpi_count,
                "quality": quality,
            }
        )


class DashboardCommsPreviewView(APIView):
    """
    GET /api/v1/repairs/dashboard-comms-preview/

    Ostatnia aktywność komunikacji na dashboardzie: wiadomości od klienta (panel / e-mail przychodzący)
    oraz wpisy z logu wysyłki (e-mail, SMS) — ten sam zakres napraw co w /communications/logs/
    (dla staff: tylko przypisane; admin: wszystkie).
    """

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        limit = min(max(1, int(request.query_params.get("limit", 8))), 30)
        role = getattr(request.user, "role", None)

        notes_qs = RepairNote.objects.filter(
            is_internal=False,
            thread_origin__in=[
                RepairNoteThreadOrigin.CLIENT,
                RepairNoteThreadOrigin.EMAIL_INBOUND,
            ],
        ).select_related("repair")

        logs_qs = CommunicationLog.objects.select_related("repair", "sent_by")

        if role == "staff":
            notes_qs = notes_qs.filter(repair__assigned_to_id=request.user.id)
            logs_qs = logs_qs.filter(repair__assigned_to_id=request.user.id)

        notes_qs = notes_qs.order_by("-created_at")[: limit * 4]
        logs_qs = logs_qs.order_by("-sent_at")[: limit * 4]

        rows = []
        for n in notes_qs:
            raw = (n.note or "").strip()
            preview = raw.replace("\n", " ")
            if len(preview) > 140:
                preview = preview[:140] + "…"
            label = (
                "E-mail od klienta"
                if n.thread_origin == RepairNoteThreadOrigin.EMAIL_INBOUND
                else "Wiadomość od klienta (panel)"
            )
            rows.append(
                {
                    "kind": "from_client",
                    "id": f"note-{n.id}",
                    "at": n.created_at.isoformat(),
                    "repair_id": str(n.repair_id),
                    "repair_number": n.repair.repair_number,
                    "label": label,
                    "preview": preview or "—",
                }
            )

        for log in logs_qs:
            rows.append(
                {
                    "kind": "to_client",
                    "id": str(log.id),
                    "at": log.sent_at.isoformat(),
                    "repair": str(log.repair_id),
                    "repair_number": log.repair.repair_number,
                    "channel": log.channel,
                    "recipient": log.recipient,
                    "subject": log.subject,
                    "body_snapshot": log.body_snapshot,
                    "sent_at": log.sent_at.isoformat(),
                    "status": log.status,
                }
            )

        rows.sort(key=lambda x: x["at"], reverse=True)
        return Response({"items": rows[:limit]})


