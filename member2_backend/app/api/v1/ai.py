from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.schemas.ai import AIQuestionRequest, AIQuestionResponse
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.services.m4_ai_nlp import M4AiNlpClient, get_m4_client

router = APIRouter(prefix='/ai', tags=['AI & NLP Grounded Assistant'])

@router.post('/query', response_model=ResponseEnvelope[AIQuestionResponse], summary='Ask Evidence-Grounded Question to AI Assistant')
@router.post('/assistant/query', response_model=ResponseEnvelope[AIQuestionResponse], summary='Ask Evidence-Grounded Question to AI Assistant (Alias)')
async def query_ai_assistant(
    req: AIQuestionRequest,
    current_user: UserProfile = Depends(get_current_user),
    m4_client: M4AiNlpClient = Depends(get_m4_client)
):
    q = req.question or req.query or ""
    c_id = req.caseId or req.case_id or "CASE-2025-NAT-001"
    res = await m4_client.answer_grounded_question(
        question=q,
        question_type=req.questionType or 'natural_language',
        case_id=c_id
    )
    if not res.query:
        res.query = res.question
    if not res.relevantEntities:
        res.relevantEntities = [
            {'id': se.entityId, 'label': se.name, 'type': se.entityType}
            for se in res.supportingEntities
        ]
    return ResponseEnvelope(data=res)
