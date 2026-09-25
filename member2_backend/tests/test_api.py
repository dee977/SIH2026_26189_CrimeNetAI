import io
import pytest
import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath('member2_backend'))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_and_health():
    resp = client.get('/')
    assert resp.status_code == 200
    assert resp.json()['status'] == 'OPERATIONAL'

    health_resp = client.get('/health')
    assert health_resp.status_code == 200
    assert health_resp.json()['status'] == 'healthy'

    ready_resp = client.get('/ready')
    assert ready_resp.status_code == 200
    assert ready_resp.json()['ready'] is True

def test_auth_login_and_profile():
    login_payload = {'email': 'rajesh.kumar@cid.gov.in', 'password': 'SecuredPassword123!'}
    resp = client.post('/api/v1/auth/login', json=login_payload)
    assert resp.status_code == 200
    data = resp.json()['data']
    assert 'accessToken' in data
    assert data['user']['email'] == 'rajesh.kumar@cid.gov.in'

    me_resp = client.get('/api/v1/auth/me')
    assert me_resp.status_code == 200
    assert me_resp.json()['data']['role'] == 'lead_investigator'

def test_cases_crud():
    # 1. List cases
    list_resp = client.get('/api/v1/cases')
    assert list_resp.status_code == 200
    assert len(list_resp.json()['items']) >= 1

    # 2. Get case detail
    detail_resp = client.get('/api/v1/cases/CASE-2024-001')
    assert detail_resp.status_code == 200
    case_data = detail_resp.json()['data']
    assert case_data['caseId'] == 'CASE-2024-001'
    assert len(case_data['entities']) >= 1
    assert len(case_data['relationships']) >= 1

    # 3. Create case
    new_case_payload = {
        'title': 'Operation Dark Port',
        'description': 'Tracking illicit container transshipments across coastal logistics hubs.',
        'assignedInvestigator': 'Inspector Vikram Deshmukh',
        'assignedTeam': 'Port Special Task Force',
        'priority': 'critical'
    }
    create_resp = client.post('/api/v1/cases', json=new_case_payload)
    assert create_resp.status_code == 201
    created_id = create_resp.json()['data']['caseId']

    # 4. Update case
    update_payload = {'status': 'under_review', 'notes': 'Additional FIR cross-referenced'}
    update_resp = client.patch(f'/api/v1/cases/{created_id}', json=update_payload)
    assert update_resp.status_code == 200
    assert update_resp.json()['data']['status'] == 'under_review'

def test_entities_normalized_endpoints():
    # Test Persons
    resp = client.get('/api/v1/entities/persons')
    assert resp.status_code == 200
    assert len(resp.json()['items']) >= 1

    # Test Phones
    resp = client.get('/api/v1/entities/phones')
    assert resp.status_code == 200

    # Test Bank Accounts
    resp = client.get('/api/v1/entities/bank-accounts')
    assert resp.status_code == 200

    # Test Vehicles
    resp = client.get('/api/v1/entities/vehicles')
    assert resp.status_code == 200

    # Test Locations
    resp = client.get('/api/v1/entities/locations')
    assert resp.status_code == 200

    # Test Organizations
    resp = client.get('/api/v1/entities/organizations')
    assert resp.status_code == 200

    # Test FIRs
    resp = client.get('/api/v1/entities/firs')
    assert resp.status_code == 200

    # Test Crimes
    resp = client.get('/api/v1/entities/crimes')
    assert resp.status_code == 200

    # Test Transactions
    resp = client.get('/api/v1/entities/transactions')
    assert resp.status_code == 200

    # Test Evidence
    resp = client.get('/api/v1/entities/evidence')
    assert resp.status_code == 200

    # Test Get Entity by ID
    resp = client.get('/api/v1/entities/PER-001')
    assert resp.status_code == 200
    assert resp.json()['data']['canonicalName'] == 'Vikram Malhotra'

def test_graph_orchestration_endpoints():
    # 1. Neighborhood Expansion
    expand_resp = client.post('/api/v1/graph/expand', json={'nodeId': 'FIR-2024-8841', 'hops': 2})
    assert expand_resp.status_code == 200
    assert expand_resp.json()['data']['totalNodes'] >= 1

    # 2. Subgraph
    subgraph_resp = client.post('/api/v1/graph/subgraph', json={'nodeIds': ['PER-001', 'PHO-001', 'PER-002']})
    assert subgraph_resp.status_code == 200

    # 3. Shortest Path (M5)
    sp_resp = client.post('/api/v1/graph/shortest-path', json={'sourceNodeId': 'FIR-2024-8841', 'targetNodeId': 'CRM-001'})
    assert sp_resp.status_code == 200
    assert sp_resp.json()['data']['found'] is True

    # 4. Multi-hop (M5)
    mh_resp = client.post('/api/v1/graph/multi-hop', json={'startNodeId': 'FIR-2024-8841', 'targetNodeType': 'Crime', 'maxHops': 6})
    assert mh_resp.status_code == 200

