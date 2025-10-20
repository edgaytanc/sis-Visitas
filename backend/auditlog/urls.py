from django.urls import path
from .views import AuditlogPlaceholderAPIView

urlpatterns = [
    path("placeholder/", AuditlogPlaceholderAPIView.as_view(), name="auditlog-placeholder"),
]
