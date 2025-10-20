from rest_framework.permissions import BasePermission, SAFE_METHODS

ADMIN_GROUP = "admin"
SUPERVISOR_GROUP = "supervisor"

class TopicPermission(BasePermission):
    """
    - Lectura: cualquier usuario autenticado.
    - Escritura (POST/PUT/PATCH/DELETE): solo 'admin' o 'supervisor'.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        # Métodos de escritura:
        return (
            request.user.groups.filter(name=ADMIN_GROUP).exists() or
            request.user.groups.filter(name=SUPERVISOR_GROUP).exists() or
            request.user.is_superuser
        )
