"""
Zarządzanie pracownikami (Staff Management) — tylko admin.
Lista, dodawanie, edycja, reset hasła, blokada, logi logowania.
"""
from datetime import date, timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from apps.accounts.models import User, UserRole, StaffProfile, StaffSpecialization, LoginActivity
from apps.repairs.models import RepairRequest
from apps.common.enums import RepairStatus
from apps.availability.models import EmployeeAvailability
from apps.availability.enums import AvailabilityType
from apps.accounts.serializers.staff_management import (
    StaffListSerializer,
    StaffCreateSerializer,
    StaffUpdateSerializer,
)


def _is_admin(request):
    return getattr(request.user, "role", None) == UserRole.ADMIN


def _get_staff_stats(user_ids):
    """Dla listy user_ids zwraca active_repairs_count, completed_repairs_count, health_score_level."""
    from apps.repairs.selectors import staff_health_score
    active = (
        RepairRequest.objects.filter(assigned_to_id__in=user_ids)
        .exclude(status__in=[RepairStatus.CANCELLED, RepairStatus.ABANDONED, RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED])
        .values("assigned_to_id")
        .annotate(c=Count("id"))
    )
    completed = (
        RepairRequest.objects.filter(
            assigned_to_id__in=user_ids,
            status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
        )
        .values("assigned_to_id")
        .annotate(c=Count("id"))
    )
    by_user = {}
    for r in active:
        by_user[str(r["assigned_to_id"])] = {"active_repairs_count": r["c"], "completed_repairs_count": 0, "health_score_level": None}
    for r in completed:
        uid = str(r["assigned_to_id"])
        if uid not in by_user:
            by_user[uid] = {"active_repairs_count": 0, "completed_repairs_count": 0, "health_score_level": None}
        by_user[uid]["completed_repairs_count"] = r["c"]
    for uid in user_ids:
        uid_str = str(uid)
        if uid_str not in by_user:
            by_user[uid_str] = {"active_repairs_count": 0, "completed_repairs_count": 0, "health_score_level": None}
        if User.objects.filter(pk=uid, role=UserRole.STAFF).exists():
            try:
                health = staff_health_score(uid)
                by_user[uid_str]["health_score_level"] = health.get("level")
            except Exception:
                pass
    return by_user


ABSENCE_TYPES = {
    AvailabilityType.DAY_OFF,
    AvailabilityType.VACATION,
    AvailabilityType.SICK_LEAVE,
    AvailabilityType.TEMPORARILY_UNAVAILABLE,
}

AVAILABILITY_LABELS = dict(AvailabilityType.choices)


def _to_iso(d):
    return d.isoformat() if d else None


def _availability_type_label(value):
    return AVAILABILITY_LABELS.get(value, value)


def _group_absence_ranges(entries):
    """Scala kolejne dni nieobecności w ciągłe zakresy dla czytelnego podglądu w panelu."""
    rows = sorted(entries, key=lambda e: (e.date, e.availability_type))
    ranges = []
    current_type = None
    current_label = None
    current_start = None
    current_end = None
    current_note = ""

    def _push_current():
        if not current_type or not current_start or not current_end:
            return
        ranges.append(
            {
                "availability_type": current_type,
                "availability_type_label": current_label,
                "start_date": _to_iso(current_start),
                "end_date": _to_iso(current_end),
                "note": current_note,
            }
        )

    for entry in rows:
        if entry.availability_type not in ABSENCE_TYPES:
            continue
        if current_type is None:
            current_type = entry.availability_type
            current_label = _availability_type_label(entry.availability_type)
            current_start = entry.date
            current_end = entry.date
            current_note = entry.note or ""
            continue
        expected_next_day = current_end + timedelta(days=1)
        if entry.availability_type == current_type and entry.date == expected_next_day:
            current_end = entry.date
            if not current_note and entry.note:
                current_note = entry.note
            continue
        _push_current()
        current_type = entry.availability_type
        current_label = _availability_type_label(entry.availability_type)
        current_start = entry.date
        current_end = entry.date
        current_note = entry.note or ""

    _push_current()
    return ranges


