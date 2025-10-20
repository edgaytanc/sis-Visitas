from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("ts", "user", "action", "entity", "entity_id", "ip")
    list_filter = ("action", "entity", "ts")
    search_fields = ("user__username", "action", "entity", "entity_id")
