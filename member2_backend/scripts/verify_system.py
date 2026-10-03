import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import (
    CaseModel, EntityModel, RelationshipModel, EvidenceModel,
    AlertModel, WatchlistModel, TimelineEventModel
)

def verify():
    db = SessionLocal()
    try:
        cases = db.query(CaseModel).all()
        print(f"Total Cases in PostgreSQL: {len(cases)}")
        assert len(cases) == 10, f"Expected 10 cases, got {len(cases)}"
        
        for c in cases:
            ent_cnt = db.query(EntityModel).filter(EntityModel.case_id == c.case_id).count()
            rel_cnt = db.query(RelationshipModel).filter(RelationshipModel.case_id == c.case_id).count()
            ev_cnt = db.query(EvidenceModel).filter(EvidenceModel.case_id == c.case_id).count()
            alt_cnt = db.query(AlertModel).filter(AlertModel.case_id == c.case_id).count()
            wl_cnt = db.query(WatchlistModel).filter(WatchlistModel.case_id == c.case_id).count()
            tl_cnt = db.query(TimelineEventModel).filter(TimelineEventModel.case_id == c.case_id).count()
            print(f"  * [{c.case_id}] {c.title[:45]}... -> Ent: {ent_cnt}, Rel: {rel_cnt}, Ev: {ev_cnt}, Alt: {alt_cnt}, Wl: {wl_cnt}, Tl: {tl_cnt}")
            assert ent_cnt >= 5, f"Case {c.case_id} has fewer than 5 entities: {ent_cnt}"
            assert rel_cnt >= 4, f"Case {c.case_id} has fewer than 4 relationships: {rel_cnt}"
            assert ev_cnt >= 1, f"Case {c.case_id} has no evidence items"
            assert tl_cnt >= 1, f"Case {c.case_id} has no timeline events"

        print("\nALL 10 CASES VERIFIED WITH RICH MULTI-MODAL DATA IN SUPABASE POSTGRES!")

    finally:
        db.close()

if __name__ == '__main__':
    verify()
