"""PRO-KOM Serwis — Documents URL config."""
from django.urls import path
from .views import (
    AcceptanceProtocolPDFView,
    AcceptanceProtocolShortPDFView,
    ComplaintWarrantyIntakePDFView,
    RepairQRView,
)

urlpatterns = [
    path(
        "repair/<uuid:repair_id>/acceptance-protocol/",
        AcceptanceProtocolPDFView.as_view(),
        name="documents-acceptance-protocol",
    ),
    path(
        "repair/<uuid:repair_id>/acceptance-protocol-short/",
        AcceptanceProtocolShortPDFView.as_view(),
        name="documents-acceptance-protocol-short",
    ),
    path(
        "repair/<uuid:repair_id>/complaint-warranty-intake/",
        ComplaintWarrantyIntakePDFView.as_view(),
        name="documents-complaint-warranty-intake",
    ),
    path(
        "repair/<uuid:repair_id>/qr/",
        RepairQRView.as_view(),
        name="documents-repair-qr",
    ),
]
