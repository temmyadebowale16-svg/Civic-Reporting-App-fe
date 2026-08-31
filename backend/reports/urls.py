from django.urls import path
from .views import (
    ReportCreateView,
    ReportListView,
    ReportLookupView,
    AdminLoginView,
    AdminReportListView,
    AdminReportStatusUpdateView,
)

urlpatterns = [
    path("reports/", ReportCreateView.as_view(), name="report-create"),
    path("reports/public/", ReportListView.as_view(), name="report-public-list"),
    path("reports/lookup/<str:reference_code>/", ReportLookupView.as_view(), name="report-lookup"),
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path("admin/reports/", AdminReportListView.as_view(), name="admin-report-list"),
    path("admin/reports/<int:pk>/status/", AdminReportStatusUpdateView.as_view(), name="admin-report-status"),
]
