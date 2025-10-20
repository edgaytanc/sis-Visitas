from rest_framework import serializers
from .models import Topic
import re

CODE_RE = re.compile(r"^[A-Z0-9\-_.]{3,32}$")

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = [
            "id", "code", "name", "description", "unit", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_code(self, value: str) -> str:
        v = value.strip().upper()
        if not CODE_RE.match(v):
            raise serializers.ValidationError(
                "Formato de 'code' inválido. Usa solo A-Z, 0-9, '-', '_' o '.', longitud 3–32."
            )
        return v

    def validate_name(self, value: str) -> str:
        v = value.strip()
        if len(v) < 3:
            raise serializers.ValidationError("El nombre debe tener al menos 3 caracteres.")
        return v

    def validate_unit(self, value: str) -> str:
        v = value.strip()
        if len(v) < 2:
            raise serializers.ValidationError("La unidad debe tener al menos 2 caracteres.")
        return v
