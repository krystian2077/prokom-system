from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.orders.models import OrderProduct
from apps.orders.serializers import OrderProductListSerializer, OrderProductSerializer
from apps.orders.permissions import IsOrdersAdmin
from apps.orders.selectors import order_product_autocomplete, order_product_card_stats


class OrderProductViewSet(viewsets.ModelViewSet):
    """Katalog produktów (zamówienia). Tylko admin. Autocomplete + karta produktu."""
    permission_classes = [IsOrdersAdmin]
    queryset = OrderProduct.objects.select_related("category").order_by("name")
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["is_active", "category", "brand", "product_type"]
    search_fields = ["name", "brand", "product_type"]

    def get_serializer_class(self):
        return OrderProductListSerializer if self.action == "list" else OrderProductSerializer

    @action(detail=False, url_path="autocomplete")
    def autocomplete(self, request):
        """GET /api/v1/orders/products/autocomplete/?q=...&category=<uuid>&limit=20"""
        q = (request.query_params.get("q") or "").strip()
        category_id = request.query_params.get("category")
        limit = min(int(request.query_params.get("limit", 20)), 50)
        products = order_product_autocomplete(q, category_id=category_id, limit=limit)
        return Response(OrderProductListSerializer(products, many=True).data)

    @action(detail=True, url_path="card")
    def card(self, request, pk=None):
        """GET /api/v1/orders/products/<id>/card/ — karta produktu: historia, ceny, hurtownie."""
        product = self.get_object()
        stats = order_product_card_stats(product.id)
        product_data = OrderProductSerializer(product).data

        def supplier_serializer(supplier):
            if not supplier:
                return None
            return {"id": str(supplier.id), "name": supplier.name}

        last_supplier = stats.get("last_supplier")
        most_used_supplier = None
        if stats.get("most_used_supplier_id"):
            from apps.inventory.models import Supplier
            most_used_supplier = Supplier.objects.filter(id=stats["most_used_supplier_id"]).first()

        return Response({
            "product": product_data,
            "customer_order_count": stats["customer_order_count"],
            "store_supply_count": stats["store_supply_count"],
            "last_purchase_price": str(stats["last_purchase_price"]) if stats["last_purchase_price"] is not None else None,
            "last_sell_price": str(stats["last_sell_price"]) if stats["last_sell_price"] is not None else None,
            "last_supplier": supplier_serializer(last_supplier),
            "avg_purchase_price": str(stats["avg_purchase_price"]) if stats["avg_purchase_price"] is not None else None,
            "min_purchase_price": str(stats["min_purchase_price"]) if stats["min_purchase_price"] is not None else None,
            "max_purchase_price": str(stats["max_purchase_price"]) if stats["max_purchase_price"] is not None else None,
            "avg_sell_price": str(stats["avg_sell_price"]) if stats["avg_sell_price"] is not None else None,
            "most_used_supplier": supplier_serializer(most_used_supplier),
            "recent_customer_orders": stats["recent_customer_orders"],
            "recent_supply_orders": stats["recent_supply_orders"],
            "price_history": stats.get("price_history", []),
        })
