"""PRO-KOM Serwis — Communications URL config."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MessageTemplateViewSet, CommunicationLogViewSet, SendMessageAction
from .views.inbound_email_views import EmailInboundWebhookView
from .views.inquiry_views import InquiryFormView

router = DefaultRouter()
router.register(r"templates", MessageTemplateViewSet, basename="messagetemplate")
router.register(r"logs", CommunicationLogViewSet, basename="communicationlog")

urlpatterns = [
    path("", include(router.urls)),
    path("send/", SendMessageAction.as_view(), name="communications-send"),
    path("inbound-email/", EmailInboundWebhookView.as_view(), name="communications-inbound-email"),
    path("inquiry/", InquiryFormView.as_view(), name="communications-inquiry"),
]