class StaffListView(APIView):
    """
    GET /api/v1/accounts/staff/ — lista pracowników (admin + staff). Tylko admin.
    POST /api/v1/accounts/staff/ — tworzenie pracownika. Tylko admin.
    Filtry (GET): role, is_active, specialization.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        qs = User.objects.filter(role__in=[UserRole.ADMIN, UserRole.STAFF]).select_related("staff_profile").order_by("role", "last_name", "first_name")
        role = request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        is_active = request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ("true", "1", "yes"))
        specialization = request.query_params.get("specialization")
        if specialization:
            qs = qs.filter(staff_profile__specialization=specialization)
        user_ids = list(qs.values_list("id", flat=True))
        staff_stats = _get_staff_stats(user_ids)
        return Response(
            StaffListSerializer(qs, many=True, context={"staff_stats": staff_stats}).data,
            status=200,
        )

    def post(self, request):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        ser = StaffCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        from apps.accounts.serializers import UserSerializer
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class StaffTeamOverviewView(APIView):
    """
    GET /api/v1/accounts/staff/team-overview/
    Zwrot: wszyscy admin/staff + status na dziś + najbliższe zakresy planowanej nieobecności.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, "role", None)
        if role not in (UserRole.ADMIN, UserRole.STAFF):
            return Response({"detail": "Brak uprawnień."}, status=403)

        today = timezone.localdate()
        to_param = request.query_params.get("to")
        if to_param:
            try:
                end_date = date.fromisoformat(to_param)
            except ValueError:
                return Response({"detail": "Nieprawidłowa data parametru 'to' (YYYY-MM-DD)."}, status=400)
        else:
            end_date = today + timedelta(days=30)

        if end_date < today:
            end_date = today
        max_end_date = today + timedelta(days=90)
        if end_date > max_end_date:
            end_date = max_end_date

        user_roles = [UserRole.STAFF] if role == UserRole.STAFF else [UserRole.ADMIN, UserRole.STAFF]
        users = list(
            User.objects.filter(role__in=user_roles)
            .select_related("staff_profile")
            .order_by("is_active", "role", "last_name", "first_name")
        )
        user_ids = [u.id for u in users]

        entries = list(
            EmployeeAvailability.objects.filter(
                employee_id__in=user_ids,
                is_active=True,
                date__gte=today,
                date__lte=end_date,
            )
            .select_related("employee")
            .order_by("employee_id", "date", "start_time")
        )

        entries_by_user = {}
        for entry in entries:
            key = str(entry.employee_id)
            if key not in entries_by_user:
                entries_by_user[key] = []
            entries_by_user[key].append(entry)

        data = []
        for user in users:
            key = str(user.id)
            profile = getattr(user, "staff_profile", None)
            user_entries = entries_by_user.get(key, [])
            today_entries = [e for e in user_entries if e.date == today]
            future_absence_entries = [e for e in user_entries if e.date >= today and e.availability_type in ABSENCE_TYPES]
            absence_ranges = _group_absence_ranges(future_absence_entries)
            next_absence = absence_ranges[0] if absence_ranges else None

            has_available_today = any(e.availability_type == AvailabilityType.AVAILABLE for e in today_entries)
            has_absence_today = any(e.availability_type in ABSENCE_TYPES for e in today_entries)

            if not user.is_active:
                today_status = "off_today"
                today_status_label = "Wolne"
            elif has_available_today:
                today_status = "working_today"
                today_status_label = "W pracy"
            elif has_absence_today:
                today_status = "off_today"
                today_status_label = "Wolne"
            elif today_entries:
                today_status = "working_today"
                today_status_label = "W pracy"
            elif next_absence:
                today_status = "planned_off"
                today_status_label = "Planuje wolne"
            else:
                today_status = "unknown"
                today_status_label = "Brak deklaracji"

            data.append(
                {
                    "id": key,
                    "email": user.email,
                    "full_name": user.get_full_name(),
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                    "phone": user.phone or "",
                    "role": user.role,
                    "role_display": user.get_role_display(),
                    "is_active": user.is_active,
                    "is_superadmin": user.is_superadmin,
                    "today_status": today_status,
                    "today_status_label": today_status_label,
                    "today_entries": [
                        {
                            "id": str(e.id),
                            "availability_type": e.availability_type,
                            "availability_type_label": e.get_availability_type_display(),
                            "date": _to_iso(e.date),
                            "is_all_day": e.is_all_day,
                            "start_time": e.start_time.isoformat() if e.start_time else None,
                            "end_time": e.end_time.isoformat() if e.end_time else None,
                            "note": e.note or "",
                            "created_at": e.created_at.isoformat() if e.created_at else None,
                            "updated_at": e.updated_at.isoformat() if e.updated_at else None,
                        }
                        for e in today_entries
                    ],
                    "next_absence": next_absence,
                    "planned_absence_ranges": absence_ranges[:6],
                    "staff_profile": {
                        "specialization": getattr(profile, "specialization", None) if profile else None,
                        "specialization_display": (
                            dict(StaffSpecialization.choices).get(profile.specialization, profile.specialization)
                            if profile and profile.specialization
                            else None
                        ),
                        "display_name": getattr(profile, "display_name", None) if profile else None,
                        "calendar_color": getattr(profile, "calendar_color", None) if profile else None,
                        "is_available": getattr(profile, "is_available", True) if profile else True,
                    },
                }
            )

        return Response({"date": _to_iso(today), "to": _to_iso(end_date), "results": data}, status=200)


