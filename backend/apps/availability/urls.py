"""PRO-KOM Serwis — Availability API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeAvailabilityViewSet,
    EmployeeAbsenceRequestViewSet,
    WorkSessionActiveView,
    WorkSessionStartView,
    WorkSessionEndView,
    WorkSessionMonthSummaryView,
    AdminWorkSessionMonthSummaryView,
)

router = DefaultRouter()
router.register(r"requests", EmployeeAbsenceRequestViewSet, basename="absence-request")
router.register(r"", EmployeeAvailabilityViewSet, basename="availability")

urlpatterns = [
    path("work-sessions/me/", WorkSessionActiveView.as_view(), name="work-session-active"),
    path("work-sessions/me/start/", WorkSessionStartView.as_view(), name="work-session-start"),
    path("work-sessions/me/end/", WorkSessionEndView.as_view(), name="work-session-end"),
    path("work-sessions/me/month-summary/", WorkSessionMonthSummaryView.as_view(), name="work-session-month-summary"),
    path("work-sessions/admin/month-summary/", AdminWorkSessionMonthSummaryView.as_view(), name="admin-work-session-month-summary"),
    path("", include(router.urls)),
]
