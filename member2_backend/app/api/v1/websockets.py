import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

router = APIRouter(tags=['Real-Time WebSocket Streams'])

@router.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
                action = data.get('action')
                channel = data.get('channel')
                if action == 'subscribe' and channel:
                    ws_manager.subscribe(websocket, channel)
                    await ws_manager.send_personal_message({'type': 'SUBSCRIPTION_CONFIRMED', 'channel': channel}, websocket)
                elif action == 'unsubscribe' and channel:
                    ws_manager.unsubscribe(websocket, channel)
                    await ws_manager.send_personal_message({'type': 'UNSUBSCRIBED', 'channel': channel}, websocket)
                elif action == 'ping':
                    await ws_manager.send_personal_message({'type': 'pong'}, websocket)
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
