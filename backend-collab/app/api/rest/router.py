"""Aggregated REST router mounted under `/api` by the FastAPI app."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.rest import auth, collaboration, documents, users, workspace

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(workspace.router)
api_router.include_router(documents.router)
api_router.include_router(collaboration.router)
