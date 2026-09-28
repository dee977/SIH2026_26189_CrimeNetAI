import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from neo4j import GraphDatabase

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import CaseModel

class CaseService:
    def __init__(self):
        self.driver = None
        self.driver = None

    def _create_in_neo4j(self, data):
        if not self.driver: return
        try:
            with self.driver.session() as s:
                s.run(
                    """
                    MERGE (c:Case {caseId: $caseId})
                    SET c.caseNumber = $caseNumber,
                        c.title = $title,
                        c.description = $description,
                        c.assignedInvestigator = $assignedInvestigator,
                        c.assignedTeam = $assignedTeam,
                        c.status = $status,
                        c.priority = $priority,
                        c.jurisdiction = $jurisdiction,
                        c.policeStation = $policeStation,
                        c.createdAt = $createdAt,
                        c.updatedAt = $updatedAt
                    """,
                    caseId=data['caseId'],
                    caseNumber=data.get('caseNumber', data['caseId']),
                    title=data.get('title', ''),
                    description=data.get('description', ''),
                    assignedInvestigator=data.get('assignedInvestigator', ''),
                    assignedTeam=data.get('assignedTeam', ''),
                    status=data.get('status', 'active'),
                    priority=data.get('priority', 'high'),
                    jurisdiction=data.get('jurisdiction', ''),
                    policeStation=data.get('policeStation', ''),
                    createdAt=data.get('createdAt', ''),
                    updatedAt=data.get('updatedAt', '')
                )
        except Exception as e:
            print(f"[CaseService] Neo4j case sync error: {e}")

    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        db: Session = SessionLocal()
        try:
            case = db.query(CaseModel).filter(
                (CaseModel.case_id == case_id) | (CaseModel.case_number == case_id)
            ).first()
            if not case:
                return None
            
            result = {
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
                'entityCount': 0,
                'relationshipCount': 0,
                'evidenceCount': 0,
                'reportCount': 0
            }
            
            if self.driver:
                try:
                    with self.driver.session() as s:
                        count_res = s.run("MATCH (n) WHERE n.caseId = $cid RETURN count(n) as node_count", cid=case.case_id).single()
                        if count_res:
                            result['entityCount'] = count_res['node_count']
                except Exception:
                    pass
            return result
        finally:
            db.close()

    def list_cases(self, status: Optional[str] = None, priority: Optional[str] = None) -> List[Dict[str, Any]]:
        db: Session = SessionLocal()
        try:
            query = db.query(CaseModel)
            if status:
                query = query.filter(CaseModel.status == status)
            if priority:
                query = query.filter(CaseModel.priority == priority)
            
            cases = query.all()
            result = []
            for case in cases:
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
                    'updatedAt': case.updated_at.isoformat() if case.updated_at else None
                })
            
            return sorted(result, key=lambda x: (x.get('priority') != 'critical', x.get('createdAt', '')), reverse=False)
        finally:
            db.close()

    def create_case(self, data: Dict[str, Any]) -> Dict[str, Any]:
        db: Session = SessionLocal()
        try:
            now = datetime.now(timezone.utc).isoformat()
            case_id = data.get('caseId') or data.get('case_id')
            if not case_id:
                year = datetime.now().year
                seq = db.query(CaseModel).count() + 1
                case_id = f"CASE-{year}-{seq:03d}"
            
            case_id = case_id.strip()

            existing = db.query(CaseModel).filter(CaseModel.case_id == case_id).first()
            if existing:
                return self.get_case(case_id)

            new_case_data = {
                'caseId': case_id,
                'caseNumber': case_id,
                'title': data.get('title', 'New Investigation Case'),
                'description': data.get('description', 'Case investigation record.'),
                'assignedInvestigator': data.get('assignedInvestigator', 'Inspector Vikramaditya Rao (LEO-7729)'),
                'assignedTeam': data.get('assignedTeam', 'Special Investigation Unit'),
                'status': data.get('status', 'active'),
                'priority': data.get('priority', 'high'),
                'jurisdiction': data.get('jurisdiction', 'State Police CID'),
                'policeStation': data.get('policeStation', 'Central Police Station'),
                'createdAt': now,
                'updatedAt': now
            }

            db_case = CaseModel(
                case_id=new_case_data['caseId'],
                case_number=new_case_data['caseNumber'],
                title=new_case_data['title'],
                description=new_case_data['description'],
                assigned_investigator=new_case_data['assignedInvestigator'],
                assigned_team=new_case_data['assignedTeam'],
                status=new_case_data['status'],
                priority=new_case_data['priority'],
                jurisdiction=new_case_data['jurisdiction'],
                police_station=new_case_data['policeStation']
            )
            db.add(db_case)
            db.commit()
            db.refresh(db_case)

            if self.driver:
                self._create_in_neo4j(new_case_data)

            return self.get_case(case_id)
        finally:
            db.close()

    
    def update_case(self, case_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        db: Session = SessionLocal()
        try:
            case = db.query(CaseModel).filter(
                (CaseModel.case_id == case_id) | (CaseModel.case_number == case_id)
            ).first()
            if not case:
                return None
            
            for k, v in update_data.items():
                if hasattr(case, k):
                    setattr(case, k, v)
                elif k == 'assignedInvestigator':
                    case.assigned_investigator = v
                elif k == 'assignedTeam':
                    case.assigned_team = v
                elif k == 'policeStation':
                    case.police_station = v

            db.commit()
            return self.get_case(case_id)
        finally:
            db.close()

    def increment_case_counts(self, case_id: str, entities_add: int = 0, rels_add: int = 0, evidence_add: int = 0):
        # Counts are dynamic in Neo4j, so we do nothing here
        pass

_case_service_instance: Optional[CaseService] = None

def get_case_service() -> CaseService:
    global _case_service_instance
    if _case_service_instance is None:
        _case_service_instance = CaseService()
    return _case_service_instance
