from django.utils.deprecation import MiddlewareMixin
from .utils import log_action, get_client_ip

class ReportDownloadAuditMiddleware(MiddlewareMixin):
    """
    Registra descargas de reporte PDF en /api/reports/visits.
    """
    def process_response(self, request, response):
        try:
            path = request.path or ""
            if path.startswith("/api/reports/visits"):
                ctype = response.headers.get("Content-Type") or response.get("Content-Type", "")
                if response.status_code == 200 and "application/pdf" in ctype.lower():
                    user = getattr(request, "user", None)
                    ip = get_client_ip(request)
                    log_action(
                        user=user,
                        action="report_download",
                        entity="Report",
                        entity_id="visits",
                        payload={"query": request.GET.dict()},
                        ip=ip,
                    )
        except Exception:
            pass
        return response
