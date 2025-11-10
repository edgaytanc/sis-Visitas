from django.urls import path, include # <-- TAREA 4: Añadir include
from rest_framework.routers import DefaultRouter # <-- TAREA 4: Nueva importación
from .views import (
    UsersPlaceholderAPIView, 
    MeAPIView, 
    LogoutAPIView,
    UserViewSet,         # <-- TAREA 4: Nueva importación
    GroupsListView       # <-- TAREA 4: Nueva importación
)

# --- TAREA 4: INICIO (Configuración del Router) ---
router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
# --- TAREA 4: FIN (Configuración del Router) ---


urlpatterns = [
    path("me/", MeAPIView.as_view(), name="users-me"),
    path("logout/", LogoutAPIView.as_view(), name="users-logout"),
    path("placeholder/", UsersPlaceholderAPIView.as_view(), name="users-placeholder"),
    
    # --- TAREA 4: INICIO (Nuevas rutas) ---
    path("groups/", GroupsListView.as_view(), name="users-groups"),
    
    # Esto añadirá las rutas:
    #   GET /api/users/users/
    #   POST /api/users/users/
    #   GET /api/users/users/{id}/
    #   PUT /api/users/users/{id}/
    #   PATCH /api/users/users/{id}/
    #   DELETE /api/users/users/{id}/
    path("", include(router.urls)),
    # --- TAREA 4: FIN (Nuevas rutas) ---
]