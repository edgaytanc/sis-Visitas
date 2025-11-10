from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group # <-- TAREA 4: Nueva importación
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status, viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse,
    OpenApiTypes
)

from auditlog.utils import log_action, get_client_ip
from .serializers import (
    MeSerializer, UserListSerializer, UserCreateUpdateSerializer
)
from .permissions import IsAdminUserOrGroup

User = get_user_model()


class UsersPlaceholderAPIView(APIView):
    def get(self, request):
        return Response({"ok": True, "app": "users"})

class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = MeSerializer(request.user).data
        return Response(data, status=200)

@method_decorator(csrf_exempt, name="dispatch")
class LogoutAPIView(APIView):
    """
    Logout con JWT: se hace blacklist del refresh token recibido.
    Espera: { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "refresh token requerido"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()  # requiere rest_framework_simplejwt.token_blacklist en INSTALLED_APPS
        except Exception:
            return Response({"detail": "token inválido o ya invalidado"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "logout ok"}, status=200)
    

class LoginTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Puedes personalizar claims si lo deseas
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        return token

class LoginView(TokenObtainPairView):
    serializer_class = LoginTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # Si llegamos aquí, las credenciales fueron válidas
        user = None
        try:
            # El serializer validó las credenciales; intenta obtener el usuario por username
            username = request.data.get("username")
            user = User.objects.filter(username=username).first()
        except Exception:
            user = None

        log_action(
            user=user,
            action="login",
            entity="User",
            entity_id=str(user.id) if user else "",
            payload=None,
            ip=get_client_ip(request),
        )
        return response

class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para la administración de Usuarios.
    Restringido a administradores.
    """
    queryset = User.objects.all().order_by('username')
    
    # Permiso personalizado de la Tarea 2
    permission_classes = [IsAuthenticated, IsAdminUserOrGroup]
    
    # Configuración de filtros (similar a AuditLogViewSet)
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Búsqueda por:
    search_fields = ["username", "email", "first_name", "last_name"]
    
    # Filtro exacto por:
    filterset_fields = ["is_active", "groups__name"]
    
    # Ordenamiento por:
    ordering_fields = ["username", "email", "first_name", "last_name", "date_joined", "last_login"]
    ordering = ["username"]

    def get_serializer_class(self):
        """
        Usa un serializer diferente para acciones de escritura (create, update)
        y uno diferente para acciones de lectura (list, retrieve).
        """
        if self.action in ["create", "update", "partial_update"]:
            return UserCreateUpdateSerializer
        
        # Por defecto (list, retrieve)
        return UserListSerializer



class GroupsListView(APIView):
    """
    Vista simple de solo lectura para listar todos los grupos (roles)
    disponibles en el sistema.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Listar todos los Grupos (Roles)",
        responses={200: OpenApiResponse(response=serializers.ListSerializer(child=serializers.DictField()))}
    )
    def get(self, request):
        groups = Group.objects.all().order_by('name').values("id", "name")
        return Response(list(groups), status=status.HTTP_200_OK)

