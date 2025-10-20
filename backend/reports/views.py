from rest_framework.response import Response
from rest_framework.views import APIView

class ReportsPlaceholderAPIView(APIView):
    def get(self, request):
        return Response({"ok": True, "app": "reports"})
