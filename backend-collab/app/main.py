"""FastAPI application exposing REST, GraphQL, and collaboration WebSockets.

REST and GraphQL remain separate route trees while sharing the same domain
services and SQLAlchemy database layer. The WebSocket editor endpoint also uses
the shared JWT and workspace permission rules before accepting a room join.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.graphql.schema import graphql_router
from app.api.rest.router import api_router
from app.core.config import get_settings
from app.core.errors import UnauthorizedError, install_exception_handlers
from app.core.logging import configure_logging
from app.core.security import SecurityService
from app.db.session import async_session_factory
from app.domain.collaboration.schemas import JoinMessage
from app.domain.collaboration.service import (
    ClientConnection,
    CollaborationAuthService,
    CollaborationRepository,
    RoomManager,
    client_message_adapter,
)

settings = get_settings()
configure_logging()

collaboration_repository = CollaborationRepository(async_session_factory)
collaboration_auth = CollaborationAuthService(SecurityService(settings), collaboration_repository)
room_manager = RoomManager(collaboration_repository, settings)

app = FastAPI(title="CollabDocs Python Backend", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
install_exception_handlers(app)
app.include_router(api_router, prefix="/api")
app.include_router(graphql_router, prefix="/graphql")


@app.get("/health")
async def health() -> dict[str, str]:
    """Return a lightweight health response for local and container checks."""

    return {"status": "ok"}


@app.get("/metrics")
async def metrics() -> dict[str, object]:
    """Return collaboration diagnostics grouped by document."""

    return {"rooms": await collaboration_repository.metrics_summary()}


@app.websocket("/ws/docs/{doc_id}")
async def document_socket(websocket: WebSocket, doc_id: UUID) -> None:
    """Accept a document collaboration WebSocket after JWT and permission checks."""

    connection: ClientConnection | None = None
    await websocket.accept()

    try:
        user = await collaboration_auth.authenticate_websocket(websocket)
        access = await collaboration_repository.resolve_workspace_access(user.user_id, str(doc_id))

        if not access:
            await websocket.send_json(
                {
                    "type": "error",
                    "code": "FORBIDDEN",
                    "message": "You do not have access to this document.",
                    "recoverable": False,
                }
            )
            await websocket.close(code=1008)
            return

        first_payload = await websocket.receive_json()
        first_message = client_message_adapter.validate_python(first_payload)

        if not isinstance(first_message, JoinMessage):
            await websocket.send_json(
                {
                    "type": "error",
                    "code": "JOIN_REQUIRED",
                    "message": "The first WebSocket message must be a join message.",
                    "recoverable": False,
                }
            )
            await websocket.close(code=1003)
            return

        room = await room_manager.get_room(str(doc_id))
        connection = ClientConnection(
            websocket=websocket,
            user=user,
            access=access,
            client_id=first_message.client_id,
        )
        await room.join(connection)

        while True:
            payload = await websocket.receive_json()
            await room.handle_message(connection, payload)

    except UnauthorizedError as error:
        await websocket.send_json(
            {
                "type": "error",
                "code": "UNAUTHENTICATED",
                "message": error.message,
                "recoverable": False,
            }
        )
        await websocket.close(code=1008)
    except WebSocketDisconnect:
        pass
    finally:
        if connection:
            room = await room_manager.get_room(str(doc_id))
            await room.leave(connection)
