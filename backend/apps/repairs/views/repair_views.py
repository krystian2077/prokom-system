"""Widoki API dla zgłoszeń napraw."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.common.permissions import get_client_for_user, IsStaffOrAdmin
from apps.common.enums import RepairStatus
from apps.repairs.models import RepairRequest, RepairNote, RepairImage
from apps.repairs.serializers import (
    RepairRequestSerializer,
    RepairRequestListSerializer,
    RepairRequestCreateSerializer,
    RepairStatusUpdateSerializer,
    RepairNoteSerializer,
    RepairImageSerializer,
)
from apps.repairs.serializers.staff_dashboard import RecentActivityEntrySerializer
from apps.repairs.serializers.timeline import (
    TimelineStatusChangeSerializer,
    TimelineNoteSerializer,
    TimelineCommunicationSerializer,
)
from apps.repairs.serializers.quick_actions import (
    AddRepairNoteSerializer,
    AssignRepairSerializer,
    QuoteRespondSerializer,
)
from apps.repairs.serializers.satisfaction_survey import SatisfactionSurveySubmitSerializer
from apps.repairs.serializers.timeline import RepairMessageSerializer
from apps.repairs.serializers.repair_request import RepairRequestStatusSerializer
from apps.repairs.selectors import (
    repair_list,
    repair_by_id,
    repair_by_number,
    staff_dashboard_data,
)
from apps.repairs.services import (
    create_repair_request,
    change_repair_status,
    assign_repair,
)


class RepairRequestViewSet(viewsets.ModelViewSet):
    """
    Lista, tworzenie, szczegóły i edycja zgłoszeń napraw.
    - Staff/Admin: pełny CRUD + change_status.
    - Klient: tylko list + retrieve własnych napraw.
    """
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    permission_classes = []  # ustawiane w get_permissions()

    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsStaffOrAdmin()]
        return [IsAuthenticated()]
    filterset_fields = ["status", "priority", "assigned_to", "client"]
    search_fields = [
        "repair_number",
        "client__first_name",
        "client__last_name",
        "client__email",
        "device__serial_number",
        "device__imei",
        "problem_description",
    ]
    ordering_fields = [
        "created_at",
        "repair_number",
        "status",
        "priority",
        "estimated_completion_date",
    ]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return RepairRequestListSerializer
        if self.action == "create":
            return RepairRequestCreateSerializer
        return RepairRequestSerializer

    def get_queryset(self):
        qs = repair_list(
            status=self.request.query_params.get("status"),
            status_in=self.request.query_params.getlist("status_in") or None,
            assigned_to_id=self.request.query_params.get("assigned_to"),
            client_id=self.request.query_params.get("client"),
            search=self.request.query_params.get("search"),
            ordering=self.request.query_params.get("ordering", "-created_at"),
        )
        # Klient widzi tylko swoje naprawy; jeśli rola client ale brak profilu — pusty zbiór
        client_profile = get_client_for_user(self.request.user)
        if client_profile is not None:
            qs = qs.filter(client_id=client_profile.id)
        elif getattr(self.request.user, "role", None) == "client":
            qs = qs.none()
        return qs

    def get_object(self):
        pk = self.kwargs.get("pk")
        if pk and len(str(pk)) > 20:
            obj = repair_by_id(pk)
        else:
            obj = repair_by_number(pk)
        if obj is None:
            raise NotFound("Zgłoszenie naprawy nie istnieje.")
        # Klient może otworzyć tylko własną naprawę (gdy ma profil i repair należy do niego)
        client_profile = get_client_for_user(self.request.user)
        if getattr(self.request.user, "role", None) == "client":
            if client_profile is None or obj.client_id != client_profile.id:
                raise PermissionDenied("Brak dostępu do tego zgłoszenia.")
        return obj

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        repair = create_repair_request(
            client_id=data["client"].id,
            device_id=data["device"].id,
            problem_description=data["problem_description"],
            created_by_id=request.user.id if request.user.is_authenticated else None,
            delivery_method=data.get("delivery_method", "in_person"),
            return_method=data.get("return_method", "in_person"),
            delivery_address_id=data.get("delivery_address").id if data.get("delivery_address") else None,
            return_address_id=data.get("return_address").id if data.get("return_address") else None,
            priority=data.get("priority", "normal"),
            is_urgent=data.get("is_urgent", False),
            is_same_day=data.get("is_same_day", False),
            is_warranty=data.get("is_warranty", False),
            requires_data_backup=data.get("requires_data_backup", False),
            source=data.get("source", "online"),
        )
        return Response(
            RepairRequestSerializer(repair).data,
            status=status.HTTP_201_CREATED,
            headers=self.get_success_headers(RepairRequestSerializer(repair).data),
        )

    @action(detail=True, methods=["post"], url_path="change-status", permission_classes=[IsStaffOrAdmin])
    def change_status(self, request, pk=None):
        """Zmiana statusu naprawy (szybka akcja). Tylko staff/admin."""
        repair = self.get_object()
        if not repair:
            return Response({"detail": "Nie znaleziono."}, status=status.HTTP_404_NOT_FOUND)

        ser = RepairStatusUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            change_repair_status(
                repair,
                new_status=ser.validated_data["new_status"],
                changed_by_id=request.user.id if request.user.is_authenticated else None,
                notes=ser.validated_data.get("notes", ""),
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            RepairRequestSerializer(repair).data,
            status=status.HTTP_200_OK,
        )

    # ---------- Etap 4: Dashboard staff ----------
    @action(detail=False, url_path="dashboard", permission_classes=[IsStaffOrAdmin])
    def dashboard(self, request):
        """
        GET /api/v1/repairs/dashboard/
        Dane do dashboardu staff: kubełki napraw + ostatnia aktywność.
        """
        user_id = request.user.id
        days = int(request.query_params.get("days_without_update", 3))
        limit = int(request.query_params.get("recent_limit", 10))
        data = staff_dashboard_data(user_id, days_without_update=days, recent_activity_limit=limit)

        list_serializer = RepairRequestListSerializer
        return Response({
            "my_new": list_serializer(data["my_new"], many=True).data,
            "my_urgent": list_serializer(data["my_urgent"], many=True).data,
            "today_to_contact": list_serializer(data["today_to_contact"], many=True).data,
            "my_in_progress": list_serializer(data["my_in_progress"], many=True).data,
            "my_overdue": list_serializer(data["my_overdue"], many=True).data,
            "ready_for_pickup": list_serializer(data["ready_for_pickup"], many=True).data,
            "without_update": list_serializer(data["without_update"], many=True).data,
            "recent_activity": RecentActivityEntrySerializer(data["recent_activity"], many=True).data,
        })

    # ---------- Etap 4: Timeline ----------
    @action(detail=True, url_path="timeline")
    def timeline(self, request, pk=None):
        """
        GET /api/v1/repairs/<id>/timeline/
        Timeline naprawy: zmiany statusu + notatki. Klient widzi tylko notatki publiczne.
        """
        repair = self.get_object()
        events = []
        for h in repair.status_history.all().order_by("-created_at"):
            events.append(("status_change", h.created_at, h))
        for n in repair.notes.all().order_by("-created_at"):
            if request.user.role in ("staff", "admin") or not n.is_internal:
                events.append(("note", n.created_at, n))
        for c in repair.communication_logs.all().order_by("-sent_at"):
            events.append(("communication", c.sent_at, c))
        events.sort(key=lambda x: x[1], reverse=True)
        result = []
        for typ, _, obj in events:
            if typ == "status_change":
                result.append(TimelineStatusChangeSerializer(obj).data)
            elif typ == "note":
                result.append(TimelineNoteSerializer(obj).data)
            else:
                result.append(TimelineCommunicationSerializer(obj).data)
        return Response(result)

    # ---------- Etap 4: Szybkie akcje — notatka ----------
    @action(detail=True, methods=["post"], url_path="notes", permission_classes=[IsStaffOrAdmin])
    def add_note(self, request, pk=None):
        """POST /api/v1/repairs/<id>/notes/ — dodaj notatkę (wewnętrzną lub publiczną)."""
        repair = self.get_object()
        ser = AddRepairNoteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        note = RepairNote.objects.create(
            repair=repair,
            author=request.user,
            note=ser.validated_data["note"],
            is_internal=ser.validated_data.get("is_internal", True),
            is_important=ser.validated_data.get("is_important", False),
        )
        return Response(RepairNoteSerializer(note).data, status=status.HTTP_201_CREATED)

    # ---------- Etap 4: Szybkie akcje — zdjęcie ----------
    @action(detail=True, methods=["post"], url_path="images", permission_classes=[IsStaffOrAdmin])
    def add_image(self, request, pk=None):
        """POST /api/v1/repairs/<id>/images/ — dodaj zdjęcie (multipart: image, caption, image_type, is_visible_to_client)."""
        repair = self.get_object()
        ser = RepairImageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(repair=repair, uploaded_by=request.user)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    # ---------- Etap 4: Szybkie akcje — przypisanie ----------
    @action(detail=True, methods=["post"], url_path="assign", permission_classes=[IsStaffOrAdmin])
    def assign(self, request, pk=None):
        """POST /api/v1/repairs/<id>/assign/ — przypisz do siebie (brak body) lub do assigned_to_id."""
        repair = self.get_object()
        ser = AssignRepairSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        assigned_to_id = ser.validated_data.get("assigned_to_id") or request.user.id
        notes = ser.validated_data.get("notes", "")
        assign_repair(repair, assigned_to_id=assigned_to_id, assigned_by_id=request.user.id, notes=notes)
        return Response(RepairRequestSerializer(repair).data, status=status.HTTP_200_OK)

    # ---------- Etap 5: Panel klienta — odpowiedź na wycenę ----------
    @action(detail=True, methods=["post"], url_path="quote-respond")
    def quote_respond(self, request, pk=None):
        """
        POST /api/v1/repairs/<id>/quote-respond/
        Klient akceptuje lub odrzuca wycenę. Tylko gdy status = quote_sent.
        """
        repair = self.get_object()
        client_profile = get_client_for_user(request.user)
        if client_profile is None or repair.client_id != client_profile.id:
            raise PermissionDenied("Brak dostępu do tej naprawy.")
        if repair.status != RepairStatus.QUOTE_SENT:
            return Response(
                {"detail": "Odpowiedź na wycenę możliwa tylko gdy wycena została wysłana."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = QuoteRespondSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        action_value = ser.validated_data["action"]
        new_status = RepairStatus.QUOTE_ACCEPTED if action_value == "accept" else RepairStatus.QUOTE_REJECTED
        try:
            change_repair_status(
                repair,
                new_status=new_status,
                changed_by_id=request.user.id,
                notes=f"Klient {action_value} wycenę.",
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RepairRequestSerializer(repair, context={"request": request}).data, status=status.HTTP_200_OK)

    # ---------- Ankieta satysfakcji (klient) ----------
    @action(detail=True, methods=["post"], url_path="submit-satisfaction-survey")
    def submit_satisfaction_survey(self, request, pk=None):
        """
        POST /api/v1/repairs/<id>/submit-satisfaction-survey/
        Body: { "rating": 1-5, "would_recommend": true/false, "comment": "..." }
        Tylko klient, po odebraniu naprawy, raz na naprawę.
        """
        repair = self.get_object()
        ser = SatisfactionSurveySubmitSerializer(
            data={**request.data, "repair": repair.id},
            context={"request": request},
        )
        ser.is_valid(raise_exception=True)
        survey = ser.save()
        return Response(
            {"id": survey.id, "rating": survey.rating, "would_recommend": survey.would_recommend},
            status=status.HTTP_201_CREATED,
        )

    # ---------- Etap 5: Panel klienta — wiadomości ----------
    @action(detail=True, url_path="messages")
    def messages(self, request, pk=None):
        """
        GET /api/v1/repairs/<id>/messages/
        Lista wiadomości (publicznych notatek) do klienta. Klient widzi tylko publiczne.
        """
        repair = self.get_object()
        if getattr(request.user, "role", None) == "client":
            client_profile = get_client_for_user(request.user)
            if client_profile is None or repair.client_id != client_profile.id:
                raise PermissionDenied("Brak dostępu.")
            qs = repair.notes.filter(is_internal=False).order_by("-created_at")
        else:
            qs = repair.notes.all().order_by("-created_at")
        return Response(RepairMessageSerializer(qs, many=True).data)

    # ---------- Etap 5: Panel klienta — status (polling) ----------
    @action(detail=True, url_path="status")
    def status(self, request, pk=None):
        """GET /api/v1/repairs/<id>/status/ — minimalny status do pollingu."""
        repair = self.get_object()
        return Response(RepairRequestStatusSerializer(repair).data)

    # ---------- Etap 5: Panel klienta — podsumowanie moich napraw ----------
    @action(detail=False, url_path="my-summary")
    def my_summary(self, request):
        """
        GET /api/v1/repairs/my-summary/
        Podsumowanie napraw klienta: liczba po statusach + ostatnie naprawy.
        Tylko dla roli client (własne naprawy).
        """
        client_profile = get_client_for_user(request.user)
        if client_profile is None:
            if getattr(request.user, "role", None) == "client":
                return Response({
                    "count": 0,
                    "by_status": {},
                    "latest_repairs": [],
                })
            return Response({"detail": "Endpoint tylko dla klienta."}, status=status.HTTP_403_FORBIDDEN)
        qs = repair_list(
            client_id=client_profile.id,
            ordering="-updated_at",
        )
        from django.db.models import Count
        by_status = dict(qs.values("status").annotate(c=Count("id")).values_list("status", "c"))
        latest = list(qs[:10])
        return Response({
            "count": qs.count(),
            "by_status": by_status,
            "latest_repairs": RepairRequestListSerializer(latest, many=True).data,
        })

    # ---------- Etap 6: Części w naprawie (part usages) ----------
    @action(detail=True, url_path="parts", permission_classes=[IsStaffOrAdmin])
    def part_usages(self, request, pk=None):
        """
        GET /api/v1/repairs/<id>/parts/ — lista użytych części.
        POST /api/v1/repairs/<id>/parts/ — dodaj część do naprawy (body: part, quantity, unit_price_used, notes).
        """
        repair = self.get_object()
        if request.method == "GET":
            from apps.inventory.serializers import PartUsageSerializer
            qs = repair.part_usages.select_related("part").order_by("-created_at")
            return Response(PartUsageSerializer(qs, many=True).data)
        from apps.inventory.models import PartUsage
        from apps.inventory.serializers import PartUsageCreateSerializer
        ser = PartUsageCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        PartUsage.objects.create(repair=repair, **ser.validated_data)
        from apps.inventory.serializers import PartUsageSerializer
        qs = repair.part_usages.select_related("part").order_by("-created_at")
        return Response(PartUsageSerializer(qs, many=True).data, status=status.HTTP_201_CREATED)

    # ---------- Etap 6: Podsumowanie kosztów i zysk ----------
    @action(detail=True, url_path="cost-summary", permission_classes=[IsStaffOrAdmin])
    def cost_summary(self, request, pk=None):
        """
        GET /api/v1/repairs/<id>/cost-summary/
        Koszty części (zakup), przychód (final_cost / wycena), zysk.
        """
        from decimal import Decimal
        repair = self.get_object()
        parts_cost = Decimal("0")
        parts_revenue = Decimal("0")
        for u in repair.part_usages.select_related("part"):
            parts_cost += u.quantity * u.part.purchase_price
            parts_revenue += u.quantity * u.unit_price_used
        revenue = repair.final_cost or repair.estimated_cost or Decimal("0")
        accepted_quote = repair.quotes.filter(status="accepted").order_by("-version").first()
        if accepted_quote:
            quote_total = accepted_quote.total_amount
        else:
            quote_total = None
        profit = revenue - parts_cost if revenue else Decimal("0")
        return Response({
            "repair_number": repair.repair_number,
            "parts_cost": str(parts_cost),
            "parts_revenue": str(parts_revenue),
            "revenue": str(revenue),
            "quote_total": str(quote_total) if quote_total is not None else None,
            "profit": str(profit),
        })
