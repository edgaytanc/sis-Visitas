from typing import Any, Optional
from .models import AuditLog

def log_action(*, user=None, action:str, entity:str="", entity_id:str="", payload:Optional[dict]=None, ip:str=None):
    """
    Uso:
        log_action(user=request.user, action="visit_checkout", entity="Visit", entity_id=str(visit.id), payload={...}, ip=get_client_ip(request))
    """
    try:
        AuditLog.objects.create(
            user=user if (user and getattr(user, "is_authenticated", False)) else None,
            action=action,
            entity=entity,
            entity_id=str(entity_id or ""),
            payload=payload or None,
            ip=ip,
        )
    except Exception:
        # La bitácora nunca debe romper el flujo principal
        pass

def get_client_ip(request) -> str | None:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
