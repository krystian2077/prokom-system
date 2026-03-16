"""PRO-KOM Serwis — Repairs API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepairRequestViewSet, PublicRepairSubmitView
from .views.track_views import (
    TrackRepairView,
    ClaimRepairByTokenView,
    RequestClaimCodeView,
    ConfirmClaimByCodeView,
)

router = DefaultRouter()
router.register(r"", RepairRequestViewSet, basename="repair")

urlpatterns = [
    path("submit/", PublicRepairSubmitView.as_view(), name="repair-submit"),
    path("track/", TrackRepairView.as_view(), name="repair-track"),
    path("claim/", ClaimRepairByTokenView.as_view(), name="repair-claim"),
    path("request-claim-code/", RequestClaimCodeView.as_view(), name="repair-request-claim-code"),
    path("confirm-claim-by-code/", ConfirmClaimByCodeView.as_view(), name="repair-confirm-claim-by-code"),
    path("", include(router.urls)),
]
