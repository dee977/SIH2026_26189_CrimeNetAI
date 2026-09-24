from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class NetworkStats(BaseModel):
    totalNodes: int = 0
    totalEdges: int = 0
    density: float = 0.0
    averageDegree: float = 0.0
    isolatedSubgraphs: int = 0

class DashboardStatisticsResponse(BaseModel):
    totalPersons: int = 0
    totalPhones: int = 0
    totalBankAccounts: int = 0
    totalVehicles: int = 0
    totalLocations: int = 0
    totalFIRs: int = 0
    totalCrimes: int = 0
    totalOrganizations: int = 0
    totalCommunications: int = 0
    totalTransactions: int = 0
    activeInvestigations: int = 0
    pendingAlertsCount: int = 0
    watchlistItemsCount: int = 0
    recentEvidenceCount: int = 0
    recentActivities: List[Dict[str, Any]] = Field(default_factory=list)
    networkStatistics: NetworkStats = Field(default_factory=NetworkStats)
