"""Runtime configuration loaded from environment variables and `.env` files."""

from __future__ import annotations

from datetime import timedelta
from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings shared by HTTP, GraphQL, migrations, and WebSockets."""

    environment: str = Field("development", alias="ENVIRONMENT")
    host: str = Field("0.0.0.0", alias="HOST")
    port: int = Field(4000, alias="PORT")
    database_url: str = Field(
        "postgresql+asyncpg://collabdocs:collabdocs@localhost:5432/collabdocs",
        alias="DATABASE_URL",
    )
    jwt_secret: str = Field("development-secret", alias="JWT_SECRET")
    jwt_expires_minutes: int = Field(1440, alias="JWT_EXPIRES_MINUTES")
    jwt_expires_in: str | None = Field(None, alias="JWT_EXPIRES_IN")
    cors_origins: str = Field(
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174",
        alias="CORS_ORIGINS",
    )
    cors_origin: str | None = Field(None, alias="CORS_ORIGIN")
    snapshot_every_ops: int = Field(50, alias="SNAPSHOT_EVERY_OPS")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    @property
    def async_database_url(self) -> str:
        """Return a SQLAlchemy async URL, accepting legacy Prisma-style values."""

        return normalize_database_url(self.database_url, "postgresql+asyncpg")

    @property
    def sync_database_url(self) -> str:
        """Return a synchronous URL for Alembic migrations."""

        return normalize_database_url(self.database_url, "postgresql+psycopg")

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse CORS origins from current and legacy environment variable names."""

        raw = self.cors_origin or self.cors_origins
        return [origin.strip().strip('"').strip("'") for origin in raw.split(",") if origin.strip()]

    @property
    def jwt_expiry(self) -> timedelta:
        """Return the JWT lifetime while supporting the old `JWT_EXPIRES_IN=1d` value."""

        if self.jwt_expires_in:
            value = self.jwt_expires_in.strip().strip('"').strip("'")
            if value.endswith("d") and value[:-1].isdigit():
                return timedelta(days=int(value[:-1]))
            if value.endswith("h") and value[:-1].isdigit():
                return timedelta(hours=int(value[:-1]))
            if value.endswith("m") and value[:-1].isdigit():
                return timedelta(minutes=int(value[:-1]))

        return timedelta(minutes=self.jwt_expires_minutes)


def normalize_database_url(database_url: str, target_scheme: str) -> str:
    """Normalize Postgres URLs and remove Prisma-only query options."""

    value = database_url.strip().strip('"').strip("'")
    parsed = urlsplit(value)
    scheme = parsed.scheme

    if scheme in {"postgres", "postgresql", "postgresql+asyncpg", "postgresql+psycopg"}:
        scheme = target_scheme

    query = [
        (key, item)
        for key, item in parse_qsl(parsed.query, keep_blank_values=True)
        if key != "schema"
    ]

    return urlunsplit((scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))


@lru_cache
def get_settings() -> Settings:
    """Return cached runtime settings for dependency injection and module setup."""

    return Settings()
