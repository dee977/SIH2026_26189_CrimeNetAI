import os
import asyncio
from fastapi import APIRouter, Depends
from neo4j import GraphDatabase

from app.dependencies import get_current_user
from app.config import settings
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.dashboard import DashboardStatisticsResponse, NetworkStats

router = APIRouter(prefix='/dashboard', tags=['Executive Dashboard Statistics'])


@router.get('/stats', response_model=ResponseEnvelope[DashboardStatisticsResponse], summary='Get Aggregated Dashboard Metrics')
async def get_dashboard_stats(current_user: UserProfile = Depends(get_current_user)):
    # 1. Primary: Attempt to query real dataset metrics from Neo4j
    uri = os.getenv('NEO4J_URI', getattr(settings, 'M3_NEO4J_URI', 'bolt://localhost:7687'))
    user = os.getenv('NEO4J_USERNAME', os.getenv('NEO4J_USER', 'neo4j'))
    pwd = os.getenv('NEO4J_PASSWORD', settings.M3_NEO4J_PASSWORD)

    def _fetch_neo4j_stats(tx):
        # Entity counts
        p_count = tx.run("MATCH (p:Person) RETURN count(p) as c").single()["c"]
        t_count = tx.run("MATCH (t:Transaction) RETURN count(t) as c").single()["c"]
        c_count = tx.run("MATCH (c:Communication) RETURN count(c) as c").single()["c"]
        f_count = tx.run("MATCH (f:FIR) RETURN count(f) as c").single()["c"]
        crime_count = tx.run("MATCH (f:FIR) RETURN count(DISTINCT f.crime_type) as c").single()["c"]
        active_firs = tx.run("MATCH (f:FIR) WHERE f.case_status IN ['Open', 'Under Investigation'] RETURN count(f) as c").single()["c"]

        # Edges
        total_edges = tx.run("MATCH ()-[r]->() RETURN count(r) as c").single()["c"]

        # Recent activities from real datasets
        recent_txns = list(tx.run("MATCH (t:Transaction) RETURN t.id as id, t.amount as amount, t.method as method, t.location as loc, t.date as dt ORDER BY t.date DESC LIMIT 2"))
        recent_calls = list(tx.run("MATCH (c:Communication) RETURN c.id as id, c.call_type as ctype, c.status as st, c.caller_id as caller, c.receiver_id as receiver, c.timestamp as ts ORDER BY c.timestamp DESC LIMIT 2"))

        activities = []
        for r in recent_txns:
            amt_formatted = f"INR {r['amount']:,.2f}" if r.get('amount') else "INR 0"
            activities.append({
                'activity': f"Transaction {r['id']} ({amt_formatted} via {r['method']}) at {r['loc']}",
                'timestamp': f"{r['dt']}T12:00:00Z"
            })
        for r in recent_calls:
            activities.append({
                'activity': f"{r['ctype']} Call {r['id']} ({r['st']}) between {r['caller']} and {r['receiver']}",
                'timestamp': f"{r['ts'].replace(' ', 'T')}Z" if r.get('ts') else "2025-12-31T23:59:00Z"
            })

        return {
            'persons': p_count,
            'transactions': t_count,
            'communications': c_count,
            'firs': f_count,
            'crimes': crime_count,
            'active_investigations': active_firs,
            'total_edges': total_edges,
            'activities': activities
        }

    try:
        loop = asyncio.get_event_loop()
        driver = GraphDatabase.driver(uri, auth=(user, pwd))
        with driver.session() as session:
            db_stats = await loop.run_in_executor(None, session.execute_read, _fetch_neo4j_stats)
        driver.close()

        if db_stats and db_stats['persons'] > 0:
            total_nodes = db_stats['persons'] + db_stats['firs'] + db_stats['transactions'] + db_stats['communications']
            avg_deg = round((db_stats['total_edges'] * 2.0) / total_nodes, 2) if total_nodes > 0 else 2.2

            return ResponseEnvelope(data=DashboardStatisticsResponse(
                totalPersons=db_stats['persons'],
                totalPhones=0,
                totalBankAccounts=0,
                totalVehicles=0,
                totalLocations=0,
                totalFIRs=db_stats['firs'],
                totalCrimes=db_stats['crimes'],
                totalOrganizations=0,
                totalCommunications=db_stats['communications'],
                totalTransactions=db_stats['transactions'],
                activeInvestigations=db_stats['active_investigations'],
                pendingAlertsCount=0,
                watchlistItemsCount=0,
                recentEvidenceCount=0,
                recentActivities=db_stats['activities'],
                networkStatistics=NetworkStats(
                    totalNodes=total_nodes,
                    totalEdges=db_stats['total_edges'],
                    density=0,
                    averageDegree=avg_deg,
                    isolatedSubgraphs=1
                )
            ))
    except Exception as e:
        print(f"[Dashboard API] Primary Neo4j query error: {e}")

    # 2. Canonical case statistics fallback
    from app.services.demo_data import DEMO_ENTITIES, DEMO_EDGES
    persons = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'Person')
    phones = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'Phone')
    accounts = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'BankAccount')
    vehicles = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'Vehicle')
    locations = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'Location')
    firs = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'FIR')
    crimes = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'Crime')
    orgs = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'Organization')
    transactions = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'Transaction')
    comms = 14
    evidence_count = sum(1 for e in DEMO_ENTITIES if e.get('entityType') == 'Evidence')

    total_nodes = len(DEMO_ENTITIES)
    total_edges = len(DEMO_EDGES)

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
        activeInvestigations=1,
        pendingAlertsCount=1,
        watchlistItemsCount=1,
        recentEvidenceCount=evidence_count,
        recentActivities=[
            {'activity': 'FIR-2024-8841 registered at Nhava Sheva Port Police', 'timestamp': '2024-03-10T11:30:00Z'},
            {'activity': 'RTGS Remittance INR 45,00,000 to Shadow Logistics Ltd', 'timestamp': '2024-03-08T16:45:00Z'}
        ],
        networkStatistics=NetworkStats(
            totalNodes=total_nodes,
            totalEdges=total_edges,
            density=0.12,
            averageDegree=2.4,
            isolatedSubgraphs=1
        )
    )
    return ResponseEnvelope(data=stats)
