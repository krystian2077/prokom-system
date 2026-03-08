"""Widoki API zadań (staff: swoje, admin: wszystkie)."""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Task, TaskComment
from .enums import TaskStatus, TaskPriority
from .serializers import (
    TaskListSerializer,
    TaskSerializer,
    TaskCreateUpdateSerializer,
    TaskCommentSerializer,
)
from .permissions import IsStaffOrAdmin, can_see_task, can_edit_task


class TaskViewSet(viewsets.ModelViewSet):
    """
    Zadania wewnętrzne.
    Staff: widzi tylko zadania przypisane do siebie. Może tworzyć dla każdego.
    Admin: widzi i edytuje wszystko, może przepisywać.
    """
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "priority", "assigned_to", "created_by", "is_archived"]

    def get_queryset(self):
        qs = Task.objects.select_related(
            "created_by", "assigned_to",
            "related_repair", "related_client", "related_customer_order", "related_store_order",
        ).prefetch_related("comments").annotate(comment_count=Count("comments")).order_by("-created_at")
        if getattr(self.request.user, "role", None) == "admin":
            return qs
        return qs.filter(assigned_to=self.request.user)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return TaskCreateUpdateSerializer
        if self.action == "list":
            return TaskListSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        self._notify_task_assigned(task)

    def perform_update(self, serializer):
        old_task = serializer.instance
        old_assigned = old_task.assigned_to_id
        old_status = old_task.status
        old_due = old_task.due_date
        task = serializer.save()
        if task.assigned_to_id != old_assigned:
            self._notify_task_assigned(task)
        if task.status != old_status and task.status == TaskStatus.COMPLETED:
            task.completed_at = timezone.now()
            task.save(update_fields=["completed_at"])
        if task.due_date != old_due:
            self._notify_due_changed(task)

    def retrieve(self, request, *args, **kwargs):
        task = self.get_object()
        if not can_see_task(request.user, task):
            return Response({"detail": "Brak dostępu do tego zadania."}, status=403)
        return super().retrieve(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if not can_see_task(request.user, task):
            return Response({"detail": "Brak dostępu."}, status=403)
        if not can_edit_task(request.user, task):
            return Response({"detail": "Tylko administrator może usuwać zadania."}, status=403)
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        if not can_see_task(request.user, task):
            return Response({"detail": "Brak dostępu do tego zadania."}, status=403)
        if not can_edit_task(request.user, task):
            if task.assigned_to_id != request.user.id:
                return Response({"detail": "Brak dostępu do edycji tego zadania."}, status=403)
            # Staff może zmieniać tylko status swojego zadania
            if set(request.data.keys()) - {"status"}:
                return Response(
                    {"detail": "Pracownik może zmieniać tylko status zadania. Pełna edycja: administrator."},
                    status=403,
                )
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="comments")
    def add_comment(self, request, pk=None):
        """POST /tasks/<id>/comments/ — dodaj komentarz. Dostęp: przypisany lub admin."""
        task = self.get_object()
        if not can_see_task(request.user, task):
            return Response({"detail": "Brak dostępu."}, status=403)
        ser = TaskCommentSerializer(data=request.data, context={"request": request, "task": task})
        ser.is_valid(raise_exception=True)
        comment = ser.save()
        self._notify_comment_added(task, comment)
        return Response(TaskCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=False, url_path="mine")
    def mine(self, request):
        """Moje zadania (alias dla list z filtrem assigned_to=current user)."""
        self.queryset = self.get_queryset()
        return self.list(request)

    @action(detail=False, url_path="due-today")
    def due_today(self, request):
        """Zadania na dziś (termin = dziś, nie zakończone)."""
        qs = self.get_queryset().exclude(status__in=[TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        qs = qs.filter(due_date__gte=today_start, due_date__lt=today_end)
        return Response(TaskListSerializer(qs[:100], many=True).data)

    @action(detail=False, url_path="urgent")
    def urgent(self, request):
        """Pilne (priorytet urgent, nie zakończone)."""
        qs = self.get_queryset().exclude(status__in=[TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        qs = qs.filter(priority=TaskPriority.URGENT)
        return Response(TaskListSerializer(qs[:100], many=True).data)

    @action(detail=False, url_path="overdue")
    def overdue(self, request):
        """Zaległe (termin w przeszłości, nie zakończone)."""
        qs = self.get_queryset().exclude(status__in=[TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        qs = qs.filter(due_date__lt=timezone.now())
        return Response(TaskListSerializer(qs[:100], many=True).data)

    @action(detail=False, url_path="completed")
    def completed(self, request):
        """Zakończone."""
        qs = self.get_queryset().filter(status=TaskStatus.COMPLETED)
        return Response(TaskListSerializer(qs[:100], many=True).data)

    @action(detail=False, url_path="no-due-date")
    def no_due_date(self, request):
        """Bez terminu (tylko admin ma sens)."""
        qs = self.get_queryset().exclude(status__in=[TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        qs = qs.filter(due_date__isnull=True)
        return Response(TaskListSerializer(qs[:100], many=True).data)

    @action(detail=False, url_path="dashboard")
    def dashboard(self, request):
        """Liczby do dashboardu: na dziś, pilne, zaległe, nowe (dla zalogowanego)."""
        qs = self.get_queryset().exclude(status__in=[TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        due_today_count = qs.filter(due_date__gte=today_start, due_date__lt=today_end).count()
        urgent_count = qs.filter(priority=TaskPriority.URGENT).count()
        overdue_count = qs.filter(due_date__lt=timezone.now()).count()
        new_count = self.get_queryset().filter(status=TaskStatus.NEW).count()
        return Response({
            "due_today_count": due_today_count,
            "urgent_count": urgent_count,
            "overdue_count": overdue_count,
            "new_count": new_count,
        })

    @action(detail=False, url_path="team-dashboard")
    def team_dashboard(self, request):
        """Dashboard zespołu (tylko admin): otwarte, zaległe, pilne, liczba per pracownik."""
        if getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Tylko administrator."}, status=403)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        qs = Task.objects.exclude(status__in=[TaskStatus.COMPLETED, TaskStatus.CANCELLED]).exclude(is_archived=True)
        open_count = qs.count()
        overdue_count = qs.filter(due_date__lt=timezone.now()).count()
        urgent_count = qs.filter(priority=TaskPriority.URGENT).count()
        no_due_count = qs.filter(due_date__isnull=True).count()
        by_user = dict(
            qs.values_list("assigned_to_id").annotate(c=Count("id")).values_list("assigned_to_id", "c")
        )
        by_assigned = []
        for uid, count in by_user.items():
            if uid:
                u = User.objects.filter(id=uid).first()
                by_assigned.append({"user_id": str(uid), "user_name": u.get_full_name() or u.email if u else "", "count": count})
        return Response({
            "open_count": open_count,
            "overdue_count": overdue_count,
            "urgent_count": urgent_count,
            "no_due_date_count": no_due_count,
            "by_assigned_to": by_assigned,
        })

    def _notify_task_assigned(self, task):
        if not task.assigned_to_id:
            return
        try:
            from apps.accounts.models import StaffNotification
            StaffNotification.objects.create(
                user_id=task.assigned_to_id,
                notification_type="task_assigned",
                priority="standard",
                title=f"Nowe zadanie: {task.title[:80]}",
                description=task.description[:200] if task.description else "",
                link=f"/staff/tasks/{task.id}/",
            )
        except Exception:
            pass

    def _notify_comment_added(self, task, comment):
        if not task.assigned_to_id or task.assigned_to_id == comment.author_id:
            return
        try:
            from apps.accounts.models import StaffNotification
            author_name = comment.author.get_full_name() or comment.author.email if comment.author else "Ktoś"
            StaffNotification.objects.create(
                user_id=task.assigned_to_id,
                notification_type="task_comment",
                priority="standard",
                title=f"Komentarz do zadania: {task.title[:50]}",
                description=f"{author_name}: {comment.body[:100]}",
                link=f"/staff/tasks/{task.id}/",
            )
        except Exception:
            pass

    def _notify_due_changed(self, task):
        if not task.assigned_to_id:
            return
        try:
            from apps.accounts.models import StaffNotification
            StaffNotification.objects.create(
                user_id=task.assigned_to_id,
                notification_type="task_due_changed",
                priority="standard",
                title=f"Zmiana terminu: {task.title[:80]}",
                description=f"Nowy termin: {task.due_date}" if task.due_date else "",
                link=f"/staff/tasks/{task.id}/",
            )
        except Exception:
            pass
