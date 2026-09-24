import json
from typing import Dict, List, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.channel_subscriptions: Dict[str, Set[WebSocket]] = {
            'alerts': set(),
            'jobs': set(),
            'graph': set(),
            'cases': set(),
            'notifications': set()
        }

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Default subscribe to notifications
        self.channel_subscriptions['notifications'].add(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for channel, subscribers in self.channel_subscriptions.items():
            if websocket in subscribers:
                subscribers.remove(websocket)

    def subscribe(self, websocket: WebSocket, channel: str):
        if channel not in self.channel_subscriptions:
            self.channel_subscriptions[channel] = set()
        self.channel_subscriptions[channel].add(websocket)

    def unsubscribe(self, websocket: WebSocket, channel: str):
        if channel in self.channel_subscriptions and websocket in self.channel_subscriptions[channel]:
            self.channel_subscriptions[channel].remove(websocket)

    async def send_personal_message(self, message: Dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            self.disconnect(websocket)

    async def broadcast_to_channel(self, channel: str, message: Dict):
        if channel not in self.channel_subscriptions:
            return
        payload = json.dumps({'channel': channel, 'data': message})
        dead_sockets = set()
        for connection in list(self.channel_subscriptions[channel]):
            try:
                await connection.send_text(payload)
            except Exception:
                dead_sockets.add(connection)
        for dead in dead_sockets:
            self.disconnect(dead)

    async def broadcast(self, message: Dict):
        payload = json.dumps(message)
        dead_sockets = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                dead_sockets.add(connection)
        for dead in dead_sockets:
            self.disconnect(dead)

ws_manager = ConnectionManager()
