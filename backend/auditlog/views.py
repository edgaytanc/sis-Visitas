from rest_framework.response import Response
from rest_framework.views import APIView

class AuditlogPlaceholderAPIView(APIView):
    def get(self, request):
        return Response({"ok": True, "app": "auditlog"})
