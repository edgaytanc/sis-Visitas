from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from .models import AuditLog
from .serializers import AuditLogSerializer

from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse,
    OpenApiTypes
)

class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["action", "entity", "user"]
    search_fields = ["entity", "entity_id", "user__username", "ip"]
    ordering_fields = ["ts"]
    ordering = ["-ts"]


class AuditlogPlaceholderAPIView(APIView):
    def get(self, request):
        return Response({"ok": True, "app": "auditlog"})
