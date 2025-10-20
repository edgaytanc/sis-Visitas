from django.urls import path
from .views import ReportsPlaceholderAPIView

urlpatterns = [
    path("placeholder/", ReportsPlaceholderAPIView.as_view(), name="reports-placeholder"),
]
