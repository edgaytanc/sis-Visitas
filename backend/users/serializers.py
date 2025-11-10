from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

User = get_user_model()

# --- Serializer existente para /users/me/ ---
# (No se modifica, ya que lo usa MeAPIView)
class MeSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "is_active", "groups"]

    def get_groups(self, obj):
        return list(obj.groups.values_list("name", flat=True))



# --- Serializer para Listar Usuarios (Lectura) ---
class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para listar usuarios en el panel de administración.
    Incluye los grupos a los que pertenece.
    """
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name", "email", 
            "is_active", "is_staff", "is_superuser", "groups", "last_login", "date_joined"
        ]

    def get_groups(self, obj):
        # Devuelve una lista de nombres de grupos, ej: ["admin", "supervisor"]
        return list(obj.groups.values_list("name", flat=True))


# --- Serializer para Crear y Actualizar Usuarios (Escritura) ---
class UserCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y actualizar usuarios.
    Maneja el hashing de contraseña y la asignación de grupos por nombre.
    """
    
    # Validador de email: requerido y único
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    
    # Validador de username: requerido y único
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    
    # Manejo de contraseña: solo escritura, no requerida en actualizaciones
    password = serializers.CharField(
        write_only=True, 
        required=False, 
        allow_blank=True, 
        style={'input_type': 'password'}
    )
    
    # Manejo de grupos: acepta una lista de nombres, ej: ["admin", "recepcion"]
    groups = serializers.SlugRelatedField(
        many=True,
        queryset=Group.objects.all(),
        slug_field='name',
        required=False  # No siempre se envían los grupos
    )

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", 
            "is_active", "is_staff", "is_superuser", "password", "groups"
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        """
        Maneja la creación de un nuevo usuario, asegurando que la contraseña
        se hashee correctamente usando create_user.
        """
        groups_data = validated_data.pop('groups', [])
        password = validated_data.pop('password', None)

        if not password:
            raise serializers.ValidationError({"password": "La contraseña es requerida para crear un usuario."})

        # Usar create_user para hashear la contraseña
        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        # Asignar grupos
        if groups_data:
            user.groups.set(groups_data)
            
        return user

    def update(self, instance, validated_data):
        """
        Maneja la actualización de un usuario existente.
        Actualiza la contraseña solo si se proporciona una nueva.
        """
        groups_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)

        # Actualiza los campos simples (username, email, etc.)
        instance = super().update(instance, validated_data)

        # Si se proporcionó una contraseña nueva, hashearla y guardarla
        if password:
            instance.set_password(password)
            instance.save()

        # Si se proporcionó una lista de grupos, actualizarla
        # (si 'groups' no está en el payload, groups_data es None y no se tocan)
        if groups_data is not None:
            instance.groups.set(groups_data)

        return instance

