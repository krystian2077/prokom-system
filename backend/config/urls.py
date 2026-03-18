"""
PRO-KOM Serwis — Główny plik URL
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from apps.common.views import GlobalSearchView, ParcelLockerAddressView
from apps.repairs.views.staff_views import StaffRepairsListView, StaffRepairDetailView, StaffDashboardView

# Tytuł panelu admina
admin.site.site_header = "PRO-KOM Serwis — Panel Admina"
admin.site.site_title = "PRO-KOM Admin"
admin.site.index_title = "Panel administracyjny"

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # API — główne endpointy
    path("api/v1/accounts/", include("apps.accounts.urls")),
    path("api/v1/clients/", include("apps.clients.urls")),
    path("api/v1/devices/", include("apps.devices.urls")),
    path("api/v1/repairs/", include("apps.repairs.urls")),
    path("api/v1/accessories/", include("apps.accessories.urls")),
    path("api/v1/hammer-glass/", include("apps.hammer_glass.urls")),
    path("api/v1/communications/", include("apps.communications.urls")),
    path("api/v1/documents/", include("apps.documents.urls")),
    path("api/v1/compliance/", include("apps.compliance.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/search/", include("apps.search.urls")),
    path("api/v1/staff/repairs/", StaffRepairsListView.as_view(), name="staff-repairs-list"),
    path("api/v1/staff/repairs/<uuid:pk>/", StaffRepairDetailView.as_view(), name="staff-repair-detail"),
    path("api/v1/staff/dashboard/", StaffDashboardView.as_view(), name="staff-dashboard"),
    path("api/v1/config/parcel-locker-address/", ParcelLockerAddressView.as_view(), name="parcel-locker-address"),
    path("api/v1/inventory/", include("apps.inventory.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/tasks/", include("apps.tasks.urls")),
    path("api/v1/availability/", include("apps.availability.urls")),
    path("api/v1/calendar/", include("apps.calendar_app.urls")),
    path("api/v1/pricing/", include("apps.pricing.urls")),

    # API Schema / Dokumentacja (dostępna tylko w DEBUG)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# Pliki medialne w trybie development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
