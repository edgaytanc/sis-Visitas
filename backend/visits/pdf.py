from io import BytesIO
import os
from datetime import datetime

from django.conf import settings
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode import qr

BADGE_WIDTH = 90 * mm   # tamaño tipo gafete, horizontal
BADGE_HEIGHT = 60 * mm

def _draw_header(c: canvas.Canvas, text: str):
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(10*mm, BADGE_HEIGHT - 12*mm, text)

def _safe_image_reader(abs_path: str):
    try:
        if abs_path and os.path.exists(abs_path):
            return ImageReader(abs_path)
    except Exception:
        pass
    return None

def render_badge_pdf(visit) -> bytes:
    """
    Genera un PDF de gafete para una Visit.
    Contenido: encabezado, foto (si hay), nombre, topic, unidad destino,
    código de gafete, QR y fecha/hora.
    """
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape((BADGE_WIDTH, BADGE_HEIGHT)))

    # Fondo superior (barra de color)
    c.setFillColorRGB(0.12, 0.47, 0.86)  # azul institucional (aprox)
    c.rect(0, BADGE_HEIGHT - 16*mm, BADGE_WIDTH, 16*mm, stroke=0, fill=1)
    _draw_header(c, "SisVisitas — Gafete")

    # Marco general
    c.setStrokeColor(colors.black)
    c.rect(4*mm, 4*mm, BADGE_WIDTH - 8*mm, BADGE_HEIGHT - 8*mm, stroke=1, fill=0)

    # Datos
    citizen = visit.case.citizen
    topic = visit.case.topic
    badge_code = visit.badge_code or "SIN-COD"
    full_name = citizen.name
    unit = visit.target_unit or ""
    dt = visit.checkin_at or datetime.now()

    # Foto (si existe)
    photo_rel = (visit.photo_path or "").strip()
    photo_abs = os.path.join(settings.MEDIA_ROOT, photo_rel) if photo_rel else ""
    img = _safe_image_reader(photo_abs)

    # Área de foto (izquierda)
    photo_x = 8*mm
    photo_y = 12*mm
    photo_w = 30*mm
    photo_h = 36*mm

    if img:
        c.drawImage(img, photo_x, photo_y, width=photo_w, height=photo_h, preserveAspectRatio=True, mask='auto')
    else:
        # Placeholder
        c.setStrokeColor(colors.gray)
        c.rect(photo_x, photo_y, photo_w, photo_h, stroke=1, fill=0)
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(photo_x + photo_w/2, photo_y + photo_h/2, "Sin foto")

    # Texto (derecha)
    tx_x = photo_x + photo_w + 6*mm
    ty = BADGE_HEIGHT - 22*mm

    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(tx_x, ty, full_name[:40])
    ty -= 6*mm

    c.setFont("Helvetica", 10)
    c.drawString(tx_x, ty, f"Tema: {topic.code} — {topic.name[:32]}")
    ty -= 5*mm
    if unit:
        c.drawString(tx_x, ty, f"Unidad destino: {unit[:35]}")
        ty -= 5*mm

    c.setFont("Helvetica", 10)
    c.drawString(tx_x, ty, f"Entrada: {dt.strftime('%Y-%m-%d %H:%M')}")
    ty -= 6*mm

    # Código y QR
    c.setFont("Helvetica-Bold", 11)
    c.setFillColorRGB(0.12, 0.47, 0.86)
    c.drawString(tx_x, ty, f"Código: {badge_code}")
    c.setFillColor(colors.black)

    # QR con el badge_code
    qr_code = qr.QrCodeWidget(badge_code)
    bounds = qr_code.getBounds()
    qr_w = bounds[2] - bounds[0]
    qr_h = bounds[3] - bounds[1]
    size = 22*mm
    d = size / max(qr_w, qr_h)
    # Draw QR
    from reportlab.graphics.shapes import Drawing
    dr = Drawing(size, size)
    dr.add(qr_code)
    dr.scale(d, d)
    render_x = BADGE_WIDTH - size - 8*mm
    render_y = 10*mm
    dr.drawOn(c, render_x, render_y)

    c.showPage()
    c.save()

    pdf = buf.getvalue()
    buf.close()
    return pdf
