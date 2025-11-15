from io import BytesIO
import os
from datetime import datetime

from django.conf import settings
from django.utils import timezone
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

# ---- Helpers originales ----
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

def _para(text, width, align="left", font_size=10, leading=12, bold=False):
    styles = getSampleStyleSheet()
    style = ParagraphStyle(
        'badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold' if bold else 'Helvetica',
        fontSize=font_size,
        leading=leading,
        textColor=colors.black,
        spaceBefore=0,
        spaceAfter=0,
        alignment={"left":0, "center":1, "right":2}.get(align, 0),
    )
    return Paragraph(text, style), width, None

def render_badge_pdf(visit) -> bytes:
    """
    Gafete con columnas + footer de código:
    - Columna QR fija a la derecha (sin superposición con texto).
    - Izquierda: foto; derecha (texto): Tema y Unidad.
    - Footer: Código de visitante (grande) y Entrada (pequeño).
    """
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(BADGE_WIDTH, BADGE_HEIGHT))

    # Barra superior (azul)
    c.setFillColorRGB(0.12, 0.47, 0.86)
    c.rect(0, BADGE_HEIGHT - HEADER_H, BADGE_WIDTH, HEADER_H, stroke=0, fill=1)
    _draw_header(c, "SisVisitas — Gafete")

    # Marco externo
    c.setStrokeColor(colors.black)
    c.rect(MARGIN, MARGIN, BADGE_WIDTH - 2*MARGIN, BADGE_HEIGHT - 2*MARGIN, stroke=1, fill=0)

    # ---- Datos base ----
    citizen    = visit.case.citizen
    topic      = visit.case.topic
    badge_code = (visit.badge_code or "SIN-COD").strip()
    full_name  = (citizen.name or "—").strip()
    unit       = (visit.target_unit or "").strip()
    dt         = visit.checkin_at or timezone.now()

    # ---- Grid general ----
    content_left  = MARGIN + 4*mm
    content_right = BADGE_WIDTH - (MARGIN + 1*mm)
    content_top   = BADGE_HEIGHT - HEADER_H - 3*mm
    content_bot   = MARGIN + 12*mm             # deja espacio para footer
    gutter        = 4 * mm

    # ---- Columna QR (fija) ----
    qr_size   = 17 * mm # tamaño del código QR 20x20
    qr_box_w  = qr_size + 2*mm                 # caja completa para evitar roces
    qr_x      = content_right - qr_box_w
    qr_y      = content_top - qr_size          # pegado al borde superior de contenido

    qr_code = qr.QrCodeWidget(badge_code)
    bounds = qr_code.getBounds()
    w, h = bounds[2] - bounds[0], bounds[3] - bounds[1]
    d = Drawing(qr_size, qr_size, transform=[qr_size / w, 0, 0, qr_size / h, 0, 0])
    # d.add(qr_code)
    # renderPDF.draw(d, c, qr_x + 1*mm, qr_y)    # +1mm para centrar dentro de su caja

    # Opcional: marco tenue de la columna QR (útil en pruebas)
    # c.setStrokeColorRGB(0.9,0.9,0.9); c.rect(qr_x, content_bot, qr_box_w, content_top - content_bot, stroke=1, fill=0)
    c.setStrokeColor(colors.black)

    # ---- Nombre centrado SOLO en la columna de texto (entre foto y QR) ----
    # Reservamos siempre el ancho de la foto a la izquierda (aunque no haya imagen)
    text_left   = content_left + 30*mm + gutter   # 30mm = photo_w
    text_right  = qr_x - gutter
    name_left   = text_left
    name_width  = max(26*mm, text_right - text_left)  # ancho util de la columna
    name_y      = content_top - 1*mm

    # Auto-encogimiento (12 → 11 → 10 pt) hasta 2 líneas máx
    for fsize in (12, 11, 10):
        p_name, _, _ = _para(full_name[:70], name_width, align="center",
                            font_size=fsize, leading=fsize+2, bold=True)
        p_name.wrapOn(c, name_width, 40)
        if p_name.height <= 18:
            break

    # Centrar dentro de la columna de texto
    name_text_width = p_name.minWidth()
    name_x = name_left + max(0, (name_width - name_text_width) / 2)

    p_name.drawOn(c, name_x, name_y - p_name.height)
    row_y = name_y - p_name.height - 3*mm



    # ---- Columna izquierda: Foto ----
    photo_w = 30 * mm
    photo_h = 34 * mm
    photo_x = content_left
    # photo_y = max(content_bot, row_y - photo_h)
    photo_y = content_bot - row_y + photo_h - 10*mm

    photo_rel = (visit.photo_path or "").strip()
    photo_abs = os.path.join(settings.MEDIA_ROOT, photo_rel) if photo_rel else ""
    img = _safe_image_reader(photo_abs)

    if img:
        c.drawImage(img, photo_x, photo_y, width=photo_w, height=photo_h,
                    preserveAspectRatio=True, mask='auto')
    else:
        c.setStrokeColor(colors.gray)
        c.rect(photo_x, photo_y, photo_w, photo_h, stroke=1, fill=0)
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(photo_x + photo_w/2, photo_y + photo_h/2, "Sin foto")
        c.setStrokeColor(colors.black)

    # ---- Columna derecha (texto) respetando columna QR ----
    right_x = photo_x + photo_w + gutter
    right_right_limit = qr_x - gutter
    right_w = max(26*mm, right_right_limit - right_x)
    right_y_top = row_y

    # Tema
    tema_text = f"Tema: {topic.code} — {topic.name}"
    p_tema, _, _ = _para(tema_text, right_w, font_size=6, leading=10)
    p_tema.wrapOn(c, right_w, 200)
    p_tema.drawOn(c, right_x, right_y_top - p_tema.height)
    cursor_y = right_y_top - p_tema.height - 2*mm

    # Unidad (si hay)
    if unit:
        uni_text = f"Unidad destino:\n{unit}"
        p_uni, _, _ = _para(uni_text, right_w, font_size=6, leading=10)
        p_uni.wrapOn(c, right_w, 150)
        p_uni.drawOn(c, right_x, cursor_y - p_uni.height)
        cursor_y -= (p_uni.height + 2*mm)

    # ---- Footer: Código de visitante + Entrada ----
    footer_h = 10 * mm
    c.setFillColorRGB(0.96, 0.97, 0.99)
    c.rect(MARGIN, MARGIN, BADGE_WIDTH - 2*MARGIN, footer_h, stroke=0, fill=1)
    c.setFillColor(colors.black)

    # --- 🔽 MODIFICADO ---
    # Convertimos la fecha UTC (dt_utc) a la zona local (GTM-6)
    dt_local = timezone.localtime(dt)
    
    # Entrada (pequeño, a la izquierda)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN + 5*mm, MARGIN + footer_h - 4*mm, f"Entrada: {dt_local.strftime('%Y-%m-%d %H:%M')}")
    # --- 🔼 FIN MODIFICADO ---

    # Código (grande, centrado) — visible para control de salida
    code_text = f"Código visitante: {badge_code}"
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(BADGE_WIDTH/2, MARGIN + 2*mm, code_text)

    c.showPage()
    c.save()
    pdf = buf.getvalue()
    buf.close()
    return pdf
