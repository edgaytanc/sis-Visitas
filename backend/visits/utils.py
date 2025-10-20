import base64
import io
import os
import re
import uuid
from datetime import datetime
from PIL import Image, ExifTags

from django.conf import settings

# 5 MB (ajusta si lo necesitas)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
# Formatos aceptados
ALLOWED_FORMATS = ("JPEG", "PNG")
ALLOWED_EXTS = (".jpg", ".jpeg", ".png")

DATAURL_RE = re.compile(r"^data:image/(?P<fmt>[a-zA-Z0-9+.-]+);base64,(?P<data>.+)$", re.IGNORECASE)

def _parse_base64(data_str: str):
    """
    Acepta data URL (data:image/png;base64,...) o base64 'puro'.
    Retorna bytes y sug. extension ('jpg'/'png' o '').
    """
    m = DATAURL_RE.match(data_str.strip())
    if m:
        fmt = (m.group("fmt") or "").lower()
        raw = m.group("data")
        return base64.b64decode(raw), (".jpg" if fmt in ("jpg", "jpeg") else ".png" if fmt == "png" else "")
    # base64 "puro"
    return base64.b64decode(data_str), ""

def _fix_orientation(pil_img: Image.Image) -> Image.Image:
    # Corrige orientación según EXIF (si existe)
    try:
        exif = pil_img._getexif()
        if not exif:
            return pil_img
        orientation_key = next((k for k, v in ExifTags.TAGS.items() if v == "Orientation"), None)
        if not orientation_key:
            return pil_img
        orientation = exif.get(orientation_key)
        if orientation == 3:
            pil_img = pil_img.rotate(180, expand=True)
        elif orientation == 6:
            pil_img = pil_img.rotate(270, expand=True)
        elif orientation == 8:
            pil_img = pil_img.rotate(90, expand=True)
    except Exception:
        # Si algo falla, seguimos con la imagen como está
        pass
    return pil_img

def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def _safe_ext_from_name(name: str) -> str:
    _, ext = os.path.splitext(name or "")
    ext = ext.lower()
    if ext in ALLOWED_EXTS:
        return ext
    return ""

def save_image_file(file_bytes: bytes, original_name: str = "") -> str:
    """
    Valida, corrige orientación y guarda imagen en MEDIA_ROOT/photos/YYYY/MM/uuid.ext
    Retorna la ruta relativa (p.ej. 'photos/2025/10/abcd-...ef.jpg')
    """
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError("La imagen excede el tamaño máximo permitido (5 MB).")

    # Abrir con PIL y validar formato
    pil = Image.open(io.BytesIO(file_bytes))
    pil = _fix_orientation(pil)
    fmt = (pil.format or "").upper()

    # Si no tiene formato, intenta deducir con el nombre
    if fmt not in ALLOWED_FORMATS:
        # Reintentar guardando como JPEG si la imagen es convertible
        # pero primero verifica si el nombre sugiere PNG/JPEG
        ext_hint = _safe_ext_from_name(original_name)
        if ext_hint in (".jpg", ".jpeg"):
            fmt = "JPEG"
        elif ext_hint == ".png":
            fmt = "PNG"
        # Si sigue sin estar permitido, rechazamos
        if fmt not in ALLOWED_FORMATS:
            raise ValueError("Formato no permitido. Usa JPEG o PNG.")

    # Formato destino y extensión
    ext = ".jpg" if fmt == "JPEG" else ".png"
    today = datetime.now()
    rel_dir = f"photos/{today.year}/{today.month:02d}"
    abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
    _ensure_dir(abs_dir)
    fname = f"{uuid.uuid4().hex}{ext}"
    rel_path = f"{rel_dir}/{fname}"
    abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)

    # Guardar con compresión razonable
    out = io.BytesIO()
    if fmt == "JPEG":
        pil = pil.convert("RGB")  # evitar errores con modo "P"/"RGBA"
        pil.save(out, format="JPEG", quality=85, optimize=True)
    else:
        pil.save(out, format="PNG", optimize=True)

    with open(abs_path, "wb") as f:
        f.write(out.getvalue())

    return rel_path

def read_inmemory_uploadedfile(dj_file) -> bytes:
    """
    Convierte InMemoryUploadedFile o TemporaryUploadedFile en bytes.
    """
    dj_file.seek(0)
    return dj_file.read()
