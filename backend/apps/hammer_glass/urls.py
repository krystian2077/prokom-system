"""PRO-KOM Serwis — Hammer Glass URL config."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    HammerGlassFilmTypeViewSet,
    HammerGlassProductViewSet,
    RepairHammerGlassOfferViewSet,
)

router = DefaultRouter()
router.register(r"film-types", HammerGlassFilmTypeViewSet, basename="hammerglassfilmtype")
router.register(r"products", HammerGlassProductViewSet, basename="hammerglassproduct")
router.register(r"repair-offers", RepairHammerGlassOfferViewSet, basename="repairhammerglassoffer")

urlpatterns = [
    path("", include(router.urls)),
]
