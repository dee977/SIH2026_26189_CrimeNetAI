import requests

try:
    res = requests.post('http://localhost:8000/api/v1/assistant/query', json={
        "question": "test",
        "caseId": "CASE-123"
    })
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
