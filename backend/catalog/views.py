from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .models import Topic
from .serializers import TopicSerializer
from .permissions import TopicPermission
from .filters import TopicFilter

class CatalogPlaceholderAPIView(APIView):
    def get(self, request):
        return Response({"ok": True, "app": "catalog"})

class TopicViewSet(viewsets.ModelViewSet):
    """
    CRUD de temas/gestiones con permisos por rol y filtros/búsquedas.
    """
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticated & TopicPermission]

    # Búsqueda / ordenamiento (apoyado por DRF settings)
    filterset_class = TopicFilter
    search_fields = ["code", "name", "unit", "description"]
    ordering_fields = ["name", "code", "unit", "created_at", "updated_at"]
    ordering = ["name"]

    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        """
        Listado rápido de activos (ayuda UX).
        """
        qs = self.get_queryset().filter(is_active=True)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data, status=200)