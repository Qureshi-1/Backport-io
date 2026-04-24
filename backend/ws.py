import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt

from config import SECRET_KEY, ALGORITHM

logger = logging.getLogger("backport")

router = APIRouter(tags=["websocket"])


# ─── Connection Manager ────────────────────────────────────────────────────

class ConnectionManager:
    """
    Manages WebSocket connections per user.
    Supports multiple connections per user (e.g., multiple browser tabs).
    """

    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}  # user_id -> [WebSocket, ...]

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept a WebSocket connection and register it for the user."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected: user_id={user_id}, total_connections={len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket connection for the user."""
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass  # Connection already removed
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            logger.info(f"WebSocket disconnected: user_id={user_id}")

    async def broadcast_to_user(self, user_id: int, message: dict):
        """
        Broadcast a message to all active WebSocket connections for a user.
        This is safe to call from sync code (e.g., background threads) —
        it schedules the send on the event loop.
        """
        if user_id not in self.active_connections:
            return

        connections = list(self.active_connections[user_id])  # Copy list to avoid mutation during iteration
        dead = []

        for ws in connections:
            try:
                # If called from a non-async context, we need to use the event loop
                payload = json.dumps(message)
                if hasattr(ws, 'send_text') and not ws.client_state.disconnected:
                    try:
                        loop = asyncio.get_running_loop()
                        # We're already in an async context
                        await ws.send_text(payload)
                    except RuntimeError:
                        # No running loop — this shouldn't happen in an async context
                        await ws.send_text(payload)
                else:
                    dead.append(ws)
            except Exception as e:
                logger.debug(f"WebSocket send error for user_id={user_id}: {e}")
                dead.append(ws)

        # Clean up dead connections
        for ws in dead:
            try:
                self.active_connections[user_id].remove(ws)
            except (ValueError, KeyError):
                pass
        if user_id in self.active_connections and not self.active_connections[user_id]:
            del self.active_connections[user_id]

    def broadcast_from_thread(self, user_id: int, message: dict):
        """
        Thread-safe broadcast — call from background threads (analytics engine).
        Schedules the actual WebSocket send on the main event loop.
        """
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(self.broadcast_to_user(user_id, message), loop=loop)
            else:
                loop.run_until_complete(self.broadcast_to_user(user_id, message))
        except RuntimeError:
            # No event loop exists — the WebSocket manager was likely called
            # before the app event loop started. This is safe to ignore.
            logger.debug("No event loop available for WebSocket broadcast from thread")

    def get_connection_count(self) -> int:
        """Get total number of active WebSocket connections."""
        return sum(len(conns) for conns in self.active_connections.values())


# Global singleton
manager = ConnectionManager()


# ─── JWT validation for WebSocket ──────────────────────────────────────────

def _validate_ws_token(token: str) -> int | None:
    """
    Validate a JWT token and return the user_id, or None if invalid.
    Reuses the same JWT logic as the rest of the auth system.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (JWTError, ValueError, TypeError):
        return None


# ─── WebSocket Endpoint ────────────────────────────────────────────────────

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time updates.

    Connect with: ws://host:port/ws/{jwt_token}

    Messages received from client are ignored (this is a broadcast-only channel).
    Messages sent to client are JSON objects with a "type" field:
      - "log_entry": New request log entry
      - "alert": New alert triggered
      - "health_check": Health check status change
      - "rate_limit_warning": Approaching rate limit (80%)
      - "cache_stats": Cache hit/miss stats update
      - "team_invite": Team invitation received
    """
    user_id = _validate_ws_token(token)
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    await manager.connect(websocket, user_id)

    try:
        # Send a welcome message
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": "Real-time updates active",
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }))

        # Keep the connection alive, listening for client messages (ping/pong)
        while True:
            try:
                data = await websocket.receive_text()
                # Handle optional ping messages from client
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        await websocket.send_text(json.dumps({
                            "type": "pong",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }))
                except (json.JSONDecodeError, TypeError):
                    pass  # Ignore malformed messages
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass  # Normal disconnect, no logging needed
    except Exception as e:
        logger.debug(f"WebSocket error for user_id={user_id}: {e}")
    finally:
        manager.disconnect(websocket, user_id)
