from typing import Any, Dict, List, Optional
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from app.dependencies import get_current_user, assert_case_access
from app.database import get_db
from sqlalchemy.orm import Session
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.schemas.timeline import TimelineEvent, TimelinePlaybackFrame, TimelinePlaybackResponse
from neo4j import GraphDatabase
from app.config import settings

router = APIRouter(prefix='/timeline', tags=['Temporal Intelligence Engine'])

CASE_TIMELINES: Dict[str, List[Dict[str, Any]]] = {
    'CASE-2025-M3-DATASET': [
        {
            'eventId': 'EVT-M3-001',
            'timestamp': '2026-01-08T08:30:00Z',
            'eventType': 'COMMUNICATION',
            'title': 'VoIP Encrypted Burst Call Intercept',
            'description': '14 short-duration encrypted voice calls recorded between P00004 and P00005 preceding suspected contraband shipment dispatch.',
            'primaryEntityId': 'P00004',
            'primaryEntityName': 'Person_00004 (Courier Lead)',
            'secondaryEntityId': 'P00005',
            'secondaryEntityName': 'Person_00005 (Handler)',
            'location': 'Airtel Sector 4 Tower (Cell 19402)',
            'sourceDocument': 'telecom_cdr_carrier_dump.csv',
            'evidenceId': 'EVD-2025-M3-01',
            'caseId': 'CASE-2025-M3-DATASET',
            'metadata': {'duration': 180, 'callType': 'VoIP Burst', 'classification': 'LEO Intercept'}
        },
        {
            'eventId': 'EVT-M3-002',
            'timestamp': '2026-01-08T10:15:00Z',
            'eventType': 'LOCATION',
            'title': 'Fastag Highway Toll Barrier Passage',
            'description': 'Transport carrier vehicle crossed Khed Shivapur Toll Gate moving along southern corridor.',
            'primaryEntityId': 'P00004',
            'primaryEntityName': 'Person_00004',
            'secondaryEntityId': 'VEH-MH04-8812',
            'secondaryEntityName': 'Consignment Vehicle #8812',
            'location': 'Khed Shivapur Toll Plaza (NH4)',
            'sourceDocument': 'nhai_fastag_transit_logs.csv',
            'evidenceId': 'EVD-2025-M3-02',
            'caseId': 'CASE-2025-M3-DATASET',
            'metadata': {'lane': 'Lane 03', 'speed': '64 km/h', 'rfid': 'TAG-9921443'}
        },
        {
            'eventId': 'EVT-M3-003',
            'timestamp': '2026-01-08T11:45:00Z',
            'eventType': 'FINANCIAL_TRANSACTION',
            'title': 'Layered RTGS Fund Dispersion (INR 18,50,000)',
            'description': 'Rapid smurfed transfers split across 4 intermediary accounts including ICICI Escrow Mule Account #8821.',
            'primaryEntityId': 'ACC-FEEDER',
            'primaryEntityName': 'Layering Origin Account',
            'secondaryEntityId': 'ACC-90218821',
            'secondaryEntityName': 'ICICI Mule Account #8821',
            'location': 'ICICI Core Banking Branch, Mumbai',
            'sourceDocument': 'cbs_bank_statements.csv',
            'evidenceId': 'EVD-2025-M3-03',
            'caseId': 'CASE-2025-M3-DATASET',
            'metadata': {'amount': 1850000, 'method': 'RTGS', 'velocity': '4 txns / 12 mins'}
        },
        {
            'eventId': 'EVT-M3-004',
            'timestamp': '2026-01-08T14:10:00Z',
            'eventType': 'LOCATION',
            'title': 'Cellular Azimuth Tower Telemetry Ping',
            'description': 'Handset IMEI registered at Cargo Terminal 2 BTS sector azimuth, establishing spatial proximity to yard.',
            'primaryEntityId': 'P00004',
            'primaryEntityName': 'Person_00004',
            'location': 'JNPT Cargo Terminal 2',
            'sourceDocument': 'bts_azimuth_dumps.csv',
            'evidenceId': 'EVD-2025-M3-01',
            'caseId': 'CASE-2025-M3-DATASET',
            'metadata': {'azimuth': 142, 'timingAdvance': 3}
        },
        {
            'eventId': 'EVT-M3-005',
            'timestamp': '2026-01-08T17:30:00Z',
            'eventType': 'CRIME_INCIDENT',
            'title': 'Preventive Interdiction & Contraband Seizure',
            'description': 'Joint enforcement team intercepted refrigerated cargo container at Yard 4B; recovered 42.5kg illicit contraband.',
            'primaryEntityId': 'P00004',
            'primaryEntityName': 'Person_00004',
            'location': 'Nhava Sheva Yard 4B Berth',
            'sourceDocument': 'seizure_panchnama_signed.pdf',
            'evidenceId': 'EVD-2025-M3-01',
            'caseId': 'CASE-2025-M3-DATASET',
            'metadata': {'contrabandWeightKg': 42.5, 'statutoryStandard': 'BSA Section 63'}
        },
        {
            'eventId': 'EVT-M3-006',
            'timestamp': '2026-01-09T09:00:00Z',
            'eventType': 'RELATIONSHIP',
            'title': 'CCTNS Regular FIR Registration #F000001',
            'description': 'Formal FIR registered at CID Special Crime Branch under Bharatiya Nyaya Sanhita §111 (Organised Crime) & §61.',
            'primaryEntityId': 'FIR-F000001',
            'primaryEntityName': 'CCTNS FIR #F000001',
            'location': 'Special Crime Branch, CID Mumbai',
            'sourceDocument': 'cctns_fir_docket.pdf',
            'evidenceId': 'EVD-2025-M3-02',
            'caseId': 'CASE-2025-M3-DATASET',
            'metadata': {'acts': ['BNS §111', 'BNS §61', 'BSA §63']}
        }
    ],

    'CASE-VIDEO-001': [
        {
            'eventId': 'EVT-V1-001',
            'timestamp': '2026-01-05T09:15:00Z',
            'eventType': 'FINANCIAL_TRANSACTION',
            'title': 'High-Velocity Hawala Aggregator Credit (INR 45,00,000)',
            'description': 'Multiple high-value RTGS credits channeled into HDFC Account #99214430 from 6 unrelated shell corporate entities.',
            'primaryEntityId': 'ACC-HDFC-9921',
            'primaryEntityName': 'HDFC Aggregator #99214430',
            'secondaryEntityId': 'P00101',
            'secondaryEntityName': 'Person_00101 (Hawala Booker)',
            'location': 'Bandra-Kurla Complex Financial Hub',
            'sourceDocument': 'hdfc_core_banking_records.csv',
            'evidenceId': 'EVD-VIDEO-001',
            'caseId': 'CASE-VIDEO-001',
            'metadata': {'amount': 4500000, 'method': 'RTGS Layering', 'pmlaCategory': 'Section 3/4'}
        },
        {
            'eventId': 'EVT-V1-002',
            'timestamp': '2026-01-05T11:00:00Z',
            'eventType': 'COMMUNICATION',
            'title': 'Hawala Token Confirmation Transmission',
            'description': 'Coded monetary compensation token transmitted via encrypted messaging hook to overseas settlement agent.',
            'primaryEntityId': 'P00101',
            'primaryEntityName': 'Person_00101',
            'location': 'South Mumbai Courier Office',
            'sourceDocument': 'intercepted_comms_record.csv',
            'evidenceId': 'EVD-VIDEO-001-B',
            'caseId': 'CASE-VIDEO-001',
            'metadata': {'tokenSerial': 'HWL-DXB-9912', 'channel': 'Signal Encrypted'}
        },
        {
            'eventId': 'EVT-V1-003',
            'timestamp': '2026-01-05T15:30:00Z',
            'eventType': 'FINANCIAL_TRANSACTION',
            'title': 'Outward Telegraphic Wire Request',
            'description': 'Immediate outward foreign remittance wire requested to offshore logistics supplier without underlying trade invoices.',
            'primaryEntityId': 'ACC-HDFC-9921',
            'primaryEntityName': 'HDFC Aggregator #99214430',
            'location': 'Mumbai Foreign Exchange Clearing Desk',
            'sourceDocument': 'swift_mt103_outward.csv',
            'evidenceId': 'EVD-VIDEO-001',
            'caseId': 'CASE-VIDEO-001',
            'metadata': {'beneficiary': 'Gulf Trade Logistics FZE', 'fiuAlert': 'STR-2026-01'}
        }
    ],

    'CASE-VIDEO-002': [
        {
            'eventId': 'EVT-V2-001',
            'timestamp': '2026-01-07T01:15:00Z',
            'eventType': 'COMMUNICATION',
            'title': 'Thuraya Satellite Telemetry Burst',
            'description': 'Encrypted satellite voice packet burst captured along offshore coastal approach corridor.',
            'primaryEntityId': 'SAT-THURAYA-881',
            'primaryEntityName': 'Thuraya Satellite Unit #881',
            'secondaryEntityId': 'P00201',
            'secondaryEntityName': 'Person_00201 (Dockside Receiver)',
            'location': 'Arabian Sea Offshore Grid',
            'sourceDocument': 'satellite_intercept_tape.csv',
            'evidenceId': 'EVD-VIDEO-002',
            'caseId': 'CASE-VIDEO-002',
            'metadata': {'frequencyMhz': 1544.5, 'beamId': 12}
        },
        {
            'eventId': 'EVT-V2-002',
            'timestamp': '2026-01-07T01:18:22Z',
            'eventType': 'LOCATION',
            'title': 'AIS Vessel Transponder Blackout & Radar Intercept',
            'description': 'Coastal surveillance radar tracked target craft moving at 14 knots meeting unflagged skiff at 18.91N 72.82E.',
            'primaryEntityId': 'P00201',
            'primaryEntityName': 'Person_00201',
            'location': 'Alibaug Offshore Coordinates (18.91°N, 72.82°E)',
            'sourceDocument': 'icg_coastal_surveillance_radar.csv',
            'evidenceId': 'EVD-VIDEO-002',
            'caseId': 'CASE-VIDEO-002',
            'metadata': {'radarTrackId': 'ICG-TRK-771', 'speedKnots': 14.2}
        },
        {
            'eventId': 'EVT-V2-003',
            'timestamp': '2026-01-07T04:45:00Z',
            'eventType': 'CRIME_INCIDENT',
            'title': 'Maritime Interdiction & Consignment Seizure',
            'description': 'Coast Guard intercepted drop vessel; seized high-purity contraband cargo under NDPS Act Section 29.',
            'primaryEntityId': 'P00201',
            'primaryEntityName': 'Person_00201',
            'location': 'Offshore Anchorage Berth Delta-3',
            'sourceDocument': 'ndps_seizure_memo.pdf',
            'evidenceId': 'EVD-VIDEO-002',
            'caseId': 'CASE-VIDEO-002',
            'metadata': {'ndpsSections': ['NDPS §29', 'NDPS §21']}
        }
    ],

    'CASE-VIDEO-003': [
        {
            'eventId': 'EVT-V3-001',
            'timestamp': '2026-01-08T02:00:00Z',
            'eventType': 'LOCATION',
            'title': 'Phishing Domain DNS Ingress Trigger',
            'description': 'Spoofed banking panel domain sbi-secure-portal.net resolved to C2 phishing proxy IP 198.51.100.42.',
            'primaryEntityId': '198.51.100.42',
            'primaryEntityName': 'C2 Phish Proxy Node',
            'secondaryEntityId': 'P00301',
            'secondaryEntityName': 'Person_00301 (Mule Recruiter)',
            'location': 'Bengaluru Hosting Data Center',
            'sourceDocument': 'dns_telemetry_dump.csv',
            'evidenceId': 'EVD-VIDEO-003',
            'caseId': 'CASE-VIDEO-003',
            'metadata': {'certInIncidentId': 'CERT-IN-2026-081', 'asn': 'AS13335'}
        },
        {
            'eventId': 'EVT-V3-002',
            'timestamp': '2026-01-08T03:12:00Z',
            'eventType': 'COMMUNICATION',
            'title': 'Automated Exfiltration Hook Intercept',
            'description': 'Harvested 2FA credentials relayed to encrypted bot endpoint for instant unauthorized fund transfers.',
            'primaryEntityId': 'P00301',
            'primaryEntityName': 'Person_00301',
            'location': 'Noida Cyber Operations Hub',
            'sourceDocument': 'pcap_traffic_capture.pcap',
            'evidenceId': 'EVD-VIDEO-003',
            'caseId': 'CASE-VIDEO-003',
            'metadata': {'protocol': 'HTTPS/TLSv1.3', 'compromisedSessions': 31}
        },
        {
            'eventId': 'EVT-V3-003',
            'timestamp': '2026-01-08T06:45:00Z',
            'eventType': 'FINANCIAL_TRANSACTION',
            'title': 'Simultaneous Multi-ATM Mule Liquidation',
            'description': 'Cyber scam proceeds withdrawn in coordinated sequence across 3 metropolitan ATMs in under 15 minutes.',
            'primaryEntityId': 'ACC-MULE-01',
            'primaryEntityName': 'Mule Current Account #1102',
            'location': 'Delhi NCR ATM Cluster',
            'sourceDocument': 'atm_terminal_journal.csv',
            'evidenceId': 'EVD-VIDEO-003',
            'caseId': 'CASE-VIDEO-003',
            'metadata': {'totalDispensed': 850000, 'atmTerminals': ['ATM-DEL-01', 'ATM-NOI-04']}
        }
    ],

    'CASE-VIDEO-004': [
        {
            'eventId': 'EVT-V4-001',
            'timestamp': '2026-01-09T14:00:00Z',
            'eventType': 'LOCATION',
            'title': 'Transport Manifest Route Divergence',
            'description': 'Commercial carrier with counterfeit travel documents diverted from declared transit path towards secluded safehouse.',
            'primaryEntityId': 'P00401',
            'primaryEntityName': 'Person_00401 (Safehouse Custodian)',
            'location': 'Highway Checkpoint NH48',
            'sourceDocument': 'consignment_waybill.csv',
            'evidenceId': 'EVD-VIDEO-004',
            'caseId': 'CASE-VIDEO-004',
            'metadata': {'vehicleReg': 'MH-12-TR-9902', 'manifestMismatch': True}
        },
        {
            'eventId': 'EVT-V4-002',
            'timestamp': '2026-01-09T17:42:10Z',
            'eventType': 'LOCATION',
            'title': 'Safehouse Staging Facility Ingress',
            'description': 'CCTV timestamp recorded suspect entering staging facility with duplicate passport serial #PASSPORT-Z992144.',
            'primaryEntityId': 'P00401',
            'primaryEntityName': 'Person_00401',
            'location': 'Rural Logistics Safehouse #04',
            'sourceDocument': 'cctv_optical_capture.mp4',
            'evidenceId': 'EVD-VIDEO-004',
            'caseId': 'CASE-VIDEO-004',
            'metadata': {'forgedDocumentSerial': 'PASSPORT-Z992144'}
        },
        {
            'eventId': 'EVT-V4-003',
            'timestamp': '2026-01-09T18:30:00Z',
            'eventType': 'CRIME_INCIDENT',
            'title': 'Anti-Human Trafficking Unit Tactical Breach',
            'description': 'Specialized AHTU team breached premises; recovered victims and seized counterfeit immigration clearance stamps.',
            'primaryEntityId': 'P00401',
            'primaryEntityName': 'Person_00401',
            'location': 'Safehouse Complex, Sector 9',
            'sourceDocument': 'ahtu_raid_docket.pdf',
            'evidenceId': 'EVD-VIDEO-004',
            'caseId': 'CASE-VIDEO-004',
            'metadata': {'victimsRescued': 6, 'seizedLedgers': 2}
        }
    ]
}


