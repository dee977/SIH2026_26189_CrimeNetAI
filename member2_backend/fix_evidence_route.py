filepath = "app/api/v1/evidence.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

# Make caseId optional and return evidence from authorized cases
target = """    target_case_id = (caseId if isinstance(caseId, str) and caseId else None) or (case_id if isinstance(case_id, str) and case_id else None)
    if not target_case_id:
        raise HTTPException(status_code=400, detail='caseId is required')

    from app.dependencies import assert_case_access
    assert_case_access(db, current_user, target_case_id)
    
    rows = db.query(EvidenceModel).filter(EvidenceModel.case_id == target_case_id).order_by(EvidenceModel.collected_date.desc()).limit(limit).all()"""

replacement = """    target_case_id = (caseId if isinstance(caseId, str) and caseId else None) or (case_id if isinstance(case_id, str) and case_id else None)
    
    from app.dependencies import assert_case_access, get_authorized_case_ids
    
    if target_case_id:
        assert_case_access(db, current_user, target_case_id)
        rows = db.query(EvidenceModel).filter(EvidenceModel.case_id == target_case_id).order_by(EvidenceModel.collected_date.desc()).limit(limit).all()
    else:
        # If no case_id provided, fetch across authorized cases
        if current_user.grantedRole in ['ADMIN', 'INVESTIGATOR']:
            rows = db.query(EvidenceModel).order_by(EvidenceModel.collected_date.desc()).limit(limit).all()
        else:
            auth_case_ids = get_authorized_case_ids(db, current_user)
            if not auth_case_ids:
                rows = []
            else:
                rows = db.query(EvidenceModel).filter(EvidenceModel.case_id.in_(auth_case_ids)).order_by(EvidenceModel.collected_date.desc()).limit(limit).all()"""

code = code.replace(target, replacement)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("evidence API fixed")
