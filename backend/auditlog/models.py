from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AuditLog(models.Model):
    """
    Bitácora mínima de acciones relevantes.
    """
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs")
    action = models.CharField(max_length=64, db_index=True)               # p.ej. 'login', 'user_created', 'case_created', 'visit_checkin', 'visit_checkout', 'report_download'
    entity = models.CharField(max_length=64, blank=True, default="", db_index=True)  # p.ej. 'User', 'VisitCase', 'Visit', 'Report'
    entity_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    payload = models.JSONField(null=True, blank=True)                      # datos útiles (no sensibles)
    ip = models.GenericIPAddressField(null=True, blank=True)
    ts = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-ts"]
        verbose_name = "Registro de bitácora"
        verbose_name_plural = "Bitácora"

    def __str__(self):
        u = self.user.username if self.user else "anon"
        return f"[{self.ts:%Y-%m-%d %H:%M:%S}] {self.action} by {u} -> {self.entity}({self.entity_id})"
