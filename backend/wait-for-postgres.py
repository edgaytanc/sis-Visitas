# backend/wait-for-postgres.py
import socket
import time
import os
import sys

# El host 'db' y el puerto '5432' se leen de las variables de entorno
# 'db' es el nombre del servicio de la base de datos en docker-compose.yml
db_host = os.environ.get("POSTGRES_HOST", "db")
db_port = int(os.environ.get("POSTGRES_PORT", 5432))
timeout = 25  # Esperar máximo 25 segundos

sys.stdout.write(f"Esperando a que Postgres ({db_host}:{db_port}) esté listo...\n")

start_time = time.time()

while time.time() - start_time < timeout:
    try:
        # Intenta crear una conexión
        with socket.create_connection((db_host, db_port), timeout=2):
            sys.stdout.write(f"¡Postgres está listo! Continuando...\n")
            sys.exit(0) # Éxito
    except (socket.timeout, socket.error, ConnectionRefusedError):
        sys.stderr.write("Postgres aún no está listo. Reintentando en 1 segundo...\n")
        time.sleep(1)

sys.stderr.write(f"Error: Postgres no estuvo disponible después de {timeout} segundos.\n")
sys.exit(1) # Falla