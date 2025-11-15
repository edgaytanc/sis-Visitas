from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q, Max

from catalog.models import Topic
from .models import Citizen, VisitCase, Visit
from .serializers import (
    CitizenSerializer, VisitCaseSerializer, VisitSerializer, VisitCreateSerializer
)
from .filters import VisitFilter, VisitCaseFilter
from django.conf import settings
from .serializers import PhotoUploadSerializer
from .utils import _parse_base64, save_image_file, read_inmemory_uploadedfile
from django.utils import timezone

from django.http import HttpResponse
from .pdf import render_badge_pdf

from auditlog.utils import log_action, get_client_ip

from django.utils import timezone
from datetime import datetime
from reports.utils import make_datetime_range

from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse,
    OpenApiTypes
)

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
    
    # ✅ NUEVO ENDPOINT: listar visitantes activos
    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        """
        GET /api/visits/visits/active/
        Retorna todas las visitas sin checkout (visitantes activos).
        """
        qs = self.get_queryset().filter(checkout_at__isnull=True)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # Helper interno: marca checkout, valida idempotencia
    def _perform_checkout(self, visit, request=None):
        if visit.checkout_at:
            return None, {"detail": "La visita ya tiene checkout registrado."}
        from django.utils import timezone
        visit.checkout_at = timezone.now()
        visit.save(update_fields=["checkout_at", "updated_at"])

        # Auditoría con usuario + IP
        try:
            log_action(
                user=getattr(request, "user", None),
                action="visit_checkout",
                entity="Visit",
                entity_id=str(visit.id),
                payload={"badge_code": visit.badge_code, "case_id": visit.case_id},
                ip=get_client_ip(request) if request else None,
            )
        except Exception:
            pass

        return visit, None

    @action(detail=True, methods=["patch"], url_path="checkout")
    def checkout_by_id(self, request, pk=None):
        """
        PATCH /api/visits/visits/{id}/checkout/
        """
        visit = self.get_object()
        updated, error = self._perform_checkout(visit)
        if error:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)
        return Response(VisitSerializer(updated).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["patch"], url_path="checkout")
    def checkout_by_badge(self, request):
        """
        PATCH /api/visits/visits/checkout/?badge_code=...  (o JSON { "badge_code": "..." })
        """
        badge_code = request.query_params.get("badge_code") or request.data.get("badge_code")
        if not badge_code:
            return Response({"detail": "Debe proporcionar 'badge_code'."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            visit = Visit.objects.get(badge_code=badge_code)
        except Visit.DoesNotExist:
            return Response({"detail": "No existe una visita con ese badge_code."}, status=status.HTTP_404_NOT_FOUND)

        updated, error = self._perform_checkout(visit)
        if error:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)
        return Response(VisitSerializer(updated).data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["get"], url_path=r"badge\.pdf")
    def badge_pdf(self, request, pk=None):
        """
        GET /api/visits/visits/{id}/badge.pdf
        Devuelve el PDF del gafete (inline por defecto).
        Puedes pasar ?download=1 para forzar descarga.
        """
        visit = self.get_object()
        pdf_bytes = render_badge_pdf(visit)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        filename = f"gafete-{visit.badge_code or visit.id}.pdf"
        if request.query_params.get("download") in ("1", "true", "yes"):
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
        else:
            response["Content-Disposition"] = f'inline; filename="{filename}"'
        return response
    

    
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        GET /api/visits/visits/stats/
        Retorna estadísticas para el dashboard.
        """
        # 1. Visitantes activos (sin checkout)
        activos = Visit.objects.filter(checkout_at__isnull=True).count()
        
        # 2. Usar la utilidad de reportes para el rango de "hoy"
        tz = timezone.get_current_timezone()
        # (from_str=None, to_str=None) por defecto usa el día de hoy
        dt_from, dt_to = make_datetime_range(None, None, tz) 

        # 3. Entradas de hoy (checkin en el rango de hoy)
        entradas_hoy = Visit.objects.filter(checkin_at__gte=dt_from, checkin_at__lt=dt_to).count()
        
        # 4. Salidas de hoy (checkout en el rango de hoy)
        salidas_hoy = Visit.objects.filter(checkout_at__gte=dt_from, checkout_at__lt=dt_to).count()

        data = {
            "activos": activos,
            "entradas_hoy": entradas_hoy,
            "salidas_hoy": salidas_hoy
        }
        return Response(data, status=status.HTTP_200_OK)
    
    
    

    
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
    


class SearchAPIView(APIView):
    """
    GET /api/visits/search/?dpi=&phone=&name=&case_code=&topic=
    - topic: acepta id numérico, o código/nombre (icontains)
    Retorna: citizen, citizen_candidates, topic, topic_candidates, case, cases, last_visit
    """
    permission_classes = [IsAuthenticated]

    def get_topic_from_param(self, topic_param: str | None):
        if not topic_param:
            return None, []
        topic = None
        candidates = []
        # Si es número, intenta por id
        if topic_param.isdigit():
            topic = Topic.objects.filter(id=int(topic_param), is_active=True).first()
            if topic:
                return topic, []
        # Buscar por code o name (icontains)
        qs = Topic.objects.filter(is_active=True).filter(
            Q(code__iexact=topic_param) | Q(name__icontains=topic_param)
        )[:10]
        candidates = list(qs)
        if len(candidates) == 1:
            topic = candidates[0]
            candidates = []
        return topic, candidates

    def get(self, request):
        dpi = (request.query_params.get("dpi") or "").strip()
        phone = (request.query_params.get("phone") or "").strip()
        name = (request.query_params.get("name") or "").strip()
        case_code = (request.query_params.get("case_code") or "").strip()
        topic_param = (request.query_params.get("topic") or "").strip()

        # --- Topic (claro o candidatos) ---
        topic, topic_candidates = self.get_topic_from_param(topic_param)

        # --- Citizen (claro o candidatos) ---
        citizen = None
        citizen_candidates = []

        # Prioridad: dpi exacto > phone exacto > name icontains
        if dpi:
            citizen = Citizen.objects.filter(dpi__iexact=dpi).first()
        if not citizen and phone:
            # varios podrían tener el mismo phone; listamos candidatos
            cands = Citizen.objects.filter(phone__iexact=phone)[:10]
            if cands.count() == 1:
                citizen = cands.first()
            else:
                citizen_candidates = list(cands)
        if not citizen and name:
            # buscar por nombre
            cands = Citizen.objects.filter(name__icontains=name)[:10]
            if cands.count() == 1:
                citizen = cands.first()
            else:
                citizen_candidates = list(cands)

        # Si viene case_code, úsalo para fijar case (y de ahí citizen/topic)
        case = None
        cases = []
        last_visit = None

        if case_code:
            case = VisitCase.objects.select_related("citizen", "topic").filter(code_persistente__iexact=case_code).first()
            if case:
                citizen = citizen or case.citizen
                topic = topic or case.topic

        # Si ya tengo citizen (y quizá topic), arma el set de cases
        if citizen:
            qs_cases = VisitCase.objects.select_related("citizen", "topic").filter(citizen=citizen)
            if topic:
                qs_cases = qs_cases.filter(topic=topic)
            cases = list(qs_cases.order_by("-opened_at")[:50])
            # Si topic único → intenta definir case principal
            if not case and topic:
                case = qs_cases.order_by("-opened_at").first()
            # last_visit: del case si hay; si no, de ese citizen
            if case:
                last_visit = Visit.objects.filter(case=case).order_by("-checkin_at").first()
            else:
                last_visit = Visit.objects.filter(case__citizen=citizen).order_by("-checkin_at").first()
        else:
            # Sin citizen claro pero con topic: no hay cases definidos; last_visit no aplica
            pass

        # Serialización
        out = {
            "query": {
                "dpi": dpi,
                "phone": phone,
                "name": name,
                "case_code": case_code,
                "topic": topic_param,
            },
            "citizen": CitizenSerializer(citizen).data if citizen else None,
            "citizen_candidates": CitizenSerializer(citizen_candidates, many=True).data if citizen_candidates else [],
            "topic": {"id": topic.id, "code": topic.code, "name": topic.name} if topic else None,
            "topic_candidates": [{"id": t.id, "code": t.code, "name": t.name} for t in topic_candidates] if topic_candidates else [],
            "case": VisitCaseSerializer(case).data if case else None,
            "cases": VisitCaseSerializer(cases, many=True).data if cases else [],
            "last_visit": VisitSerializer(last_visit).data if last_visit else None,
        }
        return Response(out, status=200)