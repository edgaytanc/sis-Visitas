from rest_framework.response import Response
from rest_framework.views import APIView

class UsersPlaceholderAPIView(APIView):
    def get(self, request):
        return Response({"ok": True, "app": "users"})