def _fetch_neo4j_timeline(case_id: str, entity_id: str = None, event_type: str = None, limit: int = 100):
    events = []
    try:
        driver = GraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD), connection_timeout=0.2, max_connection_lifetime=10)
        driver.verify_connectivity()
        with driver.session() as session:
            # Match communication events
            if not event_type or event_type in ['COMMUNICATION', 'Call']:
                query = """
                MATCH (c:Call)
                WHERE c.caseId = $case_id OR c.case_id = $case_id
                """
                if entity_id:
                    query += " AND (c.caller_id = $eid OR c.receiver_id = $eid) "
                query += """
                RETURN c.id as id, c.timestamp as ts, c.caller_id as caller, c.receiver_id as receiver, 
                       c.call_type as ctype, c.duration as dur, c.status as st
                ORDER BY c.timestamp DESC LIMIT $lim
                """
                records = session.run(query, case_id=case_id, eid=entity_id, lim=limit)
                for r in records:
                    caller_id = str(r['caller'])
                    receiver_id = str(r['receiver'])
                    events.append(TimelineEvent(
                        eventId=f"EVT-CALL-{r['id']}",
                        caseId=case_id,
                        timestamp=f"{r['ts']}T00:00:00Z" if len(str(r['ts'])) <= 10 else str(r['ts']),
                        eventType='COMMUNICATION',
                        title=f"{r['ctype']} Call ({r['dur']}s)",
                        description=f"{r['ctype']} call from {caller_id} to {receiver_id} lasting {r['dur']} seconds. Status: {r['st']}.",
                        primaryEntityId=caller_id,
                        primaryEntityName=f"Subject {caller_id}",
                        secondaryEntityId=receiver_id,
                        secondaryEntityName=f"Subject {receiver_id}",
                        location="Cell Tower Grid",
                        sourceDocument="communication_links.csv",
                        evidenceId='EVD-REAL-001',
                        metadata={'callId': r['id'], 'callType': r['ctype'], 'duration': r['dur'], 'status': r['st']}
                    ))

            # Financial Transactions
            if not event_type or event_type in ['FINANCIAL_TRANSACTION', 'Transaction', 'FINANCIAL']:
                query = """
                MATCH (t:Transaction)
                WHERE t.caseId = $case_id OR t.case_id = $case_id
                """
                if entity_id:
                    query += " AND (t.sender_id = $eid OR t.receiver_id = $eid) "
                query += """
                RETURN t.id as id, t.date as dt, t.sender_id as sender, t.receiver_id as receiver,
                       t.amount as amt, t.method as method, t.location as loc, t.risk_label as risk
                ORDER BY t.date DESC LIMIT $lim
                """
                records = session.run(query, case_id=case_id, eid=entity_id, lim=limit)
                for r in records:
                    amt_str = f"INR {r['amt']:,.2f}" if r.get('amt') else "INR 0"
                    sender_id = str(r['sender'])
                    receiver_id = str(r['receiver'])
                    events.append(TimelineEvent(
                        eventId=f"EVT-TXN-{r['id']}",
                        caseId=case_id,
                        timestamp=f"{r['dt']}T12:00:00Z",
                        eventType='FINANCIAL_TRANSACTION',
                        title=f"{r['method']} Transfer ({amt_str})",
                        description=f"Funds transfer of {amt_str} from {sender_id} to {receiver_id} via {r['method']} in {r['loc']}. Risk: {r['risk']}.",
                        primaryEntityId=sender_id,
                        primaryEntityName=f"Account Holder {sender_id}",
                        secondaryEntityId=receiver_id,
                        secondaryEntityName=f"Beneficiary {receiver_id}",
                        location=str(r['loc']),
                        sourceDocument="financial_transactions.csv",
                        evidenceId='EVD-REAL-002',
                        metadata={'transactionId': r['id'], 'amount': r['amt'], 'method': r['method'], 'location': r['loc'], 'riskLabel': r['risk']}
                    ))

            # FIR Registration Events
            if not event_type or event_type in ['CRIME_INCIDENT', 'FIR', 'CRIME']:
                query = """
                MATCH (f:FIR)
                WHERE f.caseId = $case_id OR f.case_id = $case_id
                RETURN f.id as id, f.date as dt, f.crime_type as crime, f.location as loc, f.case_status as status
                ORDER BY f.date DESC LIMIT $lim
                """
                records = session.run(query, case_id=case_id, lim=limit)
                for r in records:
                    fid = str(r['id'])
                    events.append(TimelineEvent(
                        eventId=f"EVT-FIR-{fid}",
                        caseId=case_id,
                        timestamp=f"{r['dt']}T09:00:00Z",
                        eventType='CRIME_INCIDENT',
                        title=f"FIR Registration: {r['crime']}",
                        description=f"FIR {fid} registered for {r['crime']} at {r['loc']}. Status: {r['status']}.",
                        primaryEntityId=fid,
                        primaryEntityName=f"FIR {fid}",
                        location=str(r['loc']),
                        sourceDocument="criminal_relationships.csv",
                        evidenceId='EVD-REAL-003',
                        metadata={'firId': fid, 'crimeType': r['crime'], 'location': r['loc'], 'caseStatus': r['status']}
                    ))
        driver.close()
    except Exception:
        pass

    if not events:
        from app.services.demo_data import DEMO_TIMELINE
        for d_evt in DEMO_TIMELINE:
            if not case_id or d_evt.get('caseId') == case_id:
                events.append(TimelineEvent(**d_evt))

    events.sort(key=lambda x: x.timestamp, reverse=True)
    return events


