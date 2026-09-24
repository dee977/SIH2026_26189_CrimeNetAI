from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

class ErrorDetail(BaseModel):
    code: str = Field(..., description='Machine readable error code')
    message: str = Field(..., description='Human readable error message')
    details: Optional[Dict[str, Any]] = Field(default_factory=dict, description='Additional error context')
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StandardErrorResponse(BaseModel):
    success: bool = Field(default=False)
    error: ErrorDetail

class AppException(Exception):
    def __init__(self, message: str, code: str = 'INTERNAL_SERVER_ERROR', status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}

class ValidationError(AppException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code='VALIDATION_ERROR', status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)

class AuthenticationError(AppException):
    def __init__(self, message: str = 'Authentication credentials were missing or invalid', details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code='AUTHENTICATION_ERROR', status_code=status.HTTP_401_UNAUTHORIZED, details=details)

class AuthorizationError(AppException):
    def __init__(self, message: str = 'You do not have permission to perform this action', details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code='AUTHORIZATION_ERROR', status_code=status.HTTP_403_FORBIDDEN, details=details)

class ResourceNotFoundError(AppException):
    def __init__(self, resource_type: str, identifier: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=f'{resource_type} with ID \'{identifier}\' not found', code='RESOURCE_NOT_FOUND', status_code=status.HTTP_404_NOT_FOUND, details=details)

class DatabaseError(AppException):
    def __init__(self, message: str = 'Database operation failed', details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code='DATABASE_ERROR', status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)

class DependencyError(AppException):
    def __init__(self, service_name: str, message: str = 'Downstream dependency unavailable', details: Optional[Dict[str, Any]] = None):
        super().__init__(message=f'{service_name} error: {message}', code='DEPENDENCY_ERROR', status_code=status.HTTP_502_BAD_GATEWAY, details=details)

class ProcessingError(AppException):
    def __init__(self, message: str = 'Background processing failed', details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code='PROCESSING_ERROR', status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)

class InvalidUploadError(AppException):
    def __init__(self, message: str = 'Uploaded file format or content is invalid', details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code='INVALID_UPLOAD_ERROR', status_code=status.HTTP_400_BAD_REQUEST, details=details)

class TimeoutError(AppException):
    def __init__(self, message: str = 'Request processing timed out', details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code='TIMEOUT_ERROR', status_code=status.HTTP_504_GATEWAY_TIMEOUT, details=details)

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    error_payload = StandardErrorResponse(success=False, error=ErrorDetail(code=exc.code, message=exc.message, details=exc.details))
    return JSONResponse(status_code=exc.status_code, content=error_payload.model_dump())

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    error_payload = StandardErrorResponse(success=False, error=ErrorDetail(code='INTERNAL_SERVER_ERROR', message='An unexpected server error occurred. Please contact the system administrator.', details={'path': str(request.url.path)}))
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=error_payload.model_dump())
