from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
import os

User = get_user_model()

GROUPS = ["recepcion", "supervisor", "admin"]

class Command(BaseCommand):
    help = "Crea grupos base y un superusuario inicial (desde .env si disponible)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Creando grupos..."))
        for g in GROUPS:
            Group.objects.get_or_create(name=g)
        self.stdout.write(self.style.SUCCESS(f"Grupos OK: {', '.join(GROUPS)}"))

        su_username = os.getenv("SU_USERNAME", "admin")
        su_email = os.getenv("SU_EMAIL", "admin@example.com")
        su_password = os.getenv("SU_PASSWORD", "admin1234")

        self.stdout.write(self.style.MIGRATE_HEADING("Creando/actualizando superusuario..."))

        if not User.objects.filter(username=su_username).exists():
            User.objects.create_superuser(
                username=su_username,
                email=su_email,
                password=su_password,
                is_active=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Superusuario creado: {su_username} / {su_email}"))
        else:
            self.stdout.write(self.style.WARNING("Superusuario ya existía; no se modifica contraseña."))

        # Opcional: agrega el superuser al grupo admin
        su = User.objects.get(username=su_username)
        admin_group = Group.objects.get(name="admin")
        su.groups.add(admin_group)
        self.stdout.write(self.style.SUCCESS("Superusuario agregado al grupo 'admin'."))

        self.stdout.write(self.style.SUCCESS("Seed completado."))
