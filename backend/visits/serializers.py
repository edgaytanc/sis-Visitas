from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Citizen, VisitCase, Visit, CASE_CLOSED, CASE_OPEN
from catalog.models import Topic

User = get_user_model()

class CitizenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citizen
        fields = ["id", "dpi", "passport", "name", "phone", "origin", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
        # 👇 IMPORTANTE: no validar unicidad aquí, la BD ya la garantiza y
        # VisitCreateSerializer.create() hace get_or_create(...)
        extra_kwargs = {
            "dpi": {"validators": []},
            "passport": {"validators": []},
        }

    def validate(self, attrs):
        dpi = attrs.get("dpi") if "dpi" in attrs else getattr(self.instance, "dpi", None)
        passport = attrs.get("passport") if "passport" in attrs else getattr(self.instance, "passport", None)
        if not dpi and not passport:
            raise serializers.ValidationError("Debe proporcionar DPI o PASAPORTE.")
        return attrs


class VisitCaseSerializer(serializers.ModelSerializer):
    citizen = CitizenSerializer(read_only=True)
    topic = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = VisitCase
        fields = [
            "id", "code_persistente", "citizen", "topic", "state",
            "opened_at", "closed_at", "closed_reason", "last_reopen_reason",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class VisitSerializer(serializers.ModelSerializer):
    case = VisitCaseSerializer(read_only=True)
    intake_user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Visit
        fields = [
            "id", "case", "checkin_at", "checkout_at",
            "intake_user", "target_unit", "reason", "photo_path", "badge_code",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "case", "checkin_at", "checkout_at", "intake_user", "badge_code", "created_at", "updated_at"]


class VisitCreateSerializer(serializers.Serializer):
    """
    Crea una visita y garantiza/gestiona el expediente (VisitCase).
    """
    # Datos del ciudadano (crea/actualiza si no existe)
    citizen = CitizenSerializer()
    # Tema (Topic)
    topic_id = serializers.IntegerField()
    # Datos de la visita
    target_unit = serializers.CharField(max_length=128)
    reason = serializers.CharField(max_length=256, required=False, allow_blank=True, default="")
    photo_path = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")

    # Si el expediente está CERRADO, se permite reabrir con justificación
    reopen_justification = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_topic_id(self, value):
        if not Topic.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("El tema especificado no existe o no está activo.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        user: User = request.user

        citizen_data = validated_data.pop("citizen")
        topic_id = validated_data.pop("topic_id")
        reopen_justification = validated_data.pop("reopen_justification", "")

        topic = Topic.objects.get(id=topic_id)

        # 1) Obtiene o crea el ciudadano (prioriza dpi; si no hay, usa passport)
        dpi = (citizen_data.get("dpi") or "").strip() or None
        passport = (citizen_data.get("passport") or "").strip() or None
        name = citizen_data["name"].strip()
        phone = citizen_data.get("phone", "").strip()
        origin = citizen_data.get("origin", "").strip()

        citizen = None
        if dpi:
            citizen, _ = Citizen.objects.get_or_create(dpi=dpi, defaults={"name": name, "phone": phone, "origin": origin})
        elif passport:
            citizen, _ = Citizen.objects.get_or_create(passport=passport, defaults={"name": name, "phone": phone, "origin": origin})
        else:
            # Ya validado por CitizenSerializer, pero por seguridad:
            raise serializers.ValidationError("Debe proporcionar DPI o PASAPORTE en citizen.")

        # Actualiza datos básicos si cambiaron
        changed = False
        if name and citizen.name != name:
            citizen.name = name; changed = True
        if phone != citizen.phone:
            citizen.phone = phone; changed = True
        if origin != citizen.origin:
            citizen.origin = origin; changed = True
        if changed:
            citizen.save()

        # 2) Garantiza el expediente persistente por (citizen, topic)
        case = None
        try:
            case = VisitCase.objects.get(citizen=citizen, topic=topic)
            # si está cerrado → reabrir con justificación
            if case.state == CASE_CLOSED:
                case.reopen(justification=reopen_justification)
        except VisitCase.DoesNotExist:
            # crear expediente con código persistente
            case = VisitCase.objects.create(
                citizen=citizen,
                topic=topic,
                state=CASE_OPEN,
                opened_at=timezone.now(),
                code_persistente="PENDIENTE"  # placeholder para obtener id y luego setear código
            )
            case.code_persistente = VisitCase.make_code(citizen.id, topic.id)
            case.save(update_fields=["code_persistente"])

        # 3) Crea la visita (check-in)
        visit = Visit.objects.create(
            case=case,
            intake_user=user,
            target_unit=validated_data.get("target_unit").strip(),
            reason=validated_data.get("reason", "").strip(),
            photo_path=validated_data.get("photo_path", "").strip(),
        )
        return visit

    def to_representation(self, instance: Visit):
        return VisitSerializer(instance).data



class PhotoUploadSerializer(serializers.Serializer):
    """
    Permite subir imagen vía:
    - multipart: campo 'image' (InMemoryUploadedFile)
    - o JSON base64: campo 'image_base64' (data:image/<fmt>;base64,<...> o solo el base64)
    Opcional: 'filename' sugerido.
    """
    image = serializers.ImageField(required=False, allow_null=True)
    image_base64 = serializers.CharField(required=False, allow_blank=True)
    filename = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        if not attrs.get("image") and not attrs.get("image_base64"):
            raise serializers.ValidationError("Debes enviar 'image' (multipart) o 'image_base64' (JSON).")
        return attrs
