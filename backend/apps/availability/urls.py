"""PRO-KOM Serwis — Availability API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeAvailabilityViewSet

router = DefaultRouter()
router.register(r"", EmployeeAvailabilityViewSet, basename="availability")

urlpatterns = [
    path("", include(router.urls)),
]
