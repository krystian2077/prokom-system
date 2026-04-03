"""PRO-KOM Serwis — Availability API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeAvailabilityViewSet, EmployeeAbsenceRequestViewSet

router = DefaultRouter()
router.register(r"requests", EmployeeAbsenceRequestViewSet, basename="absence-request")
router.register(r"", EmployeeAvailabilityViewSet, basename="availability")

urlpatterns = [
    path("", include(router.urls)),
]
