import django_filters
from .models import Topic

class TopicFilter(django_filters.FilterSet):
    code = django_filters.CharFilter(field_name="code", lookup_expr="icontains")
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")
    unit = django_filters.CharFilter(field_name="unit", lookup_expr="icontains")
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = Topic
        fields = ["code", "name", "unit", "is_active"]
