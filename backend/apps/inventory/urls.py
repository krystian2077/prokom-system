"""PRO-KOM Serwis — Inventory API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, PartViewSet, PurchaseOrderViewSet

router = DefaultRouter()
router.register(r"suppliers", SupplierViewSet, basename="supplier")
router.register(r"parts", PartViewSet, basename="part")
router.register(r"purchase-orders", PurchaseOrderViewSet, basename="purchase-order")

urlpatterns = [
    path("", include(router.urls)),
]
