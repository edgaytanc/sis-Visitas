from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import RegexValidator
from catalog.models import Topic

User = get_user_model()

# Estados del expediente
CASE_OPEN   = "ABIERTO"
CASE_WIP    = "EN_GESTION"
CASE_CLOSED = "CERRADO"

CASE_STATES = [
    (CASE_OPEN, "Abierto"),
    (CASE_WIP, "En gestión"),
    (CASE_CLOSED, "Cerrado"),
]

dpi_validator = RegexValidator(
    regex=r"^[0-9]{6,13}$",
    message="DPI debe contener entre 6 y 13 dígitos."
)

phone_validator = RegexValidator(
    regex=r"^[0-9+\-() ]{6,20}$",
    message="Teléfono con formato inválido."
)

class Citizen(models.Model):
    """
    Datos mínimos del ciudadano. Debe proveer DPI o PASAPORTE (al menos uno).
    """
    dpi = models.CharField(
        max_length=20, unique=True, null=True, blank=True,
        validators=[dpi_validator], db_index=True
    )
    passport = models.CharField(max_length=32, unique=True, null=True, blank=True, db_index=True)
    name = models.CharField(max_length=128, db_index=True)
    phone = models.CharField(max_length=20, validators=[phone_validator], blank=True, default="", db_index=True)
    origin = models.CharField(max_length=128, blank=True, default="", help_text="Procedencia / comunidad / municipio")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ciudadano"
        verbose_name_plural = "Ciudadanos"

    def __str__(self):
        ident = self.dpi or self.passport or "SIN-ID"
        return f"{self.name} ({ident})"

    def has_identifier(self) -> bool:
        return bool(self.dpi or self.passport)


class VisitCase(models.Model):
    """
    Expediente persistente por (citizen, topic).
    Puede reabrirse las veces que sea necesario con la misma clave persistente.
    """
    code_persistente = models.CharField(max_length=32, unique=True, db_index=True)
    citizen = models.ForeignKey(Citizen, on_delete=models.CASCADE, related_name="cases")
    topic = models.ForeignKey(Topic, on_delete=models.PROTECT, related_name="cases")
    state = models.CharField(max_length=16, choices=CASE_STATES, default=CASE_OPEN, db_index=True)

    opened_at = models.DateTimeField(default=timezone.now, db_index=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_reason = models.TextField(blank=True, default="")

    # Última justificación al reabrir (auditoría básica)
    last_reopen_reason = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("citizen", "topic")]
        verbose_name = "Expediente de Visita"
        verbose_name_plural = "Expedientes de Visita"

    def __str__(self):
        return f"{self.code_persistente} — {self.citizen} — {self.topic.name}"

    @staticmethod
    def make_code(citizen_id: int, topic_id: int) -> str:
        # Código persistente legible y estable: CASE-<citizen>-<topic>
        return f"CASE-{citizen_id}-{topic_id}".upper()

    def reopen(self, justification: str = ""):
        self.state = CASE_OPEN
        self.opened_at = timezone.now()
        self.closed_at = None
        self.closed_reason = ""
        self.last_reopen_reason = justification or ""
        self.save(update_fields=["state", "opened_at", "closed_at", "closed_reason", "last_reopen_reason", "updated_at"])


class Visit(models.Model):
    """
    Movimiento de visita (entrada/salida) asociado a un expediente.
    """
    case = models.ForeignKey(VisitCase, on_delete=models.CASCADE, related_name="visits")
    checkin_at = models.DateTimeField(default=timezone.now, db_index=True)
    checkout_at = models.DateTimeField(null=True, blank=True, db_index=True)

    intake_user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="intake_visits")
    target_unit = models.CharField(max_length=128, db_index=True)   # Unidad destino de la gestión
    reason = models.CharField(max_length=256, blank=True, default="")
    photo_path = models.CharField(max_length=255, blank=True, default="")  # BE-05 lo convertirá a upload real
    badge_code = models.CharField(max_length=32, unique=True, db_index=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-checkin_at"]
        verbose_name = "Visita"
        verbose_name_plural = "Visitas"

    def __str__(self):
        return f"{self.badge_code or 'SIN-COD'} — {self.case.code_persistente}"

    def save(self, *args, **kwargs):
        creating = self.pk is None
        super().save(*args, **kwargs)
        # Genera badge_code legible tras tener id
        if creating and not self.badge_code:
            y = timezone.now().year
            self.badge_code = f"VIS-{y}-{self.id:06d}"
            super().save(update_fields=["badge_code"])
