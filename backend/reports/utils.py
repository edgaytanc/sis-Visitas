from datetime import datetime, time, timedelta
from django.utils import timezone

DATE_FMT = "%Y-%m-%d"

def parse_date_param(s: str | None):
    """
    Devuelve datetime.date o None si el string no es válido.
    """
    if not s:
        return None
    try:
        return datetime.strptime(s, DATE_FMT).date()
    except Exception:
        return None

def make_datetime_range(from_str: str | None, to_str: str | None, tzinfo=None):
    """
    Construye (dt_from, dt_to_exclusive) en timezone dado (o el actual).
    Si faltan params, por defecto usa el día de hoy.
    """
    tz = tzinfo or timezone.get_current_timezone()
    today = timezone.localdate()
    d_from = parse_date_param(from_str) or today
    d_to = parse_date_param(to_str) or today

    if d_to < d_from:
        d_to = d_from

    # Inicio del día en zona local
    dt_from = timezone.make_aware(datetime.combine(d_from, time.min), tz)
    # Fin del día + 1 micro para exclusivo
    dt_to = timezone.make_aware(datetime.combine(d_to, time.max), tz)
    # Para filtros "lte" mejor una exclusiva al siguiente segundo
    dt_to = dt_to + timedelta(seconds=1)
    return dt_from, dt_to
