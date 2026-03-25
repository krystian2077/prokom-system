"""Widoki API dla zgłoszeń napraw."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.common.permissions import get_client_for_user, IsStaffOrAdmin
from apps.common.enums import RepairStatus
from apps.repairs.models import (
    RepairRequest,
    RepairNote,
    RepairImage,
    ChecklistRun,
    ChecklistRunItem,
    ChecklistTemplate,
)
from apps.repairs.serializers import (
    RepairRequestSerializer,
    RepairRequestListSerializer,
    RepairRequestCreateSerializer,
    RepairStatusUpdateSerializer,
    RepairNoteSerializer,
    RepairImageSerializer,
    ChecklistRunSerializer,
    ChecklistRunItemSerializer,
    ChecklistRunItemUpdateSerializer,
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
    QuickAcceptSerializer,
    MarkPackageReceivedSerializer,
)
from apps.repairs.serializers.satisfaction_survey import SatisfactionSurveySubmitSerializer
from apps.repairs.serializers.timeline import RepairMessageSerializer
from apps.repairs.serializers.repair_request import RepairRequestStatusSerializer
from apps.repairs.selectors import (
    repair_list,
    repair_by_id,
    repair_by_number,
    staff_dashboard_data,
    staff_dashboard_quality_metrics,
    staff_health_score,
    pickup_panel_data,
    repairs_overdue,
)
from apps.repairs.services import (
    create_repair_request,
    change_repair_status,
    assign_repair,
)
from apps.repairs.services.repair_creation import quick_accept_repair
from apps.repairs.services.assignment_suggest import suggest_assignment
from datetime import timedelta
from django.utils import timezone


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
    filterset_fields = [
        "status", "priority", "assigned_to", "client", "is_incomplete",
        "repair_type", "complaint_warranty_status",
    ]
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
        tags_param = self.request.query_params.getlist("tags") or self.request.query_params.getlist("tag")
        qs = repair_list(
            status=self.request.query_params.get("status"),
            status_in=self.request.query_params.getlist("status_in") or None,
            assigned_to_id=self.request.query_params.get("assigned_to"),
            client_id=self.request.query_params.get("client"),
            search=self.request.query_params.get("search"),
            tags=tags_param or None,
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
            assigned_to_id=data.get("assigned_to").id if data.get("assigned_to") else None,
            parent_repair_id=data.get("parent_repair").id if data.get("parent_repair") else None,
            repair_type=data.get("repair_type", "standard"),
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

    @action(detail=False, methods=["post"], url_path="quick-accept", permission_classes=[IsStaffOrAdmin])
    def quick_accept(self, request):
        """
        POST /api/v1/repairs/quick-accept/
        Szybkie przyjęcie (prokom.md): minimalne dane, is_incomplete=True, source=in_person.
        Body: problem_description + (client_id i device_id) LUB (first_name, last_name, phone, email, device_category [, device_model_name]).
        """
        ser = QuickAcceptSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        try:
            repair = quick_accept_repair(
                created_by_id=request.user.id,
                problem_description=data["problem_description"],
                client_id=data.get("client_id"),
                device_id=data.get("device_id"),
                first_name=data.get("first_name") or None,
                last_name=data.get("last_name") or None,
                phone=data.get("phone") or None,
                email=data.get("email") or None,
                device_category=data.get("device_category"),
                device_model_name=data.get("device_model_name") or None,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            RepairRequestSerializer(repair).data,
            status=status.HTTP_201_CREATED,
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
        quality = staff_dashboard_quality_metrics(user_id)
        health = staff_health_score(user_id)
        quality["health_score"] = {"level": health["level"], "factors": health["factors"]}

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
            "quality": quality,
        })

    @action(detail=False, url_path="pickup-panel", permission_classes=[IsStaffOrAdmin])
    def pickup_panel(self, request):
        """
        GET /api/v1/repairs/pickup-panel/?assigned_to=<uuid>
        Panel odbiorów: gotowe do odbioru, nieodebrane 3/7 dni, do wysyłki zwrotnej, wydane dziś.
        """
        assigned_to_id = request.query_params.get("assigned_to")
        data = pickup_panel_data(assigned_to_id=assigned_to_id)
        list_serializer = RepairRequestListSerializer
        return Response({
            "ready_for_pickup": list_serializer(data["ready_for_pickup"], many=True).data,
            "unclaimed_3_days": list_serializer(data["unclaimed_3_days"], many=True).data,
            "unclaimed_7_days": list_serializer(data["unclaimed_7_days"], many=True).data,
            "to_prepare_shipment": list_serializer(data["to_prepare_shipment"], many=True).data,
            "issued_today": list_serializer(data["issued_today"], many=True).data,
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

    # ---------- Etap 4.5: Checklista (pracownik) ----------
    @action(detail=True, methods=["get"], url_path="checklist", permission_classes=[IsStaffOrAdmin])
    def checklist(self, request, pk=None):
        """
        GET /api/v1/repairs/<id>/checklist/
        - jeśli checklist run nie istnieje: tworzymy run na podstawie szablonu dla kategorii urządzenia
        - zwracamy run + pozycje (dla UI pracownika)
        """
        repair = self.get_object()

        device_category = getattr(getattr(repair, "device", None), "category", None)
        templates_qs = ChecklistTemplate.objects.filter(is_active=True)
        if device_category:
            templates_qs = templates_qs.filter(device_category_code=device_category)
        template = templates_qs.order_by("-created_at").first()
        if not template:
            template = ChecklistTemplate.objects.filter(is_active=True).order_by("-created_at").first()

        if not template:
            return Response({"run": None, "items": []})

        run = (
            repair.checklist_runs.select_related("template", "started_by")
            .order_by("-started_at")
            .first()
        )

        # Jeśli run nie istnieje — utwórz domyślną listę pozycji z szablonu
        if not run:
            run = ChecklistRun.objects.create(repair=repair, template=template, started_by=request.user, status="in_progress")
            items = template.items.all().order_by("sort_order")
            for ti in items:
                ChecklistRunItem.objects.create(run=run, template_item=ti, result="", note="")
        else:
            # Dopilnujmy spójności (jeśli szablon zmienił się po utworzeniu run)
            existing_ids = set(run.items.values_list("template_item_id", flat=True))
            for ti in template.items.all().order_by("sort_order"):
                if ti.id in existing_ids:
                    continue
                ChecklistRunItem.objects.create(run=run, template_item=ti, result="", note="")

        items_qs = run.items.select_related("template_item", "checked_by").order_by("template_item__sort_order")
        return Response(
            {
                "run": ChecklistRunSerializer(run).data,
                "items": ChecklistRunItemSerializer(items_qs, many=True).data,
            }
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="checklist/item",
        permission_classes=[IsStaffOrAdmin],
    )
    def checklist_item(self, request, pk=None):
        """
        PATCH /api/v1/repairs/<id>/checklist/item/
        Body: { item_id, checked?, result?, note? }
        """
        repair = self.get_object()
        ser = ChecklistRunItemUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        item_id = ser.validated_data["item_id"]
        try:
            item = (
                ChecklistRunItem.objects.select_related(
                    "run",
                    "run__repair",
                    "checked_by",
                    "template_item",
                )
                .get(id=item_id, run__repair=repair)
            )
        except ChecklistRunItem.DoesNotExist:
            raise NotFound("Pozycja checklista nie istnieje.")

        checked = ser.validated_data.get("checked")
        result = ser.validated_data.get("result")
        note = ser.validated_data.get("note")

        # checkbox: checked -> result (niepuste = odhaczone)
        if checked is not None:
            if checked:
                if result is not None and str(result).strip():
                    item.result = str(result)
                else:
                    item.result = "checked"
                item.checked_by = request.user
                item.checked_at = timezone.now()
            else:
                item.result = ""
                item.checked_by = None
                item.checked_at = None

        if result is not None:
            item.result = result or ""
            if str(result).strip():
                item.checked_by = request.user
                item.checked_at = timezone.now()
            else:
                item.checked_by = None
                item.checked_at = None

        if note is not None:
            item.note = note or ""

        item.save(update_fields=["result", "note", "checked_by", "checked_at"])

        # Aktualizuj status run (prosto: gdy wszystkie mają wynik niepusty => completed)
        run = item.run
        all_items = run.items.all()
        if all(i.result and str(i.result).strip() for i in all_items):
            run.status = "completed"
            if not run.completed_at:
                run.completed_at = timezone.now()
            run.save(update_fields=["status", "completed_at"])
        else:
            run.status = "in_progress"
            if run.completed_at:
                run.completed_at = None
            run.save(update_fields=["status", "completed_at"])

        return Response(ChecklistRunItemSerializer(item).data)

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
            note_type=ser.validated_data.get("note_type", RepairNote.NOTE_TYPE_INTERNAL),
            pinned=ser.validated_data.get("pinned", False),
        )
        from apps.accounts.services.notification_service import notify_note_added

        notify_note_added(
            repair,
            note_author_id=request.user.id,
            assigned_to_id=repair.assigned_to_id,
            is_internal=note.is_internal,
            note_preview=note.note or "",
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
        """
        POST /api/v1/repairs/<id>/assign/
        Admin: może przypisać do dowolnego pracownika (assigned_to_id w body).
        Staff: może tylko przypisać do siebie (body ignorowane).
        """
        from django.contrib.auth import get_user_model
        repair = self.get_object()
        ser = AssignRepairSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        notes = ser.validated_data.get("notes", "")
        if getattr(request.user, "role", None) == "admin":
            assigned_to_id = ser.validated_data.get("assigned_to_id") or request.user.id
            if assigned_to_id:
                assignee = get_user_model().objects.filter(pk=assigned_to_id).first()
                if not assignee or getattr(assignee, "role", None) not in ("staff", "admin"):
                    return Response(
                        {"detail": "Przypisanie tylko do pracownika lub administratora."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        else:
            assigned_to_id = request.user.id
        assign_repair(repair, assigned_to_id=assigned_to_id, assigned_by_id=request.user.id, notes=notes)
        from apps.accounts.services.notification_service import notify_repair_assigned
        notify_repair_assigned(repair, assigned_to_id)
        return Response(RepairRequestSerializer(repair).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="suggest-assignment", permission_classes=[IsStaffOrAdmin])
    def suggest_assignment_view(self, request, pk=None):
        """GET /api/v1/repairs/<id>/suggest-assignment/ — sugerowany pracownik według kategorii urządzenia."""
        repair = self.get_object()
        user = suggest_assignment(repair)
        if not user:
            return Response({"suggested_user_id": None, "suggested_user": None})
        return Response({
            "suggested_user_id": str(user.id),
            "suggested_user": {"id": str(user.id), "email": user.email, "full_name": user.get_full_name()},
        })

    @action(detail=True, methods=["post"], url_path="mark-package-received", permission_classes=[IsStaffOrAdmin])
    def mark_package_received(self, request, pk=None):
        """
        POST /api/v1/repairs/<id>/mark-package-received/
        Oznaczenie odbioru paczki z urządzeniem (package_ok, request_number_attached, notes, opcjonalnie zdjęcie).
        """
        repair = self.get_object()
        ser = MarkPackageReceivedSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        repair.package_received_at = timezone.now()
        repair.package_received_by_id = request.user.id
        repair.package_ok = data.get("package_ok")
        repair.request_number_attached = data.get("request_number_attached")
        repair.package_notes = data.get("package_notes", "") or repair.package_notes
        if request.FILES.get("package_photo"):
            repair.package_photo = request.FILES["package_photo"]
        repair.save(update_fields=[
            "package_received_at", "package_received_by_id", "package_ok",
            "request_number_attached", "package_notes", "package_photo",
        ])
        new_status = data.get("change_status_to")
        if new_status:
            try:
                change_repair_status(
                    repair,
                    new_status=new_status,
                    changed_by_id=request.user.id,
                    notes="Odebrano paczkę z urządzeniem.",
                )
            except ValueError:
                pass
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
        comment = ser.validated_data.get("comment", "")
        # Znajdź wycenę w statusie "sent" i zapisz decyzję (QuoteDecision)
        from apps.pricing.models import Quote
        from apps.pricing.services import save_quote_decision
        sent_quote = repair.quotes.filter(status="sent").order_by("-sent_at").first()
        if sent_quote:
            save_quote_decision(
                sent_quote,
                decision="accepted" if action_value == "accept" else "rejected",
                decided_by_id=request.user.id if request.user.is_authenticated else None,
                comment=comment,
            )
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
        from apps.accounts.services.notification_service import notify_quote_accepted, notify_quote_rejected
        if action_value == "accept":
            notify_quote_accepted(repair)
        else:
            notify_quote_rejected(repair)
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

    @action(detail=True, methods=["post"], url_path="set-inbound-tracking")
    def set_inbound_tracking(self, request, pk=None):
        """
        POST /api/v1/repairs/<id>/set-inbound-tracking/
        Body: { "tracking_number": "..." } — opcjonalny numer listu przewozowego (wysyłka do serwisu).
        Klient może ustawić tylko dla własnej naprawy.
        """
        repair = self.get_object()
        if getattr(request.user, "role", None) == "client":
            client_profile = get_client_for_user(request.user)
            if client_profile is None or repair.client_id != client_profile.id:
                raise PermissionDenied("Brak dostępu do tej naprawy.")
        tracking = (request.data.get("tracking_number") or "").strip()[:100]
        repair.client_tracking_number = tracking
        repair.save(update_fields=["client_tracking_number", "updated_at"])
        return Response(RepairRequestSerializer(repair, context={"request": request}).data, status=status.HTTP_200_OK)

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
            qs = repair.part_usages.select_related("part", "supplier").order_by("-created_at")
            return Response(PartUsageSerializer(qs, many=True).data)
        from apps.inventory.models import PartUsage
        from apps.inventory.serializers import PartUsageCreateSerializer
        ser = PartUsageCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        PartUsage.objects.create(
            repair=repair,
            added_by=request.user,
            **ser.validated_data,
        )
        from apps.inventory.serializers import PartUsageSerializer
        qs = repair.part_usages.select_related("part", "supplier").order_by("-created_at")
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
            cost_per_unit = u.purchase_cost if u.purchase_cost is not None else (u.part.purchase_price or 0)
            parts_cost += u.quantity * cost_per_unit
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

    # ---------- Widoki specjalne (prokom.md) ----------
    @action(detail=False, url_path="special-views/requires-action", permission_classes=[IsStaffOrAdmin])
    def requires_action(self, request):
        """
        GET /api/v1/repairs/special-views/requires-action/
        Co dziś wymaga reakcji: do wyceny, do kontaktu, do zamówienia, szybkie przyjęcia do uzupełnienia, gotowe do odbioru, zaległe.
        Query: assigned_to (uuid), date (optional).
        """
        from django.db.models import Q
        user_id = request.query_params.get("assigned_to")
        qs = repair_list(assigned_to_id=user_id)
        statuses_action = [
            RepairStatus.QUOTE_PENDING,
            RepairStatus.QUOTE_SENT,
            RepairStatus.QUOTE_ACCEPTED,
            RepairStatus.READY_FOR_PICKUP,
        ]
        overdue_ids = list(repairs_overdue().values_list("id", flat=True))
        qs = qs.filter(
            Q(status__in=statuses_action) | Q(is_incomplete=True) | Q(id__in=overdue_ids)
        ).distinct().order_by("-created_at")[:100]
        return Response(RepairRequestListSerializer(qs, many=True).data)

    @action(detail=False, url_path="special-views/unclaimed-devices", permission_classes=[IsStaffOrAdmin])
    def unclaimed_devices(self, request):
        """
        GET /api/v1/repairs/special-views/unclaimed-devices/?days_min=3
        Urządzenia gotowe do odbioru nieodebrane od N dni (3, 7, 14, 30).
        """
        days_min = int(request.query_params.get("days_min", 3))
        threshold = timezone.now() - timedelta(days=days_min)
        qs = (
            RepairRequest.objects.filter(
                status=RepairStatus.READY_FOR_PICKUP,
                ready_for_pickup_at__lt=threshold,
            )
            .select_related("client", "device", "assigned_to")
            .order_by("ready_for_pickup_at")[:100]
        )
        return Response(RepairRequestListSerializer(qs, many=True).data)

    @action(detail=False, url_path="special-views/requires-decision", permission_classes=[IsStaffOrAdmin])
    def requires_decision(self, request):
        """
        GET /api/v1/repairs/special-views/requires-decision/
        Wymaga decyzji: czeka na decyzję klienta (quote_sent), czeka na odpowiedź staff, czeka na część.
        """
        qs = repair_list(
            status_in=[
                RepairStatus.QUOTE_SENT,
                RepairStatus.QUOTE_ACCEPTED,
                RepairStatus.WAITING_FOR_PARTS,
            ],
        ).order_by("-updated_at")[:100]
        return Response(RepairRequestListSerializer(qs, many=True).data)

    # ---------- Inteligentny system dopierania do sprzedaży (prokom.md) ----------
    @action(detail=True, url_path="recommended-products", permission_classes=[IsStaffOrAdmin])
    def recommended_products(self, request, pk=None):
        """
        GET /api/v1/repairs/<id>/recommended-products/
        Rekomendowane akcesoria, pakiety i Hammer Glass dla tej naprawy (dopasowanie do kategorii urządzenia).
        """
        repair = self.get_object()
        category = repair.device.category if repair.device else None
        if not category:
            return Response({"accessories": [], "bundles": [], "hammer_glass": []})

        from apps.accessories.models import AccessoryProduct, AccessoryBundle
        from apps.accessories.serializers import AccessoryProductListSerializer
        from apps.accessories.serializers.bundle import AccessoryBundleListSerializer
        from apps.hammer_glass.models import HammerGlassProduct
        from apps.hammer_glass.serializers import HammerGlassProductListSerializer

        accessories = [
            p for p in AccessoryProduct.objects.filter(is_active=True).select_related("category")
            if p.compatible_with_category(category)
        ][:15]
        # Pakiety zawierające co najmniej jeden produkt dopasowany do kategorii
        bundle_ids = set()
        for bundle in AccessoryBundle.objects.filter(is_active=True).prefetch_related("items__product"):
            if any(bi.product.compatible_with_category(category) for bi in bundle.items.all()):
                bundle_ids.add(bundle.id)
        bundles = AccessoryBundle.objects.filter(id__in=bundle_ids).order_by("sort_order", "name")[:10]
        hammer_glass = [
            p for p in HammerGlassProduct.objects.filter(is_active=True)
            if p.compatible_with_category(category)
        ][:15]

        return Response({
            "accessories": AccessoryProductListSerializer(accessories, many=True).data,
            "bundles": AccessoryBundleListSerializer(bundles, many=True).data,
            "hammer_glass": HammerGlassProductListSerializer(hammer_glass, many=True).data,
        })
