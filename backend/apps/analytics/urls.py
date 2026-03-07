"""PRO-KOM Serwis — Analytics URL config."""
from django.urls import path
from .views import KPIDashboardView, StaffRankingView, RepairsReportView, SummaryStatsView

urlpatterns = [
    path("kpi/", KPIDashboardView.as_view(), name="analytics-kpi"),
    path("staff-ranking/", StaffRankingView.as_view(), name="analytics-staff-ranking"),
    path("repairs-report/", RepairsReportView.as_view(), name="analytics-repairs-report"),
    path("summary/", SummaryStatsView.as_view(), name="analytics-summary"),
]
