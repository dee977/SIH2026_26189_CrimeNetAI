"""
CrimeNet AI — Member 5: Synthetic Demo Data Generator
Ground truth graph matching the continuous SIH26189 demo storyline:

FIR
-> Person A (Alok Sharma)
-> Phone X (+91-9876543210)
-> Person B (Vikram Malhotra - Intermediary/Bridge)
-> Bank Account Y (HDFC-8829103)
-> Transaction Z (Layered transfer)
-> Organization C (Apex Global shell company)
-> Location (Warehouse - Ahmedabad)
-> Crime Incident (Narcotics contraband seized / Syndicate hub)
"""

from member5_graph_ml.models.schemas import (
    GraphNode,
    GraphEdge,
    NetworkData,
    TemporalEvent,
)


def create_demo_network_data() -> NetworkData:
    """Creates a comprehensive ground-truth graph for CrimeNet AI demo story."""
    nodes = [
        # Primary actors
        GraphNode(
            id="NODE_PERSON_A",
            name="Alok Sharma",
            entity_type="Person",
            properties={"alias": "Rocky", "role_in_fir": "Named Suspect", "city": "Mumbai"},
            first_seen="2026-08-01T09:00:00Z",
            last_seen="2026-08-15T18:00:00Z",
            evidence_ids=["EV_FIR_001", "EV_WITNESS_01"],
        ),
        GraphNode(
            id="NODE_PERSON_B",
            name="Vikram Malhotra",
            entity_type="Person",
            properties={"alias": "Vicky", "known_courier": True, "city": "Ahmedabad"},
            first_seen="2026-08-02T10:00:00Z",
            last_seen="2026-08-15T22:00:00Z",
            evidence_ids=["EV_CDR_TOWER_42", "EV_BANK_KYC_99"],
        ),
        GraphNode(
            id="NODE_PERSON_C",
            name="Rajesh Gupta",
            entity_type="Person",
            properties={"role": "Accountant / Mule Manager"},
            first_seen="2026-08-03T11:00:00Z",
            last_seen="2026-08-15T20:00:00Z",
            evidence_ids=["EV_BANK_REC_104"],
        ),
        # Assets & Communications
        GraphNode(
            id="NODE_PHONE_X",
            name="+91-9876543210",
            entity_type="PhoneNumber",
            properties={"carrier": "Airtel", "registered_user": "Alok Sharma"},
            first_seen="2026-08-01T09:00:00Z",
            last_seen="2026-08-15T21:00:00Z",
            evidence_ids=["EV_CDR_BATCH_A"],
        ),
        GraphNode(
            id="NODE_PHONE_Y",
            name="+91-9123456789",
            entity_type="PhoneNumber",
            properties={"carrier": "Jio", "burner_sim": True},
            first_seen="2026-08-02T10:00:00Z",
            last_seen="2026-08-15T21:30:00Z",
            evidence_ids=["EV_CDR_BATCH_B"],
        ),
        GraphNode(
            id="NODE_BANK_Y",
            name="HDFC-8829103",
            entity_type="BankAccount",
            properties={"bank": "HDFC Bank", "branch": "Nariman Point", "status": "Active"},
            first_seen="2026-08-05T12:00:00Z",
            last_seen="2026-08-15T15:00:00Z",
            evidence_ids=["EV_BANK_STMT_AUG26"],
        ),
        GraphNode(
            id="NODE_BANK_Z",
            name="ICICI-4491028",
            entity_type="BankAccount",
            properties={"bank": "ICICI Bank", "branch": "SG Highway, Ahmedabad"},
            first_seen="2026-08-05T12:30:00Z",
            last_seen="2026-08-15T16:00:00Z",
            evidence_ids=["EV_BANK_STMT_AUG26"],
        ),
        # Organizations & Locations
        GraphNode(
            id="NODE_ORG_C",
            name="Apex Global Logistics Ltd",
            entity_type="Organization",
            properties={"status": "Shell Company Candidate", "pan": "AACCA1234F"},
            first_seen="2026-08-06T10:00:00Z",
            last_seen="2026-08-15T18:00:00Z",
            evidence_ids=["EV_ROC_FILING_2026"],
        ),
        GraphNode(
            id="NODE_LOC_WAREHOUSE",
            name="Warehouse Unit 4B, Changodar, Ahmedabad",
            entity_type="Location",
            properties={"category": "Storage Facility / Suspected Safehouse"},
            first_seen="2026-08-08T08:00:00Z",
            last_seen="2026-08-15T23:00:00Z",
            evidence_ids=["EV_GPS_LOG_TRUCK", "EV_ELECTRICITY_METER"],
        ),
        GraphNode(
            id="NODE_VEHICLE_1",
            name="GJ-01-AB-9988",
            entity_type="Vehicle",
            properties={"make": "Tata 407", "ownership": "Apex Global Logistics Ltd"},
            first_seen="2026-08-08T09:00:00Z",
            last_seen="2026-08-15T22:00:00Z",
            evidence_ids=["EV_TOLL_PLAZA_GJ"],
        ),
        # Incident
        GraphNode(
            id="NODE_CRIME_EVENT",
            name="FIR #261/2026 Narcotics Contraband Seizure",
            entity_type="CrimeEvent",
            properties={"police_station": "Crime Branch Mumbai", "ipc_sections": "NDPS Act 20, 25, 29"},
            first_seen="2026-08-15T22:30:00Z",
            last_seen="2026-08-15T23:59:00Z",
            evidence_ids=["EV_FIR_OFFICIAL_COPY"],
        ),
    ]

    edges = [
        # FIR to Person A
        GraphEdge(
            id="EDGE_01",
            source="NODE_CRIME_EVENT",
            target="NODE_PERSON_A",
            relationship_type="NAMES_SUSPECT",
            timestamp="2026-08-15T22:45:00Z",
            evidence_ids=["EV_FIR_001"],
        ),
        # Person A to Phone X
        GraphEdge(
            id="EDGE_02",
            source="NODE_PERSON_A",
            target="NODE_PHONE_X",
            relationship_type="USES_PHONE",
            timestamp="2026-08-01T09:30:00Z",
            evidence_ids=["EV_CAF_AIRTEL_A"],
        ),
        # Phone X to Phone Y (calls)
        GraphEdge(
            id="EDGE_03",
            source="NODE_PHONE_X",
            target="NODE_PHONE_Y",
            relationship_type="CALLS",
            timestamp="2026-08-10T14:20:00Z",
            weight=14.0,  # 14 calls
            evidence_ids=["EV_CDR_BATCH_A", "EV_CDR_BATCH_B"],
        ),
        # Phone Y to Person B
        GraphEdge(
            id="EDGE_04",
            source="NODE_PERSON_B",
            target="NODE_PHONE_Y",
            relationship_type="USES_PHONE",
            timestamp="2026-08-02T10:15:00Z",
            evidence_ids=["EV_TOWER_HANDSET_B"],
        ),
        # Person B to Bank Y
        GraphEdge(
            id="EDGE_05",
            source="NODE_PERSON_B",
            target="NODE_BANK_Y",
            relationship_type="SIGNATORY_ON",
            timestamp="2026-08-05T12:00:00Z",
            evidence_ids=["EV_BANK_KYC_99"],
        ),
        # Bank Y to Bank Z (layered fund transfer)
        GraphEdge(
            id="EDGE_06",
            source="NODE_BANK_Y",
            target="NODE_BANK_Z",
            relationship_type="TRANSFERS_FUNDS",
            timestamp="2026-08-12T15:30:00Z",
            weight=450000.0,
            properties={"amount": 450000, "reference": "IMPS/6281903"},
            evidence_ids=["EV_BANK_STMT_AUG26"],
        ),
        # Bank Z to Person C
        GraphEdge(
            id="EDGE_07",
            source="NODE_PERSON_C",
            target="NODE_BANK_Z",
            relationship_type="OPERATES_ACCOUNT",
            timestamp="2026-08-05T12:30:00Z",
            evidence_ids=["EV_BANK_REC_104"],
        ),
        # Person C to Org C (Director/Beneficiary)
        GraphEdge(
            id="EDGE_08",
            source="NODE_PERSON_C",
            target="NODE_ORG_C",
            relationship_type="DIRECTOR_OF",
            timestamp="2026-08-06T10:00:00Z",
            evidence_ids=["EV_ROC_FILING_2026"],
        ),
        # Org C owns Vehicle
        GraphEdge(
            id="EDGE_09",
            source="NODE_ORG_C",
            target="NODE_VEHICLE_1",
            relationship_type="OWNS_VEHICLE",
            timestamp="2026-08-08T09:00:00Z",
            evidence_ids=["EV_VAHAN_REGISTRY"],
        ),
        # Vehicle ping at Location
        GraphEdge(
            id="EDGE_10",
            source="NODE_VEHICLE_1",
            target="NODE_LOC_WAREHOUSE",
            relationship_type="PARKED_AT",
            timestamp="2026-08-15T21:45:00Z",
            evidence_ids=["EV_GPS_LOG_TRUCK"],
        ),
        # Location tied to Crime
        GraphEdge(
            id="EDGE_11",
            source="NODE_CRIME_EVENT",
            target="NODE_LOC_WAREHOUSE",
            relationship_type="SEIZURE_LOCATION",
            timestamp="2026-08-15T22:30:00Z",
            evidence_ids=["EV_POLICE_PANCHNAMA"],
        ),
        # Inter-community link: Person B visited Location
        GraphEdge(
            id="EDGE_12",
            source="NODE_PERSON_B",
            target="NODE_LOC_WAREHOUSE",
            relationship_type="VISITED_LOCATION",
            timestamp="2026-08-14T20:00:00Z",
            evidence_ids=["EV_CCTV_CHANGODAR"],
        ),
    ]

    return NetworkData(
        nodes=nodes,
        edges=edges,
        metadata={"case_id": "CR_26189_DEMO", "title": "Narcotics Contraband Supply Syndicate"},
    )


