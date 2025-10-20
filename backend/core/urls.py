from django.contrib import admin
from django.urls import path, include
from core.views import healthcheck
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", healthcheck, name="healthcheck"),

    # OpenAPI / Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # Namespaces para futuras rutas de apps
    path("api/users/", include("users.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/visits/", include("visits.urls")),
    path("api/auditlog/", include("auditlog.urls")),
    path("api/reports/", include("reports.urls")),
]
