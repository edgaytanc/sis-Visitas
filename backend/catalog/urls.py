from django.urls import path
from .views import CatalogPlaceholderAPIView

urlpatterns = [
    path("placeholder/", CatalogPlaceholderAPIView.as_view(), name="catalog-placeholder"),
]
