import asyncio
from app.api.v1.ai import query_ai_assistant
from app.schemas.ai import AIQuestionRequest
from app.database import SessionLocal
from app.auth_middleware import UserProfile

async def test():
    req = AIQuestionRequest(
        question="what is this case about",
        caseId="CASE-2025-NAT-001"
    )
    class M4Mock:
        async def answer_grounded_question(self, question, question_type, case_id):
            from app.schemas.ai import AIQuestionResponse
            return AIQuestionResponse(question=question, query=question, answer="Test answer", relevantEntities=[], supportingEvidence=[], graphPath=[], sourceRecords=[], caseReferences=[])
    
    from app.services.m4_ai_nlp import get_m4_client
    try:
        res = await query_ai_assistant(req=req, current_user=UserProfile(email="t", role="ADMIN", grantedRole="ADMIN"), m4_client=await get_m4_client())
        print(res)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
