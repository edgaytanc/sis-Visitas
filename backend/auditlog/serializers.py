from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "ts", "user", "user_username", "action", "entity", "entity_id", "payload", "ip"]

    def get_user_username(self, obj):
        return obj.user.username if obj.user else None