def test_search_endpoint():
    search_payload = {'query': 'Malhotra', 'limit': 10}
    resp = client.post('/api/v1/search', json=search_payload)
    assert resp.status_code == 200
    data = resp.json()['data']
    assert data['totalMatches'] >= 1
    assert any('Vikram' in item['name'] for item in data['results'])

def test_timeline_and_playback():
    tl_resp = client.get('/api/v1/timeline?caseId=CASE-2024-001')
    assert tl_resp.status_code == 200
    assert len(tl_resp.json()['items']) >= 1

    pb_resp = client.get('/api/v1/timeline/playback?caseId=CASE-2024-001')
    assert pb_resp.status_code == 200
    assert pb_resp.json()['data']['totalFrames'] >= 1

def test_data_ingest_upload_and_status():
    file_bytes = b'FIR No. 8841/2024 Nhava Sheva Police. Accused: Vikram Malhotra'
    files = {'file': ('fir_doc.pdf', io.BytesIO(file_bytes), 'application/pdf')}
    data = {'docType': 'FIR', 'caseId': 'CASE-2024-001'}
    upload_resp = client.post('/api/v1/ingest/upload', files=files, data=data)
    assert upload_resp.status_code == 202
    job_id = upload_resp.json()['data']['jobId']

    status_resp = client.get(f'/api/v1/ingest/jobs/{job_id}')
    assert status_resp.status_code == 200
    assert status_resp.json()['data']['status'] == 'Completed'

def test_ai_assistant_grounded_query():
    ai_payload = {'question': 'What is the connection between Vikram Malhotra and Shadow Logistics Ltd?', 'caseId': 'CASE-2024-001'}
    resp = client.post('/api/v1/ai/query', json=ai_payload)
    assert resp.status_code == 200
    data = resp.json()['data']
    assert 'Vikram Malhotra' in data['answer']
    assert len(data['supportingEntities']) >= 1
    assert len(data['supportingEvidence']) >= 1
    assert data['source'] == 'M4_GROUNDED_AI_ENGINE'

def test_alerts_and_watchlist():
    # Alerts
    alerts_resp = client.get('/api/v1/alerts')
    assert alerts_resp.status_code == 200
    assert len(alerts_resp.json()['items']) >= 1

    # Acknowledge Alert
    ack_resp = client.post('/api/v1/alerts/ALT-2024-001/acknowledge', json={'resolutionNotes': 'Verified with CID portal', 'status': 'RESOLVED'})
    assert ack_resp.status_code == 200
    assert ack_resp.json()['data']['status'] == 'RESOLVED'

    # Watchlist Add & List
    add_resp = client.post('/api/v1/watchlist', json={'entityType': 'Phone', 'identifierValue': '+91-9988776655', 'reason': 'Suspected Hawala Operative', 'priority': 'high'})
    assert add_resp.status_code == 201
    watch_id = add_resp.json()['data']['watchId']

    w_list_resp = client.get('/api/v1/watchlist')
    assert w_list_resp.status_code == 200

    del_resp = client.delete(f'/api/v1/watchlist/{watch_id}')
    assert del_resp.status_code == 200

def test_reports_and_dashboard_and_audit():
    # Reports Generate
    rpt_resp = client.post('/api/v1/reports/generate', json={'caseId': 'CASE-2024-MH-092'})
    assert rpt_resp.status_code == 200
    assert len(rpt_resp.json()['data']['sections']) >= 4
    assert rpt_resp.json()['data']['bsaSection65BCertificate'] is not None

    # Reports PDF Export GET
    pdf_get_resp = client.get('/api/v1/reports/export/CASE-2024-MH-092.pdf')
    assert pdf_get_resp.status_code == 200
    assert pdf_get_resp.headers['content-type'] == 'application/pdf'
    assert len(pdf_get_resp.content) > 10000
    assert pdf_get_resp.content.startswith(b'%PDF-')

    # Reports PDF Export POST
    pdf_post_resp = client.post('/api/v1/reports/export/pdf', json={'caseId': 'CASE-2024-MH-092'})
    assert pdf_post_resp.status_code == 200
    assert pdf_post_resp.headers['content-type'] == 'application/pdf'
    assert len(pdf_post_resp.content) > 10000
    assert pdf_post_resp.content.startswith(b'%PDF-')

    # Dashboard
    dash_resp = client.get('/api/v1/dashboard/stats')
    assert dash_resp.status_code == 200
    stats = dash_resp.json()['data']
    assert stats['totalPersons'] >= 1
    assert stats['totalFIRs'] >= 1
    assert stats['totalTransactions'] >= 1

    # Audit Logs
    audit_resp = client.get('/api/v1/audit/logs')
    assert audit_resp.status_code == 200
    assert len(audit_resp.json()['items']) >= 1
