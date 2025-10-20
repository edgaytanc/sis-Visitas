from django.urls import path
from .views import UsersPlaceholderAPIView

urlpatterns = [
    path("placeholder/", UsersPlaceholderAPIView.as_view(), name="users-placeholder"),
]
