from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.cases import router as cases_router
from app.api.v1.entities import router as entities_router
from app.api.v1.graph import router as graph_router
from app.api.v1.search import router as search_router
from app.api.v1.timeline import router as timeline_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.ai import router as ai_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.watchlist import router as watchlist_router
from app.api.v1.reports import router as reports_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.audit import router as audit_router
from app.api.v1.websockets import router as ws_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(cases_router)
api_v1_router.include_router(entities_router)
api_v1_router.include_router(graph_router)
api_v1_router.include_router(search_router)
api_v1_router.include_router(timeline_router)
api_v1_router.include_router(ingestion_router)
api_v1_router.include_router(jobs_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(watchlist_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(ws_router)
