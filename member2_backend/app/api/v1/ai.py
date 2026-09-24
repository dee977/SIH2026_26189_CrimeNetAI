from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.schemas.ai import AIQuestionRequest, AIQuestionResponse
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.services.m4_ai_nlp import M4AiNlpClient, get_m4_client

router = APIRouter(prefix='/ai', tags=['AI & NLP Grounded Assistant'])

@router.post('/query', response_model=ResponseEnvelope[AIQuestionResponse], summary='Ask Evidence-Grounded Question to AI Assistant')
async def query_ai_assistant(
    req: AIQuestionRequest,
    current_user: UserProfile = Depends(get_current_user),
    m4_client: M4AiNlpClient = Depends(get_m4_client)
):
    res = await m4_client.answer_grounded_question(
        question=req.question,
        question_type=req.questionType,
        case_id=req.caseId
    )
    return ResponseEnvelope(data=res)
