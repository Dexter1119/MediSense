####################################################################
#
# File Name :   lung_pdf_generator.py
# Description : Advanced COPD Clinical PDF (Heatmap + Prob Bars)
# Author      : Pradhumnya Changdev Kalsait
# Date        : 27/02/26
#
####################################################################

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from io import BytesIO
import numpy as np


# ==============================================================
# Utility: Color Mapping for Heatmap
# ==============================================================

def value_to_color(value, vmin, vmax):

    if vmax == vmin:
        return colors.white

    normalized = (value - vmin) / (vmax - vmin)

    # Blue → Yellow → Red gradient
    if normalized < 0.5:
        return colors.Color(0, normalized * 2, 1 - normalized * 2)
    else:
        return colors.Color((normalized - 0.5) * 2, 1 - (normalized - 0.5) * 2, 0)


# ==============================================================
# Utility: Probability Bar Renderer
# ==============================================================

def create_probability_bar(label, probability):

    percentage = round(probability * 100, 2)

    bar_length = 3 * inch
    filled_length = bar_length * probability

    bar_data = [
        [
            label,
            ""
        ]
    ]

    table = Table(bar_data, colWidths=[1.5 * inch, bar_length])

    table.setStyle(TableStyle([
        ('BACKGROUND', (1, 0), (1, 0), colors.lightgrey),
        ('BOX', (1, 0), (1, 0), 0.5, colors.grey),
    ]))

    # Overlay colored bar
    table._argW[1] = bar_length

    return table


# ==============================================================
# Main PDF Generator
# ==============================================================

def generate_copd_pdf(report_data):

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()

    # ================= TITLE =================
    elements.append(Paragraph("<b>COPD AI Clinical Report</b>", styles["Title"]))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(
        Paragraph(f"Generated: {report_data['generated_at']}", styles["Normal"])
    )
    elements.append(Spacer(1, 0.3 * inch))

    # ================= STAGE 1 =================
    s1 = report_data["stage1"]

    elements.append(Paragraph("<b>Stage 1 Prediction</b>", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Prediction: {s1['prediction']} | Confidence: {round(s1['confidence']*100,2)}%",
            styles["Normal"]
        )
    )
    elements.append(Spacer(1, 0.2 * inch))

    # Probability Bars
    for label, data in s1["probabilities"].items():
        elements.append(
            Paragraph(
                f"{label}: {round(data['probability']*100,2)}%",
                styles["Normal"]
            )
        )
        elements.append(Spacer(1, 0.1 * inch))

    elements.append(Spacer(1, 0.3 * inch))

    # ================= STAGE 2 =================
    if report_data["stage2"]:

        s2 = report_data["stage2"]

        elements.append(Paragraph("<b>Stage 2 Severity</b>", styles["Heading2"]))
        elements.append(
            Paragraph(
                f"GOLD Stage: {s2['gold_stage']} | Confidence: {round(s2['confidence']*100,2)}%",
                styles["Normal"]
            )
        )
        elements.append(Spacer(1, 0.2 * inch))

        elements.append(
            Paragraph(
                f"<b>Clinical Note:</b> {report_data['clinical_note']}",
                styles["Normal"]
            )
        )

        elements.append(Spacer(1, 0.3 * inch))

        # Stage 2 Probabilities
        for label, data in s2["probabilities"].items():
            elements.append(
                Paragraph(
                    f"{label}: {round(data['probability']*100,2)}%",
                    styles["Normal"]
                )
            )
            elements.append(Spacer(1, 0.1 * inch))

        elements.append(Spacer(1, 0.4 * inch))

    # ================= TOPOGRAPHY HEATMAP =================
    if report_data["topography"]:

        elements.append(Paragraph("<b>Topography Heatmap</b>", styles["Heading2"]))
        elements.append(Spacer(1, 0.2 * inch))

        matrix = report_data["topography"]["matrix"]
        stats = report_data["topography"]["statistics"]

        np_matrix = np.array(matrix)
        vmin = np.min(np_matrix)
        vmax = np.max(np_matrix)

        heatmap_data = []
        table_style = TableStyle([])

        for i, row in enumerate(matrix):
            heatmap_row = []
            for j, value in enumerate(row):
                heatmap_row.append(round(value, 2))

                color = value_to_color(value, vmin, vmax)

                table_style.add(
                    'BACKGROUND',
                    (j, i),
                    (j, i),
                    color
                )

            heatmap_data.append(heatmap_row)

        heatmap_table = Table(heatmap_data)
        heatmap_table.setStyle(table_style)

        elements.append(heatmap_table)
        elements.append(Spacer(1, 0.4 * inch))

        # Statistics Table
        stats_data = [
            ["Max", stats["max"]],
            ["Min", stats["min"]],
            ["Mean", stats["mean"]],
            ["Std Dev", stats["std"]],
        ]

        stats_table = Table(stats_data, colWidths=[2 * inch, 2 * inch])
        stats_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))

        elements.append(Paragraph("<b>Topography Statistics</b>", styles["Heading3"]))
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(stats_table)

    doc.build(elements)
    buffer.seek(0)

    return buffer