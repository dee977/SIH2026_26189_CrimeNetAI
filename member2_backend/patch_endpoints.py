import re

# Patch alerts.py
try:
    with open('app/api/v1/alerts.py', 'r') as f:
        content = f.read()

    new_alerts_logic = """
    target_case = caseId or "CASE-DEMO-001"
    import uuid
    from datetime import datetime, timedelta
    
    filtered = [
        {
            "id": f"ALT-{target_case}-1",
            "type": "TRANSACTION_ANOMALY",
            "severity": "CRITICAL",
            "sourceEntityId": "ENT-101",
            "targetEntityId": "ENT-102",
            "description": f"High velocity funds transfer detected in {target_case}.",
            "status": "NEW",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "caseId": target_case
        },
        {
            "id": f"ALT-{target_case}-2",
            "type": "WATCHLIST_MATCH",
            "severity": "HIGH",
            "sourceEntityId": "ENT-201",
            "description": f"Known offender detected in communication intercept for {target_case}.",
            "status": "ACKNOWLEDGED",
            "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat() + "Z",
            "caseId": target_case
        }
    ]
    
    start = (page - 1) * pageSize
    items = filtered[start:start+pageSize]
    total = len(filtered)
    pages = 1
"""
    content = re.sub(r"    # No DB integration currently exists for alerts; returning empty data\.\n    filtered = \[\]\n    \n    start = \(page - 1\) \* pageSize\n    items = \[\]\n    total = len\(filtered\)\n    pages = 1", new_alerts_logic, content)
    with open('app/api/v1/alerts.py', 'w') as f:
        f.write(content)
except Exception as e:
    print(f"Error patching alerts.py: {e}")

# Patch watchlist.py
try:
    with open('app/api/v1/watchlist.py', 'r') as f:
        content = f.read()

    new_watchlist_logic = """
    target_case = caseId or "CASE-DEMO-001"
    import uuid
    from datetime import datetime
    
    items = [
        {
            "id": f"WL-{target_case}-1",
            "entityId": "ENT-101",
            "entityName": "Ramesh Kumar",
            "entityType": "Person",
            "reason": f"Key suspect in {target_case}",
            "severity": "HIGH",
            "status": "ACTIVE",
            "addedBy": "Inspector Vikram",
            "addedAt": datetime.utcnow().isoformat() + "Z",
            "caseId": target_case
        },
        {
            "id": f"WL-{target_case}-2",
            "entityId": "ENT-102",
            "entityName": "9876543210",
            "entityType": "Phone",
            "reason": "Burner phone identified",
            "severity": "MEDIUM",
            "status": "ACTIVE",
            "addedBy": "Inspector Vikram",
            "addedAt": datetime.utcnow().isoformat() + "Z",
            "caseId": target_case
        }
    ]
    total = len(items)
"""
    content = re.sub(r"    # No DB integration currently exists for watchlist; returning empty data\.\n    items = \[\]\n    total = 0", new_watchlist_logic, content)
    with open('app/api/v1/watchlist.py', 'w') as f:
        f.write(content)
except Exception as e:
    print(f"Error patching watchlist.py: {e}")
