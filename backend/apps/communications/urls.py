"""PRO-KOM Serwis — Communications URL config."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MessageTemplateViewSet, CommunicationLogViewSet, SendMessageAction

router = DefaultRouter()
router.register(r"templates", MessageTemplateViewSet, basename="messagetemplate")
router.register(r"logs", CommunicationLogViewSet, basename="communicationlog")

urlpatterns = [
    path("", include(router.urls)),
    path("send/", SendMessageAction.as_view(), name="communications-send"),
]
