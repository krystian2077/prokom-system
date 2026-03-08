"""Dashboard modułu zamówień: liczby po statusach (kafelki) + statystyki."""
from datetime import date
from decimal import Decimal
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.orders.models import CustomerOrder, StoreSupplyOrder
from apps.orders.enums import CustomerOrderStatus, StoreSupplyStatus
from apps.orders.permissions import IsOrdersAdmin


class OrdersDashboardView(APIView):
    """
    GET /api/v1/orders/dashboard/
    Kafelki: liczby po statusach, wymaga reakcji, do zamówienia dziś.
    Statystyki: łączny zysk, średnia marża, nieodebrane, powiązane z naprawą.
    Tylko admin.
    """
    permission_classes = [IsOrdersAdmin]

    def get(self, request):
        cust = dict(
            CustomerOrder.objects.exclude(status=CustomerOrderStatus.CANCELLED).values("status").annotate(
                count=Count("id")
            ).values_list("status", "count")
        )
        supply = dict(
            StoreSupplyOrder.objects.exclude(status=StoreSupplyStatus.CANCELLED).values("status").annotate(
                count=Count("id")
            ).values_list("status", "count")
        )
        requires_action = CustomerOrder.objects.exclude(
            status=CustomerOrderStatus.CANCELLED
        ).filter(
            status__in=[CustomerOrderStatus.ARRIVED, CustomerOrderStatus.READY_FOR_PICKUP],
            client_notified=False,
        ).count() + CustomerOrder.objects.filter(overdue=True).count()

        today = date.today()
        to_order_today_count = CustomerOrder.objects.filter(
            status=CustomerOrderStatus.TO_ORDER
        ).exclude(status=CustomerOrderStatus.CANCELLED).filter(
            planned_order_date=today
        ).count() + StoreSupplyOrder.objects.filter(
            status=StoreSupplyStatus.TO_ORDER
        ).count()

        # Zysk z zrealizowanych (odebranych) zamówień
        completed = CustomerOrder.objects.filter(status=CustomerOrderStatus.PICKED_UP)
        profit_sum = Decimal("0")
        for o in completed.only("sell_price", "purchase_price", "quantity"):
            profit_sum += (o.sell_price - o.purchase_price) * o.quantity

        uncollected = CustomerOrder.objects.filter(
            status__in=[CustomerOrderStatus.READY_FOR_PICKUP, CustomerOrderStatus.CLIENT_NOTIFIED],
        ).exclude(status=CustomerOrderStatus.CANCELLED).count()
        linked_to_repair = CustomerOrder.objects.exclude(
            status=CustomerOrderStatus.CANCELLED
        ).filter(related_repair_id__isnull=False).count()

        return Response({
            "customer_orders_by_status": {s: cust.get(s, 0) for s, _ in CustomerOrderStatus.choices},
            "store_supply_by_status": {s: supply.get(s, 0) for s, _ in StoreSupplyStatus.choices},
            "requires_action_count": requires_action,
            "to_order_today_count": to_order_today_count,
            "total_profit": str(profit_sum),
            "uncollected_count": uncollected,
            "linked_to_repair_count": linked_to_repair,
        })
