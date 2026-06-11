from typing import Dict
from fastapi import WebSocket
import logging

logger = logging.getLogger("websocket_manager")

class ConnectionManager:
    def __init__(self):
        # Maps worker_id (str) to their WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, worker_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[worker_id] = websocket
        logger.info(f"Worker {worker_id} connected via WebSocket.")

    def disconnect(self, worker_id: str):
        if worker_id in self.active_connections:
            del self.active_connections[worker_id]
            logger.info(f"Worker {worker_id} disconnected from WebSocket.")

    async def send_to_worker(self, worker_id: str, message: dict):
        if worker_id in self.active_connections:
            try:
                await self.active_connections[worker_id].send_json(message)
                logger.info(f"Sent notification to worker {worker_id}: {message}")
            except Exception as e:
                logger.error(f"Error sending message to worker {worker_id}: {e}")
                self.disconnect(worker_id)

    async def broadcast(self, message: dict):
        logger.info(f"Broadcasting message to all workers: {message}")
        disconnected_workers = []
        for worker_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to worker {worker_id}: {e}")
                disconnected_workers.append(worker_id)
        
        # Clean up any dead connections
        for worker_id in disconnected_workers:
            self.disconnect(worker_id)

manager = ConnectionManager()
