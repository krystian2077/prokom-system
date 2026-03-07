"""PRO-KOM Serwis — Pricing API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabourTypeViewSet, QuoteViewSet, DepositViewSet

router = DefaultRouter()
router.register(r"labour-types", LabourTypeViewSet, basename="labour-type")
router.register(r"quotes", QuoteViewSet, basename="quote")
router.register(r"deposits", DepositViewSet, basename="deposit")

urlpatterns = [
    path("", include(router.urls)),
]
