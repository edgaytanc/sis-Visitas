from django.urls import path
from .views import ReportsPlaceholderAPIView,VisitsReportAPIView

urlpatterns = [
    path("placeholder/", ReportsPlaceholderAPIView.as_view(), name="reports-placeholder"),
    path("visits", VisitsReportAPIView.as_view(), name="reports-visits"),
]
