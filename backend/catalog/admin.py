from django.contrib import admin
from .models import Topic

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "unit", "is_active", "created_at")
    list_filter = ("is_active", "unit", "created_at")
    search_fields = ("code", "name", "unit", "description")
    ordering = ("name",)
