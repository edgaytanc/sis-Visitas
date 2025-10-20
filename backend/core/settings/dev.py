from .base import *

DEBUG = True

# En dev puedes usar SQLite si no tienes Postgres local:
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
