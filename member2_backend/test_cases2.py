import time
from app.services.case_service import CaseService

def test():
    svc = CaseService()
    start = time.time()
    cases = svc.list_cases()
    end = time.time()
    print(f"Loaded {len(cases)} cases in {end - start:.4f} seconds.")

test()
