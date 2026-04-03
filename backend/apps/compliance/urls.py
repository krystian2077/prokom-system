"""PRO-KOM Serwis — Compliance (RODO) URL config."""
from django.urls import path
from .views import ExportMyDataView, RequestAccountDeletionView
from .views import (
    BackupLogsAdminListView,
    ConfigAuditLogsAdminListView,
    FeatureFlagsAdminBulkUpdateView,
    FeatureFlagsAdminListView,
    GdprRequestAdminUpdateView,
    GdprRequestsAdminListView,
    SystemSettingsAdminBulkUpdateView,
    SystemSettingsAdminListView,
    TermsVersionsAdminListView,
    TermsVersionsAdminSetActiveView,
)

urlpatterns = [
    path("export-my-data/", ExportMyDataView.as_view(), name="compliance-export-my-data"),
    path("request-account-deletion/", RequestAccountDeletionView.as_view(), name="compliance-request-account-deletion"),
    # Admin panel (RODO / konfiguracja)
    path("admin/terms-versions/", TermsVersionsAdminListView.as_view(), name="compliance-admin-terms-versions"),
    path(
        "admin/terms-versions/<int:pk>/set-active/",
        TermsVersionsAdminSetActiveView.as_view(),
        name="compliance-admin-terms-versions-set-active",
    ),
    path("admin/gdpr-requests/", GdprRequestsAdminListView.as_view(), name="compliance-admin-gdpr-requests"),
    path(
        "admin/gdpr-requests/<int:pk>/update/",
        GdprRequestAdminUpdateView.as_view(),
        name="compliance-admin-gdpr-requests-update",
    ),
    path("admin/backup-logs/", BackupLogsAdminListView.as_view(), name="compliance-admin-backup-logs"),
    path("admin/system-settings/", SystemSettingsAdminListView.as_view(), name="compliance-admin-system-settings"),
    path(
        "admin/system-settings/bulk-update/",
        SystemSettingsAdminBulkUpdateView.as_view(),
        name="compliance-admin-system-settings-bulk-update",
    ),
    path("admin/feature-flags/", FeatureFlagsAdminListView.as_view(), name="compliance-admin-feature-flags"),
    path(
        "admin/feature-flags/bulk-update/",
        FeatureFlagsAdminBulkUpdateView.as_view(),
        name="compliance-admin-feature-flags-bulk-update",
    ),
    path("admin/config-audit-logs/", ConfigAuditLogsAdminListView.as_view(), name="compliance-admin-config-audit-logs"),
]
