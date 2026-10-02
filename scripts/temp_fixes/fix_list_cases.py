import os

filepath = "member2_backend/app/services/case_service.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

new_func = """
    def list_cases(self, status: Optional[str] = None, priority: Optional[str] = None) -> List[Dict[str, Any]]:
        db: Session = SessionLocal()
        try:
            query = db.query(CaseModel)
            if status:
                query = query.filter(CaseModel.status == status)
            if priority:
                query = query.filter(CaseModel.priority == priority)
            
            cases = query.all()
            case_ids = [c.case_id for c in cases]
            
            # Batch fetch counts to avoid N+1 problem
            counts_map = {cid: {
                'evidenceCount': 0, 'entityCount': 0, 'relationshipCount': 0,
                'alertCount': 0, 'noteCount': 0, 'teamCount': 0,
                'importCount': 0, 'reportCount': 0, 'timelineEventCount': 0
            } for cid in case_ids}
            
            if case_ids:
                from app.models import EvidenceModel, EntityModel, RelationshipModel, AlertModel, CaseNoteModel, CaseMembershipModel, IngestJobModel
                from sqlalchemy import func
                
                def _fill_counts(model, key):
                    res = db.query(model.case_id, func.count(model.id)).filter(model.case_id.in_(case_ids)).group_by(model.case_id).all()
                    for r in res:
                        counts_map[r[0]][key] = r[1]
                        
                _fill_counts(EvidenceModel, 'evidenceCount')
                _fill_counts(EntityModel, 'entityCount')
                _fill_counts(RelationshipModel, 'relationshipCount')
                _fill_counts(AlertModel, 'alertCount')
                _fill_counts(CaseNoteModel, 'noteCount')
                # For CaseMembershipModel, id might not exist, wait let's just use func.count()
                res = db.query(CaseMembershipModel.case_id, func.count()).filter(CaseMembershipModel.case_id.in_(case_ids)).group_by(CaseMembershipModel.case_id).all()
                for r in res: counts_map[r[0]]['teamCount'] = r[1]
                
                _fill_counts(IngestJobModel, 'importCount')

            result = []
            for case in cases:
                counts = counts_map[case.case_id]
                result.append({
                    'caseId': case.case_id,
                    'caseNumber': case.case_number,
                    'title': case.title,
                    'description': case.description,
                    'assignedInvestigator': case.assigned_investigator,
                    'assignedTeam': case.assigned_team,
                    'status': case.status,
                    'priority': case.priority,
                    'jurisdiction': case.jurisdiction,
                    'policeStation': case.police_station,
                    'createdAt': case.created_at.isoformat() if case.created_at else None,
                    'updatedAt': case.updated_at.isoformat() if case.updated_at else None,
                    'caseType': case.case_type,
                    'closedAt': case.closed_at.isoformat() if case.closed_at else None,
                    'archivedAt': case.archived_at.isoformat() if case.archived_at else None,
                    'closureReason': case.closure_reason,
                    'entityCount': counts['entityCount'],
                    'relationshipCount': counts['relationshipCount'],
                    'evidenceCount': counts['evidenceCount'],
                    'reportCount': counts['reportCount']
                })
            
            return sorted(result, key=lambda x: (x.get('priority') != 'critical', x.get('createdAt', '')), reverse=False)
        finally:
            db.close()
"""

# Regex to replace list_cases exactly
pattern = re.compile(r"    def list_cases\(self, status: Optional\[str\] = None, priority: Optional\[str\] = None\) -> List\[Dict\[str, Any\]\]:.*?finally:\n            db\.close\(\)\n", re.DOTALL)
new_code = pattern.sub(new_func[1:], code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("Replaced list_cases")
