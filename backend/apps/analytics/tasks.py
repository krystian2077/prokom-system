"""
PRO-KOM Serwis — Analytics tasks (Celery).
Dzienny snapshot statystyk pracowników.
"""
from celery import shared_task
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from decimal import Decimal

from apps.accounts.models import User
from apps.accounts.models import UserRole
from apps.repairs.models import RepairRequest
from apps.common.enums import RepairStatus
from apps.analytics.models import EmployeeStatsSnapshot


@shared_task(bind=True, name="analytics.build_employee_stats_snapshots")
def build_employee_stats_snapshots(self, for_date=None):
    """
    Dla każdego pracownika (staff) buduje EmployeeStatsSnapshot za podany dzień.
    for_date: YYYY-MM-DD lub None (wtedy wczoraj).
    Wywoływane przez beat codziennie (np. 0 1 * * * — 1:00).
    """
    if for_date is None:
        day = (timezone.now() - timedelta(days=1)).date()
    else:
        from datetime import datetime
        day = datetime.strptime(for_date, "%Y-%m-%d").date() if isinstance(for_date, str) else for_date

    start = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.min.time()))
    end = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.max.time()))

    staff_users = User.objects.filter(role=UserRole.STAFF, is_active=True)
    created = 0
    for user in staff_users:
        # Naprawy z danego dnia (przypisane do usera): aktualizowane w tym dniu lub zakończone w tym dniu
        repairs_qs = RepairRequest.objects.filter(
            assigned_to_id=user.id,
            updated_at__gte=start,
            updated_at__lte=end,
        )
        repairs_count = repairs_qs.count()
        delayed = repairs_qs.filter(
            status__in=[
                RepairStatus.ACCEPTED, RepairStatus.IN_DIAGNOSTICS, RepairStatus.QUOTE_PENDING,
                RepairStatus.QUOTE_SENT, RepairStatus.WAITING_FOR_PARTS, RepairStatus.IN_REPAIR,
                RepairStatus.REPAIR_DONE, RepairStatus.IN_TESTING, RepairStatus.TESTING_FAILED,
            ],
            estimated_completion_date__lt=day,
        ).count()
        quotes_sent = repairs_qs.filter(status=RepairStatus.QUOTE_SENT).count()
        ready = repairs_qs.filter(status=RepairStatus.READY_FOR_PICKUP).count()
        # Upsell: z ofert akcesoriów / HG za ten dzień — uproszczenie: suma final_cost napraw zakończonych w dniu
        completed_in_day = RepairRequest.objects.filter(
            assigned_to_id=user.id,
            status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED],
            updated_at__gte=start,
            updated_at__lte=end,
        )
        revenue = completed_in_day.aggregate(s=Sum("final_cost"))["s"] or Decimal("0")
        # Jako upsell_total na razie używamy 0 lub część final_cost; można rozszerzyć o RepairAccessoryOffer
        upsell_total = Decimal("0")
        profit_total = revenue  # uproszczenie

        EmployeeStatsSnapshot.objects.update_or_create(
            employee=user,
            date=day,
            defaults={
                "repairs_count": repairs_count,
                "delayed_repairs_count": delayed,
                "quotes_sent_count": quotes_sent,
                "ready_for_pickup_count": ready,
                "upsell_total": upsell_total,
                "profit_total": profit_total,
            },
        )
        created += 1
    return {"ok": True, "date": str(day), "snapshots_created": created}
