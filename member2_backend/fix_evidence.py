import re

with open("app/api/v1/evidence.py", "r") as f:
    content = f.read()

# Add current_user to get_evidence_file
content = re.sub(
    r"async def get_evidence_file\(\s+evidence_id: str = Path\(\.\.\.\),\s+db = Depends\(get_db\)\s+\):",
    "async def get_evidence_file(\n    evidence_id: str = Path(...),\n    current_user = Depends(require_permission('evidence:read')),\n    db = Depends(get_db)\n):",
    content
)

# Add assert_case_access
content = re.sub(
    r'        raise HTTPException\(status_code=404, detail="Evidence item not found."\)',
    '        raise HTTPException(status_code=404, detail="Evidence item not found.")\n    \n    from app.dependencies import assert_case_access\n    assert_case_access(db, current_user, ev_row.case_id)',
    content
)

with open("app/api/v1/evidence.py", "w") as f:
    f.write(content)
