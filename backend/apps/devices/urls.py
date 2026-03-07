"""PRO-KOM Serwis — Devices API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BrandViewSet, DeviceModelViewSet, DeviceViewSet

router = DefaultRouter()
router.register(r"brands", BrandViewSet, basename="brand")
router.register(r"models", DeviceModelViewSet, basename="device-model")
router.register(r"", DeviceViewSet, basename="device")

urlpatterns = [
    path("", include(router.urls)),
]
