"""Lista „Do zamówienia dziś” i grupowanie po hurtowniach."""
from datetime import date
from decimal import Decimal
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.orders.models import CustomerOrder, StoreSupplyOrder
from apps.orders.enums import CustomerOrderStatus, StoreSupplyStatus, SupplyPriority
from apps.orders.serializers import CustomerOrderSerializer, StoreSupplyOrderSerializer
from apps.orders.permissions import IsOrdersAdmin


class ToOrderTodayView(APIView):
    """
    GET /api/v1/orders/to-order-today/
    Lista do zamówienia dziś: zamówienia klientów z planowaną datą dziś lub statusem to_order,
    oraz braki sklepu (to_order, opcjonalnie wysokie priorytety).
    """
    permission_classes = [IsOrdersAdmin]

    def get(self, request):
        today = date.today()
        # Zamówienia klientów: planowana data dziś LUB status do zamówienia
        customer = CustomerOrder.objects.filter(
            Q(planned_order_date=today) | Q(status=CustomerOrderStatus.TO_ORDER)
        ).exclude(status=CustomerOrderStatus.CANCELLED).select_related(
            "client", "product", "supplier", "related_repair"
        ).order_by("planned_order_date", "-created_at")[:100]
        # Braki sklepu: do zamówienia (opcjonalnie filtrowane po priorytecie)
        store = StoreSupplyOrder.objects.filter(
            status=StoreSupplyStatus.TO_ORDER
        ).select_related("product", "supplier").order_by("-created_at")[:100]

        return Response({
            "customer_orders": CustomerOrderSerializer(customer, many=True).data,
            "store_supply_orders": StoreSupplyOrderSerializer(store, many=True).data,
        })


class OrdersBySupplierView(APIView):
    """
    GET /api/v1/orders/by-supplier/
    Grupowanie zamówień po hurtowniach: dla każdej hurtowni lista pozycji (klienckie + sklep),
    łączny koszt, liczba.
    """
    permission_classes = [IsOrdersAdmin]

    def get(self, request):
        from django.db.models import Sum
        from apps.inventory.models import Supplier

        today = date.today()
        # Aktywne zamówienia (nie anulowane) z wybraną hurtownią
        cust_with_supplier = CustomerOrder.objects.exclude(
            status=CustomerOrderStatus.CANCELLED
        ).filter(supplier_id__isnull=False).select_related("client", "product", "supplier", "related_repair")
        supply_with_supplier = StoreSupplyOrder.objects.exclude(
            status=StoreSupplyStatus.CANCELLED
        ).filter(supplier_id__isnull=False).select_related("product", "supplier")

        supplier_ids = set(
            cust_with_supplier.values_list("supplier_id", flat=True).distinct()
        ) | set(supply_with_supplier.values_list("supplier_id", flat=True).distinct())

        result = []
        for sid in supplier_ids:
            supplier = Supplier.objects.filter(id=sid).first()
            if not supplier:
                continue
            cust_list = list(cust_with_supplier.filter(supplier_id=sid))
            supply_list = list(supply_with_supplier.filter(supplier_id=sid))
            total_cost = sum(
                ((o.purchase_price or Decimal("0")) * o.quantity for o in cust_list),
                Decimal("0"),
            ) + sum(
                ((o.estimated_cost or Decimal("0")) * o.quantity for o in supply_list),
                Decimal("0"),
            )
            result.append({
                "supplier": {"id": str(supplier.id), "name": supplier.name},
                "customer_order_count": len(cust_list),
                "store_supply_count": len(supply_list),
                "total_estimated_cost": str(total_cost),
                "customer_orders": CustomerOrderSerializer(cust_list, many=True).data,
                "store_supply_orders": StoreSupplyOrderSerializer(supply_list, many=True).data,
            })
        return Response({"by_supplier": result})
