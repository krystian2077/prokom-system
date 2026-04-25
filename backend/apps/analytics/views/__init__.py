"""PRO-KOM Serwis — Analytics views."""
from .kpi_views import (
    KPIDashboardView,
    StaffRankingView,
    RepairsReportView,
    SummaryStatsView,
    HealthOverviewView,
    AdminDashboardView,
)
from .staff_views import StaffSnapshotsView, StaffManagerView, StaffHealthScoreView, StaffKpiListView

__all__ = [
    "KPIDashboardView",
    "StaffRankingView",
    "RepairsReportView",
    "SummaryStatsView",
    "HealthOverviewView",
    "AdminDashboardView",
    "StaffSnapshotsView",
    "StaffManagerView",
    "StaffHealthScoreView",
    "StaffKpiListView",
]
