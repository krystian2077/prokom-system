"""PRO-KOM Serwis — Analytics views."""
from .kpi_views import (
    KPIDashboardView,
    StaffRankingView,
    RepairsReportView,
    SummaryStatsView,
    HealthOverviewView,
)
from .staff_views import StaffSnapshotsView, StaffManagerView

__all__ = [
    "KPIDashboardView",
    "StaffRankingView",
    "RepairsReportView",
    "SummaryStatsView",
    "HealthOverviewView",
    "StaffSnapshotsView",
    "StaffManagerView",
]
