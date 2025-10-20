from rest_framework.permissions import BasePermission

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