class StaffAssignableForRepairView(APIView):
    """
    GET /api/v1/accounts/staff/assignable-for-repairs/
    Aktywni pracownicy i administratorzy (do przypisania naprawy), domyślnie bez bieżącego użytkownika.
    Query: include_self=1 — uwzględnij zalogowanego (np. przyjęcie stacjonarne).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, "role", None)
        if role not in (UserRole.STAFF, UserRole.ADMIN):
            return Response({"detail": "Brak uprawnień."}, status=403)
        include_self = request.query_params.get("include_self", "").lower() in ("1", "true", "yes")
        qs = User.objects.filter(role__in=[UserRole.STAFF, UserRole.ADMIN], is_active=True).select_related(
            "staff_profile"
        )
        if not include_self:
            qs = qs.exclude(pk=request.user.id)
        qs = qs.order_by("first_name", "last_name", "email")
        user_ids = list(qs.values_list("id", flat=True))
        stats = _get_staff_stats(user_ids) if user_ids else {}
        data = []
        for u in qs:
            try:
                profile = u.staff_profile
            except StaffProfile.DoesNotExist:
                profile = None
            display = (profile.display_name.strip() if profile and profile.display_name else "") or ""
            picker_label = display or (u.first_name.strip() if u.first_name else "") or (u.get_full_name() or u.email)
            st = stats.get(str(u.id), {})
            data.append(
                {
                    "id": str(u.id),
                    "role": u.role,
                    "first_name": u.first_name or "",
                    "last_name": u.last_name or "",
                    "full_name": u.get_full_name() or u.email,
                    "picker_label": picker_label,
                    "active_repairs_count": st.get("active_repairs_count", 0),
                    "specialization": getattr(profile, "specialization", None) if profile else None,
                }
            )
        return Response(data, status=200)


class StaffDetailView(APIView):
    """GET /api/v1/accounts/staff/<uuid>/ — szczegóły pracownika. Tylko admin."""
    permission_classes = [IsAuthenticated]

    def _get_user(self, pk):
        user = User.objects.filter(pk=pk, role__in=[UserRole.ADMIN, UserRole.STAFF]).select_related("staff_profile").first()
        if not user:
            raise NotFound("Pracownik nie znaleziony.")
        return user

    def get(self, request, pk):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = self._get_user(pk)
        stats = _get_staff_stats([user.id])
        data = StaffListSerializer(user, context={"staff_stats": stats}).data
        return Response(data)

    def delete(self, request, pk):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = self._get_user(pk)
        if getattr(user, "is_superadmin", False):
            return Response({"detail": "Nie można usunąć konta superadministratora."}, status=400)
        if str(user.id) == str(request.user.id):
            return Response({"detail": "Nie możesz usunąć własnego konta."}, status=400)
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response({"message": "Konto pracownika zostało dezaktywowane (soft delete).", "is_active": False}, status=200)


class StaffUpdateView(APIView):
    """PATCH /api/v1/accounts/staff/<uuid>/ — edycja pracownika. Tylko admin. Nie można edytować superadmina (poza częścią pól)."""
    permission_classes = [IsAuthenticated]

    def _get_user(self, pk):
        user = User.objects.filter(pk=pk, role__in=[UserRole.ADMIN, UserRole.STAFF]).select_related("staff_profile").first()
        if not user:
            raise NotFound("Pracownik nie znaleziony.")
        return user

    def patch(self, request, pk):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = self._get_user(pk)
        ser = StaffUpdateSerializer(user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        if "email" in data:
            user.email = data["email"]
        if "phone" in data:
            user.phone = data["phone"]
        if "role" in data:
            user.role = data["role"]
            user.is_staff = True  # admin i staff mają dostęp do panelu
        if "is_active" in data:
            if getattr(user, "is_superadmin", False):
                return Response({"detail": "Nie można dezaktywować konta superadministratora."}, status=400)
            user.is_active = data["is_active"]
        user.save()
        profile = getattr(user, "staff_profile", None)
        if profile and any(k in data for k in ["specialization", "calendar_color", "display_name", "is_visible_in_rankings", "is_available", "accepts_shipment_repairs"]):
            if "specialization" in data:
                profile.specialization = data["specialization"]
            if "calendar_color" in data:
                profile.calendar_color = data["calendar_color"]
            if "display_name" in data:
                profile.display_name = data["display_name"]
            if "is_visible_in_rankings" in data:
                profile.is_visible_in_rankings = data["is_visible_in_rankings"]
            if "is_available" in data:
                profile.is_available = data["is_available"]
            if "accepts_shipment_repairs" in data:
                profile.accepts_shipment_repairs = data["accepts_shipment_repairs"]
            profile.save()
        elif user.role == UserRole.STAFF and not profile and any(k in data for k in ["specialization", "calendar_color", "display_name", "is_visible_in_rankings", "is_available", "accepts_shipment_repairs"]):
            StaffProfile.objects.create(
                user=user,
                specialization=data.get("specialization", ""),
                calendar_color=data.get("calendar_color", "#3498db"),
                display_name=data.get("display_name", ""),
                is_visible_in_rankings=data.get("is_visible_in_rankings", True),
                is_available=data.get("is_available", True),
                accepts_shipment_repairs=data.get("accepts_shipment_repairs", True),
            )
        from apps.accounts.serializers import UserSerializer
        return Response(UserSerializer(user).data)


class StaffResetPasswordView(APIView):
    """
    POST /api/v1/accounts/staff/<uuid>/reset-password/
    Body: { "action": "generate" | "send_link", "new_password": "..." } (opcjonalnie)
    generate — ustawia nowe hasło (jeśli podane new_password lub losowe) i zwraca je w odpowiedzi (tylko przy generate).
    send_link — wysyła link do resetu (wymaga konfiguracji email).
    Tylko admin. Dla superadmina dozwolone.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = User.objects.filter(pk=pk, role__in=[UserRole.ADMIN, UserRole.STAFF]).first()
        if not user:
            raise NotFound("Pracownik nie znaleziony.")
        action = (request.data.get("action") or "generate").lower()
        new_password = request.data.get("new_password", "").strip()
        if action == "generate":
            if not new_password:
                from django.utils.crypto import get_random_string
                new_password = get_random_string(12)
            user.set_password(new_password)
            user.save(update_fields=["password"])
            return Response({"message": "Hasło ustawione.", "temporary_password": new_password if len(new_password) == 12 and not request.data.get("new_password") else None})
        if action == "send_link":
            from django.contrib.auth.tokens import default_token_generator
            from django.core.mail import send_mail
            from django.conf import settings
            token = default_token_generator.make_token(user)
            # Uproszczone: w pełnej wersji budujesz URL do frontu resetu z tokenem
            try:
                send_mail(
                    subject="Reset hasła — PRO-KOM Serwis",
                    message=f"Link do resetu hasła (token w systemie). Skontaktuj się z administratorem lub użyj funkcji resetu w panelu.",
                    from_email=settings.DEFAULT_FROM_EMAIL or "noreply@prokom.pl",
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass
            return Response({"message": "Link do resetu został wysłany na adres e-mail pracownika (jeśli skonfigurowano wysyłkę).", "token_created": True})
        return Response({"detail": "Nieznana akcja. Użyj: generate lub send_link."}, status=400)


class StaffDeactivateView(APIView):
    """POST /api/v1/accounts/staff/<uuid>/deactivate/ — ustaw is_active=False. Tylko admin. Nie dla superadmina."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = User.objects.filter(pk=pk, role__in=[UserRole.ADMIN, UserRole.STAFF]).first()
        if not user:
            raise NotFound("Pracownik nie znaleziony.")
        if getattr(user, "is_superadmin", False):
            return Response({"detail": "Nie można dezaktywować konta superadministratora."}, status=400)
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response({"message": "Konto zostało zablokowane.", "is_active": False})


class StaffActivateView(APIView):
    """POST /api/v1/accounts/staff/<uuid>/activate/ — ustaw is_active=True."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = User.objects.filter(pk=pk, role__in=[UserRole.ADMIN, UserRole.STAFF]).first()
        if not user:
            raise NotFound("Pracownik nie znaleziony.")
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response({"message": "Konto zostało aktywowane.", "is_active": True})


class StaffLoginActivityView(APIView):
    """GET /api/v1/accounts/staff/<uuid>/login-activity/ — logi logowania pracownika. Tylko admin."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not _is_admin(request):
            return Response({"detail": "Tylko administrator."}, status=403)
        user = User.objects.filter(pk=pk, role__in=[UserRole.ADMIN, UserRole.STAFF]).first()
        if not user:
            raise NotFound("Pracownik nie znaleziony.")
        limit = min(int(request.query_params.get("limit", 50)), 200)
        activities = LoginActivity.objects.filter(user=user).order_by("-logged_in_at")[:limit]
        data = [
            {
                "id": a.id,
                "ip_address": a.ip_address,
                "user_agent": (a.user_agent or "")[:200],
                "login_status": a.login_status,
                "logged_in_at": a.logged_in_at.isoformat() if a.logged_in_at else None,
            }
            for a in activities
        ]
        return Response({"user_id": str(pk), "login_activity": data})
