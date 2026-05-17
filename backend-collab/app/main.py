from __future__ import annotations

from uuid import UUID

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .auth import AuthService, AuthenticationError
from .config import get_settings
from .models import JoinMessage
from .repository import CollaborationRepository
from .rooms import ClientConnection, RoomManager, client_message_adapter

settings = get_settings()
repository = CollaborationRepository(settings.database_url)
auth_service = AuthService(settings.jwt_secret, repository)
room_manager = RoomManager(repository, settings)

app = FastAPI(title="CollabDocs OT Sidecar", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    await repository.connect()


@app.on_event("shutdown")
async def shutdown() -> None:
    await repository.close()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/metrics")
async def metrics() -> dict[str, object]:
    return {"rooms": await repository.metrics_summary()}


@app.websocket("/ws/docs/{doc_id}")
async def document_socket(websocket: WebSocket, doc_id: UUID) -> None:
    connection: ClientConnection | None = None
    await websocket.accept()

    try:
        user = await auth_service.authenticate_websocket(websocket)
        access = await repository.resolve_workspace_access(user.user_id, str(doc_id))

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

    except AuthenticationError as error:
        await websocket.send_json(
            {
                "type": "error",
                "code": "UNAUTHENTICATED",
                "message": str(error),
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
