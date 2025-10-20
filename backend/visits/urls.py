from django.urls import path
from .views import VisitsPlaceholderAPIView

urlpatterns = [
    path("placeholder/", VisitsPlaceholderAPIView.as_view(), name="visits-placeholder"),
]
