"""Logging configuration for local development and production deployments."""

from __future__ import annotations

import logging


def configure_logging() -> None:
    """Configure a compact application log format once during startup."""

    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s [%(name)s] %(message)s",
    )
