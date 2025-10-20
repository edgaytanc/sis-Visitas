from django.urls import path, include
from .views import CatalogPlaceholderAPIView
from rest_framework.routers import DefaultRouter
from .views import TopicViewSet

router = DefaultRouter()
router.register(r"topics", TopicViewSet, basename="topic")

urlpatterns = [
    path("placeholder/", CatalogPlaceholderAPIView.as_view(), name="catalog-placeholder"),
    path("", include(router.urls)),
]
