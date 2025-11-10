from rest_framework.permissions import BasePermission

# Definir el nombre del grupo de admin, igual que en catalog/permissions.py
ADMIN_GROUP = "admin"

class IsInGroup(BasePermission):
    """
    Permite acceso si el usuario está en un grupo concreto.
    Usar: permission_classes = [IsInGroup.as_group("recepcion")]
    """
    group_name: str = ""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not self.group_name:
            return False
        return request.user.groups.filter(name=self.group_name).exists()

    @classmethod
    def as_group(cls, group_name: str):
        class _Perm(cls):
            pass
        _Perm.group_name = group_name
        return _Perm


class IsAdminUserOrGroup(BasePermission):
    """
    Permite acceso total (lectura y escritura) únicamente a superusuarios
    o a usuarios que pertenezcan al grupo 'admin'.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # El permiso se concede si es superusuario O si está en el grupo admin
        return (
            request.user.is_superuser or
            request.user.groups.filter(name=ADMIN_GROUP).exists()
        )
