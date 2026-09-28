from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api.v1.router import api_v1_router
from app.config import settings
from app.exceptions import AppException, app_exception_handler, global_exception_handler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize service connectors, background job configurations
    print(f'Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]')
    # Development SQLite installations may not run Alembic; creating declared
    # tables is idempotent and keeps the ACL available after a restart.
    from app.database import Base, engine
    import app.models  # register models before metadata creation
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Clean up connections
    print(f'Shutting down {settings.PROJECT_NAME}')

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url='/docs',
    redoc_url='/redoc',
    openapi_url='/openapi.json',
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)



@app.get('/health', tags=['System Health'], summary='Liveness Probe')
async def health():
    return {
        'status': 'healthy',
        'service': 'member2_backend',
        'environment': settings.ENVIRONMENT,
        'fallbackMode': settings.DOWNSTREAM_FALLBACK_MODE
    }

@app.get('/ready', tags=['System Health'], summary='Readiness Probe')
async def readiness():
    return {
        'ready': True,
        'dependencies': {
            'm3_data_graph': 'CONNECTED_OR_FALLBACK',
            'm4_ai_nlp': 'CONNECTED_OR_FALLBACK',
            'm5_graph_ml': 'CONNECTED_OR_FALLBACK',
            'm6_security': 'CONNECTED_OR_FALLBACK',
            'redis': 'CONFIGURED',
            'celery': 'CONFIGURED'
        }
    }

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description='CrimeNet AI Backend Orchestration Layer (SIH Problem ID: SIH26189). Provides unified API orchestration across Data & Neo4j (M3), OCR/NLP & AI (M4), Graph Analytics & ML (M5), and Security & Evidence Ledger (M6).',
        routes=app.routes,
    )
    openapi_schema['info']['x-team-member'] = 'M2 — Backend Engineer'
    openapi_schema['info']['x-compliance'] = 'Bharatiya Sakshya Adhiniyam (BSA) Section 65B & Strict Zero Risk-Score Policy'
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi


# --- Serve React Frontend ---
# Assuming member1_frontend/dist is at the root level relative to member2_backend
FRONTEND_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "member1_frontend", "dist")

if os.path.exists(FRONTEND_DIST_DIR):
    # Mount assets so they are served quickly and with correct MIME types
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        # Prevent catching API routes if they slip through
        if full_path.startswith(settings.API_V1_STR.strip('/')):
            return {"error": "API route not found"}
            
        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
            
        return {"error": "Frontend build not found"}
else:
    @app.get('/', tags=['System Health'], summary='Root Endpoint')
    async def root():
        return {
            'system': settings.PROJECT_NAME,
            'version': settings.VERSION,
            'status': 'OPERATIONAL (Frontend dist not found)',
            'api_v1': settings.API_V1_STR
        }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app.main:app', host=settings.BACKEND_HOST, port=settings.BACKEND_PORT, reload=settings.DEBUG)
