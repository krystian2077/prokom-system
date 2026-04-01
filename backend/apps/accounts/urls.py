"""PRO-KOM Serwis — Accounts API URLs."""
from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    CurrentUserView,
    RegisterView,
    VerifyEmailView,
    ResendVerificationCodeView,
    RequestPasswordResetView,
    ResetPasswordView,
    ChangePasswordView,
    StaffLoginView,
)
from .views.notification_views import (
    StaffNotificationListView,
    StaffNotificationDetailView,
    StaffNotificationMarkAllReadView,
    StaffNotificationUnreadCountView,
    StaffNotificationRequiresActionView,
    AdminNotificationListView,
    AdminNotificationDetailView,
    AdminNotificationMarkAllReadView,
)
from .views.staff_management_views import (
    StaffListView,
    StaffAssignableForRepairView,
    StaffDetailView,
    StaffUpdateView,
    StaffResetPasswordView,
    StaffDeactivateView,
    StaffActivateView,
    StaffLoginActivityView,
)

app_name = "accounts"

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("staff-login/", StaffLoginView.as_view(), name="staff-login"),
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification-code/", ResendVerificationCodeView.as_view(), name="resend-verification-code"),
    path("request-password-reset/", RequestPasswordResetView.as_view(), name="request-password-reset"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="me"),
    path("notifications/", StaffNotificationListView.as_view(), name="notifications-list"),
    path("notifications/requires-action/", StaffNotificationRequiresActionView.as_view(), name="notifications-requires-action"),
    path("notifications/mark-all-read/", StaffNotificationMarkAllReadView.as_view(), name="notifications-mark-all-read"),
    path("notifications/unread-count/", StaffNotificationUnreadCountView.as_view(), name="notifications-unread-count"),
    path("notifications/<int:pk>/", StaffNotificationDetailView.as_view(), name="notifications-detail"),
    path("notifications/admin/", AdminNotificationListView.as_view(), name="notifications-admin-list"),
    path("notifications/admin/mark-all-read/", AdminNotificationMarkAllReadView.as_view(), name="notifications-admin-mark-all-read"),
    path("notifications/admin/<int:pk>/", AdminNotificationDetailView.as_view(), name="notifications-admin-detail"),
    # Lista do przypisywania napraw (staff/admin, bez siebie)
    path("staff/assignable-for-repairs/", StaffAssignableForRepairView.as_view(), name="staff-assignable-for-repairs"),
    # Zarządzanie pracownikami (tylko admin)
    path("staff/", StaffListView.as_view(), name="staff-list"),
    path("staff/<uuid:pk>/", StaffDetailView.as_view(), name="staff-detail"),
    path("staff/<uuid:pk>/update/", StaffUpdateView.as_view(), name="staff-update"),
    path("staff/<uuid:pk>/reset-password/", StaffResetPasswordView.as_view(), name="staff-reset-password"),
    path("staff/<uuid:pk>/deactivate/", StaffDeactivateView.as_view(), name="staff-deactivate"),
    path("staff/<uuid:pk>/activate/", StaffActivateView.as_view(), name="staff-activate"),
    path("staff/<uuid:pk>/login-activity/", StaffLoginActivityView.as_view(), name="staff-login-activity"),
]
