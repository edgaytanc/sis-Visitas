from django.contrib import admin
from .models import Citizen, VisitCase, Visit

@admin.register(Citizen)
class CitizenAdmin(admin.ModelAdmin):
    list_display = ("name", "dpi", "passport", "phone", "origin", "created_at")
    search_fields = ("name", "dpi", "passport", "phone", "origin")
    list_filter = ("created_at",)

@admin.register(VisitCase)
class VisitCaseAdmin(admin.ModelAdmin):
    list_display = ("code_persistente", "citizen", "topic", "state", "opened_at", "closed_at")
    list_filter = ("state", "topic", "opened_at", "closed_at")
    search_fields = ("code_persistente", "citizen__name", "citizen__dpi", "citizen__passport", "topic__name")

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("badge_code", "case", "checkin_at", "checkout_at", "intake_user", "target_unit")
    list_filter = ("target_unit", "checkin_at", "checkout_at")
    search_fields = ("badge_code", "case__code_persistente", "case__citizen__name", "target_unit")
