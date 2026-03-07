"""PRO-KOM Serwis — Clients API URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ClientMeView

router = DefaultRouter()
router.register(r"", ClientViewSet, basename="client")

urlpatterns = [
    path("me/", ClientMeView.as_view(), name="client-me"),
    path("", include(router.urls)),
]
