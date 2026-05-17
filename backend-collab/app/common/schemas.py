"""Pydantic base models for camelCase API serialization."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.common.utils import to_camel


class CamelModel(BaseModel):
    """Base response/request model using the frontend's camelCase JSON contract."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        arbitrary_types_allowed=True,
        from_attributes=True,
        populate_by_name=True,
    )
