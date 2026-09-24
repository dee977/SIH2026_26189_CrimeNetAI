from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.config import settings
from app.exceptions import AppException, app_exception_handler, global_exception_handler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize service connectors, background job configurations
    print(f'Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]')
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
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.get('/', tags=['System Health'], summary='Root Endpoint')
async def root():
    return {
        'system': settings.PROJECT_NAME,
        'version': settings.VERSION,
        'status': 'OPERATIONAL',
        'documentation': '/docs',
        'api_v1': settings.API_V1_STR
    }

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

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app.main:app', host=settings.BACKEND_HOST, port=settings.BACKEND_PORT, reload=settings.DEBUG)
