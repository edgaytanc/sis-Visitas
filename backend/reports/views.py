from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from rest_framework.views import APIView

from rest_framework.permissions import IsAuthenticated

from django.utils import timezone

from visits.models import Visit
from visits.serializers import VisitSerializer  # opcional si quieres exponer JSON en el futuro
from .utils import make_datetime_range
from .pdf import render_visits_report_pdf

from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse,
    OpenApiTypes
)

class ReportsPlaceholderAPIView(APIView):
    def get(self, request):
        return Response({"ok": True, "app": "reports"})


class VisitsReportAPIView(APIView):
    """
    GET /api/reports/visits?from=YYYY-MM-DD&to=YYYY-MM-DD&citizen=<id|texto>
    - 'citizen' puede ser id (numérico) o un nombre parcial (icontains).
    Respuesta: PDF (application/pdf).
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self, request):
        q = Visit.objects.select_related("case", "case__citizen", "case__topic").all()

        # Rango de fecha por check-in (zona local)
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")
        dt_from, dt_to = make_datetime_range(from_str, to_str, timezone.get_current_timezone())
        q = q.filter(checkin_at__gte=dt_from, checkin_at__lt=dt_to)

        # Filtro de ciudadano: id exacto o nombre parcial
        citizen_param = (request.query_params.get("citizen") or "").strip()
        if citizen_param:
            if citizen_param.isdigit():
                q = q.filter(case__citizen__id=int(citizen_param))
            else:
                q = q.filter(case__citizen__name__icontains=citizen_param)

        # Podríamos añadir más filtros aquí si fuese necesario (topic, unidad, etc.)
        return q.order_by("-checkin_at")

    def get(self, request):
        qs = self.get_queryset(request)
        visits = list(qs[:2000])  # evita PDFs gigantes (ajustable)
        total = qs.count()

        from_str = request.query_params.get("from") or ""
        to_str = request.query_params.get("to") or ""
        citizen_param = request.query_params.get("citizen") or ""

        title = "Reporte de Visitas"
        subtitle = []
        subtitle.append(f"Rango: {from_str or '(hoy)'} a {to_str or '(hoy)'}")
        if citizen_param:
            subtitle.append(f"Filtro ciudadano: {citizen_param}")

        pdf_bytes = render_visits_report_pdf(title, subtitle, visits, total)

        filename = f"reporte-visitas-{from_str or 'hoy'}_{to_str or 'hoy'}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        # inline por defecto (para ver en navegador); usa ?download=1 para forzar descarga
        if request.query_params.get("download") in ("1", "true", "yes"):
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
        else:
            response["Content-Disposition"] = f'inline; filename="{filename}"'
        return response