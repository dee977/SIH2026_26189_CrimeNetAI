from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.dashboard import DashboardStatisticsResponse, NetworkStats
from app.services.demo_data import DEMO_CASES, DEMO_ENTITIES, DEMO_EDGES, DEMO_ALERTS, DEMO_WATCHLIST

router = APIRouter(prefix='/dashboard', tags=['Executive Dashboard Statistics'])

@router.get('/stats', response_model=ResponseEnvelope[DashboardStatisticsResponse], summary='Get Aggregated Dashboard Metrics')
async def get_dashboard_stats(current_user: UserProfile = Depends(get_current_user)):
    persons = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Person'])
    phones = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Phone'])
    accounts = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'BankAccount'])
    vehicles = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Vehicle'])
    locations = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Location'])
    firs = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'FIR'])
    crimes = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Crime'])
    orgs = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Organization'])
    transactions = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Transaction'])
    comms = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Communication'])
    evidence_count = len([e for e in DEMO_ENTITIES if e.get('entityType') == 'Evidence'])

    stats = DashboardStatisticsResponse(
        totalPersons=persons,
        totalPhones=phones,
        totalBankAccounts=accounts,
        totalVehicles=vehicles,
        totalLocations=locations,
        totalFIRs=firs,
        totalCrimes=crimes,
        totalOrganizations=orgs,
        totalCommunications=comms,
        totalTransactions=transactions,
        activeInvestigations=len([c for c in DEMO_CASES if c.get('status') == 'active']),
        pendingAlertsCount=len([a for a in DEMO_ALERTS if a.get('status') == 'UNRESOLVED']),
        watchlistItemsCount=len([w for w in DEMO_WATCHLIST if w.get('isActive')]),
        recentEvidenceCount=evidence_count,
        recentActivities=[
            {'activity': 'FIR-2024-8841 ingested and cross-referenced with Central Graph', 'timestamp': '2024-03-10T11:30:00Z'},
            {'activity': 'RTGS Transaction TXN-2024-8812 linked to Shadow Logistics Ltd', 'timestamp': '2024-03-08T16:45:00Z'}
        ],
        networkStatistics=NetworkStats(
            totalNodes=len(DEMO_ENTITIES),
            totalEdges=len(DEMO_EDGES),
            density=0.18,
            averageDegree=2.4,
            isolatedSubgraphs=1
        )
    )
    return ResponseEnvelope(data=stats)
