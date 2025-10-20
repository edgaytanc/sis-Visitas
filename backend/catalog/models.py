from django.db import models

class Topic(models.Model):
    """
    Catálogo de temas/gestiones.
    """
    code = models.CharField(max_length=32, unique=True, db_index=True)  # ej: "TRAM-001"
    name = models.CharField(max_length=128, db_index=True)              # ej: "Trámite de constancia"
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=128, db_index=True)              # ej: "Tesorería", "Secretaría Municipal"
    is_active = models.BooleanField(default=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Tema / Gestión"
        verbose_name_plural = "Temas / Gestiones"

    def __str__(self):
        return f"{self.code} - {self.name}"
