import io
import requests

BASE = 'http://localhost:8000'
CASE = 'CASE-2024-MH-092'

def main():
    print('=== STARTING END-TO-END VALIDATION ===')

    # 1. Upload CSV: Persons
    csv_persons = '''id,name,role,status
PER-E2E-01,Vikram Mehra,Smuggling Associate,Suspect
PER-E2E-02,Sanjay Singhania,Shell Account Signatory,Person of Interest
'''
    r1 = requests.post(
        f'{BASE}/api/v1/ingestion/upload',
        files={'file': ('persons.csv', csv_persons.encode('utf-8'), 'text/csv')},
        data={'caseId': CASE}
    )
    assert r1.status_code == 202, f'CSV Persons failed: {r1.text}'
    job1_id = r1.json()['data']['jobId']
    print(f'1. Persons CSV Uploaded: Job {job1_id}')

    # 2. Upload CSV: Relationships
    csv_rels = '''source_id,target_id,relationship_type,confidence
PER-E2E-01,PER-E2E-02,FINANCIAL_TRANSACTOR,0.92
'''
    r2 = requests.post(
        f'{BASE}/api/v1/ingestion/upload',
        files={'file': ('relationships.csv', csv_rels.encode('utf-8'), 'text/csv')},
        data={'caseId': CASE}
    )
    assert r2.status_code == 202, f'CSV Rels failed: {r2.text}'
    job2_id = r2.json()['data']['jobId']
    print(f'2. Relationships CSV Uploaded: Job {job2_id}')

    # 3. Upload PDF
    with open('test_evidence_report.pdf', 'rb') as f:
        pdf_bytes = f.read()
    r3 = requests.post(
        f'{BASE}/api/v1/ingestion/upload',
        files={'file': ('intelligence_brief_092.pdf', pdf_bytes, 'application/pdf')},
        data={'caseId': CASE}
    )
    assert r3.status_code == 202, f'PDF Upload failed: {r3.text}'
    job3_id = r3.json()['data']['jobId']
    print(f'3. PDF Uploaded: Job {job3_id}')

    # 4. Check status of all 3 jobs
    for jid, name in [(job1_id, 'Persons CSV'), (job2_id, 'Rels CSV'), (job3_id, 'PDF')]:
        st = requests.get(f'{BASE}/api/v1/ingestion/status/{jid}').json()['data']
        print(f'   - {name} Status: {st.get("status")}, Entities: {st.get("entitiesExtracted", 0)}, SHA256: {st.get("sha256Hash", "")[:16]}...')
        assert st.get('status') == 'Completed'

    # 5. Check Entities list
    persons = requests.get(f'{BASE}/api/v1/entities/persons').json()['items']
    p_names = [p['canonicalName'] for p in persons]
    assert 'Vikram Mehra' in p_names, f'Vikram Mehra not found in {p_names}'
    assert 'Sanjay Singhania' in p_names, f'Sanjay Singhania not found in {p_names}'
    print(f'5. Entities Verified in Entity Explorer: {len(persons)} total persons')

    # 6. Check Universal Search
    s_res = requests.post(f'{BASE}/api/v1/search', json={'query': 'Singhania'}).json()['data']
    assert s_res['totalMatches'] >= 1
    print(f'6. Universal Search Verified: matched {s_res["results"][0]["name"]}')

    # 7. Check AI Assistant Grounded Query
    q_res = requests.post(
        f'{BASE}/api/v1/ai/query',
        json={'question': 'What evidence exists in intelligence_brief_092.pdf regarding Priya Sharma?'}
    ).json()['data']
    assert 'Priya Sharma' in q_res['answer']
    assert 'intelligence_brief_092.pdf' in q_res['answer']
    print('7. AI Assistant Grounded Query Verified: Answer cites document and entities')

    # 8. Check AI Assistant Unknown Query
    u_res = requests.post(
        f'{BASE}/api/v1/ai/query',
        json={'question': 'Is Clark Kent involved in the syndicate?'}
    ).json()['data']
    assert 'INSUFFICIENT EVIDENCE / DATA NOT FOUND' in u_res['answer']
    print('8. AI Assistant Strict Provenance (Zero Hallucination) Verified')

    # 9. Check Report Generation
    pdf_rep = requests.get(f'{BASE}/api/v1/reports/export/{CASE}.pdf')
    assert pdf_rep.status_code == 200
    assert pdf_rep.content.startswith(b'%PDF-')
    print(f'9. PDF Investigation Report Export Verified ({len(pdf_rep.content)} bytes)')

    # 10. Check Error Validation: .exe rejected
    bad_file = requests.post(
        f'{BASE}/api/v1/ingestion/upload',
        files={'file': ('payload.exe', b'MZ123', 'application/x-msdownload')},
        data={'caseId': CASE}
    )
    assert bad_file.status_code == 400
    assert 'UNSUPPORTED FILE FORMAT' in bad_file.json()['detail']
    print('10. Unsupported File Rejection (.exe -> 400) Verified')

    # 11. Check Error Validation: empty file rejected
    empty_file = requests.post(
        f'{BASE}/api/v1/ingestion/upload',
        files={'file': ('empty.csv', b'', 'text/csv')},
        data={'caseId': CASE}
    )
    assert empty_file.status_code == 400
    assert 'EMPTY FILE' in empty_file.json()['detail']
    print('11. Empty File Rejection (0 bytes -> 400) Verified')

    # 12. Check Duplicate Ingestion
    dup_res = requests.post(
        f'{BASE}/api/v1/ingestion/upload',
        files={'file': ('persons.csv', csv_persons.encode('utf-8'), 'text/csv')},
        data={'caseId': CASE}
    )
    dup_st = requests.get(f'{BASE}/api/v1/ingestion/status/{dup_res.json()["data"]["jobId"]}').json()['data']
    assert dup_st['duplicateRecords'] == 2
    assert dup_st['recordsUpdated'] == 2
    print('12. Duplicate CSV Ingestion & Deduplication Verified (2 duplicates updated without data loss)')

    print('\n=== ALL 12 VALIDATION CHECKS PASSED PERFECTLY! ===')

if __name__ == '__main__':
    main()
