import asyncio
from app.services.m4_ai_nlp import get_m4_client

async def main():
    client = get_m4_client()
    questions = [
        ("Who are the main suspects in this case and what are their roles?", "CASE-2025-M3-DATASET"),
        ("Explain the financial transactions and money trail", "CASE-VIDEO-001"),
        ("What evidence has been seized and what are the SHA-256 hashes?", "CASE-VIDEO-002"),
        ("Tell me about the cyber infrastructure and C2 servers", "CASE-VIDEO-003"),
        ("Give me a complete summary of this investigation", "CASE-VIDEO-004")
    ]
    for q, cid in questions:
        print(f"\n==========================================")
        print(f"QUERY: '{q}' (Case: {cid})")
        res = await client.answer_grounded_question(q, case_id=cid)
        print("ANSWER:\n", res.answer[:250], "...")
        print("Supporting entities:", [(e.entityId, e.name) for e in res.supportingEntities])
        print("Supporting evidence:", [(e.evidenceId, e.sha256Hash[:16] + '...') for e in res.supportingEvidence])
        print("Hops:", getattr(res.graphPath, 'hops', []))

if __name__ == '__main__':
    asyncio.run(main())