@router.get('', response_model=PaginatedResponse[TimelineEvent], summary='Query Investigation Timeline')
async def get_timeline(
    case_id: Optional[str] = Query(None, description="Case ID"),
    caseId: Optional[str] = Query(None, description="Case ID alternative"),
    entityId: Optional[str] = Query(None),
    eventType: Optional[str] = Query(None),
    fromDate: Optional[str] = Query(None),
    toDate: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=500),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_case = case_id or caseId
    if not target_case:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail='caseId is required')
    assert_case_access(db, current_user, target_case)
    loop = asyncio.get_event_loop()
    real_events = await loop.run_in_executor(None, _fetch_neo4j_timeline, target_case, entityId, eventType, pageSize * 2)
    start = (page - 1) * pageSize
    paginated = real_events[start:start + pageSize]
    total = len(real_events)
    pages = (total + pageSize - 1) // pageSize if total > 0 else 1
    return PaginatedResponse(
        items=paginated,
        pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages)
    )

@router.get('/playback', response_model=ResponseEnvelope[TimelinePlaybackResponse], summary='Temporal Playback Frames for Graph Animation')
async def get_timeline_playback(
    case_id: Optional[str] = Query(None, description="Case ID"), 
    caseId: Optional[str] = Query(None, description="Case ID alternative"), 
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_case = case_id or caseId
    if not target_case:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail='caseId is required')
    assert_case_access(db, current_user, target_case)
    loop = asyncio.get_event_loop()
    events = await loop.run_in_executor(None, _fetch_neo4j_timeline, target_case, None, None, 40)
    
    sorted_events = sorted(events, key=lambda x: x.timestamp)
    frames = []
    accumulated_nodes = set()
    accumulated_edges = set()

    for idx, evt in enumerate(sorted_events):
        p_id = evt.primaryEntityId
        s_id = evt.secondaryEntityId
        if p_id:
            accumulated_nodes.add(p_id)
        if s_id:
            accumulated_nodes.add(s_id)
        if p_id and s_id:
            accumulated_edges.add(f'{p_id}->{s_id}')

        frames.append(TimelinePlaybackFrame(
            frameIndex=idx + 1,
            timestamp=evt.timestamp,
            activeEvents=[evt],
            activeNodes=list(accumulated_nodes),
            activeEdges=list(accumulated_edges)
        ))

    resp = TimelinePlaybackResponse(
        totalFrames=len(frames),
        startDate=sorted_events[0].timestamp if sorted_events else '',
        endDate=sorted_events[-1].timestamp if sorted_events else '',
        frames=frames
    )
    return ResponseEnvelope(data=resp)
