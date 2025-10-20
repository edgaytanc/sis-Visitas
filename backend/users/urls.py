from django.urls import path
from .views import UsersPlaceholderAPIView, MeAPIView, LogoutAPIView

urlpatterns = [
    path("me/", MeAPIView.as_view(), name="users-me"),
    path("logout/", LogoutAPIView.as_view(), name="users-logout"),
    path("placeholder/", UsersPlaceholderAPIView.as_view(), name="users-placeholder"),
]
