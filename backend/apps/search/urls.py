"""PRO-KOM Serwis — Search API URLs."""
from django.urls import path
from .views import GlobalSearchAPIView, IntakeSearchAPIView, AdvancedSearchAPIView

app_name = "search"

urlpatterns = [
    path("", GlobalSearchAPIView.as_view(), name="global-search"),
    path("global/", GlobalSearchAPIView.as_view(), name="global"),
    path("intake/", IntakeSearchAPIView.as_view(), name="intake"),
    path("advanced/", AdvancedSearchAPIView.as_view(), name="advanced"),
]
