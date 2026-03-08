"""
Staff Notifications Center — API dla pracownika.
GET lista, PATCH oznacz przeczytane/zarchiwizuj, GET wymaga reakcji.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import StaffNotification
from apps.accounts.serializers.notification_serializer import StaffNotificationSerializer
from apps.common.permissions import IsStaffOrAdmin


class StaffNotificationListView(APIView):
    """
    GET /api/v1/accounts/notifications/
    Lista powiadomień zalogowanego pracownika. Query: status, priority, type, limit.
    """
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        if request.user.role not in ("staff", "admin"):
            return Response({"detail": "Brak uprawnień."}, status=403)
        qs = StaffNotification.objects.filter(user=request.user).select_related("repair").order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        priority = request.query_params.get("priority")
        if priority:
            qs = qs.filter(priority=priority)
        notif_type = request.query_params.get("type")
        if notif_type:
            qs = qs.filter(notification_type=notif_type)
        limit = int(request.query_params.get("limit", 50))
        qs = qs[:limit]
        return Response(StaffNotificationSerializer(qs, many=True).data)


class StaffNotificationDetailView(APIView):
    """
    PATCH /api/v1/accounts/notifications/<id>/
    Oznacz jako przeczytane lub zarchiwizowane (body: status=read|archived).
    """
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def patch(self, request, pk):
        if request.user.role not in ("staff", "admin"):
            return Response({"detail": "Brak uprawnień."}, status=403)
        notif = StaffNotification.objects.filter(user=request.user, id=pk).first()
        if not notif:
            return Response({"detail": "Nie znaleziono."}, status=404)
        new_status = request.data.get("status")
        if new_status in ("read", "archived"):
            notif.status = new_status
            notif.save(update_fields=["status"])
        return Response(StaffNotificationSerializer(notif).data)


class StaffNotificationMarkAllReadView(APIView):
    """POST /api/v1/accounts/notifications/mark-all-read/ — oznacz wszystkie jako przeczytane."""
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def post(self, request):
        if request.user.role not in ("staff", "admin"):
            return Response({"detail": "Brak uprawnień."}, status=403)
        updated = StaffNotification.objects.filter(user=request.user, status="unread").update(status="read")
        return Response({"marked": updated})


class StaffNotificationRequiresActionView(APIView):
    """
    GET /api/v1/accounts/notifications/requires-action/
    Lista spraw „wymagających reakcji” dla zalogowanego pracownika (kolejka reakcji, nie tylko powiadomienia).
    Zwraca naprawy: nowa wiadomość od klienta, brak odpowiedzi, brak wyceny po SLA, zaakceptowana wycena bez zamówienia,
    reklamacja/gwarancja bez decyzji, szybkie przyjęcie nieuzupełnione, nieodebrane itd.
    """
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        if request.user.role not in ("staff", "admin"):
            return Response({"detail": "Brak uprawnień."}, status=403)
        from apps.repairs.models import RepairRequest
        from apps.repairs.serializers import RepairRequestListSerializer
        from apps.common.enums import RepairStatus

        user_id = request.user.id
        # Naprawy przypisane do usera z requires_attention=True lub spełniające kryteria
        qs = (
            RepairRequest.objects.filter(assigned_to_id=user_id)
            .filter(requires_attention=True)
            .exclude(status__in=[RepairStatus.CANCELLED, RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED])
            .select_related("client", "device")
            .order_by("-last_activity_at", "-updated_at")[:100]
        )
        # Alternatywnie: można budować listę z warunków (nowa wiadomość, brak odpowiedzi, ...) — na razie requires_attention
        return Response({
            "items": RepairRequestListSerializer(qs, many=True).data,
            "count": qs.count(),
        })