def create_demo_temporal_events() -> list[TemporalEvent]:
    """Generates chronologically indexed events for timeline playback & burst detection."""
    return [
        TemporalEvent(
            event_id="EVT_01",
            timestamp="2026-08-10T14:15:00Z",
            event_type="COMMUNICATION",
            entity_source_id="NODE_PERSON_A",
            entity_target_id="NODE_PERSON_B",
            description="Call initiated from Mumbai to Ahmedabad",
            evidence_ids=["EV_CDR_BATCH_A"],
        ),
        TemporalEvent(
            event_id="EVT_02",
            timestamp="2026-08-10T14:22:00Z",
            event_type="COMMUNICATION",
            entity_source_id="NODE_PERSON_A",
            entity_target_id="NODE_PERSON_B",
            description="Follow-up call 7 mins duration",
            evidence_ids=["EV_CDR_BATCH_A"],
        ),
        TemporalEvent(
            event_id="EVT_03",
            timestamp="2026-08-10T14:40:00Z",
            event_type="COMMUNICATION",
            entity_source_id="NODE_PERSON_A",
            entity_target_id="NODE_PERSON_B",
            description="Call 3 in rapid succession (burst)",
            evidence_ids=["EV_CDR_BATCH_A"],
        ),
        TemporalEvent(
            event_id="EVT_04",
            timestamp="2026-08-10T15:05:00Z",
            event_type="COMMUNICATION",
            entity_source_id="NODE_PERSON_A",
            entity_target_id="NODE_PERSON_B",
            description="Call 4 in rapid succession (burst)",
            evidence_ids=["EV_CDR_BATCH_A"],
        ),
        TemporalEvent(
            event_id="EVT_05",
            timestamp="2026-08-12T15:30:00Z",
            event_type="TRANSACTION",
            entity_source_id="NODE_BANK_Y",
            entity_target_id="NODE_BANK_Z",
            description="Fund transfer ₹4,50,000",
            evidence_ids=["EV_BANK_STMT_AUG26"],
        ),
        TemporalEvent(
            event_id="EVT_06",
            timestamp="2026-08-14T20:00:00Z",
            event_type="LOCATION_PING",
            entity_source_id="NODE_PERSON_B",
            entity_target_id="NODE_LOC_WAREHOUSE",
            description="Person B CCTV detection at warehouse gate",
            evidence_ids=["EV_CCTV_CHANGODAR"],
        ),
        TemporalEvent(
            event_id="EVT_07",
            timestamp="2026-08-15T21:45:00Z",
            event_type="LOCATION_PING",
            entity_source_id="NODE_VEHICLE_1",
            entity_target_id="NODE_LOC_WAREHOUSE",
            description="Truck arrival at Changodar warehouse",
            evidence_ids=["EV_GPS_LOG_TRUCK"],
        ),
        TemporalEvent(
            event_id="EVT_08",
            timestamp="2026-08-15T22:30:00Z",
            event_type="CRIME_INCIDENT",
            entity_source_id="NODE_CRIME_EVENT",
            entity_target_id="NODE_LOC_WAREHOUSE",
            description="Police raid and NDPS seizure at warehouse",
            evidence_ids=["EV_POLICE_PANCHNAMA"],
        ),
    ]


