"""PRO-KOM Serwis — Compliance (RODO) URL config."""
from django.urls import path
from .views import ExportMyDataView, RequestAccountDeletionView

urlpatterns = [
    path("export-my-data/", ExportMyDataView.as_view(), name="compliance-export-my-data"),
    path("request-account-deletion/", RequestAccountDeletionView.as_view(), name="compliance-request-account-deletion"),
]
