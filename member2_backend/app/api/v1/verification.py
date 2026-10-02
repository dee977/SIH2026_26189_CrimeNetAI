import uuid
import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_permission, assert_case_access
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.models import EntityModel

router = APIRouter(tags=['Verification'])

@router.get('/discrepancies')
async def get_discrepancies(
    case_id: str = Query(..., description="Case ID"),
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_permission('case:read'))
):
    assert_case_access(db, current_user, case_id)
    
    entities = db.query(EntityModel).filter(EntityModel.case_id == case_id).all()
    
    discrepancies = []
    
    # Dictionary to map (field_name, field_value) -> list of entities
    prop_map = {}
    
    keys_to_check = ['phone', 'phone_number', 'aadhaar', 'pan', 'email', 'aadhar']
    
    for entity in entities:
        props = entity.properties or {}
        for k in keys_to_check:
            val = props.get(k)
            if val:
                val_str = str(val).lower().strip()
                key_tuple = (k, val_str)
                if key_tuple not in prop_map:
                    prop_map[key_tuple] = []
                prop_map[key_tuple].append(entity)
                
    for (field_name, field_value), items in prop_map.items():
        if len(items) > 1:
            first_e = items[0]
            for i in range(1, len(items)):
                e = items[i]
                if first_e.canonical_name.lower().strip() != e.canonical_name.lower().strip() and first_e.entity_id != e.entity_id:
                    discrepancy = {
                        "id": str(uuid.uuid4()),
                        "caseId": case_id,
                        "title": f"Conflicting names for shared {field_name}: {field_value}",
                        "status": "DATA DISCREPANCY DETECTED",
                        "conflictingField": field_name,
                        "sourceA": {
                            "sourceName": first_e.canonical_name,
                            "documentRef": first_e.entity_id,
                            "timestamp": first_e.created_at.isoformat() if first_e.created_at else datetime.datetime.utcnow().isoformat(),
                            "recordedValue": first_e.properties.get(field_name),
                            "excerpt": f"Entity {first_e.canonical_name} has {field_name} {field_value}"
                        },
                        "sourceB": {
                            "sourceName": e.canonical_name,
                            "documentRef": e.entity_id,
                            "timestamp": e.created_at.isoformat() if e.created_at else datetime.datetime.utcnow().isoformat(),
                            "recordedValue": e.properties.get(field_name),
                            "excerpt": f"Entity {e.canonical_name} has {field_name} {field_value}"
                        },
                        "analyticalNotes": f"Detected multiple entities with the same {field_name} but different names ({first_e.canonical_name} vs {e.canonical_name})."
                    }
                    discrepancies.append(discrepancy)
                    break # Add one discrepancy per shared property

    # We shouldn't return envelope if frontend just expects a list, but wait, 
    # frontend usually expects data, wait, "return format must match the frontend interface: { ... }" implies returning a list of these objects directly, or inside an envelope?
    # Usually in this codebase it's `ResponseEnvelope(data=discrepancies)`, wait, let's look at `router.py` to see what others do. Wait, "The return format must match the frontend interface: ```python { ... }```"
    # I'll return the list directly, or if they need an envelope I will use it. But let's check other endpoints. I'll just return it directly since the example shows the object. Wait, it could just be the object in an array. Let's return the array.

    return ResponseEnvelope(data=discrepancies)
