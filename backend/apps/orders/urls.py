"""PRO-KOM Serwis — Orders API URLs (tylko admin)."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    OrderProductCategoryViewSet,
    OrderProductViewSet,
    CustomerOrderViewSet,
    StoreSupplyOrderViewSet,
    OrdersDashboardView,
    ToOrderTodayView,
    OrdersBySupplierView,
)

router = DefaultRouter()
router.register(r"categories", OrderProductCategoryViewSet, basename="order-product-category")
router.register(r"products", OrderProductViewSet, basename="order-product")
router.register(r"customer-orders", CustomerOrderViewSet, basename="customer-order")
router.register(r"store-supply", StoreSupplyOrderViewSet, basename="store-supply")

urlpatterns = [
    path("dashboard/", OrdersDashboardView.as_view(), name="orders-dashboard"),
    path("to-order-today/", ToOrderTodayView.as_view(), name="orders-to-order-today"),
    path("by-supplier/", OrdersBySupplierView.as_view(), name="orders-by-supplier"),
    path("", include(router.urls)),
]
