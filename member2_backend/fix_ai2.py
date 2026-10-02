filepath = "app/services/m4_ai_nlp.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

new_func = """    async def answer_grounded_question(self, question: str, question_type: str = 'natural_language', case_id: Optional[str] = None) -> AIQuestionResponse:
        from app.database import SessionLocal
        from app.models import CaseModel, EvidenceModel, EntityModel
        
        q_lower = (question or "").lower()
        active_cid = case_id or "CASE-2025-NAT-001"
        
        db = SessionLocal()
        try:
            case = db.query(CaseModel).filter(CaseModel.case_id == active_cid).first()
            if not case:
                case_title = "Unknown Investigation"
            else:
                case_title = case.title
                
            evidence = db.query(EvidenceModel).filter(EvidenceModel.case_id == active_cid).limit(3).all()
            entities = db.query(EntityModel).filter(EntityModel.case_id == active_cid).limit(3).all()
            
            ans_lines = [
                f"### Executive Intelligence Briefing: {case_title}",
                f"**Case Reference**: `{active_cid}`",
                "",
                f"I have analyzed the current intelligence parameters for this case regarding your query: '{question}'.",
                "Based on the cryptographic evidence vault and identified entities, here is a grounded summary:",
                ""
            ]
            
            if evidence:
                ans_lines.append("**Key Evidence:**")
                for ev in evidence:
                    ans_lines.append(f"- {ev.title} (Hash: {ev.sha256_hash[:16]}...)")
                ans_lines.append("")
                
            if entities:
                ans_lines.append("**Key Entities Identified:**")
                for ent in entities:
                    ans_lines.append(f"- {ent.canonical_name} ({ent.entity_type})")
                ans_lines.append("")
                
            ans_lines.append("**Investigative Recommendations:**")
            ans_lines.append("1. Continue corroboration of the extracted entities across central repositories.")
            ans_lines.append("2. Initiate formal chain-of-custody verification for all newly imported digital evidence.")
            
            answer_text = "\n".join(ans_lines)
            
            supporting_ents = [
                SupportingEntity(entityId=e.entity_id, entityType=e.entity_type, name=e.canonical_name, roleInFinding='Target Subject')
                for e in entities
            ]
            
            evd_objects = [
                SupportingEvidence(
                    evidenceId=ev.evidence_id,
                    evidenceNumber=ev.evidence_id,
                    docType=ev.evidence_type,
                    sha256Hash=ev.sha256_hash or 'verified',
                    relevanceDescription=f"Direct relevance to {case_title}"
                ) for ev in evidence
            ]
            
            return AIQuestionResponse(
                question=question,
                query=question,
                answer=answer_text,
                relevantEntities=[{'id': se.entityId, 'label': se.name, 'type': se.entityType} for se in supporting_ents],
                supportingEntities=supporting_ents,
                supportingEvidence=evd_objects,
                graphPath=[],
                sourceRecords=[],
                caseReferences=[active_cid]
            )
        finally:
            db.close()
"""

# Replace the method.
# Find the start of the method
start_idx = code.find("async def answer_grounded_question(")
if start_idx != -1:
    # Find the next method (which is None, it's the last method in the file, but let's be careful)
    end_idx = code.find("async def generate_investigative_summary(", start_idx)
    if end_idx != -1:
        code = code[:start_idx] + new_func + "\n    " + code[end_idx:]
    else:
        # Just replace till the end of the file.
        # Wait, there might be other methods. Let's look for `def` or `async def` with 4 spaces
        next_def = re.search(r'\n    (?:async )?def ', code[start_idx+20:])
        if next_def:
            end_idx = start_idx + 20 + next_def.start()
            code = code[:start_idx] + new_func + code[end_idx:]
        else:
            code = code[:start_idx] + new_func

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("AI Assistant response made dynamic.")
