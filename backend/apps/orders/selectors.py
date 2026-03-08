"""
Moduł zamówień: karta produktu (historia, ceny, hurtownia) i autocomplete.
"""
from django.db.models import Q, Count, Avg, Min, Max

from apps.orders.models import OrderProduct, CustomerOrder, StoreSupplyOrder


def order_product_autocomplete(q, *, category_id=None, limit=20):
    """Podpowiedzi produktów (nazwa, marka, typ)."""
    if not (q or "").strip():
        return OrderProduct.objects.filter(is_active=True).none()
    term = (q or "").strip()[:100]
    qs = OrderProduct.objects.filter(is_active=True).filter(
        Q(name__icontains=term)
        | Q(brand__icontains=term)
        | Q(product_type__icontains=term)
        | Q(ean__icontains=term)
    ).select_related("category")
    if category_id:
        qs = qs.filter(category_id=category_id)
    return qs.order_by("name")[:limit]


def order_product_card_stats(product_id):
    """
    Statystyki do karty produktu:
    - liczba zamówień klientów, ostatnia cena zakupu/sprzedaży, ostatnia hurtownia
    - liczba pozycji zaopatrzenia, ostatni szacowany koszt
    - najczęściej używana hurtownia
    """
    customer_orders = CustomerOrder.objects.filter(product_id=product_id).exclude(
        status="cancelled"
    ).select_related("supplier").order_by("-created_at")
    supply_orders = StoreSupplyOrder.objects.filter(product_id=product_id).exclude(
        status="cancelled"
    ).select_related("supplier").order_by("-created_at")

    cust_count = customer_orders.count()
    supply_count = supply_orders.count()

    last_cust = customer_orders.first()
    last_supply = supply_orders.first()

    agg_cust = CustomerOrder.objects.filter(product_id=product_id).exclude(
        status="cancelled"
    ).aggregate(
        avg_purchase=Avg("purchase_price"),
        min_purchase=Min("purchase_price"),
        max_purchase=Max("purchase_price"),
        avg_sell=Avg("sell_price"),
    )

    # Najczęściej używana hurtownia (z zamówień klientów)
    most_supplier_id = (
        CustomerOrder.objects.filter(product_id=product_id, supplier_id__isnull=False)
        .exclude(status="cancelled")
        .values("supplier_id")
        .annotate(c=Count("id"))
        .order_by("-c")
        .values_list("supplier_id", flat=True)
        .first()
    )

    recent_customer = list(
        customer_orders[:10].values(
            "id", "status", "quantity", "purchase_price", "sell_price",
            "expected_delivery_date", "client_notified", "created_at", "supplier_id",
        )
    )
    recent_supply = list(
        supply_orders[:10].values(
            "id", "status", "quantity", "estimated_cost", "created_at", "supplier_id",
        )
    )

    # Historia cen: data, cena, hurtownia, ilość (z zamówień klientów)
    price_history = list(
        customer_orders.filter(purchase_price__isnull=False).exclude(purchase_price=0)[:30].values(
            "created_at", "purchase_price", "quantity", "supplier_id"
        )
    )

    return {
        "customer_order_count": cust_count,
        "store_supply_count": supply_count,
        "last_customer_order": last_cust,
        "last_supply_order": last_supply,
        "last_purchase_price": last_cust.purchase_price if last_cust else None,
        "last_sell_price": last_cust.sell_price if last_cust else None,
        "last_supplier": last_cust.supplier if last_cust else (last_supply.supplier if last_supply else None),
        "avg_purchase_price": agg_cust.get("avg_purchase"),
        "min_purchase_price": agg_cust.get("min_purchase"),
        "max_purchase_price": agg_cust.get("max_purchase"),
        "avg_sell_price": agg_cust.get("avg_sell"),
        "most_used_supplier_id": most_supplier_id,
        "recent_customer_orders": recent_customer,
        "recent_supply_orders": recent_supply,
        "price_history": price_history,
    }
