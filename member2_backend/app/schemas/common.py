from datetime import datetime, timezone
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ResponseMeta(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    version: str = "1.0.0"
    requestId: Optional[str] = None


class ResponseEnvelope(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: ResponseMeta = Field(default_factory=ResponseMeta)


class PaginationMeta(BaseModel):
    page: int = Field(default=1, ge=1)
    pageSize: int = Field(default=20, ge=1, le=500)
    totalRecords: int = Field(default=0, ge=0)
    totalPages: int = Field(default=0, ge=0)


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    items: List[T]
    pagination: PaginationMeta
    meta: ResponseMeta = Field(default_factory=ResponseMeta)
