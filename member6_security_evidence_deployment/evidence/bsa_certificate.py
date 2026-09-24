import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime

def generate_bsa_certificate(evidence_data: dict, ledger_history: list) -> io.BytesIO:
    """
    Generates a PDF certificate conforming to Bharatiya Sakshya Adhiniyam (BSA) standards.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Bharatiya Sakshya Adhiniyam (BSA) Evidence Certificate")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Date Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 120, "Evidence Details")
    c.setFont("Helvetica", 12)
    
    y_pos = height - 140
    c.drawString(50, y_pos, f"Evidence ID: {evidence_data.get('id')}")
    c.drawString(50, y_pos - 20, f"Case ID: {evidence_data.get('case_id')}")
    c.drawString(50, y_pos - 40, f"Original SHA-256: {evidence_data.get('original_sha256')}")
    c.drawString(50, y_pos - 60, f"Current Status: {evidence_data.get('verification_status')}")
    c.drawString(50, y_pos - 80, f"Uploaded By (User ID): {evidence_data.get('uploaded_by')}")
    c.drawString(50, y_pos - 100, f"Upload Timestamp: {evidence_data.get('upload_timestamp')}")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y_pos - 140, "Chain of Custody & Verification History")
    
    c.setFont("Helvetica", 10)
    y_pos = y_pos - 160
    
    for record in ledger_history:
        if y_pos < 50:
            c.showPage()
            y_pos = height - 50
            c.setFont("Helvetica", 10)
            
        action_text = f"[{record.get('timestamp')}] Action: {record.get('action')} by Actor: {record.get('actor_id')}"
        hash_text = f"  Record Hash: {record.get('current_record_hash')}"
        
        c.drawString(50, y_pos, action_text)
        c.drawString(50, y_pos - 15, hash_text)
        
        y_pos -= 40
        
    c.save()
    buffer.seek(0)
    return buffer
