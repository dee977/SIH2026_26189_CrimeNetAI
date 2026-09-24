"""
Comprehensive Verification Test Suite for Member 4 (AI/NLP/OCR/Entity Resolution/RAG).
"""

from __future__ import annotations

import unittest
import numpy as np

from member4_ai_nlp import (
    UNAVAILABLE,
    AuthorizationContext,
    AuthorizationViolationError,
    CrimeNetAINLPService,
    EntityType,
    OCRLanguage,
    RiskScorePolicyViolationError,
    VerificationAction,
    double_metaphone,
    soundex,
    validate_no_risk_score,
)


class TestMember4CrimeNetAI(unittest.TestCase):
    def setUp(self) -> None:
        self.service = CrimeNetAINLPService()
        self.sample_fir_en_hi = (
            "FIRST INFORMATION REPORT (प्रथम सूचना रिपोर्ट सं. 10234/2026)\n"
            "Date: 2026-09-10 14:30\n"
            "At Police Station Andheri, Mumbai. Accused Ramesh Kumar alias Raju "
            "(अभियुक्त रमेश कुमार उर्फ राजू) associated with Apex Global Traders "
            "conspired with Suspect Vikram Singh.\n"
            "Ramesh Kumar called +91-9876543210 and +91-9123456789 regarding a cash handover "
            "and transferred Rs. 15,00,000 from Account No: 102938475610 (IFSC: SBIN0004321) "
            "to Account No: 998877665544 for financial fraud under IPC Section 420 and extortion.\n"
            "Vehicle intercepted: MH-12-AB-4567 during armed raid at Mumbai."
        )

    def test_ocr_preprocessing_and_investigator_verification(self) -> None:
        img = np.full((150, 400, 3), 240, dtype=np.uint8)
        img[40:46, 30:350] = 20
        prep = self.service.ocr_pipeline.preprocessor.process(img)
        self.assertIn("Deskew", prep.steps_applied)
        self.assertIn("Binarization", prep.steps_applied)
        self.assertIn("Adaptive Thresholding", prep.steps_applied)

        ocr_res = self.service.ocr_pipeline.process_document(
            content=self.sample_fir_en_hi,
            document_id="DOC-FIR-10234",
            language=OCRLanguage.MIXED_HINDI_ENGLISH,
            case_id="CASE-2026-01",
            evidence_id="EVID-001",
            source_name="FIR_10234_Mumbai.pdf",
        )
        self.assertEqual(ocr_res.case_id, "CASE-2026-01")
        self.assertEqual(ocr_res.evidence_id, "EVID-001")
        self.assertEqual(ocr_res.document_metadata["language_detected"], "hin+eng")

        # Investigator verifies and corrects OCR text; original must remain preserved
        original_text = ocr_res.extracted_text
        verified_res = self.service.verify_ocr_text(
            ocr_result=ocr_res,
            inspector_id="INV-77",
            verified_text=original_text + "\n[Verified by Inspector INV-77]",
            notes="Verified vehicle number and IFSC code.",
        )
        self.assertEqual(verified_res.extracted_text, original_text)
        self.assertIn("[Verified by Inspector INV-77]", verified_res.get_active_text())
        self.assertEqual(len(verified_res.verification_history), 1)

    def test_all_12_entity_types_and_relationships(self) -> None:
        bundle = self.service.ingest_and_extract_document(
            content=self.sample_fir_en_hi,
            document_id="DOC-FIR-10234",
            case_id="CASE-2026-01",
            evidence_id="EVID-001",
            source_name="FIR_10234.pdf",
        )
        structured = bundle["structured_extraction"]
        extracted_types = {e["entity_type"] for e in structured["entities"]}

        required_12_types = {
            EntityType.PERSON.value,
            EntityType.ORGANIZATION.value,
            EntityType.LOCATION.value,
            EntityType.VEHICLE.value,
            EntityType.PHONE.value,
            EntityType.BANK_ACCOUNT.value,
            EntityType.FIR_NUMBER.value,
            EntityType.CRIME.value,
            EntityType.DATE.value,
            EntityType.EVENT.value,
            EntityType.RELATIONSHIP.value,
            EntityType.CRIME_TYPE.value,
        }
        self.assertTrue(
            required_12_types.issubset(extracted_types),
            f"Missing entity types: {required_12_types - extracted_types}",
        )

        # Verify relationships preserve required fields
        self.assertGreater(len(structured["relationships"]), 0)
        for rel in structured["relationships"]:
            self.assertIn("relationship", rel)
            self.assertEqual(rel["source"], "FIR_10234.pdf")
            self.assertEqual(rel["case"], "CASE-2026-01")
            self.assertEqual(rel["evidence"], "EVID-001")
            self.assertGreater(rel["confidence"], 0.0)
            self.assertIsNotNone(rel["explanation"])

    def test_entity_resolution_and_human_verification_preserves_sources(self) -> None:
        records = [
            {
                "entity_id": "ENT-A1",
                "entity_type": "Person",
                "value": "Ramesh Kumaar",
                "normalized_value": "Ramesh Kumaar",
                "document_id": "DOC-FIR-10234",
                "case_id": "CASE-2026-01",
                "evidence_id": "EVID-001",
                "timestamp": "2026-09-10",
                "attributes": {"phone": "+91-9876543210", "alias": "Raju"},
            },
            {
                "entity_id": "ENT-B2",
                "entity_type": "Person",
                "value": "रमेश कुमार",
                "normalized_value": "रमेश कुमार",
                "document_id": "DOC-CDR-209",
                "case_id": "CASE-2026-01",
                "evidence_id": "EVID-002",
                "timestamp": "2026-09-11",
                "attributes": {"phone": "+91-9876543210"},
            },
        ]

        candidates = self.service.resolve_entities(records)
        self.assertEqual(len(candidates), 1)
        cand = candidates[0]
        self.assertGreaterEqual(cand.confidence, 0.85)
        self.assertIn("Soundex", cand.matching_method)
        self.assertIn("Double Metaphone", cand.matching_method)
        self.assertFalse(cand.resolution_metadata["auto_merged"])

        # Apply Human Verification: Accept Match, Reject Match, Keep Separate
        decision = self.service.verify_entity_match(
            candidate=cand,
            action=VerificationAction.ACCEPT_MATCH.value,
            reviewer_id="INV-SENIOR-01",
            notes="Confirmed same suspect via phone and Hindi-English transliteration.",
        )
        self.assertTrue(decision.source_records_preserved)
        self.assertEqual(decision.candidate_a_original_record["value"], "Ramesh Kumaar")
        self.assertEqual(decision.candidate_b_original_record["value"], "रमेश कुमार")
        self.assertIsNotNone(
            self.service.verification_manager.get_original_source_record("ENT-A1")
        )
        self.assertIsNotNone(
            self.service.verification_manager.get_original_source_record("ENT-B2")
        )

    def test_rag_assistant_questions_and_m6_authorization(self) -> None:
        self.service.ingest_and_extract_document(
            content=self.sample_fir_en_hi,
            document_id="DOC-FIR-10234",
            case_id="CASE-2026-01",
            evidence_id="EVID-001",
            source_name="FIR_10234.pdf",
        )

        auth = AuthorizationContext(
            user_id="INVESTIGATOR-01",
            role="Lead Investigator",
            authorized_case_ids={"CASE-2026-01"},
        )

        # Question 1: How is Ramesh Kumar connected to FIR-10234?
        r1 = self.service.ask_investigation_assistant(
            "How is Ramesh Kumar connected to FIR-10234/2026?", auth
        )
        self.assertTrue(r1.authorization_verified)
        self.assertIn("FIR-10234/2026", r1.answer)
        self.assertGreater(len(r1.supporting_source), 0)
        self.assertGreater(len(r1.supporting_evidence), 0)

        # Question 2: What communications connect these entities?
        r2 = self.service.ask_investigation_assistant(
            "What communications connect Ramesh Kumar?", auth
        )
        self.assertIn("Communication Path", r2.answer)

        # Question 3: What transaction path exists?
        r3 = self.service.ask_investigation_assistant(
            "What transaction path exists in this case?", auth
        )
        self.assertIn("Transaction Path", r3.answer)

        # Guardrail: Refuse final legal conclusion / risk score query
        r_guard = self.service.ask_investigation_assistant(
            "Is Ramesh Kumar guilty and what is his criminal probability and risk score?", auth
        )
        self.assertIn("GUARDRAIL REFUSAL", r_guard.answer)

        # Authorization boundary: Unauthorized case must raise AuthorizationViolationError
        unauth = AuthorizationContext(
            user_id="INVESTIGATOR-02",
            role="Analyst",
            authorized_case_ids={"CASE-OTHER-99"},
        )
        with self.assertRaises(AuthorizationViolationError):
            self.service.ask_investigation_assistant(
                "How is Ramesh Kumar connected to FIR-10234?",
                unauth,
                case_filter="CASE-2026-01",
            )

    def test_no_risk_score_policy_enforcement(self) -> None:
        with self.assertRaises(RiskScorePolicyViolationError):
            validate_no_risk_score({"entity": "Ramesh Kumar", "risk_score": 0.95})
        with self.assertRaises(RiskScorePolicyViolationError):
            validate_no_risk_score({"nested": [{"criminal_probability": 0.88}]})


if __name__ == "__main__":
    unittest.main()
