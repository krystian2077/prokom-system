"""Widoki API modułu zamówień (tylko admin)."""
from .category_views import OrderProductCategoryViewSet
from .product_views import OrderProductViewSet
from .customer_order_views import CustomerOrderViewSet
from .store_supply_views import StoreSupplyOrderViewSet
from .dashboard_views import OrdersDashboardView
from .to_order_today_views import ToOrderTodayView, OrdersBySupplierView

__all__ = [
    "OrderProductCategoryViewSet",
    "OrderProductViewSet",
    "CustomerOrderViewSet",
    "StoreSupplyOrderViewSet",
    "OrdersDashboardView",
    "ToOrderTodayView",
    "OrdersBySupplierView",
]
