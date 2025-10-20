from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .models import Citizen, VisitCase, Visit
from .serializers import (
    CitizenSerializer, VisitCaseSerializer, VisitSerializer, VisitCreateSerializer
)
from .filters import VisitFilter, VisitCaseFilter
from django.conf import settings
from .serializers import PhotoUploadSerializer
from .utils import _parse_base64, save_image_file, read_inmemory_uploadedfile

class VisitsPlaceholderAPIView(APIView):
    def get(self, request):
        return Response({"ok": True, "app": "visits"})

# ---- Citizen (solo lectura básica; la creación ocurre desde el check-in) ----
class CitizenViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    queryset = Citizen.objects.all().order_by("name")
    serializer_class = CitizenSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "dpi", "passport", "phone", "origin"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


# ---- VisitCase (lectura; se crea/gestiona desde VisitCreate) ----
class VisitCaseViewSet(mixins.ListModelMixin,
                       mixins.RetrieveModelMixin,
                       viewsets.GenericViewSet):
    queryset = VisitCase.objects.select_related("citizen", "topic").all()
    serializer_class = VisitCaseSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = VisitCaseFilter
    search_fields = ["code_persistente", "citizen__name", "citizen__dpi", "topic__name"]
    ordering_fields = ["opened_at", "updated_at", "state"]
    ordering = ["-opened_at"]


# ---- Visit (incluye create con lógica de expediente) ----
class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.select_related("case", "case__citizen", "case__topic", "intake_user").all()
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = VisitFilter
    search_fields = ["badge_code", "case__code_persistente", "case__citizen__name", "target_unit", "reason"]
    ordering_fields = ["checkin_at", "checkout_at", "badge_code"]
    ordering = ["-checkin_at"]

    def get_serializer_class(self):
        if self.action in ["create"]:
            return VisitCreateSerializer
        return VisitSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        visit = serializer.save()
        out = VisitSerializer(visit).data
        return Response(out, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="recent")
    def recent(self, request):
        qs = self.get_queryset().order_by("-checkin_at")[:20]
        ser = VisitSerializer(qs, many=True)
        return Response(ser.data, status=200)
    
class PhotoUploadAPIView(APIView):
    """
    POST /api/visits/photos/upload/
    - multipart: image=<file>
    - JSON: { "image_base64": "data:image/jpeg;base64,..." }
    Respuesta: { "path": "<rel_path>", "url": "<abs_url>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = PhotoUploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        image_file = ser.validated_data.get("image", None)
        image_b64 = ser.validated_data.get("image_base64", "")
        filename = ser.validated_data.get("filename", "")

        try:
            if image_file:
                raw = read_inmemory_uploadedfile(image_file)
                rel_path = save_image_file(raw, original_name=image_file.name)
            else:
                raw, ext_hint = _parse_base64(image_b64)
                suggest_name = filename or f"upload{ext_hint}"
                rel_path = save_image_file(raw, original_name=suggest_name)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        except Exception:
            return Response({"detail": "No se pudo procesar la imagen."}, status=400)

        url = request.build_absolute_uri(f"{settings.MEDIA_URL}{rel_path}")
        return Response({"path": rel_path, "url": url}, status=201)