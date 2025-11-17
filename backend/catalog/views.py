from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .models import Topic
from .serializers import TopicSerializer
from .permissions import TopicPermission
from .filters import TopicFilter
from auditlog.utils import log_action, get_client_ip

from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse,
    OpenApiTypes
)

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

    # --- TAREA: INICIO (Sobrescritura de 'destroy' para Soft Delete) ---
    
    def destroy(self, request, *args, **kwargs):
        """
        En lugar de borrar (DELETE), desactiva (is_active = False).
        Esto evita problemas de Foreign Key si el Tema ya está en uso.
        """
        instance = self.get_object()
        
        if not instance.is_active:
            # Si ya está inactivo, no hacer nada (idempotente)
            return Response(status=status.HTTP_204_NO_CONTENT)

        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])
        
        # Registrar en la bitácora
        try:
            log_action(
                user=request.user,
                action="topic_deactivate", # Acción específica de desactivar
                entity="Topic",
                entity_id=str(instance.id),
                payload={"code": instance.code, "name": instance.name},
                ip=get_client_ip(request),
            )
        except Exception:
            pass # La auditoría no debe fallar la operación

        return Response(status=status.HTTP_204_NO_CONTENT)
    
    # --- TAREA: FIN (Sobrescritura de 'destroy') ---

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