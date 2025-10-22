from io import BytesIO
import os
from datetime import datetime

from django.conf import settings
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph

BADGE_WIDTH  = 90 * mm   # horizontal
BADGE_HEIGHT = 60 * mm

HEADER_H = 16 * mm
MARGIN   = 4  * mm

def _draw_header(c: canvas.Canvas, text: str):
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN + 6*mm, BADGE_HEIGHT - HEADER_H + 4*mm, text)

def _safe_image_reader(abs_path: str):
    try:
        if abs_path and os.path.exists(abs_path):
            return ImageReader(abs_path)
    except Exception:
        pass
    return None

def _para(text, width):
    # Estilo básico para párrafos de una o dos líneas
    styles = getSampleStyleSheet()
    style = ParagraphStyle(
        'badge',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=12,
        textColor=colors.black,
        spaceBefore=0,
        spaceAfter=0,
    )
    return Paragraph(text, style), width, None

def render_badge_pdf(visit) -> bytes:
    """
    PDF del gafete: encabezado, foto, datos, QR y fecha/hora.
    """
    buf = BytesIO()

    # 👉 No usar landscape aquí; nuestra medida ya es horizontal.
    c = canvas.Canvas(buf, pagesize=(BADGE_WIDTH, BADGE_HEIGHT))

    # Barra superior (azul)
    c.setFillColorRGB(0.12, 0.47, 0.86)
    c.rect(0, BADGE_HEIGHT - HEADER_H, BADGE_WIDTH, HEADER_H, stroke=0, fill=1)
    _draw_header(c, "SisVisitas — Gafete")

    # Marco general
    c.setStrokeColor(colors.black)
    c.rect(MARGIN, MARGIN, BADGE_WIDTH - 2*MARGIN, BADGE_HEIGHT - 2*MARGIN, stroke=1, fill=0)

    # Datos
    citizen    = visit.case.citizen
    topic      = visit.case.topic
    badge_code = visit.badge_code or "SIN-COD"
    full_name  = citizen.name
    unit       = visit.target_unit or ""
    dt         = visit.checkin_at or datetime.now()

    # Foto (izquierda)
    photo_rel = (visit.photo_path or "").strip()
    photo_abs = os.path.join(settings.MEDIA_ROOT, photo_rel) if photo_rel else ""
    img = _safe_image_reader(photo_abs)

    photo_x = MARGIN + 4*mm
    photo_y = MARGIN + 8*mm
    photo_w = 30*mm
    photo_h = 36*mm

    if img:
        c.drawImage(img, photo_x, photo_y, width=photo_w, height=photo_h,
                    preserveAspectRatio=True, mask='auto')
    else:
        c.setStrokeColor(colors.gray)
        c.rect(photo_x, photo_y, photo_w, photo_h, stroke=1, fill=0)
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(photo_x + photo_w/2, photo_y + photo_h/2, "Sin foto")
    c.setStrokeColor(colors.black)  # restore

    # Reserva del QR a la derecha
    qr_size   = 22 * mm
    qr_pad    = 2  * mm
    qr_x      = BADGE_WIDTH - qr_size - (MARGIN + 4*mm)
    qr_y      = MARGIN + 6*mm

    # Área de texto disponible = desde fin de foto hasta antes del QR
    text_x = photo_x + photo_w + 6*mm
    text_right_limit = qr_x - qr_pad
    text_w = max(20*mm, text_right_limit - text_x)

    # Nombre
    ty = BADGE_HEIGHT - HEADER_H - 6*mm
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(text_x, ty, (full_name or "")[:40])
    ty -= 6*mm

    # Párrafos con wrap para Tema y Unidad
    c.setFont("Helvetica", 10)

    # Tema
    tema_text = f"Tema: {topic.code} — {topic.name}"
    p, w, _ = _para(tema_text, text_w)
    p.wrapOn(c, text_w, 100)
    p.drawOn(c, text_x, ty - p.height)
    ty -= (p.height + 1*mm)

    # Unidad (si hay)
    if unit:
        uni_text = f"Unidad destino: {unit}"
        p, w, _ = _para(uni_text, text_w)
        p.wrapOn(c, text_w, 100)
        p.drawOn(c, text_x, ty - p.height)
        ty -= (p.height + 1*mm)

    # Fecha/hora
    c.setFont("Helvetica", 10)
    c.drawString(text_x, ty, f"Entrada: {dt.strftime('%Y-%m-%d %H:%M')}")
    ty -= 6*mm

    # Código (en azul)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColorRGB(0.12, 0.47, 0.86)
    c.drawString(text_x, ty, f"Código: {badge_code}")
    c.setFillColor(colors.black)

    # QR escalado y posicionado
    qr_code = qr.QrCodeWidget(badge_code)
    bounds = qr_code.getBounds()
    w = bounds[2] - bounds[0]
    h = bounds[3] - bounds[1]
    # Normaliza el widget al cuadro (0,0)-(1,1) y luego escala a qr_size
    d = Drawing(qr_size, qr_size, transform=[qr_size / w, 0, 0, qr_size / h, 0, 0])
    d.add(qr_code)
    renderPDF.draw(d, c, qr_x, qr_y)

    c.showPage()
    c.save()
    pdf = buf.getvalue()
    buf.close()
    return pdf
