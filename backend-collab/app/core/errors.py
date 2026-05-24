"""Application error types and HTTP exception handlers."""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Domain error carrying a stable code and HTTP status for all transports."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "BAD_REQUEST",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        field_errors: dict[str, list[str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.field_errors = field_errors


class UnauthorizedError(AppError):
    """Raised when a request lacks a valid authenticated user."""

    def __init__(self, message: str = "Authentication is required.") -> None:
        super().__init__(message, code="UNAUTHENTICATED", status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(AppError):
    """Raised when a user is authenticated but lacks required permission."""

    def __init__(self, message: str = "You do not have access to this resource.") -> None:
        super().__init__(message, code="FORBIDDEN", status_code=status.HTTP_403_FORBIDDEN)


class NotFoundAppError(AppError):
    """Raised when a requested entity does not exist or is intentionally hidden."""

    def __init__(self, message: str, *, code: str = "NOT_FOUND") -> None:
        super().__init__(message, code=code, status_code=status.HTTP_404_NOT_FOUND)


class ConflictAppError(AppError):
    """Raised when a valid request conflicts with current persisted state."""

    def __init__(self, message: str, *, code: str = "CONFLICT") -> None:
        super().__init__(message, code=code, status_code=status.HTTP_409_CONFLICT)


def install_exception_handlers(app: FastAPI) -> None:
    """Install REST error handlers with the frontend-compatible JSON shape."""

    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        """Return a domain error using its stable code, message, and HTTP status."""

        return JSONResponse(status_code=exc.status_code, content=error_body(exc))

    @app.exception_handler(RequestValidationError)
    async def request_validation_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Normalize FastAPI request validation errors for frontend field rendering."""

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=validation_error_body(exc.errors()),
        )

    @app.exception_handler(ValidationError)
    async def pydantic_validation_handler(_request: Request, exc: ValidationError) -> JSONResponse:
        """Normalize Pydantic validation errors raised outside FastAPI request parsing."""

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=validation_error_body(exc.errors()),
        )

    @app.exception_handler(IntegrityError)
    async def integrity_handler(_request: Request, exc: IntegrityError) -> JSONResponse:
        """Hide database constraint details behind a stable conflict response."""

        logger.warning("Database integrity error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "code": "DATABASE_INTEGRITY_ERROR",
                "message": "The request conflicts with existing data.",
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(_request: Request, exc: Exception) -> JSONResponse:
        """Log unexpected errors and return a generic server error response."""

        logger.exception("Unhandled request error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"code": "INTERNAL_SERVER_ERROR", "message": "Internal server error."},
        )


def error_body(error: AppError) -> dict[str, Any]:
    """Serialize an application error for REST responses."""

    body: dict[str, Any] = {"code": error.code, "message": error.message}

    if error.field_errors:
        body["issues"] = {"fieldErrors": error.field_errors}

    return body


def validation_error_body(errors: list[dict[str, Any]]) -> dict[str, Any]:
    """Convert Pydantic validation details into frontend field errors."""

    field_errors: dict[str, list[str]] = defaultdict(list)

    for item in errors:
        location = item.get("loc", ())
        field = str(location[-1]) if location else "body"
        field_errors[field].append(str(item.get("msg", "Invalid value.")))

    return {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed.",
        "issues": {"fieldErrors": dict(field_errors)},
    }
