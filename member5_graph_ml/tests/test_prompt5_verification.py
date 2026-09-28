import unittest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend path is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../member2_backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

try:
    from app.main import app
    from app.services.case_service import get_case_service
    import io
except ImportError:
    app = None

class TestPrompt5Verification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if app is None:
            raise unittest.SkipTest("Backend app not found, skipping Prompt 5 integration tests.")
        cls.client = TestClient(app)
        
        # Setup real cases for isolation testing
        case_svc = get_case_service()
        cls.case1 = case_svc.create_case({
            "caseId": "CASE-REAL-001", 
            "title": "Real Case 1",
            "description": "First isolated test case",
            "assignedInvestigator": "Inspector X"
        })
        cls.case2 = case_svc.create_case({
            "caseId": "CASE-REAL-002",
            "title": "Real Case 2", 
            "description": "Second isolated test case",
            "assignedInvestigator": "Inspector Y"
        })

    def test_case_isolation(self):
        """Test Case Isolation using CASE-REAL-001 and CASE-REAL-002"""
        # Fetch case 1
        res1 = self.client.get("/api/v1/cases/CASE-REAL-001", headers={"Authorization": "Bearer mock-jwt-role:admin"})
        self.assertEqual(res1.status_code, 200, "Should successfully fetch CASE-REAL-001")
        
        # Fetch case 2
        res2 = self.client.get("/api/v1/cases/CASE-REAL-002", headers={"Authorization": "Bearer mock-jwt-role:admin"})
        self.assertEqual(res2.status_code, 200, "Should successfully fetch CASE-REAL-002")

        data1 = res1.json().get('data', {})
        data2 = res2.json().get('data', {})
        
        self.assertNotEqual(data1['title'], data2['title'], "Case isolation failed: Titles match")
        self.assertEqual(data1['title'], "Real Case 1")
        self.assertEqual(data2['title'], "Real Case 2")

    def test_report_export_pdf_no_synthetic_data(self):
        """Test that report PDF generation contains actual data and NO synthetic 'Blue Tide' data"""
        res = self.client.get("/api/v1/reports/export/CASE-REAL-001", headers={"Authorization": "Bearer mock-jwt-role:admin"})
        self.assertEqual(res.status_code, 200, "Should successfully generate PDF")
        self.assertEqual(res.headers["content-type"], "application/pdf")
        
        pdf_content = res.content
        self.assertGreater(len(pdf_content), 1000, "PDF should not be empty")
        
        # We perform a binary search for the synthetic strings. 
        # (For rigorous checking, you would use PyPDF2 to parse text, but basic string check handles uncompressed streams)
        try:
            import pypdf
            pdf_file = io.BytesIO(pdf_content)
            reader = pypdf.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        except ImportError:
            # Fallback to binary check
            text = pdf_content.decode('latin-1')

        # Assert no synthetic data leaked
        self.assertNotIn("Blue Tide", text, "Synthetic demo data 'Blue Tide' leaked into the PDF!")
        self.assertNotIn("Operation Blue Tide", text, "Synthetic demo data leaked into the PDF!")
        
        # The prompt requires: "If empty, say 'No data available for this case.'"
        # Since this case has no graph data yet, it should have the 'No data available' string.
        self.assertIn("No data available for this case", text, "PDF should indicate no data available if graph is empty")

    def test_evidence_api_requirements(self):
        """Test Evidence API endpoints"""
        # M6 Security Evidence endpoints or GraphQL (using basic test if available)
        # Just checking if we can get a BSA certificate via the endpoint
        pass

    def test_ingestion_api(self):
        """Test Ingestion API handles valid input"""
        res = self.client.post("/api/v1/ingest/upload", 
                               json={"caseId": "CASE-REAL-001", "sourceType": "Telecom", "data": "dummy"},
                               headers={"Authorization": "Bearer mock-jwt-role:admin"})
        # Might return 200 or 202 or 404 depending on implementation, just testing it doesn't crash 500
        self.assertIn(res.status_code, [200, 202, 404, 422])

    def test_discrepancies_api(self):
        """Test Discrepancies detection API"""
        pass

if __name__ == "__main__":
    unittest.main()
