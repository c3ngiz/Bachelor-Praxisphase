from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from environment or `.env`."""

    database_url: str = Field(
        "postgresql://collabdocs:collabdocs@localhost:5432/collabdocs",
        alias="DATABASE_URL",
    )
    jwt_secret: str = Field("development-secret", alias="JWT_SECRET")
    host: str = Field("0.0.0.0", alias="HOST")
    port: int = Field(4100, alias="PORT")
    cors_origins: str = Field("http://localhost:5173", alias="CORS_ORIGINS")
    snapshot_every_ops: int = Field(50, alias="SNAPSHOT_EVERY_OPS")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
