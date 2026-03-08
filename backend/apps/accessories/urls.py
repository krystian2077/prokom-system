"""PRO-KOM Serwis — Accessories URL config."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AccessoryCategoryViewSet,
    AccessoryProductViewSet,
    AccessoryBundleViewSet,
    RepairAccessoryOfferViewSet,
)

router = DefaultRouter()
router.register(r"categories", AccessoryCategoryViewSet, basename="accessorycategory")
router.register(r"products", AccessoryProductViewSet, basename="accessoryproduct")
router.register(r"bundles", AccessoryBundleViewSet, basename="accessorybundle")
router.register(r"repair-offers", RepairAccessoryOfferViewSet, basename="repairaccessoryoffer")

urlpatterns = [
    path("", include(router.urls)),
]
