import django_filters
from .models import Visit, VisitCase, Citizen

class VisitFilter(django_filters.FilterSet):
    from_date = django_filters.DateTimeFilter(field_name="checkin_at", lookup_expr="gte")
    to_date = django_filters.DateTimeFilter(field_name="checkin_at", lookup_expr="lte")
    citizen_name = django_filters.CharFilter(field_name="case__citizen__name", lookup_expr="icontains")
    citizen_dpi = django_filters.CharFilter(field_name="case__citizen__dpi", lookup_expr="iexact")
    topic_id = django_filters.NumberFilter(field_name="case__topic__id")
    badge_code = django_filters.CharFilter(field_name="badge_code", lookup_expr="iexact")

    class Meta:
        model = Visit
        fields = ["topic_id", "citizen_name", "citizen_dpi", "badge_code", "from_date", "to_date"]


class VisitCaseFilter(django_filters.FilterSet):
    code_persistente = django_filters.CharFilter(field_name="code_persistente", lookup_expr="iexact")
    state = django_filters.CharFilter(field_name="state", lookup_expr="iexact")
    citizen_name = django_filters.CharFilter(field_name="citizen__name", lookup_expr="icontains")
    citizen_dpi = django_filters.CharFilter(field_name="citizen__dpi", lookup_expr="iexact")
    topic_id = django_filters.NumberFilter(field_name="topic__id")

    class Meta:
        model = VisitCase
        fields = ["code_persistente", "state", "citizen_name", "citizen_dpi", "topic_id"]
