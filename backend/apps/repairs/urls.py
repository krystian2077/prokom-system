"""PRO-KOM Serwis — Repairs API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepairRequestViewSet, PublicRepairSubmitView

router = DefaultRouter()
router.register(r"", RepairRequestViewSet, basename="repair")

urlpatterns = [
    path("submit/", PublicRepairSubmitView.as_view(), name="repair-submit"),
    path("", include(router.urls)),
]
