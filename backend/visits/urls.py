from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitsPlaceholderAPIView, CitizenViewSet, VisitCaseViewSet, VisitViewSet, PhotoUploadAPIView

router = DefaultRouter()
router.register(r"citizens", CitizenViewSet, basename="citizen")
router.register(r"cases", VisitCaseViewSet, basename="visitcase")
router.register(r"visits", VisitViewSet, basename="visit")

urlpatterns = [
    path("placeholder/", VisitsPlaceholderAPIView.as_view(), name="visits-placeholder"),
    path("", include(router.urls)),
    path("photos/upload/", PhotoUploadAPIView.as_view(), name="photo-upload"),
]
