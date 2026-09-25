import io
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from app.services.demo_data import (
    DEMO_CASES, DEMO_ENTITIES, DEMO_EDGES, DEMO_TIMELINE, DEMO_ALERTS,
    DEMO_ENTITIES_MH092, DEMO_HOPS_MH092, DEMO_DISCREPANCIES_MH092, DEMO_EVIDENCE_MH092
)


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that accumulates total page count and renders
    legal law-enforcement headers, footers, and 'Page X of Y' on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.case_number = "CASE-2024-MH-092"

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        w, h = 595.27, 841.89  # A4 dimensions

        # Top Header (pages 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#0f172a"))
            self.drawString(44, h - 30, "CONFIDENTIAL // LAW ENFORCEMENT INTELLIGENCE DOSSIER")
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#0891b2"))
            self.drawRightString(w - 44, h - 30, self.case_number)
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(44, h - 34, w - 44, h - 34)

        # Bottom Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(44, 38, w - 44, 38)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(44, 26, f"{self.case_number}  |  CrimeNet AI  |  CONFIDENTIAL")
        self.drawRightString(w - 44, 26, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def resolve_case_dossier_data(report_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Dynamically loads and synthesizes dossier data for any requested case.
    Prioritizes passed caseData, or falls back to backend canonical demo registries.
    """
    case_id = (report_data.get('caseId') or 'CASE-2024-MH-092') if report_data else 'CASE-2024-MH-092'
    case_number = report_data.get('caseNumber') or case_id if report_data else case_id
    custom_data = report_data.get('caseData') or {} if report_data else {}

    # 1. Lookup case record
    matched_case = next((c for c in DEMO_CASES if c.get('caseId') == case_id or c.get('caseNumber') == case_id), None)
    if not matched_case:
        matched_case = DEMO_CASES[0]

    lead_investigator = custom_data.get('leadInvestigator') or matched_case.get('leadInvestigator') or "Inspector Vikramaditya Rao (LEO-7729)"
    assigned_team = custom_data.get('assignedTeam') or matched_case.get('assignedTeam') or "Insp. V. Rao, SI Priyanka Sen, Analyst K. Nair"
    jurisdiction = custom_data.get('jurisdiction') or matched_case.get('jurisdiction') or "Special Crime Branch, CID Mumbai"
    associated_firs = custom_data.get('associatedFIRs') or matched_case.get('associatedFIRs') or ["FIR-2024-8841"]
    fir_str = ", ".join(associated_firs) if isinstance(associated_firs, list) else str(associated_firs)

    # 2. Executive Summary
    summary_text = custom_data.get('summary') or (
        "Investigation into organized contraband import through fictitious shipping manifests, "
        "shell clearing companies, and offshore hawala conduits along the Mumbai-Surat maritime corridor. "
        "On 14 August 2024 at 02:30 AM, joint preventive officers intercepted refrigerated container #MRKU-982141-0 "
        "at Nhava Sheva Port Yard 4B, recovering 42.5 kg concealed illicit contraband. "
        "Multi-hop network synthesis establishes operational coordination between logistics operator "
        "Vikram Malhotra and Surat financial broker Rajesh K. Sharma via shell entity BlueSea Logistics & Trading Pvt Ltd."
    )

    # 3. Canonical Registries
    entities = DEMO_ENTITIES_MH092
    path_hops = DEMO_HOPS_MH092
    network_metrics = {
        'betweenness': '0.842 (Rajesh K. Sharma / ENT-PERS-002)',
        'community': 'Cluster #3 (Financial Intermediation & Maritime Logistics)',
        'shortestPath': '6-Hop Direct Forensic Traversal (Person -> Phone -> Person -> Bank -> Txn -> Org)',
        'multiHop': 'Conducted via M5 Graph ML Traversal Engine'
    }
    discrepancies = DEMO_DISCREPANCIES_MH092
    evidence_items = DEMO_EVIDENCE_MH092
    timeline = [
        {
            'timestamp': '2024-08-10 16:00',
            'title': 'Import Manifest Filed (IGM #239104)',
            'source': 'ICEGATE Electronic Manifest',
            'details': 'BlueSea Logistics declared 800 cartons of fresh dates from Dubai aboard vessel MV Al-Rida.'
        },
        {
            'timestamp': '2024-08-14 01:04',
            'title': 'Suspicious Intercept Voice Call',
            'source': 'Airtel CDR Dump #901',
            'details': '342s voice call between Vikram Malhotra (+91-98201-99412) and Surat broker Rajesh Sharma.'
        },
        {
            'timestamp': '2024-08-14 01:18',
            'title': 'NEFT Relay Wire Executed (TXN-90214)',
            'source': 'HDFC Certified Ledger',
            'details': 'INR 15,00,000 debit wire transfer from Rajesh Sharma account to BlueSea Logistics clearing account.'
        },
        {
            'timestamp': '2024-08-14 02:30',
            'title': 'Physical Interception & Seizure (Exhibit P-1)',
            'source': 'Panchnama Exhibit P-1',
            'details': 'Joint raid seized container #MRKU-982141-0 at Nhava Sheva Yard 4B. Found 42.5 kg contraband behind false insulation panel.'
        },
        {
            'timestamp': '2024-08-14 04:00',
            'title': 'Suspect Apprehension & Device Seizure',
            'source': 'Seizure Memo #14-B',
            'details': 'Apprehended Vikram Malhotra on site. Secured operational smartphone inside RF-shielded Faraday bag.'
        }
    ]

    officer_name = "Inspector Vikramaditya Rao (LEO-7729)"
    badge = "LEO-7729"
    agency = "Special Crime Branch, CID Mumbai"

    return {
        'caseReference': case_number,
        'dossierId': case_number,
        'leadInvestigator': officer_name,
        'badgeNumber': badge,
        'agencyUnit': agency,
        'dateGenerated': '2026-09-24',
        'securityClearance': 'CONFIDENTIAL',
        'jurisdiction': jurisdiction,
        'assignedTeam': assigned_team,
        'associatedFIR': fir_str,
        'statutoryCompliance': "BSA Sec. 63 / BNS Sec. 111 Certified Dossier",
        'summary': summary_text,
        'entities': entities,
        'pathHops': path_hops,
        'networkMetrics': network_metrics,
        'discrepancies': discrepancies,
        'evidenceItems': evidence_items,
        'timeline': timeline,
        'attestation': {
            'standard': 'BSA Section 63',
            'certText': 'I hereby certify that the electronic records, hash digests, network relationships, and discrepancies compiled in this document were produced by computer systems operating under regular supervision during the ordinary course of investigative duties. The cryptographic SHA-256 hashes were calculated directly from bitstream forensic copies without manual interception or post-facto modification.',
            'investigatingOfficer': 'Insp. Vikramaditya Rao (LEO-7729)',
            'officerBadge': 'LEO-7729',
            'officerUnit': 'Special Crime Branch, CID Mumbai',
            'attestingAuthority': 'Superintendent of Police / Authority Attestation',
            'authorityUnit': 'Special Crime Branch CID Maharashtra',
            'digitalSeal': 'SHA256-ECDSA-VERIFIED'
        }
    }


def generate_investigation_report_pdf(report_data: Optional[Dict[str, Any]] = None) -> io.BytesIO:
    """
    Generates a complete multi-page, REAL TEXT-BASED PDF investigation report.
    Conforms to the legal intelligence dossier structure, professional typography,
    and exact immutable text content specified for CASE-2024-MH-092.
    """
    buffer = io.BytesIO()
    # A4 Dimensions: 595.27 x 841.89 pt. Printable width: 595.27 - 88 = 507.27 pt.
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=44,
        rightMargin=44,
        topMargin=46,
        bottomMargin=46
    )

    dossier = resolve_case_dossier_data(report_data)

    # Color Palette: Deep Navy & Restrained Cyan / Charcoal
    c_navy = colors.HexColor("#0f172a")
    c_slate_dark = colors.HexColor("#1e293b")
    c_card_bg = colors.HexColor("#f8fafc")
    c_card_border = colors.HexColor("#cbd5e1")
    c_cyan = colors.HexColor("#0891b2")
    c_cyan_light = colors.HexColor("#ecfeff")
    c_amber = colors.HexColor("#b45309")
    c_amber_bg = colors.HexColor("#fef3c7")
    c_red = colors.HexColor("#b91c1c")
    c_red_bg = colors.HexColor("#fee2e2")
    c_green = colors.HexColor("#15803d")
    c_green_bg = colors.HexColor("#dcfce7")
    c_text_main = colors.HexColor("#0f172a")
    c_text_muted = colors.HexColor("#475569")
    c_subtle_bg = colors.HexColor("#f1f5f9")

    # Typography Styles
    styles = getSampleStyleSheet()

    style_doc_tag = ParagraphStyle(
        'DocTag',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=c_cyan,
        alignment=1,
        spaceAfter=4
    )
    style_doc_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=c_navy,
        alignment=1,
        spaceAfter=10
    )
    style_sec_heading = ParagraphStyle(
        'SecHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=c_navy,
        spaceBefore=10,
        spaceAfter=6
    )
    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_text_main
    )
    style_body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=c_text_main
    )
    style_meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=c_text_muted
    )
    style_meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=c_text_main
    )
    style_card_body = ParagraphStyle(
        'CardBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_text_main
    )
    style_card_title = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=c_navy
    )
    style_hash_text = ParagraphStyle(
        'HashText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=c_text_main
    )
    style_caption = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=c_text_muted,
        alignment=1
    )
    style_badge_valid = ParagraphStyle(
        'BadgeValid',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=c_green,
        alignment=2
    )
    style_badge_revoked = ParagraphStyle(
        'BadgeRevoked',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=c_red,
        alignment=2
    )
    style_badge_discrepancy = ParagraphStyle(
        'BadgeDiscrepancy',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=c_amber,
        alignment=0
    )

    story = []

    # =========================================================================
    # PAGE 1: DOCUMENT HEADER & METADATA GRID
    # =========================================================================
    story.append(Paragraph("CONFIDENTIAL LAW ENFORCEMENT INTELLIGENCE DOSSIER", style_doc_tag))
    story.append(Paragraph("CRIME NETWORK ANALYSIS & EVIDENCE INTEGRITY REPORT", style_doc_title))

    meta_data = [
        [
            Paragraph("Case Reference: <b>CASE-2024-MH-092</b>", style_meta_val),
            Paragraph("Jurisdiction: <b>Special Crime Branch, CID Mumbai</b>", style_meta_val)
        ],
        [
            Paragraph("DOSSIER ID: <b>CASE-2024-MH-092</b>", style_meta_val),
            Paragraph("LEAD OFFICER: <b>Inspector Vikramaditya Rao (LEO-7729)</b>", style_meta_val)
        ],
        [
            Paragraph("DATE GENERATED: <b>2026-09-24</b>", style_meta_val),
            Paragraph("SECURITY CLEARANCE: <font color='#b45309'><b>CONFIDENTIAL</b></font>", style_meta_val)
        ]
    ]

    meta_table = Table(meta_data, colWidths=[253, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_card_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_card_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 1: EXECUTIVE INVESTIGATION SUMMARY
    # =========================================================================
    story.append(Paragraph("1. EXECUTIVE INVESTIGATION SUMMARY", style_sec_heading))
    sec1_text = (
        "Investigation into organized contraband import through fictitious shipping manifests, "
        "shell clearing companies, and offshore hawala conduits along the Mumbai-Surat maritime corridor. "
        "On 14 August 2024 at 02:30 AM, joint preventive officers intercepted refrigerated container #MRKU-982141-0 "
        "at Nhava Sheva Port Yard 4B, recovering 42.5 kg concealed illicit contraband. "
        "Multi-hop network synthesis establishes operational coordination between logistics operator "
        "Vikram Malhotra and Surat financial broker Rajesh K. Sharma via shell entity BlueSea Logistics & Trading Pvt Ltd."
    )
    summary_table = Table([[Paragraph(sec1_text, style_body)]], colWidths=[507])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_card_border),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 9),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: KEY INDEXED NETWORK ENTITIES
    # =========================================================================
    story.append(Paragraph("2. KEY INDEXED NETWORK ENTITIES", style_sec_heading))

    ent1_html = (
        "<b>PRIMARY SUBJECT:</b><br/>"
        "<b>Vikram Malhotra (ENT-PERS-001)</b><br/><br/>"
        "Aliases: Vicky Cargo, V.M. Logistics<br/><br/>"
        "Identified as principal on-ground logistics coordinator in container handling at Nhava Sheva. "
        "CDR indicates repeated burst calls prior to consignment arrivals. No prior convictions recorded; "
        "analytical focus centered on multi-hop remittances and discrepancies in cargo declaration documents."
    )

    ent2_html = (
        "<b>INTERMEDIARY BROKER:</b><br/>"
        "<b>Rajesh Kumar Sharma (ENT-PERS-002)</b><br/><br/>"
        "Aliases: Sharma Ji, RK Hawala, Bhaiya Surat<br/><br/>"
        "Documented financial intermediary operating out of Surat diamond bazaar. "
        "Banking audit reveals high-velocity pass-through transfers between bullion accounts and logistics firms."
    )

    ent_table_data = [
        [
            Paragraph(ent1_html, style_card_body),
            Paragraph(ent2_html, style_card_body)
        ]
    ]

    t_ent = Table(ent_table_data, colWidths=[250, 250])
    t_ent.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_card_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_card_border),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_ent)
    story.append(Spacer(1, 8))



    # Force PageBreak to start Section 3 cleanly on Page 2
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: SECTION 3 & SECTION 4
    # =========================================================================
    story.append(Paragraph("3. NETWORK GRAPH INTELLIGENCE FINDINGS (M5 TRAVERSAL)", style_sec_heading))

    # 6-Hop Visual Grouping Blocks Table
    visual_hops = [
        [
            Paragraph("<b>01</b><br/>Vikram Malhotra<br/>&darr;<br/><font color='#0891b2'>OPERATES / PHONE</font>", style_card_body),
            Paragraph("<b>02</b><br/>+91-98201-99412<br/>&darr;<br/><font color='#0891b2'>342s CALL</font>", style_card_body),
            Paragraph("<b>03</b><br/>Rajesh K. Sharma<br/>&darr;<br/><font color='#0891b2'>FINANCIAL CONTROL</font>", style_card_body)
        ],
        [
            Paragraph("<b>04</b><br/>HDFC Account 9921-4820<br/>&darr;<br/><font color='#0891b2'>NEFT</font>", style_card_body),
            Paragraph("<b>05</b><br/>TXN-90214<br/>&darr;<br/><font color='#0891b2'>BENEFICIARY</font>", style_card_body),
            Paragraph("<b>06</b><br/>BlueSea Logistics & Trading Pvt Ltd", style_card_body)
        ]
    ]
    t_visual_hops = Table(visual_hops, colWidths=[169, 169, 169])
    t_visual_hops.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_card_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_card_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(t_visual_hops)
    story.append(Spacer(1, 8))

    # Complete Original Conduit Sentence
    sec3_conduit = (
        "<b>Documented 6-Hop Conduit:</b><br/><br/>"
        "Vikram Malhotra (Person) &rarr; +91-98201-99412 (Phone) &rarr; Call 342s (01:04 AM) &rarr; "
        "Rajesh K. Sharma (Person) &rarr; HDFC Account 9921-4820 (Bank) &rarr; TXN-90214 ₹15,00,000 (NEFT) &rarr; "
        "BlueSea Logistics & Trading Pvt Ltd (Shell Org)"
    )
    t_conduit = Table([[Paragraph(sec3_conduit, style_body)]], colWidths=[507])
    t_conduit.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_card_border),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_conduit)
    story.append(Spacer(1, 6))

    # Analytical Caveat Box
    caveat_text = "<b>Note:</b> Network betweenness centrality highlights key liaison role. Does not represent automated judicial guilt."
    t_caveat = Table([[Paragraph(caveat_text, style_card_body)]], colWidths=[507])
    t_caveat.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_cyan_light),
        ('BOX', (0, 0), (-1, -1), 0.75, c_cyan),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_caveat)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 4: EVIDENTIARY DISCREPANCIES (CROSS-VERIFICATION)
    # =========================================================================
    story.append(Paragraph("4. EVIDENTIARY DISCREPANCIES (CROSS-VERIFICATION)", style_sec_heading))

    # Discrepancy 1 Card
    disc1_html = (
        "<font color='#b45309'><b>DATA DISCREPANCY DETECTED</b></font><br/><br/>"
        "<b>Contradiction: Accused Alibi Statement vs Telecom CDR Tower Ping</b><br/><br/>"
        "<b>DISCREPANCY-001</b><br/><br/>"
        "Physical alibi statement is mathematically irreconcilable with radio propagation range of Sector 4 cell tower. "
        "System flags this for investigator follow-up without drawing definitive legal conclusions."
    )
    t_disc1 = Table([[Paragraph(disc1_html, style_body)]], colWidths=[507])
    t_disc1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_amber),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_disc1)
    story.append(Spacer(1, 6))

    # Discrepancy 2 Card
    disc2_html = (
        "<font color='#b45309'><b>DATA DISCREPANCY DETECTED</b></font><br/><br/>"
        "<b>Discrepancy: Shipping Cargo Declaration vs Physical Customs Panchnama</b><br/><br/>"
        "<b>DISCREPANCY-002</b><br/><br/>"
        "Weight discrepancy confirms secondary unmanifested payload concealed within container structure."
    )
    t_disc2 = Table([[Paragraph(disc2_html, style_body)]], colWidths=[507])
    t_disc2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_amber),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_disc2)

    # Force PageBreak to start Section 5 cleanly on Page 3
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: SECTION 5 & CONTINUED / ADDITIONAL EVIDENCE RECORD & ATTESTATION
    # =========================================================================
    story.append(Paragraph("5. CRYPTOGRAPHIC EVIDENCE INTEGRITY (M6 LEDGER)", style_sec_heading))

    # Evidence 1
    evd1_html = (
        "<b>EVD-2024-0812: Physical Extraction Image: Mobile Phone (+91-98201-99412)</b><br/><br/>"
        "Genesis Hash: <font name='Courier'>e3b0c44298fc1c149afbF4c8996F92477a...</font><br/><br/>"
        "BSA Sec. 63 Cert: <b>BSA-63-FSI-2024-8841</b><br/>"
        "Status: <font color='#15803d'><b>VALID</b></font>"
    )
    t_evd1 = Table([[Paragraph(evd1_html, style_card_body)]], colWidths=[507])
    t_evd1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_green),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_evd1)
    story.append(Spacer(1, 6))

    # Evidence 2
    evd2_html = (
        "<b>EVD-2024-0813: Certified Bank Ledger: HDFC Account 9921-4820</b><br/><br/>"
        "Genesis Hash: <font name='Courier'>9b71d224bd62f3785496d4ad3ea3d73319fbc2890caadae2dff72519673ca7</font><br/><br/>"
        "BSA Sec. 63 Cert: <b>BSA-63-BNK-2024-1102</b><br/>"
        "Status: <font color='#15803d'><b>VALID</b></font>"
    )
    t_evd2 = Table([[Paragraph(evd2_html, style_card_body)]], colWidths=[507])
    t_evd2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_green),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_evd2)
    story.append(Spacer(1, 6))

    # Evidence 3
    evd3_html = (
        "<b>EVD-2024-0814: Tampered CDR Audit File (Demonstration of Mismatch Alert)</b><br/><br/>"
        "Genesis Hash: <font name='Courier'>a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0</font><br/><br/>"
        "BSA Sec. 63 Cert: <b>BSA-63-TEL-2024-0091</b><br/>"
        "Status: <font color='#b91c1c'><b>REVOKED</b></font>"
    )
    t_evd3 = Table([[Paragraph(evd3_html, style_card_body)]], colWidths=[507])
    t_evd3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_red),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_evd3)
    story.append(Spacer(1, 8))

    # Section 63 BSA Forensic Attestation Box
    attest_html = (
        "<b>CERTIFICATE UNDER SECTION 63 OF THE BHARATIYA SAKSHYA ADHINIYAM, 2023 (BSA):</b><br/>"
        "I hereby certify that the cryptographic hashes, chain of custody logs, and electronic intelligence "
        "records detailed above were retrieved and compiled through an automated, tamper-evident forensic intelligence pipeline. "
        "All SHA-256 genesis hashes and verification certificates have remained immutable, continuously monitored, and "
        "cryptographically validated under strict evidential integrity standards."
    )
    t_attest = Table([[Paragraph(attest_html, style_card_body)]], colWidths=[507])
    t_attest.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_card_border),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_attest)
    story.append(Spacer(1, 14))

    # Signatures Block
    sig_data = [
        [
            Paragraph(
                "____________________________________________<br/>"
                "<b>Investigating Officer Signature</b><br/>"
                "<font color='#0f172a'><b>Insp. Vikramaditya Rao (LEO-7729)</b></font>",
                style_body
            ),
            Paragraph(
                "____________________________________________<br/>"
                "<b>Superintendent of Police / Authority Attestation</b><br/>"
                "<font color='#0f172a'><b>Special Crime Branch CID Maharashtra</b></font>",
                style_body
            )
        ]
    ]

    t_sig = Table(sig_data, colWidths=[250, 250])
    t_sig.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_card_border),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_sig)

    # Build document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
