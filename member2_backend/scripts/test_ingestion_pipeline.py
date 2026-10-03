import sys
import os
import json
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import EntityModel, RelationshipModel, EvidenceModel, TimelineEventModel
from app.services.ingestion_service import get_ingestion_service

async def test_ingest():
    sample_data = [
        {
            "id": "PER-TEST-901",
            "name": "Devendra 'Bunty' Shinde",
            "role": "Smuggling Operative",
            "city": "Mumbai",
            "phones": ["+91-9820011223"],
            "accounts": ["ACC-HDFC-991122"],
            "vehicles": ["MH-01-AB-1234"],
            "associations": [
                {"target_id": "P-HWL-01", "relationship": "CO_CONSPIRATOR"}
            ]
        }
    ]
    raw_bytes = json.dumps(sample_data).encode('utf-8')
    svc = get_ingestion_service()
    
    case_target = "CASE-2026-HWL-001"
    res = await svc.process_file_upload(
        file_bytes=raw_bytes,
        filename="custom_intel_batch.json",
        case_id=case_target,
        uploader="Forensic Inspector Test"
    )
    print("Ingestion result:")
    print(f"  Job ID: {res.jobId}")
    print(f"  Status: {res.status}")
    print(f"  Evidence ID: {res.evidenceId}")
    print(f"  SHA-256: {res.sha256Hash}")
    print(f"  Entities Extracted: {res.entitiesExtracted}")
    print(f"  Relationships Extracted: {res.relationshipsExtracted}")

    # Verify directly in Supabase Postgres
    db = SessionLocal()
    try:
        ev = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == res.evidenceId).first()
        assert ev is not None, "Evidence item not found in DB!"
        assert ev.sha256_hash == res.sha256Hash, "SHA-256 mismatch in DB!"

        ent = db.query(EntityModel).filter(EntityModel.entity_id == "PER-TEST-901").first()
        assert ent is not None, "Entity PER-TEST-901 not found in DB!"
        assert ent.case_id == case_target, "Case ID mismatch on entity!"

        ph = db.query(EntityModel).filter(EntityModel.entity_type == "Phone", EntityModel.case_id == case_target, EntityModel.canonical_name == "+91-9820011223").first()
        assert ph is not None, "Phone entity not found in DB!"

        rel = db.query(RelationshipModel).filter(RelationshipModel.source_id == "PER-TEST-901").all()
        assert len(rel) >= 1, "Relationships not found for entity in DB!"

        tl = db.query(TimelineEventModel).filter(TimelineEventModel.evidence_id == res.evidenceId).first()
        assert tl is not None, "Timeline event not found in DB!"

        print("\nSUCCESS: End-to-end JSON ingestion verified in live PostgreSQL database!")
    finally:
        db.close()

if __name__ == '__main__':
    asyncio.run(test_ingest())
