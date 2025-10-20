from django.urls import path, include
from .views import AuditlogPlaceholderAPIView
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet

router = DefaultRouter()
router.register(r"logs", AuditLogViewSet, basename="auditlog")

urlpatterns = [
    path("placeholder/", AuditlogPlaceholderAPIView.as_view(), name="auditlog-placeholder"),
    path("", include(router.urls)),
]
