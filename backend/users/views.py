from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import MeSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

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