"""Pagination primitives reserved for later list endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PageParams(BaseModel):
    """Validated offset pagination parameters for future scalable listings."""

    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
