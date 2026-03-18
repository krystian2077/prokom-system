from django.urls import path

from .views import CalendarMonthEventsView

urlpatterns = [
    path("month/", CalendarMonthEventsView.as_view(), name="calendar-month-events"),
]

