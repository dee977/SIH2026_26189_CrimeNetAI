import sys
sys.path.append('member2_backend')
import asyncio
from app.services.m5_graph_analytics import M5GraphAnalyticsClient

async def run():
    try:
        m5 = M5GraphAnalyticsClient()
        res = await m5.get_network_statistics('CASE-REAL-001')
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(run())
