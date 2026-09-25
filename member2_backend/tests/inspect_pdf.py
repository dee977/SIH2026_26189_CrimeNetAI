import io
import pypdf
from app.services.report_pdf_service import generate_investigation_report_pdf

def test_extract_text():
    buf = generate_investigation_report_pdf({'caseId': 'CASE-2024-MH-092'})
    pdf_bytes = buf.getvalue()
    print(f"Total PDF Size: {len(pdf_bytes)} bytes")
    
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    num_pages = len(reader.pages)
    print(f"Total Pages: {num_pages}")
    
    extracted_text_all = ""
    for idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        print(f"\n=================== PAGE {idx + 1} ({len(text)} chars) ===================")
        print(text[:400] + ("..." if len(text) > 400 else ""))
        extracted_text_all += "\n" + text
        
        # Verify no image XObjects on any page
        images = list(page.images)
        print(f"Images count on Page {idx + 1}: {len(images)}")
        assert len(images) == 0, f"Found {len(images)} images on page {idx+1}!"

    # Verify key text phrases across all 7 sections
    checks = [
        "CONFIDENTIAL LAW ENFORCEMENT INTELLIGENCE DOSSIER",
        "Executive Investigation Summary",
        "Key Indexed Network Entities",
        "Network Graph Intelligence Findings",
        "Evidentiary Discrepancies",
        "Cryptographic Evidence Integrity",
        "Chronological Case Timeline",
        "Formal Attestation",
        "Vikram Malhotra",
        "Rajesh",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "MATCH",
        "MISMATCH",
        "DISCREPANCY-001",
        "DISCREPANCY-002",
        "Hop 1",
        "Hop 6",
        "Page 1 of 5"
    ]
    print("\n--- TEXT EXTRACTION / SEARCH CHECK ---")
    for phrase in checks:
        found = phrase in extracted_text_all
        status = "PASS" if found else "FAIL"
        print(f"[{status}] '{phrase}' in extracted text: {found}")

    print("\nALL PROGRAMMATIC TEXT EXTRACTION TESTS COMPLETED.")

if __name__ == "__main__":
    test_extract_text()
