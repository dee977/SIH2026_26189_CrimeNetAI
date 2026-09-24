from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class SearchFilterParams(BaseModel):
    entityTypes: Optional[List[str]] = Field(default=None, description='Filter by entity types')
    dateFrom: Optional[str] = Field(default=None, description='ISO date filter start')
    dateTo: Optional[str] = Field(default=None, description='ISO date filter end')
    location: Optional[str] = Field(default=None, description='Location string')
    source: Optional[str] = Field(default=None, description='Source dataset or system')
    caseId: Optional[str] = Field(default=None, description='Case context filter')

class UniversalSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description='Search keyword, identifier, name, phone, account, vehicle, etc.')
    filters: Optional[SearchFilterParams] = Field(default_factory=SearchFilterParams)
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

class SearchResultItem(BaseModel):
    entityId: str
    entityType: str
    name: str
    snippet: str
    source: str
    evidenceReference: Optional[str] = None
    caseReference: Optional[str] = None
    confidence: Optional[float] = 0.95
    matchedFields: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class UniversalSearchResponse(BaseModel):
    totalMatches: int
    query: str
    results: List[SearchResultItem] = Field(default_factory=list)