def create_demo_cross_verification_records() -> tuple[list[dict], list[dict], list[dict]]:
    """
    Creates records showcasing the real-world discrepancy:
    Alok Sharma claims he was at Mumbai clinic at 15:00 on Aug 12, 2026;
    ATM card was swiped in Ahmedabad at 15:05;
    CDR tower ping indicates Mumbai at 15:10.
    """
    cdrs = [
        {
            "cdr_id": "CDR_MUM_8819",
            "person_id": "NODE_PERSON_A",
            "person_name": "Alok Sharma",
            "location": "Mumbai",
            "tower_city": "Mumbai",
            "timestamp": "2026-08-12T15:10:00Z",
            "source_type": "CDR_TOWER_LOG",
            "evidence_id": "EV_CDR_TOWER_MUM_12",
            "case_id": "CR_26189_DEMO",
        }
    ]

    transactions = [
        {
            "transaction_id": "TX_ATM_AHM_901",
            "person_id": "NODE_PERSON_A",
            "person_name": "Alok Sharma",
            "location": "Ahmedabad",
            "terminal_city": "Ahmedabad",
            "amount": 20000,
            "timestamp": "2026-08-12T15:05:00Z",
            "source_type": "BANK_ATM_SWIPE",
            "evidence_id": "EV_ATM_LOG_AHM_08",
            "case_id": "CR_26189_DEMO",
        }
    ]

    fir_claims = [
        {
            "fir_number": "FIR_261_2026",
            "person_id": "NODE_PERSON_A",
            "person_name": "Alok Sharma",
            "claimed_location": "Delhi",
            "claimed_timestamp": "2026-08-12T15:15:00Z",
            "evidence_id": "EV_FIR_ALIBI_CLAIM",
        }
    ]

    return cdrs, transactions, fir_claims
