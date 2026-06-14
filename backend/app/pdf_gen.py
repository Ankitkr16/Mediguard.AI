import os
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_pdf_report(
    user_name: str,
    medicines: list[dict],
    interactions: list[dict],
    duplicates: list[dict],
    allergies: list[dict],
    reminders: list[dict],
    overall_risk: str,
    risk_score: float
) -> BytesIO:
    """
    Generates a beautifully styled medical safety report in PDF format.
    Returns a BytesIO stream containing the binary PDF data.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles (using safe system fonts)
    primary_color = colors.HexColor("#0f766e")   # Teal
    secondary_color = colors.HexColor("#1e293b") # Slate
    
    if overall_risk == "High":
        risk_color = colors.HexColor("#be123c")   # Crimson
    elif overall_risk == "Medium":
        risk_color = colors.HexColor("#d97706") # Orange
    else:
        risk_color = colors.HexColor("#16a34a")  # Green
        
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=primary_color,
        spaceAfter=15
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=secondary_color,
        spaceBefore=15,
        spaceAfter=8,
        borderColor=primary_color,
        borderWidth=1,
        borderRadius=2,
        borderPadding=5
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#334155"),
        spaceAfter=5
    )
    
    bullet_style = ParagraphStyle(
        'BulletDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=colors.HexColor("#475569"),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.white
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor("#0f172a")
    )

    story = []
    
    # 1. Header Table (Logo and Document Info)
    header_data = [
        [
            Paragraph("🛡️ MediGuard AI", title_style),
            Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d')}<br/><b>Patient:</b> {user_name or 'Guest User'}", body_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[4.0*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    
    # 2. Risk Level Banner
    risk_banner_data = [
        [
            Paragraph(f"<font color='white'><b>MEDICINE SAFETY RISK STATUS: {overall_risk.upper()} RISK ({risk_score}%)</b></font>", ParagraphStyle('Banner', fontName='Helvetica-Bold', fontSize=12, alignment=1))
        ]
    ]
    risk_banner = Table(risk_banner_data, colWidths=[7.5*inch])
    risk_banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), risk_color),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(risk_banner)
    story.append(Spacer(1, 15))
    
    # 3. Active Medicines List
    story.append(Paragraph("📋 Active Medicine Profiles", section_heading))
    if not medicines:
        story.append(Paragraph("No medicines added yet.", body_style))
    else:
        med_table_data = [[
            Paragraph("Medicine Name", table_header_style),
            Paragraph("Active Ingredients", table_header_style),
            Paragraph("Category", table_header_style)
        ]]
        for med in medicines:
            med_table_data.append([
                Paragraph(f"<b>{med.get('name', 'N/A')}</b>", table_cell_style),
                Paragraph(f"{', '.join(med.get('active_ingredients', []))}", table_cell_style),
                Paragraph(f"{med.get('category', 'General')}", table_cell_style)
            ])
        med_table = Table(med_table_data, colWidths=[2.2*inch, 2.5*inch, 2.8*inch])
        med_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        story.append(med_table)
    story.append(Spacer(1, 15))

    # 4. Drug Interactions & Warnings
    story.append(Paragraph("⚠️ Detected Drug-Drug & Safety Interactions", section_heading))
    if not interactions and not duplicates:
        story.append(Paragraph("✅ No drug-drug interactions or duplicate active ingredients detected.", body_style))
    else:
        if duplicates:
            story.append(Paragraph("<b>🚨 Duplicate Active Ingredient Alerts:</b>", body_style))
            for dup in duplicates:
                story.append(Paragraph(f"• <b>{dup['ingredient'].capitalize()}</b> is present in multiple medicines: {', '.join(dup['drugs'])}. <i>{dup['warning']}</i>", bullet_style))
            story.append(Spacer(1, 5))
            
        if interactions:
            for idx, inter in enumerate(interactions):
                r_level = inter['risk_level']
                r_color = "red" if r_level == "High" else "orange" if r_level == "Medium" else "green"
                story.append(Paragraph(
                    f"<b>{idx+1}. {inter['drug_a'].capitalize()} + {inter['drug_b'].capitalize()}</b> "
                    f"– <font color='{r_color}'><b>{r_level} Risk</b></font><br/>"
                    f"<i>Interaction:</i> {inter['description']}<br/>"
                    f"<i>Precautions:</i> {inter['precautions']}",
                    bullet_style
                ))
    story.append(Spacer(1, 15))

    # 5. Allergy Alerts
    story.append(Paragraph("🚫 Allergy Risk Profiles", section_heading))
    if not allergies:
        story.append(Paragraph("No allergies specified, or no matches detected in current profile.", body_style))
    else:
        allergy_data = [[
            Paragraph("Allergen Name", table_header_style),
            Paragraph("Severity", table_header_style),
            Paragraph("Risk Trigger", table_header_style)
        ]]
        for alg in allergies:
            # Check if matching medicine is present
            trigger = "No active medicines matched"
            for med in medicines:
                if any(ing in alg['allergen_name'].lower() for ing in med.get('active_ingredients', [])) or alg['allergen_name'].lower() in med['name'].lower():
                    trigger = f"Matched with active medicine: {med['name']}"
                    
            allergy_data.append([
                Paragraph(alg['allergen_name'], table_cell_style),
                Paragraph(f"<font color='red'><b>{alg['severity']}</b></font>" if alg['severity'] == "High" else alg['severity'], table_cell_style),
                Paragraph(trigger, table_cell_style)
            ])
        alg_table = Table(allergy_data, colWidths=[2.5*inch, 1.5*inch, 3.5*inch])
        alg_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), secondary_color),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        story.append(alg_table)
    story.append(Spacer(1, 15))

    # 6. Reminder Schedule
    story.append(Paragraph("📅 Medication Schedule & Reminders", section_heading))
    if not reminders:
        story.append(Paragraph("No reminders scheduled.", body_style))
    else:
        reminder_data = [[
            Paragraph("Medication", table_header_style),
            Paragraph("Dosage", table_header_style),
            Paragraph("Time of Day", table_header_style),
            Paragraph("Days", table_header_style)
        ]]
        for rem in reminders:
            reminder_data.append([
                Paragraph(f"<b>{rem['drug_name']}</b>", table_cell_style),
                Paragraph(rem.get('dosage') or "1 tab/caps", table_cell_style),
                Paragraph(rem['time_of_day'].capitalize(), table_cell_style),
                Paragraph(rem.get('days_of_week') or "Daily", table_cell_style)
            ])
        rem_table = Table(reminder_data, colWidths=[2.2*inch, 1.5*inch, 1.5*inch, 2.3*inch])
        rem_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        story.append(rem_table)
    story.append(Spacer(1, 20))

    # 7. Strict Disclaimer
    disclaimer_text = (
        "<b>Medical Disclaimer:</b> This safety report was compiled automatically by the MediGuard AI Assistant "
        "and is based on a limited local medical database and synthetic risk predictions. This report is for "
        "informational and educational purposes only. It is NOT a prescription, medical advice, or treatment "
        "recommendation. Always consult with a licensed doctor, pharmacist, or healthcare provider before "
        "starting, stopping, or combining any medications."
    )
    story.append(KeepTogether([
        Paragraph(disclaimer_text, ParagraphStyle('Disclaimer', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor("#64748b"), spaceBefore=10)),
        Spacer(1, 10),
        Paragraph("<font size='8'>🛡️ Generated by MediGuard AI - Smart Medicine Safety Assistant</font>", ParagraphStyle('Footer', alignment=1, textColor=colors.HexColor("#94a3b8")))
    ]))

    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
