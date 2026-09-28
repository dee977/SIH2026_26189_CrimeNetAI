import asyncio
from app.api.v1.evidence import list_evidence, verify_evidence_hash, get_verification_discrepancies
from app.schemas.auth import UserProfile

user = UserProfile(
    userId='test',
    email='admin123@gov.in',
    fullName='Admin',
    agencyUnit='CrimeNet',
    role='ADMIN',
    grantedRole='ADMIN',
    permissions=['evidence:read', 'evidence:write', 'verification:read']
)

async def test():
    cases = ['CASE-2025-M3-DATASET', 'CASE-VIDEO-001', 'CASE-VIDEO-002', 'CASE-VIDEO-003', 'CASE-VIDEO-004']
    for cid in cases:
        evds = await list_evidence(case_id=cid, current_user=user)
        print(f"Case {cid}: {len(evds.items)} evidence items")
        discs = await get_verification_discrepancies(case_id=cid, current_user=user)
        print(f"Case {cid}: {len(discs.data)} discrepancies")
        if evds.items:
            first_id = evds.items[0]['id']
            res = await verify_evidence_hash(evidence_id=first_id, file=None, current_user=user)
            print(f"Verified {first_id}: status={res.data['status']}, isMatch={res.data['isMatch']}, cert={res.data['bsaCertificateId']}")

if __name__ == '__main__':
    asyncio.run(test())
